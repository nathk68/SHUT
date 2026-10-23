import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { eventsService, userService } from '../services';
import { LiveEvent } from '../types/event';
import { User } from '../types/user';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { GlobalSearchOverlay } from '../components/search/GlobalSearchOverlay';
import { NotificationBell } from '../components/ui/NotificationBell';

const GENRE_KEYS = ['all', 'Techno', 'House', 'Progressive', 'Minimal'] as const;
const MAX_VISIBLE_GENRES = 3;

/** Extract Mux playback ID from a playback URL like https://stream.mux.com/{ID}.m3u8 */
function getMuxThumbnailUrl(playbackUrl: string | null): string | null {
  if (!playbackUrl) return null;
  const match = playbackUrl.match(/stream\.mux\.com\/([^/.]+)/);
  if (!match) return null;
  return `https://image.mux.com/${match[1]}/thumbnail.png?width=320&height=180&time=0`;
}

export function LivesScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [lives, setLives] = useState<LiveEvent[] | null>(null);
  const [djProfiles, setDjProfiles] = useState<Record<string, User>>({});
  const [activeGenre, setActiveGenre] = useState<string>('all');
  const [searchVisible, setSearchVisible] = useState(false);

  const getGenreLabel = (key: string) => key === 'all' ? t('common.all') : key;

  // Real-time listener — updates when a live starts, ends, or playbackUrl changes
  useEffect(() => {
    const unsubscribe = eventsService.onLiveEvents(setLives);
    return unsubscribe;
  }, []);

  // Fetch DJ profiles — only fetch newly seen userIds
  useEffect(() => {
    if (!lives || lives.length === 0) return;

    const userIds = [...new Set(
      lives.map((l) => l.userId).filter((id): id is string => !!id && id !== 'anonymous')
    )];

    const missing = userIds.filter((uid) => !djProfiles[uid]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map((uid) =>
        userService.getUserById(uid).then((u) => (u ? { uid, user: u } : null))
      )
    ).then((results) => {
      const newEntries: Record<string, User> = {};
      for (const r of results) {
        if (r) newEntries[r.uid] = r.user;
      }
      if (Object.keys(newEntries).length > 0) {
        setDjProfiles((prev) => ({ ...prev, ...newEntries }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives]);

  const livesLoaded = lives !== null;

  // Filter by genre — check both event.genre and DJ profile genres
  const filtered = livesLoaded
    ? activeGenre === 'all'
      ? lives
      : lives.filter((l) => {
          if (l.genre === activeGenre) return true;
          const dj = l.userId ? djProfiles[l.userId] : null;
          return dj?.genres?.includes(activeGenre) ?? false;
        })
    : [];

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('live.title')}
        subtitle={t('live.subtitle')}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => setSearchVisible(true)} hitSlop={8}>
              <Ionicons name="search-outline" size={22} color={colors.textSecondary} />
            </Pressable>
            <NotificationBell />
          </View>
        }
      />

      {/* Genre pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsRow}
        contentContainerStyle={styles.pillsContent}
      >
        {GENRE_KEYS.map((genre) => (
          <Pressable
            key={genre}
            onPress={() => setActiveGenre(genre)}
            style={[styles.pill, activeGenre === genre && styles.pillActive]}
          >
            <Text style={[styles.pillText, activeGenre === genre && styles.pillTextActive]}>
              {getGenreLabel(genre)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty state */}
      {livesLoaded && filtered.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="radio-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('live.noLives')}</Text>
        </View>
      )}

      {/* Live cards */}
      {filtered.map((live) => {
        const dj = live.userId ? djProfiles[live.userId] : null;
        const artistName = dj?.artistName || dj?.username || dj?.displayName || live.djName;
        const avatarUrl = dj?.avatarUrl ?? null;
        const genres = dj?.genres ?? (live.genre ? [live.genre] : []);
        const thumbnailUrl = getMuxThumbnailUrl(live.playbackUrl);
        const visibleGenres = genres.slice(0, MAX_VISIBLE_GENRES);
        const extraCount = genres.length - MAX_VISIBLE_GENRES;

        return (
          <Pressable
            key={live.id}
            onPress={() => navigation.navigate('LivePlayer', { eventId: live.id })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            {/* Mux Thumbnail */}
            <View style={styles.thumbnail}>
              {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnailImage} />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="videocam-outline" size={24} color="rgba(255,255,255,0.15)" />
                </View>
              )}
              <View testID="live-badge" style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              {/* DJ avatar + name row */}
              <View style={styles.djRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.djAvatar} />
                ) : (
                  <View style={styles.djAvatarFallback}>
                    <Text style={styles.djAvatarInitial}>
                      {(artistName || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.djName} numberOfLines={1}>{artistName}</Text>
              </View>

              {/* Live title */}
              {live.title ? (
                <Text style={styles.liveTitle} numberOfLines={1}>{live.title}</Text>
              ) : null}

              {/* Genre tags */}
              {visibleGenres.length > 0 && (
                <View style={styles.genreTagsRow}>
                  {visibleGenres.map((g) => (
                    <View key={g} style={styles.genreTag}>
                      <Text style={styles.genreTagText}>{g}</Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <View style={styles.genreTagExtra}>
                      <Text style={styles.genreTagExtraText}>+{extraCount}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Viewer count */}
              <View style={styles.viewersRow}>
                <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                <Text style={styles.viewers}>{live.viewerCount}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>

    <GlobalSearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  pillsRow: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  pillsContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },
  pillTextActive: {
    color: colors.white,
  },
  emptyContainer: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  // ── Thumbnail ─────────────────────────────────
  thumbnail: {
    width: 110,
    height: 120,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.live,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
  },
  liveBadgeText: {
    color: colors.white,
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  // ── Card info ─────────────────────────────────
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    gap: 5,
  },
  djRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  djAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  djAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  djAvatarInitial: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xs,
  },
  djName: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  liveTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  // ── Genre tags ────────────────────────────────
  genreTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(151,77,251,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  genreTagText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: 10,
  },
  genreTagExtra: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  genreTagExtraText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono.medium,
    fontSize: 10,
  },
  // ── Viewers ───────────────────────────────────
  viewersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewers: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
});
