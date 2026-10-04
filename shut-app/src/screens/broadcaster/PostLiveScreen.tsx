import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEventListener } from 'expo';
import {
  Alert,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { replaysService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { Replay } from '../../types';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

// ── City autocomplete via Nominatim (OpenStreetMap) ──
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function searchCitiesDebounced(
  query: string,
  callback: (results: string[]) => void,
) {
  if (searchTimer) clearTimeout(searchTimer);
  if (query.length < 2) { callback([]); return; }
  searchTimer = setTimeout(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city&accept-language=fr`;
      const res = await fetch(url, { headers: { 'User-Agent': 'SHUT-App/1.0' } });
      const data = await res.json();
      const results: string[] = [];
      const seen = new Set<string>();
      for (const item of data) {
        const addr = item.address ?? {};
        const city = addr.city || addr.town || addr.village || addr.municipality || item.name;
        const country = addr.country || '';
        if (!city) continue;
        const label = country ? `${city}, ${country}` : city;
        if (seen.has(label)) continue;
        seen.add(label);
        results.push(label);
      }
      callback(results);
    } catch {
      callback([]);
    }
  }, 350);
}

const ALL_GENRES = [
  'Techno', 'House', 'Progressive', 'Minimal', 'Trance',
  'Drum & Bass', 'Dubstep', 'Afro House', 'Melodic Techno',
  'Deep House', 'Tech House', 'Electro', 'Disco', 'Hip-Hop',
] as const;

export function PostLiveScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { eventId } = route.params as { eventId: string };

  const [replay, setReplay] = useState<Replay | null>(null);
  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Location & date
  const [location, setLocation] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Trim state (in seconds)
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimBarWidth, setTrimBarWidth] = useState(0);

  // Track whether the user has manually dragged trim handles
  const userHasTrimmedRef = useRef(false);

  // Refs for PanResponder access (avoid stale closures)
  const trimStartRef = useRef(0);
  const trimEndRef = useRef(0);
  const videoDurationRef = useRef(0);
  const trimBarWidthRef = useRef(0);
  trimStartRef.current = trimStart;
  trimEndRef.current = trimEnd;
  videoDurationRef.current = videoDuration;
  trimBarWidthRef.current = trimBarWidth;

  const hlsPlayer = useVideoPlayer(null, (player) => {
    player.loop = true;
    player.muted = false;
    player.timeUpdateEventInterval = 0.25;
  });

  // Listen for the replay doc to appear (Mux may still be processing)
  useEffect(() => {
    const unsub = replaysService.onReplayByEventId(eventId, (r) => {
      if (r) {
        setReplay(r);
        if (r.title) setTitle(r.title);
        if (r.genres?.length) setSelectedGenres(r.genres);
        if (r.trimStart) setTrimStart(r.trimStart);
        // Only restore saved trimEnd if the user actually trimmed it
        // (i.e., it's different from the stored duration)
        if (r.trimEnd && r.trimEnd > 0 && r.duration && r.trimEnd < r.duration - 1) {
          setTrimEnd(r.trimEnd);
          userHasTrimmedRef.current = true;
        }
        if (r.location) setLocation(r.location);
        if (r.liveDate) {
          setLiveDate(new Date(r.liveDate));
        } else if (r.createdAt) {
          setLiveDate(new Date(r.createdAt));
        }
      }
    });
    return unsub;
  }, [eventId]);

  // Load video when replay is ready
  useEffect(() => {
    if (!replay?.playbackUrl || replay.status === 'processing') return;
    hlsPlayer.replaceAsync({ uri: replay.playbackUrl, contentType: 'hls' as const })
      .then(() => {
        hlsPlayer.play();
        setIsPlaying(true);
      })
      .catch(() => {});
  }, [replay?.playbackUrl, replay?.status, hlsPlayer]);

  // Initialize videoDuration from replay doc as a first approximation
  useEffect(() => {
    if (replay?.duration && replay.duration > 0 && videoDurationRef.current === 0) {
      setVideoDuration(replay.duration);
      if (!userHasTrimmedRef.current) {
        setTrimEnd(replay.duration);
      }
    }
  }, [replay?.duration]);

  // Native time update event — also syncs real duration from the player
  useEventListener(hlsPlayer, 'timeUpdate', ({ currentTime: t }) => {
    if (typeof t === 'number' && !isNaN(t)) {
      setCurrentTime(t);

      // Use the player's real duration as source of truth
      const playerDur = hlsPlayer.duration;
      if (playerDur > 0 && Math.abs(playerDur - videoDurationRef.current) > 1) {
        setVideoDuration(playerDur);
        if (!userHasTrimmedRef.current) {
          setTrimEnd(playerDur);
        }
      }

      // Loop within trim range
      if (trimEndRef.current > 0 && t >= trimEndRef.current) {
        hlsPlayer.currentTime = trimStartRef.current;
      }
    }
  });

  // Pre-fill genres from user profile
  useEffect(() => {
    if (user?.genres?.length && selectedGenres.length === 0) {
      setSelectedGenres(user.genres.slice(0, 5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.genres]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 5 ? [...prev, genre] : prev
    );
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      hlsPlayer.pause();
    } else {
      if (currentTime >= trimEnd && trimEnd > 0) {
        hlsPlayer.currentTime = trimStart;
      }
      hlsPlayer.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, hlsPlayer, currentTime, trimEnd, trimStart]);

  const seekTo = useCallback((target: number) => {
    const end = trimEnd > 0 ? trimEnd : videoDuration;
    const clamped = Math.max(trimStart, Math.min(target, end));
    hlsPlayer.currentTime = clamped;
    setCurrentTime(clamped);
  }, [hlsPlayer, trimStart, trimEnd, videoDuration]);

  const seekBackward = useCallback(() => seekTo(currentTime - 10), [seekTo, currentTime]);
  const seekForward = useCallback(() => seekTo(currentTime + 10), [seekTo, currentTime]);
  const seekToStart = useCallback(() => seekTo(trimStart), [seekTo, trimStart]);

  // ── Close button ──
  const replayUpdates = useCallback(() => ({
    title: title.trim(),
    genres: selectedGenres,
    trimStart,
    trimEnd,
    duration: videoDuration,
    location: location.trim() || null,
    liveDate: liveDate.toISOString().slice(0, 10),
  }), [title, selectedGenres, trimStart, trimEnd, videoDuration, location, liveDate]);

  const handleClose = useCallback(() => {
    if (!replay) {
      navigation.popToTop();
      return;
    }

    if (replay.status === 'published') {
      // Editing a published replay
      Alert.alert(
        'Quitter',
        'Vous allez perdre vos modifications.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Publier',
            onPress: async () => {
              try {
                await replaysService.updateReplay(replay.id, {
                  ...replayUpdates(),
                  status: 'published',
                  publishedAt: replay.publishedAt ?? new Date().toISOString(),
                });
              } catch { /* ignore */ }
              navigation.goBack();
            },
          },
        ],
      );
    } else {
      // New or draft replay
      Alert.alert(
        'Quitter',
        'Vous allez perdre la rediffusion. Voulez-vous l\'enregistrer dans vos brouillons ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => navigation.popToTop(),
          },
          {
            text: 'Enregistrer en brouillon',
            onPress: async () => {
              try {
                await replaysService.updateReplay(replay.id, {
                  ...replayUpdates(),
                  status: 'draft',
                });
              } catch { /* ignore */ }
              navigation.popToTop();
            },
          },
        ],
      );
    }
  }, [replay, replayUpdates, navigation]);

  const handlePublish = useCallback(async () => {
    if (!replay) return;
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Ajoute un titre avant de publier.');
      return;
    }
    const isEdit = replay.status === 'published';
    setPublishing(true);
    try {
      await replaysService.updateReplay(replay.id, {
        ...replayUpdates(),
        status: 'published',
        publishedAt: isEdit ? (replay.publishedAt ?? new Date().toISOString()) : new Date().toISOString(),
      });
      if (isEdit) {
        navigation.goBack();
      } else {
        Alert.alert('Publié !', 'Ta rediffusion est maintenant visible sur ton profil.', [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      }
    } catch (e) {
      console.warn('[PostLive] publish error:', e);
      Alert.alert('Erreur', 'Impossible de publier. Réessaie.');
    } finally {
      setPublishing(false);
    }
  }, [replay, title, replayUpdates, navigation]);

  const handleSaveDraft = useCallback(async () => {
    if (!replay) return;
    setSaving(true);
    try {
      await replaysService.updateReplay(replay.id, {
        ...replayUpdates(),
        status: 'draft',
      });
      Alert.alert('Enregistre', 'La rediffusion est dans ta bibliotheque. Tu pourras la publier plus tard.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer. Reessaie.');
    } finally {
      setSaving(false);
    }
  }, [replay, replayUpdates, navigation]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  // ── Trim bar helpers ──
  const timeToX = useCallback(
    (t: number) => (videoDuration > 0 ? (t / videoDuration) * trimBarWidth : 0),
    [videoDuration, trimBarWidth],
  );

  const dragOriginRef = useRef(0);

  const trimStartPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        userHasTrimmedRef.current = true;
        const w = trimBarWidthRef.current;
        const dur = videoDurationRef.current;
        dragOriginRef.current = dur > 0 ? (trimStartRef.current / dur) * w : 0;
      },
      onPanResponderMove: (_, gs) => {
        const w = trimBarWidthRef.current;
        const dur = videoDurationRef.current;
        if (w <= 0 || dur <= 0) return;
        const newX = Math.max(0, Math.min(dragOriginRef.current + gs.dx, w));
        const newTime = Math.min((newX / w) * dur, trimEndRef.current - 1);
        setTrimStart(Math.max(0, newTime));
      },
      onPanResponderRelease: () => {
        if (hlsPlayer.currentTime < trimStartRef.current) {
          hlsPlayer.currentTime = trimStartRef.current;
        }
      },
    }),
  ).current;

  const dragOriginEndRef = useRef(0);

  const trimEndPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        userHasTrimmedRef.current = true;
        const w = trimBarWidthRef.current;
        const dur = videoDurationRef.current;
        dragOriginEndRef.current = dur > 0 ? (trimEndRef.current / dur) * w : 0;
      },
      onPanResponderMove: (_, gs) => {
        const w = trimBarWidthRef.current;
        const dur = videoDurationRef.current;
        if (w <= 0 || dur <= 0) return;
        const newX = Math.max(0, Math.min(dragOriginEndRef.current + gs.dx, w));
        const newTime = Math.max((newX / w) * dur, trimStartRef.current + 1);
        setTrimEnd(Math.min(dur, newTime));
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  const handleSeekBarPress = useCallback(
    (e: any) => {
      if (videoDuration <= 0 || trimBarWidth <= 0) return;
      const x = e.nativeEvent.locationX;
      const t = (x / trimBarWidth) * videoDuration;
      const clamped = Math.max(trimStart, Math.min(t, trimEnd > 0 ? trimEnd : videoDuration));
      hlsPlayer.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [videoDuration, trimBarWidth, trimStart, trimEnd, hlsPlayer],
  );

  const isProcessing = !replay || replay.status === 'processing';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Rediffusion</Text>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Video preview */}
      <View style={styles.previewContainer}>
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <Ionicons name="hourglass-outline" size={40} color={colors.accentLight} />
            <Text style={styles.processingTitle}>Encodage en cours...</Text>
            <Text style={styles.processingDesc}>
              Mux prepare ta rediffusion.{'\n'}
              Cette page se mettra a jour automatiquement.
            </Text>
          </View>
        ) : (
          <Pressable onPress={togglePlayPause} style={styles.previewTouchable}>
            <VideoView
              player={hlsPlayer}
              style={styles.previewVideo}
              contentFit="contain"
              nativeControls={false}
            />
            {!isPlaying && (
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={48} color={colors.white} />
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Playback controls + Trim bar */}
      {!isProcessing && videoDuration > 0 && (
        <View style={styles.controlsSection}>
          {/* Playback controls row */}
          <View style={styles.controlsRow}>
            <Pressable onPress={seekToStart} hitSlop={8}>
              <Ionicons name="play-skip-back" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={seekBackward} hitSlop={8}>
              <Ionicons name="play-back" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={togglePlayPause} hitSlop={8}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color={colors.textPrimary}
              />
            </Pressable>
            <Pressable onPress={seekForward} hitSlop={8}>
              <Ionicons name="play-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.timeText}>
              {formatDuration(Math.max(0, currentTime - trimStart))}
              {' / '}
              {formatDuration(trimEnd - trimStart)}
            </Text>
          </View>

          {/* Trim bar */}
          <View style={styles.trimSection}>
            <Text style={styles.trimLabel}>
              <Ionicons name="cut-outline" size={12} color={colors.textMuted} />
              {'  Couper la rediffusion'}
            </Text>
            <View
              style={styles.trimBar}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setTrimBarWidth(w);
                trimBarWidthRef.current = w;
              }}
            >
              {/* Full track (tappable for seek) */}
              <Pressable style={styles.trimTrack} onPress={handleSeekBarPress}>
                {/* Dimmed regions outside trim */}
                <View style={[styles.trimDimmed, { left: 0, width: timeToX(trimStart) }]} />
                <View style={[styles.trimDimmed, { right: 0, width: trimBarWidth - timeToX(trimEnd) }]} />

                {/* Active trim region */}
                <View
                  style={[
                    styles.trimActive,
                    { left: timeToX(trimStart), width: timeToX(trimEnd) - timeToX(trimStart) },
                  ]}
                />

                {/* Playback position */}
                <View
                  style={[
                    styles.playhead,
                    { left: Math.max(0, Math.min(timeToX(currentTime) - 1, trimBarWidth - 2)) },
                  ]}
                />
              </Pressable>

              {/* Trim start handle */}
              <View
                {...trimStartPan.panHandlers}
                style={[styles.trimHandle, styles.trimHandleStart, { left: timeToX(trimStart) - 14 }]}
              >
                <View style={styles.trimHandleBar} />
              </View>

              {/* Trim end handle */}
              <View
                {...trimEndPan.panHandlers}
                style={[styles.trimHandle, styles.trimHandleEnd, { left: timeToX(trimEnd) - 2 }]}
              >
                <View style={styles.trimHandleBar} />
              </View>
            </View>

            {/* Trim time labels */}
            <View style={styles.trimTimesRow}>
              <Text style={styles.trimTime}>Debut : {formatDuration(trimStart)}</Text>
              <Text style={styles.trimTime}>Fin : {formatDuration(trimEnd)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Title input */}
      <Text style={styles.fieldLabel}>Titre</Text>
      <TextInput
        style={styles.textInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex: Set Techno @ Festival XYZ"
        placeholderTextColor={colors.textMuted}
        maxLength={100}
      />

      {/* Genre tags */}
      <Text style={styles.fieldLabel}>Genres musicaux</Text>
      <Text style={styles.fieldHint}>Selectionne jusqu'a 5 genres</Text>
      <View style={styles.genreGrid}>
        {ALL_GENRES.map((genre) => {
          const selected = selectedGenres.includes(genre);
          return (
            <Pressable
              key={genre}
              onPress={() => toggleGenre(genre)}
              style={[styles.genreChip, selected && styles.genreChipSelected]}
            >
              <Text style={[styles.genreChipText, selected && styles.genreChipTextSelected]}>
                {genre}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Location */}
      <Text style={styles.fieldLabel}>Lieu de la diffusion</Text>
      <View style={{ zIndex: 10 }}>
        <TextInput
          style={styles.textInput}
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            searchCitiesDebounced(text, setCitySuggestions);
          }}
          placeholder="Ex: Paris, France"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
        />
        {citySuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {citySuggestions.map((s) => (
              <Pressable
                key={s}
                style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionPressed]}
                onPress={() => {
                  setLocation(s);
                  setCitySuggestions([]);
                }}
              >
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Date */}
      <Text style={styles.fieldLabel}>Date du live</Text>
      <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
        <Text style={styles.dateText}>
          {liveDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={liveDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          themeVariant="dark"
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) setLiveDate(date);
          }}
        />
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {replay?.status === 'published' ? (
          <Pressable
            onPress={handlePublish}
            disabled={isProcessing || publishing}
            style={[styles.publishBtn, (isProcessing || publishing) && styles.btnDisabled]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            <Text style={styles.publishBtnText}>
              {publishing ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={handlePublish}
              disabled={isProcessing || publishing}
              style={[styles.publishBtn, (isProcessing || publishing) && styles.btnDisabled]}
            >
              <Ionicons name="globe-outline" size={20} color={colors.white} />
              <Text style={styles.publishBtnText}>
                {publishing ? 'Publication...' : 'Publier sur mon profil'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSaveDraft}
              disabled={isProcessing || saving}
              style={[styles.draftBtn, (isProcessing || saving) && styles.btnDisabled]}
            >
              <Ionicons name="bookmark-outline" size={18} color={colors.accentLight} />
              <Text style={styles.draftBtnText}>
                {saving ? 'Enregistrement...' : 'Enregistrer dans ma bibliotheque'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 1,
  },

  // ── Video preview ──────────────────────────────
  previewContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    backgroundColor: '#000',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  previewTouchable: {
    flex: 1,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  processingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  processingTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    marginTop: spacing.sm,
  },
  processingDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Playback controls ────────────────────────────
  controlsSection: {
    marginBottom: spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
  },

  // ── Trim bar ─────────────────────────────────────
  trimSection: {
    gap: spacing.xs,
  },
  trimLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  trimBar: {
    height: 40,
    justifyContent: 'center',
  },
  trimTrack: {
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trimDimmed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  trimActive: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(151,77,251,0.25)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.accent,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.white,
    zIndex: 3,
  },
  trimHandle: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  trimHandleStart: {},
  trimHandleEnd: {},
  trimHandleBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  trimTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trimTime: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },

  // ── Fields ─────────────────────────────────────
  fieldLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },

  suggestionsBox: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  suggestionPressed: {
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  suggestionText: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  dateText: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },

  // ── Genre chips ────────────────────────────────
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  genreChipSelected: {
    backgroundColor: 'rgba(151,77,251,0.2)',
    borderColor: colors.accent,
  },
  genreChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },
  genreChipTextSelected: {
    color: colors.accentLight,
  },

  // ── Buttons ────────────────────────────────────
  actions: {
    gap: spacing.md,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  publishBtnText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 0.5,
  },
  draftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.md,
  },
  draftBtnText: {
    color: colors.accentLight,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
