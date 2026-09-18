import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EventStatusBadge } from '../../components/ui/Badge';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { formatEventDate } from '../../utils/formatDate';
import type { HomeStackParamList } from '../../navigation/ViewerTabs';
import { eventsService } from '../../services';
import type { LiveEvent } from '../../types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsService.getLiveEvents(),
      eventsService.getUpcomingEvents(),
    ])
      .then(([liveResults, upcomingResults]) => {
        setLiveEvent(liveResults.length > 0 ? liveResults[0] : null);
        setUpcomingEvents(upcomingResults);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLivePress = useCallback(() => {
    if (liveEvent) {
      navigation.navigate('LivePlayer', { eventId: liveEvent.id });
    }
  }, [navigation, liveEvent]);

  const handleEventPress = useCallback(
    (eventId: string) => {
      // For now upcoming events also open LivePlayer; will route to EventDetail later
      navigation.navigate('LivePlayer', { eventId });
    },
    [navigation],
  );

  const renderUpcomingItem = useCallback(
    ({ item }: { item: LiveEvent }) => (
      <Card onPress={() => handleEventPress(item.id)} style={styles.eventCard}>
        {/* Mini gradient cover placeholder */}
        <LinearGradient
          colors={[colors.accent, colors.accentDark ?? '#3d3970']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.eventCardCover}
        >
          <Ionicons name="musical-notes" size={20} color={colors.textMuted} />
        </LinearGradient>

        <View style={styles.eventCardBody}>
          <View style={styles.eventCardHeader}>
            <Text style={styles.eventCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <EventStatusBadge status={item.status} />
          </View>
          <Text style={styles.eventCardDj} numberOfLines={1}>
            {item.djName}
          </Text>
          <View style={styles.eventCardMeta}>
            <Text style={styles.eventCardFestival} numberOfLines={1}>
              {item.festivalName}
            </Text>
            <Text style={styles.eventCardDate}>
              {formatEventDate(item.scheduledStartTime)}
            </Text>
          </View>
        </View>
      </Card>
    ),
    [handleEventPress],
  );

  // ----- Loading state -----

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="SHUT" subtitle="Live DJ Sets" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="SHUT" subtitle="Live DJ Sets" />

      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderUpcomingItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ---- Featured live card ---- */}
            {liveEvent ? (
              <Pressable onPress={handleLivePress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featuredCard}
                >
                  {/* Overlay content */}
                  <View style={styles.featuredOverlay}>
                    {/* Top row: live badge + viewer count */}
                    <View style={styles.featuredTop}>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                      <View style={styles.viewerCount}>
                        <Ionicons name="eye" size={14} color={colors.textPrimary} />
                        <Text style={styles.viewerCountText}>
                          {liveEvent.viewerCount}
                        </Text>
                      </View>
                    </View>

                    {/* Center icon */}
                    <View style={styles.featuredCenter}>
                      <Ionicons name="musical-notes" size={48} color="rgba(255,255,255,0.25)" />
                    </View>

                    {/* Bottom row: event info + button */}
                    <View style={styles.featuredBottom}>
                      <View style={styles.featuredInfo}>
                        <Text style={styles.featuredFestival}>
                          {liveEvent.festivalName}
                        </Text>
                        <Text style={styles.featuredTitle}>
                          {liveEvent.title}
                        </Text>
                        <Text style={styles.featuredDj}>
                          {liveEvent.djName}
                        </Text>
                      </View>
                      <Button
                        title="Regarder"
                        onPress={handleLivePress}
                        size="sm"
                        variant="secondary"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.noLiveCard}>
                <Ionicons name="radio-outline" size={32} color={colors.textMuted} />
                <Text style={styles.noLiveText}>Aucun live en cours</Text>
              </View>
            )}

            {/* ---- Section title ---- */}
            <Text style={styles.sectionTitle}>A venir</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun evenement programme</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_HORIZONTAL_PADDING = spacing.lg;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Featured live card
  featuredCard: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  featuredOverlay: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginRight: spacing.xs + 1,
  },
  liveBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.white,
    letterSpacing: 1,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  viewerCountText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  featuredCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  featuredFestival: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  featuredTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.white,
  },
  featuredDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // No live state
  noLiveCard: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLiveText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Section title
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // Empty upcoming state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },

  // Upcoming event cards
  eventCard: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  eventCardCover: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardBody: {
    flex: 1,
    padding: spacing.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eventCardTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  eventCardDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventCardFestival: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventCardDate: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
