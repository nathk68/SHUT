import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { eventsService, replaysService, userService } from '../../services';
import type { User } from '../../types/user';
import type { LiveEvent } from '../../types/event';
import type { Replay } from '../../types';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function matches(text: string | null | undefined, q: string): boolean {
  return !!text && text.toLowerCase().includes(q);
}

export function GlobalSearchOverlay({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const progress = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [djs, setDJs] = useState<User[]>([]);
  const [lives, setLives] = useState<LiveEvent[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // ── Load data when overlay opens ──
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Promise.all([
      userService.getDJs(),
      eventsService.getLiveEvents(),
      replaysService.getPublishedReplays(),
    ])
      .then(([d, l, r]) => {
        setDJs(d);
        setLives(l);
        setReplays(r);
        setDataReady(true);
      })
      .catch(() => setDataReady(true))
      .finally(() => setLoading(false));
  }, [visible]);

  // ── Animate ──
  useEffect(() => {
    if (visible) {
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start(() => inputRef.current?.focus());
    }
  }, [visible, progress]);

  const handleClose = useCallback(() => {
    setQuery('');
    Keyboard.dismiss();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setDataReady(false);
      onClose();
    });
  }, [onClose, progress]);

  const handleNavigate = useCallback(
    (action: () => void) => {
      handleClose();
      setTimeout(action, 220);
    },
    [handleClose],
  );

  // ── Filter ──
  const q = query.toLowerCase().trim();
  const hasQuery = q.length >= 2;

  const filteredDJs = hasQuery
    ? djs
        .filter(
          (dj) =>
            matches(dj.artistName, q) ||
            matches(dj.displayName, q) ||
            matches(dj.username, q) ||
            matches(dj.cityName, q) ||
            dj.genres?.some((g) => g.toLowerCase().includes(q)),
        )
        .slice(0, 5)
    : [];

  const filteredLives = hasQuery
    ? lives
        .filter(
          (live) =>
            matches(live.title, q) ||
            matches(live.djName, q) ||
            matches(live.genre, q) ||
            matches(live.city, q),
        )
        .slice(0, 5)
    : [];

  const filteredReplays = hasQuery
    ? replays
        .filter(
          (r) =>
            matches(r.title, q) ||
            r.genres?.some((g) => g.toLowerCase().includes(q)) ||
            matches(r.location, q),
        )
        .slice(0, 5)
    : [];

  const hasResults = filteredDJs.length + filteredLives.length + filteredReplays.length > 0;

  // ── Animated values ──
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const barTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });
  const resultsOpacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Search bar */}
      <Animated.View
        style={[
          styles.barWrap,
          {
            paddingTop: insets.top + spacing.sm,
            opacity: progress,
            transform: [{ translateY: barTranslateY }],
          },
        ]}
      >
        <View style={styles.bar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor={colors.accent}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable onPress={handleClose} hitSlop={8} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('search.close')}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Results */}
      <Animated.View
        style={[styles.resultsWrap, { paddingTop: insets.top + 68, opacity: resultsOpacity }]}
        pointerEvents="box-none"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContent}
        >
          {loading && (
            <View style={styles.hint}>
              <ActivityIndicator color={colors.accent} />
            </View>
          )}

          {!loading && !hasQuery && (
            <View style={styles.hint}>
              <Ionicons name="search-outline" size={28} color={colors.textMuted} />
              <Text style={styles.hintText}>{t('search.minChars')}</Text>
            </View>
          )}

          {!loading && hasQuery && !hasResults && (
            <View style={styles.hint}>
              <Text style={styles.hintText}>{t('search.noResults', { query })}</Text>
            </View>
          )}

          {/* ── DJs ── */}
          {filteredDJs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('search.sectionDJs')}</Text>
              {filteredDJs.map((dj) => (
                <Pressable
                  key={dj.id}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() =>
                    handleNavigate(() =>
                      navigation.navigate('PublicProfile', { userId: dj.id }),
                    )
                  }
                >
                  {dj.avatarUrl ? (
                    <Image source={{ uri: dj.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarLetter}>
                        {(dj.artistName || dj.displayName || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {dj.artistName || dj.displayName}
                    </Text>
                    {dj.genres && dj.genres.length > 0 && (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {dj.genres.join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </>
          )}

          {/* ── Lives ── */}
          {filteredLives.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('search.sectionLive')}</Text>
              {filteredLives.map((live) => (
                <Pressable
                  key={live.id}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() =>
                    handleNavigate(() =>
                      navigation.navigate('LivePlayer', { eventId: live.id }),
                    )
                  }
                >
                  <View style={[styles.avatar, styles.liveIcon]}>
                    <View style={styles.liveDot} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {live.djName || live.title || 'Live'}
                    </Text>
                    {live.genre ? (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {live.genre}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          {/* ── Rediffusions ── */}
          {filteredReplays.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('search.sectionReplays')}</Text>
              {filteredReplays.map((replay) => (
                <Pressable
                  key={replay.id}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() =>
                    handleNavigate(() =>
                      navigation.navigate('ReplayPlayer', {
                        playbackUrl: replay.playbackUrl,
                        title: replay.title || t('common.replay'),
                        trimStart: replay.trimStart ?? 0,
                        trimEnd: replay.trimEnd ?? 0,
                        replayId: replay.id,
                        djUserId: replay.userId,
                        eventId: replay.eventId,
                      }),
                    )
                  }
                >
                  {replay.thumbnailUrl ? (
                    <Image source={{ uri: replay.thumbnailUrl }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]}>
                      <Ionicons name="musical-notes-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {replay.title || t('common.untitled')}
                    </Text>
                    {replay.genres && replay.genres.length > 0 && (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {replay.genres.join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="play-circle" size={22} color={colors.accent} style={{ opacity: 0.7 }} />
                </Pressable>
              ))}
            </>
          )}

          <View style={{ height: insets.bottom + 80 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8, 8, 15, 0.92)',
  },

  // ── Search bar ──
  barWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    padding: 0,
  },
  cancelBtn: {
    marginLeft: spacing.xs,
  },
  cancelText: {
    color: colors.accent,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },

  // ── Results ──
  resultsWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hint: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  hintText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // ── Result rows ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  rowPressed: {
    backgroundColor: 'rgba(151, 77, 251, 0.1)',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.sm,
  },
  rowSub: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },

  // ── Avatars & thumbnails ──
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    backgroundColor: 'rgba(151, 77, 251, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.accent,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
  },
  thumbFallback: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Live indicator ──
  liveIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.live,
  },
  liveBadge: {
    backgroundColor: colors.live,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveBadgeText: {
    color: colors.white,
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
});
