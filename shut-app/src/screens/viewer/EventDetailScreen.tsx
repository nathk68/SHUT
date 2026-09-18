import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Avatar } from '../../components/ui/Avatar';
import { EventStatusBadge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { formatEventDate, formatEventTime, formatRelativeTime } from '../../utils/formatDate';
import { eventsService } from '../../services';
import type { LiveEvent } from '../../types';
import type { ScheduleStackParamList } from '../../navigation/ViewerTabs';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<ScheduleStackParamList, 'EventDetail'>;

export function EventDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsService.getEventById(eventId).then((e) => {
      setEvent(e ?? null);
    }).finally(() => setLoading(false));
  }, [eventId]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleWatchLive = useCallback(() => {
    if (event) {
      navigation.navigate('LivePlayer', { eventId: event.id });
    }
  }, [navigation, event]);

  if (loading || !event) {
    return (
      <ScreenContainer noSafeArea>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  const isLive = event.status === 'live';
  const isScheduled = event.status === 'scheduled';

  return (
    <ScreenContainer noSafeArea>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover gradient placeholder */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}
        >
          {/* Back button */}
          <View style={[styles.coverOverlay, { paddingTop: insets.top + spacing.sm }]}>
            <IconButton
              icon="arrow-back"
              onPress={handleBack}
              color={colors.white}
              style={styles.backButton}
            />
            <View style={styles.coverCenter}>
              <Ionicons name="musical-notes" size={56} color="rgba(255,255,255,0.2)" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Festival badge */}
          <View style={styles.festivalRow}>
            <Avatar name={event.festivalName} size={28} />
            <Text style={styles.festivalName}>{event.festivalName}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* DJ + status row */}
          <View style={styles.djRow}>
            <View style={styles.djInfo}>
              <Avatar name={event.djName} size={36} />
              <View style={styles.djTextCol}>
                <Text style={styles.djName}>{event.djName}</Text>
                <Text style={styles.djLabel}>DJ / Artiste</Text>
              </View>
            </View>
            <EventStatusBadge status={event.status} />
          </View>

          {/* Date / time card */}
          <GlassCard style={styles.dateCard}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.accentLight} />
              <Text style={styles.dateText}>
                {formatEventDate(event.scheduledStartTime)}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={18} color={colors.accentLight} />
              <Text style={styles.dateText}>
                {formatEventTime(event.scheduledStartTime)} - {formatEventTime(event.scheduledEndTime)}
              </Text>
            </View>
            {isLive && (
              <View style={styles.dateRow}>
                <Ionicons name="eye" size={18} color={colors.live} />
                <Text style={[styles.dateText, { color: colors.live }]}>
                  {event.viewerCount} spectateurs en direct
                </Text>
              </View>
            )}
          </GlassCard>

          {/* Description */}
          <Text style={styles.descriptionLabel}>A propos</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Countdown for scheduled events */}
          {isScheduled && (
            <GlassCard style={styles.countdownCard}>
              <Ionicons name="hourglass-outline" size={20} color={colors.accentLight} />
              <Text style={styles.countdownText}>
                Commence {formatRelativeTime(event.scheduledStartTime)}
              </Text>
            </GlassCard>
          )}

          {/* Action button */}
          {isLive && (
            <Button
              title="Regarder en direct"
              onPress={handleWatchLive}
              size="lg"
              style={styles.actionButton}
            />
          )}

          {isScheduled && (
            <Button
              title="Definir un rappel"
              onPress={() => {}}
              variant="secondary"
              size="lg"
              style={styles.actionButton}
            />
          )}

          {event.status === 'ended' && (
            <View style={styles.endedNotice}>
              <Ionicons name="checkmark-circle" size={20} color={colors.textMuted} />
              <Text style={styles.endedText}>Ce set est termine</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Cover
  cover: {
    width: SCREEN_WIDTH,
    height: 260,
  },
  coverOverlay: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
  },

  // Festival
  festivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  festivalName: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // DJ row
  djRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  djInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  djTextCol: {
    gap: 2,
  },
  djName: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  djLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Date card
  dateCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Description
  descriptionLabel: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },

  // Countdown
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  countdownText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.accentLight,
  },

  // Action button
  actionButton: {
    marginTop: spacing.sm,
  },

  // Ended notice
  endedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  endedText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
