import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EventStatusBadge } from '../../components/ui/Badge';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { EventStatus } from '../../config/constants';
import { formatEventTime, formatSectionDate } from '../../utils/formatDate';
import { eventsService } from '../../services';
import type { LiveEvent } from '../../types';
import type { ScheduleStackParamList } from '../../navigation/ViewerTabs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Section {
  title: string;
  data: LiveEvent[];
}

function groupByDate(events: LiveEvent[]): Section[] {
  const groups: Record<string, LiveEvent[]> = {};

  for (const event of events) {
    // Use date part only (YYYY-MM-DD) as the key
    const dateKey = event.scheduledStartTime.slice(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, data]) => ({
      title: formatSectionDate(data[0].scheduledStartTime),
      data,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type NavigationProp = NativeStackNavigationProp<ScheduleStackParamList, 'ScheduleMain'>;

export function ScheduleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const data = await eventsService.getAllEvents();
        if (!cancelled) setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();
    return () => { cancelled = true; };
  }, []);

  const sections = useMemo(() => groupByDate(events), [events]);

  const handleEventPress = useCallback(
    (eventId: string) => {
      navigation.navigate('EventDetail', { eventId });
    },
    [navigation],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <View style={styles.sectionDivider} />
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: LiveEvent }) => (
      <Card onPress={() => handleEventPress(item.id)} style={styles.eventCard}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>
            {formatEventTime(item.scheduledStartTime)}
          </Text>
          <View style={styles.timeLine} />
          <Text style={styles.timeTextEnd}>
            {formatEventTime(item.scheduledEndTime)}
          </Text>
        </View>

        {/* Event info */}
        <View style={styles.eventInfo}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <EventStatusBadge status={item.status} />
          </View>
          <Text style={styles.eventDj} numberOfLines={1}>
            {item.djName}
          </Text>
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.eventFestival} numberOfLines={1}>
              {item.festivalName}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </Card>
    ),
    [handleEventPress],
  );

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Planning" subtitle="Prochains sets" />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Planning" subtitle="Prochains sets" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun set programme</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Section header
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderText: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Event card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  // Time column
  timeColumn: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timeText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.accentLight,
  },
  timeLine: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  timeTextEnd: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Event info
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  eventDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventFestival: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Chevron
  chevron: {
    marginLeft: spacing.sm,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
