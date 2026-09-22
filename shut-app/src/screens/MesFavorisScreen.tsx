import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/MainTabs';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import { eventsService } from '../services';
import { LiveEvent } from '../types/event';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

export function MesFavorisScreen() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { favoriteIds, isLoading } = useFavorites();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Serialize IDs to a stable string so the effect only re-runs when the
  // actual set of favorites changes, not when the Set reference changes.
  const favoriteIdsKey = Array.from(favoriteIds).sort().join(',');

  useEffect(() => {
    if (favoriteIds.size === 0) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    eventsService.getAllEvents().then((all) => {
      setEvents(all.filter(e => favoriteIds.has(e.id)));
      setLoadingEvents(false);
    }).catch(() => {
      setEvents([]);
      setLoadingEvents(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIdsKey]);

  const liveEvents = events.filter(e => e.status === 'live');
  const replayEvents = events.filter(e => e.status === 'ended' && e.playbackUrl);

  if (favoriteIds.size === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Aucun favori</Text>
        <Text style={styles.emptyText}>Like un live pour le retrouver ici</Text>
      </View>
    );
  }

  if (isLoading || loadingEvents) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const navigateToPlayer = (eventId: string) => {
    // LivePlayer lives inside the Live tab stack — navigate cross-tab
    navigation.navigate('Live', {
      screen: 'LivePlayer',
      params: { eventId },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MES FAVORIS</Text>

      {liveEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>En cours</Text>
          {liveEvents.map(event => (
            <EventCard key={event.id} event={event} onPress={() => navigateToPlayer(event.id)} />
          ))}
        </>
      )}

      {replayEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Rediffusions</Text>
          {replayEvents.map(event => (
            <EventCard key={event.id} event={event} onPress={() => navigateToPlayer(event.id)} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function EventCard({ event, onPress }: { event: LiveEvent; onPress: () => void }) {
  return (
    <Pressable
      testID={`event-card-${event.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.thumbnail} />
      <View style={styles.cardInfo}>
        <Text style={styles.djName} numberOfLines={1}>{event.djName}</Text>
        {event.genre && <Text style={styles.genre}>{event.genre}</Text>}
        <View style={styles.viewersRow}>
          <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
          <Text style={styles.viewers}>{event.viewerCount}</Text>
        </View>
      </View>
    </Pressable>
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
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
  genre: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
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
