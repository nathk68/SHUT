import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { replaysService, userService } from '../services';
import { Replay } from '../types';
import { User } from '../types/user';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import { useFocusEffect } from '@react-navigation/native';
import type { LiveClubStackParamList } from '../navigation/MainTabs';

type Nav = NativeStackNavigationProp<LiveClubStackParamList>;
type SortMode = 'recent' | 'alpha' | 'duration';
type SubTab = 'discotheque' | 'favoris';

const PULL_THRESHOLD = 80;

const SORT_OPTIONS: { mode: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'recent', label: 'Récent', icon: 'time-outline' },
  { mode: 'alpha', label: 'A-Z', icon: 'text-outline' },
  { mode: 'duration', label: 'Durée', icon: 'timer-outline' },
];

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function sortReplays(arr: Replay[], mode: SortMode): Replay[] {
  const sorted = [...arr];
  switch (mode) {
    case 'alpha':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'duration':
      return sorted.sort((a, b) => b.duration - a.duration);
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export function MaDiscothequeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { favoriteIds, isLoading: favLoading } = useFavorites();

  // ── Discothèque state (DJ's own replays) ──
  const [replays, setReplays] = useState<Replay[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // ── Favoris state (DJ's favorited replays) ──
  const [favReplays, setFavReplays] = useState<Replay[]>([]);
  const [favDjMap, setFavDjMap] = useState<Record<string, User>>({});
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [favSortMode, setFavSortMode] = useState<SortMode>('recent');

  // ── Sub-tab ──
  const [activeTab, setActiveTab] = useState<SubTab>('discotheque');

  // ── Pull-to-refresh animation ──
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadReplays = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await replaysService.getReplaysByUser(user.id);
      setReplays(data);
    } catch (e) {
      console.warn('[MaDiscotheque] fetch error:', e);
      setReplays([]);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadReplays();
    }, [loadReplays]),
  );

  // ── Load favorites ──
  const favoriteIdsKey = Array.from(favoriteIds).sort().join(',');

  useEffect(() => {
    if (favoriteIds.size === 0) {
      setFavReplays([]);
      return;
    }
    setLoadingFavs(true);
    const ids = Array.from(favoriteIds);
    Promise.all(ids.map((id) => replaysService.getReplayById(id)))
      .then(async (results) => {
        const found = results.filter(Boolean) as Replay[];
        setFavReplays(found);
        const userIds = [...new Set(found.map((r) => r.userId))];
        const users = await Promise.all(userIds.map((uid) => userService.getUserById(uid)));
        const map: Record<string, User> = {};
        users.forEach((u) => { if (u) map[u.id] = u; });
        setFavDjMap(map);
      })
      .catch(() => setFavReplays([]))
      .finally(() => setLoadingFavs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIdsKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReplays();
    setRefreshing(false);
  }, [loadReplays]);

  // ── Sorted lists ──
  const sortedReplays = useMemo(
    () => (replays ? sortReplays(replays, sortMode) : []),
    [replays, sortMode],
  );
  const sortedFavReplays = useMemo(
    () => sortReplays(favReplays, favSortMode),
    [favReplays, favSortMode],
  );

  // ── Pull animation ──
  const pullProgress = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const pullScale = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD, -10, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });
  const pullRotate = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD, 0],
    outputRange: ['360deg', '0deg'],
    extrapolate: 'clamp',
  });
  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={['transparent']}
      style={{ backgroundColor: 'transparent' }}
    />
  );

  const pullIndicator = (
    <Animated.View style={[styles.pullIndicator, { opacity: pullProgress, transform: [{ scale: pullScale }, { rotate: pullRotate }] }]}>
      {refreshing ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons name="refresh-outline" size={20} color={colors.accent} />
      )}
    </Animated.View>
  );

  // ── Loading state ──
  if (replays === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const publishedCount = replays.filter(r => r.status === 'published').length;
  const draftCount = replays.filter(r => r.status === 'draft').length;

  // ── Render helpers ──
  const renderSortChips = (current: SortMode, onPress: (m: SortMode) => void) => (
    <View style={styles.sortRow}>
      {SORT_OPTIONS.map(({ mode, label, icon }) => {
        const isActive = current === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onPress(mode)}
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
  );

  const renderDiscothequeContent = () => {
    if (replays.length === 0) {
      return (
        <View style={styles.emptyBlock}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="disc-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucune rediffusion</Text>
          <Text style={styles.emptyText}>Lance ton premier live pour voir tes rediffusions ici</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionCount}>
          {replays.length} rediffusion{replays.length > 1 ? 's' : ''}
          {publishedCount > 0 ? ` · ${publishedCount} publiée${publishedCount > 1 ? 's' : ''}` : ''}
          {draftCount > 0 ? ` · ${draftCount} brouillon${draftCount > 1 ? 's' : ''}` : ''}
        </Text>

        {renderSortChips(sortMode, setSortMode)}

        <View style={styles.cardList}>
          {sortedReplays.map(replay => (
            <Pressable
              key={replay.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => {
                if (replay.status === 'published') {
                  navigation.navigate('ReplayPlayer', {
                    playbackUrl: replay.playbackUrl,
                    title: replay.title || 'Rediffusion',
                    trimStart: replay.trimStart ?? 0,
                    trimEnd: replay.trimEnd ?? 0,
                    replayId: replay.id,
                    djUserId: replay.userId,
                    eventId: replay.eventId,
                  });
                } else {
                  navigation.navigate('PostLive', { eventId: replay.eventId });
                }
              }}
            >
              {/* Thumbnail */}
              {replay.thumbnailUrl ? (
                <Image source={{ uri: replay.thumbnailUrl }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                  <Ionicons name="videocam-outline" size={22} color={colors.textMuted} />
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
                  {replay.title || 'Sans titre'}
                </Text>

                {replay.genres.length > 0 && (
                  <Text style={styles.cardGenres} numberOfLines={1}>
                    {replay.genres.join(' · ')}
                  </Text>
                )}

                <Text style={styles.cardDate}>
                  {new Date(replay.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>

                {/* Status badge */}
                <View style={[
                  styles.statusBadge,
                  replay.status === 'published' ? styles.statusPublished : styles.statusDraft,
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: replay.status === 'published' ? colors.success : colors.warning },
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: replay.status === 'published' ? colors.success : colors.warning },
                  ]}>
                    {replay.status === 'published' ? 'Publiée' : 'Brouillon'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </>
    );
  };

  const renderFavorisContent = () => {
    if (favLoading || loadingFavs) {
      return (
        <View style={styles.emptyBlock}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }

    if (favoriteIds.size === 0 || favReplays.length === 0) {
      return (
        <View style={styles.emptyBlock}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Ajoute des rediffusions en favoris{'\n'}pour les retrouver ici
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionCount}>
          {favReplays.length} favori{favReplays.length > 1 ? 's' : ''}
        </Text>

        {renderSortChips(favSortMode, setFavSortMode)}

        <View style={styles.cardList}>
          {sortedFavReplays.map((replay) => {
            const dj = favDjMap[replay.userId];
            const djLabel = dj ? (dj.artistName ?? dj.firstName ?? dj.displayName) : '';
            return (
              <Pressable
                key={replay.id}
                onPress={() =>
                  navigation.navigate('ReplayPlayer', {
                    playbackUrl: replay.playbackUrl,
                    title: replay.title || 'Rediffusion',
                    trimStart: replay.trimStart ?? 0,
                    trimEnd: replay.trimEnd ?? 0,
                    replayId: replay.id,
                    djUserId: replay.userId,
                    eventId: replay.eventId,
                  })
                }
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                {replay.thumbnailUrl ? (
                  <Image source={{ uri: replay.thumbnailUrl }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Ionicons name="musical-notes-outline" size={22} color={colors.textMuted} />
                  </View>
                )}

                {replay.duration > 0 && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formatDuration(replay.duration)}</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {replay.title || 'Sans titre'}
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
    );
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      refreshControl={refreshControl}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {pullIndicator}

      <ScreenHeader title="Ma discothèque" />

      {/* Sub-tabs */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('discotheque')}
          style={[styles.tabPill, activeTab === 'discotheque' && styles.tabPillActive]}
        >
          <Ionicons
            name="musical-notes-outline"
            size={15}
            color={activeTab === 'discotheque' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabPillText, activeTab === 'discotheque' && styles.tabPillTextActive]}>
            Mes sets
          </Text>
          {replays.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'discotheque' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'discotheque' && styles.tabBadgeTextActive]}>
                {replays.length}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('favoris')}
          style={[styles.tabPill, activeTab === 'favoris' && styles.tabPillActive]}
        >
          <Ionicons
            name="heart-outline"
            size={15}
            color={activeTab === 'favoris' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabPillText, activeTab === 'favoris' && styles.tabPillTextActive]}>
            Favoris
          </Text>
          {favReplays.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'favoris' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'favoris' && styles.tabBadgeTextActive]}>
                {favReplays.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'discotheque' ? renderDiscothequeContent() : renderFavorisContent()}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },

  // ── Pull indicator ──
  pullIndicator: {
    alignSelf: 'center',
    marginBottom: spacing.xs,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(151, 77, 251, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Sub-tabs ──
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabPillText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
  tabPillTextActive: {
    color: colors.white,
  },
  tabBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono.medium,
    fontSize: 10,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },

  // ── Section count ──
  sectionCount: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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

  // ── Empty state ──
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(151, 77, 251, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 80,
    height: 80,
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    left: 4,
    top: 80 - 18,
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
    paddingVertical: spacing.sm,
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
  cardDate: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
  statusPublished: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  statusDraft: {
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fonts.body.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  playIcon: {
    marginRight: spacing.md,
    opacity: 0.8,
  },
});
