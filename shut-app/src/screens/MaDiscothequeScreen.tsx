import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/MainTabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services';
import { LiveEvent } from '../types/event';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import { formatEventDate } from '../utils/formatDate';

export function MaDiscothequeScreen() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { user } = useAuth();
  const [replays, setReplays] = useState<LiveEvent[] | null>(null);

  useEffect(() => {
    if (!user) return;
    eventsService.getAllEvents().then((all) => {
      // Filter by djName matching displayName — update to djUserId once field exists on LiveEvent
      setReplays(
        all
          .filter(e => e.status === 'ended' && e.djName === user.displayName)
          .sort((a, b) => (b.scheduledStartTime > a.scheduledStartTime ? 1 : -1)),
      );
    }).catch(() => setReplays([]));
  }, [user?.id]);

  const navigateToPlayer = (eventId: string) => {
    navigation.navigate('Live', {
      screen: 'LivePlayer',
      params: { eventId },
    });
  };

  if (replays === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (replays.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucune rediffusion</Text>
        <Text style={styles.emptyText}>Lance ton premier live !</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MA DISCOTHÈQUE</Text>
      <Text style={styles.subtitle}>{replays.length} set{replays.length > 1 ? 's' : ''} enregistré{replays.length > 1 ? 's' : ''}</Text>

      {replays.map(event => (
        <Pressable
          key={event.id}
          testID={`replay-card-${event.id}`}
          onPress={() => navigateToPlayer(event.id)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.thumbnail} />
          <View style={styles.cardInfo}>
            <Text style={styles.djName} numberOfLines={1}>{event.djName}</Text>
            <Text style={styles.date}>{formatEventDate(event.scheduledStartTime)}</Text>
            {event.genre && <Text style={styles.genre}>{event.genre}</Text>}
            <View style={styles.statsRow}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.stat}>{event.viewerCount} vues</Text>
            </View>
          </View>
          <Ionicons name="play-circle-outline" size={28} color={colors.textMuted} style={styles.playIcon} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
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
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  djName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  date: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  genre: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stat: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
  playIcon: {
    marginRight: spacing.md,
  },
});
