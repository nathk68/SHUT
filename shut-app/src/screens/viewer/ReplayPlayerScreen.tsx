import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { userService, replaysService, likesService, favoritesService } from '../../services';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { ReportModal } from '../../components/report/ReportModal';

type ReplayPlayerParams = {
  ReplayPlayer: {
    playbackUrl: string;
    title: string;
    trimStart?: number;
    trimEnd?: number;
    replayId?: string;
    djUserId?: string;
    eventId?: string;
  };
};

type Route = RouteProp<ReplayPlayerParams, 'ReplayPlayer'>;

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ReplayPlayerScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const {
    playbackUrl,
    title,
    trimStart = 0,
    trimEnd: rawTrimEnd,
    replayId,
    djUserId,
    eventId,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const { isFavorite, isLiked, toggleFavorite, toggleLike } = useFavorites();

  const isOwner = !!(currentUser && djUserId && currentUser.id === djUserId);
  const [reportVisible, setReportVisible] = useState(false);

  // DJ profile
  const [djName, setDjName] = useState('');
  const [djAvatarUrl, setDjAvatarUrl] = useState<string | null>(null);

  // Replay metadata (location, date)
  const [replayLocation, setReplayLocation] = useState<string | null>(null);
  const [replayDate, setReplayDate] = useState<string | null>(null);

  useEffect(() => {
    if (!djUserId) return;
    userService.getUserById(djUserId).then((u) => {
      if (!u) return;
      setDjName(u.artistName || u.displayName);
      setDjAvatarUrl(u.avatarUrl ?? null);
    });
  }, [djUserId]);

  useEffect(() => {
    if (!replayId) return;
    replaysService.getReplayById(replayId).then((r) => {
      if (!r) return;
      setReplayLocation(r.location ?? null);
      setReplayDate(r.liveDate ?? null);
    });
  }, [replayId]);

  // Video player
  const player = useVideoPlayer(playbackUrl, (p) => {
    p.loop = false;
    if (trimStart > 0) p.currentTime = trimStart;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Progress tracking
  const [currentPos, setCurrentPos] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  // If rawTrimEnd is 0 or missing, fall back to the player's real duration.
  // If rawTrimEnd exceeds the player's real duration, cap it.
  const trimEnd = (() => {
    const dur = playerDuration || player.duration || 0;
    if (!rawTrimEnd || rawTrimEnd <= 0) return dur;
    return dur > 0 ? Math.min(rawTrimEnd, dur) : rawTrimEnd;
  })();
  const trimmedDuration = trimEnd - trimStart;
  const progress = trimmedDuration > 0 ? Math.min(1, (currentPos - trimStart) / trimmedDuration) : 0;

  // Scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubbingRef = useRef(false);
  const progressBarWidthRef = useRef(0);
  const trimStartRef = useRef(trimStart);
  const trimEndRef = useRef(trimEnd);
  trimStartRef.current = trimStart;
  trimEndRef.current = trimEnd;

  useEventListener(player, 'timeUpdate', useCallback(({ currentTime }: { currentTime: number }) => {
    if (!scrubbingRef.current) setCurrentPos(currentTime);
    if (player.duration > 0) setPlayerDuration(player.duration);
    // Loop within trim bounds
    if (!scrubbingRef.current && trimEnd > 0 && currentTime >= trimEnd) {
      player.currentTime = trimStart;
      player.play();
    }
  }, [trimStart, trimEnd, player]));

  const wasPlayingRef = useRef(false);
  const grantRatioRef = useRef(0);

  const progressPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        scrubbingRef.current = true;
        setIsScrubbing(true);
        wasPlayingRef.current = player.playing;
        player.pause();
        const x = e.nativeEvent.locationX;
        const w = progressBarWidthRef.current;
        if (w > 0) {
          const ratio = Math.max(0, Math.min(x / w, 1));
          grantRatioRef.current = ratio;
          const dur = trimEndRef.current - trimStartRef.current;
          const t = trimStartRef.current + ratio * dur;
          player.currentTime = t;
          setCurrentPos(t);
        }
      },
      onPanResponderMove: (_, gs) => {
        const w = progressBarWidthRef.current;
        if (w <= 0) return;
        const ratio = Math.max(0, Math.min(grantRatioRef.current + gs.dx / w, 1));
        const dur = trimEndRef.current - trimStartRef.current;
        const t = trimStartRef.current + ratio * dur;
        player.currentTime = t;
        setCurrentPos(t);
      },
      onPanResponderRelease: () => {
        scrubbingRef.current = false;
        setIsScrubbing(false);
        if (wasPlayingRef.current) player.play();
      },
      onPanResponderTerminate: () => {
        scrubbingRef.current = false;
        setIsScrubbing(false);
        if (wasPlayingRef.current) player.play();
      },
    }),
  ).current;

  // Menu "..."
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMore = () => {
    if (Platform.OS === 'ios') {
      const options = isOwner
        ? [t('replayPlayer.edit'), t('replayPlayer.archive'), t('replayPlayer.delete'), t('common.cancel')]
        : [t('replayPlayer.report'), t('common.cancel')];
      const cancelIdx = options.length - 1;
      const destructiveIdx = isOwner ? 2 : 0;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIdx, destructiveButtonIndex: destructiveIdx },
        (idx) => {
          if (isOwner) {
            if (idx === 0) handleEdit();
            else if (idx === 1) handleArchive();
            else if (idx === 2) handleDelete();
          } else {
            if (idx === 0) handleReport();
          }
        },
      );
    } else {
      setMenuVisible(!menuVisible);
    }
  };

  const handleEdit = () => {
    if (!eventId) return;
    navigation.replace('PostLive', { eventId });
  };

  const handleArchive = () => {
    if (!replayId) return;
    Alert.alert(
      t('replayPlayer.archiveTitle'),
      t('replayPlayer.archiveMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.archive'),
          onPress: async () => {
            await replaysService.updateReplay(replayId, { status: 'draft', publishedAt: null });
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    if (!replayId) return;
    Alert.alert(
      t('replayPlayer.deleteTitle'),
      t('replayPlayer.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            // For now, archive it (actual deletion would need a Cloud Function)
            await replaysService.updateReplay(replayId, { status: 'draft', publishedAt: null });
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleReport = () => {
    setReportVisible(true);
  };

  const handleShare = async () => {
    await Share.share({ message: t('replayPlayer.shareMessage', { title, djName }) });
  };

  const handleTogglePlay = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  const eventIdForSocial = replayId ?? 'replay';

  // Likes & favorites counts
  const [likesCount, setLikesCount] = useState(0);
  const [favsCount, setFavsCount] = useState(0);
  useEffect(() => {
    if (!eventIdForSocial || eventIdForSocial === 'replay') return;
    likesService.getLikesCountForItems([eventIdForSocial]).then(setLikesCount).catch(() => {});
    favoritesService.getFavoritesCountForItem(eventIdForSocial).then(setFavsCount).catch(() => {});
  }, [eventIdForSocial]);

  const handleToggleLike = async () => {
    const wasLiked = isLiked(eventIdForSocial);
    await toggleLike(eventIdForSocial);
    setLikesCount((c) => wasLiked ? Math.max(0, c - 1) : c + 1);
  };

  const handleToggleFavorite = async () => {
    const wasFav = isFavorite(eventIdForSocial);
    await toggleFavorite(eventIdForSocial);
    setFavsCount((c) => wasFav ? Math.max(0, c - 1) : c + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video — full screen, no native controls */}
      <Pressable style={styles.videoTouchable} onPress={handleTogglePlay}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
      </Pressable>

      {/* Play/Pause overlay (briefly visible) */}
      {!isPlaying && (
        <View style={styles.playOverlay} pointerEvents="none">
          <View style={styles.playCircle}>
            <Ionicons name="play" size={36} color={colors.white} style={{ marginLeft: 4 }} />
          </View>
        </View>
      )}

      {/* Top bar: close + title */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>{title || t('common.replay')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Bottom: progress bar + time */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {/* DJ name */}
        {djName ? (
          <Pressable
            onPress={() => djUserId && navigation.navigate('PublicProfile', { userId: djUserId })}
            style={styles.djRow}
          >
            <Text style={styles.djName} numberOfLines={1}>{djName}</Text>
          </Pressable>
        ) : null}

        {/* Location & date tags */}
        {(replayLocation || replayDate) && (
          <View style={styles.tagsRow}>
            {replayLocation && (
              <View style={styles.infoTag}>
                <Ionicons name="location-outline" size={12} color={colors.white} />
                <Text style={styles.infoTagText}>{replayLocation}</Text>
              </View>
            )}
            {replayDate && (
              <View style={styles.infoTag}>
                <Ionicons name="calendar-outline" size={12} color={colors.white} />
                <Text style={styles.infoTagText}>
                  {new Date(replayDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Progress bar (scrubbable) */}
        <View style={styles.progressContainer}>
          <View
            style={styles.progressHitArea}
            onLayout={(e) => { progressBarWidthRef.current = e.nativeEvent.layout.width; }}
            {...progressPan.panHandlers}
          >
            <View style={[styles.progressTrack, isScrubbing && styles.progressTrackActive]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            {isScrubbing && (
              <View style={[styles.scrubThumb, { left: `${progress * 100}%` }]} />
            )}
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(Math.max(0, currentPos - trimStart))}</Text>
            <Text style={styles.timeText}>{formatTime(trimmedDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Right-side action bar */}
      <View style={[styles.actionBar, { bottom: insets.bottom + spacing.xl + 60 }]}>
        {/* Avatar DJ */}
        <Pressable onPress={() => djUserId && navigation.navigate('PublicProfile', { userId: djUserId })}>
          {djAvatarUrl ? (
            <Image source={{ uri: djAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(djName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Like */}
        <Pressable style={styles.action} onPress={handleToggleLike}>
          <Ionicons
            name={isLiked(eventIdForSocial) ? 'heart' : 'heart-outline'}
            size={30}
            color={isLiked(eventIdForSocial) ? colors.accent : colors.white}
          />
          {likesCount > 0 && <Text style={styles.actionCount}>{likesCount}</Text>}
        </Pressable>

        {/* Share */}
        <Pressable style={styles.action} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={28} color={colors.white} />
        </Pressable>

        {/* Favorite */}
        <Pressable style={styles.action} onPress={handleToggleFavorite}>
          <Ionicons
            name={isFavorite(eventIdForSocial) ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={isFavorite(eventIdForSocial) ? colors.accent : colors.white}
          />
          {favsCount > 0 && <Text style={styles.actionCount}>{favsCount}</Text>}
        </Pressable>

        {/* More "..." */}
        <Pressable style={styles.action} onPress={handleMore}>
          <Ionicons name="ellipsis-horizontal" size={28} color={colors.white} />
        </Pressable>
      </View>

      {/* Android fallback menu */}
      {menuVisible && Platform.OS !== 'ios' && (
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            {isOwner ? (
              <>
                <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); handleEdit(); }}>
                  <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuText}>{t('replayPlayer.edit')}</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); handleArchive(); }}>
                  <Ionicons name="archive-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuText}>{t('replayPlayer.archive')}</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); handleDelete(); }}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.menuText, { color: '#ef4444' }]}>{t('replayPlayer.delete')}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); handleReport(); }}>
                <Ionicons name="flag-outline" size={20} color="#ef4444" />
                <Text style={[styles.menuText, { color: '#ef4444' }]}>{t('replayPlayer.report')}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      )}
      {replayId && (
        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          targetType="replay"
          targetId={replayId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoTouchable: { flex: 1 },
  video: { flex: 1 },

  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  djRow: { marginBottom: spacing.xs },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  infoTagText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.body.regular,
    fontSize: 11,
  },
  djName: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressContainer: { gap: 4 },
  progressHitArea: {
    height: 24,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrackActive: {
    height: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  scrubThumb: {
    position: 'absolute',
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },

  // Action bar (right side)
  actionBar: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.xl,
    zIndex: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(124,58,237,0.4)',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  action: { alignItems: 'center' },
  actionCount: {
    color: colors.white,
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Android menu
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuText: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
  },
});
