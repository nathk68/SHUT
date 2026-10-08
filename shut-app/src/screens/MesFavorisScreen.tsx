import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FavorisStackParamList } from '../navigation/MainTabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { GlobalSearchOverlay } from '../components/search/GlobalSearchOverlay';
import { NotificationBell } from '../components/ui/NotificationBell';
import { useFavorites } from '../contexts/FavoritesContext';
import { replaysService, userService } from '../services';
import type { Replay } from '../types';
import type { User } from '../types/user';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

type Nav = NativeStackNavigationProp<FavorisStackParamList>;
type SortMode = 'recent' | 'alpha' | 'duration';

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MesFavorisScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const SORT_OPTIONS: { mode: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'recent', label: t('common.sort.recent'), icon: 'time-outline' },
    { mode: 'alpha', label: t('common.sort.alpha'), icon: 'text-outline' },
    { mode: 'duration', label: t('common.sort.duration'), icon: 'timer-outline' },
  ];
  const { favoriteIds, isLoading } = useFavorites();
  const [replays, setReplays] = useState<Replay[]>([]);
  const [djMap, setDjMap] = useState<Record<string, User>>({});
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchVisible, setSearchVisible] = useState(false);

  const favoriteIdsKey = Array.from(favoriteIds).sort().join(',');

  useEffect(() => {
    if (favoriteIds.size === 0) {
      setReplays([]);
      return;
    }
    setLoadingReplays(true);
    const ids = Array.from(favoriteIds);
    Promise.all(ids.map((id) => replaysService.getReplayById(id)))
      .then(async (results) => {
        const found = results.filter(Boolean) as Replay[];
        setReplays(found);
        const userIds = [...new Set(found.map((r) => r.userId))];
        const users = await Promise.all(userIds.map((uid) => userService.getUserById(uid)));
        const map: Record<string, User> = {};
        users.forEach((u) => { if (u) map[u.id] = u; });
        setDjMap(map);
      })
      .catch(() => setReplays([]))
      .finally(() => setLoadingReplays(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIdsKey]);

  const sortedReplays = useMemo(() => {
    const arr = [...replays];
    switch (sortMode) {
      case 'alpha':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'duration':
        return arr.sort((a, b) => b.duration - a.duration);
      case 'recent':
      default:
        return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [replays, sortMode]);

  if (isLoading || loadingReplays) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const isEmpty = favoriteIds.size === 0 || replays.length === 0;

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={isEmpty ? styles.containerEmpty : { paddingBottom: insets.bottom + spacing.xl }}>
      <ScreenHeader
        title={t('mesFavoris.title')}
        subtitle={!isEmpty ? t('mesFavoris.replayCount', { count: replays.length }) : undefined}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => setSearchVisible(true)} hitSlop={8}>
              <Ionicons name="search-outline" size={22} color={colors.textSecondary} />
            </Pressable>
            <NotificationBell />
          </View>
        }
      />

      {isEmpty ? (
        <View style={styles.emptyBlock}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={32} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>{t('mesFavoris.noFavorites')}</Text>
          <Text style={styles.emptyText}>
            {t('mesFavoris.addFavoritesHint')}
          </Text>
        </View>
      ) : (
        <>
          {/* Sort chips */}
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(({ mode, label, icon }) => {
              const isActive = sortMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setSortMode(mode)}
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                >
                  <Ionicons name={icon} size={13} color={isActive ? colors.white : colors.textSecondary} />
                  <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cards */}
          <View style={styles.cardList}>
            {sortedReplays.map((replay) => {
              const dj = djMap[replay.userId];
              const djLabel = dj ? (dj.artistName ?? dj.firstName ?? dj.displayName) : '';
              return (
                <Pressable
                  key={replay.id}
                  onPress={() =>
                    navigation.navigate('ReplayPlayer', {
                      playbackUrl: replay.playbackUrl,
                      title: replay.title || t('common.replay'),
                      trimStart: replay.trimStart ?? 0,
                      trimEnd: replay.trimEnd ?? 0,
                      replayId: replay.id,
                      djUserId: replay.userId,
                      eventId: replay.eventId,
                    })
                  }
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  {/* Thumbnail */}
                  {replay.thumbnailUrl ? (
                    <Image source={{ uri: replay.thumbnailUrl }} style={styles.thumbnail} />
                  ) : (
                    <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                      <Ionicons name="musical-notes-outline" size={22} color={colors.textMuted} />
                    </View>
                  )}

                  {/* Duration badge */}
                  {replay.duration > 0 && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{formatDuration(replay.duration)}</Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {replay.title || t('common.untitled')}
                    </Text>
                    {djLabel ? (
                      <Text style={styles.cardDj} numberOfLines={1}>{djLabel}</Text>
                    ) : null}
                    {replay.genres.length > 0 && (
                      <Text style={styles.cardGenres} numberOfLines={1}>
                        {replay.genres.join(' · ')}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name="play-circle"
                    size={30}
                    color={colors.accent}
                    style={styles.playIcon}
                  />
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>

    <GlobalSearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerEmpty: { flexGrow: 1 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },

  // ── Empty state ──
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(151, 77, 251, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Sort ──
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sortChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortChipText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: 12,
  },
  sortChipTextActive: {
    color: colors.white,
  },

  // ── Cards ──
  cardList: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(151, 77, 251, 0.08)',
    borderColor: 'rgba(151, 77, 251, 0.25)',
  },
  thumbnail: {
    width: 76,
    height: 76,
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    left: 4,
    top: 76 - 18,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: {
    color: colors.white,
    fontFamily: fonts.mono.regular,
    fontSize: 10,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 3,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.sm,
  },
  cardDj: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
  cardGenres: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  playIcon: {
    marginRight: spacing.md,
    opacity: 0.8,
  },
});
