import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eventsService } from '../services';
import { LiveEvent } from '../types/event';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

const GENRES = ['Tous', 'Techno', 'House', 'Progressive', 'Minimal'] as const;

export function LivesScreen() {
  const navigation = useNavigation<any>();
  // null = loading, [] = loaded empty, [...] = loaded with results
  const [lives, setLives] = useState<LiveEvent[] | null>(null);
  const [activeGenre, setActiveGenre] = useState<string>('Tous');

  useEffect(() => {
    eventsService.getLiveEvents().then(setLives);
  }, []);

  const livesLoaded = lives !== null;
  const filtered = livesLoaded
    ? activeGenre === 'Tous'
      ? lives
      : lives.filter((l) => l.genre === activeGenre)
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title always visible */}
      <Text testID="live-screen-title" style={styles.title}>LIVE</Text>
      <Text style={styles.subtitle}>Tous les DJ en live autour de vous</Text>

      {/* Genre pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsRow}
        contentContainerStyle={styles.pillsContent}
      >
        {GENRES.map((genre) => (
          <Pressable
            key={genre}
            onPress={() => setActiveGenre(genre)}
            style={[styles.pill, activeGenre === genre && styles.pillActive]}
          >
            <Text style={[styles.pillText, activeGenre === genre && styles.pillTextActive]}>
              {genre}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty state */}
      {livesLoaded && filtered.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="radio-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aucun live en cours</Text>
        </View>
      )}

      {/* Live cards */}
      {filtered.map((live) => (
        <Pressable
          key={live.id}
          onPress={() => navigation.navigate('LivePlayer', { eventId: live.id })}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          {/* Thumbnail */}
          <View style={styles.thumbnail}>
            <View style={styles.thumbnailInner} />
            <View testID="live-badge" style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.djName} numberOfLines={1}>{live.djName}</Text>

            {live.city && (
              <Text style={styles.location} numberOfLines={1}>
                {live.city}{live.venue ? ` · ${live.venue}` : ''}
              </Text>
            )}

            {(live.genre || live.duration) && (
              <Text style={styles.genreRow} numberOfLines={1}>
                {[live.genre, live.duration].filter(Boolean).join(' · ')}
              </Text>
            )}

            <View style={styles.viewersRow}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.viewers}>{live.viewerCount}</Text>
            </View>
          </View>

          {/* Three-dot menu */}
          <Pressable style={styles.menuButton} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
          </Pressable>
        </Pressable>
      ))}
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
    paddingTop: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  pillsRow: {
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  pillsContent: {
    gap: spacing.sm,
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
    alignItems: 'center',
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
  thumbnail: {
    width: 90,
    height: 100,
    position: 'relative',
  },
  thumbnailInner: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.live,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  liveBadgeText: {
    color: colors.white,
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 3,
  },
  djName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  location: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  genreRow: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  viewersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  viewers: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
  menuButton: {
    padding: spacing.md,
    alignSelf: 'center',
  },
});
