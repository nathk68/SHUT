import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { replaysService } from '../../services';
import type { Replay } from '../../types';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

interface Props {
  userId: string;
  onPress: (replay: Replay) => void;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ReplayList({ userId, onPress }: Props) {
  const [replays, setReplays] = useState<Replay[] | null>(null);

  useEffect(() => {
    replaysService
      .getPublishedReplaysByUser(userId)
      .then(setReplays)
      .catch(() => setReplays([]));
  }, [userId]);

  if (!replays) return null;

  if (replays.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune rediffusion publiée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Rediffusions</Text>
      {replays.map((replay) => (
        <Pressable
          key={replay.id}
          onPress={() => onPress(replay)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          {replay.thumbnailUrl ? (
            <Image source={{ uri: replay.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnail}>
              <Ionicons name="videocam-outline" size={20} color={colors.textMuted} />
            </View>
          )}

          {replay.duration > 0 && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(replay.duration)}</Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {replay.title || 'Sans titre'}
            </Text>
            {replay.genres.length > 0 && (
              <Text style={styles.genres} numberOfLines={1}>{replay.genres.join(' · ')}</Text>
            )}
            <Text style={styles.date}>
              {new Date(replay.publishedAt ?? replay.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>

          <Ionicons name="play-circle-outline" size={28} color={colors.accent} style={styles.playIcon} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { color: colors.textSecondary, fontFamily: fonts.body.medium, fontSize: fontSize.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  thumbnail: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    left: spacing.xs,
    top: 72 - 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: {
    color: colors.white,
    fontFamily: fonts.mono.regular,
    fontSize: 10,
  },
  info: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 3,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
  },
  genres: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  date: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  playIcon: {
    marginRight: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    opacity: 0.2,
    textAlign: 'center',
  },
});
