import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { EventStatusBadge } from '../../components/ui/Badge';
import { PlanningStackParamList } from '../../navigation/BroadcasterTabs';
import { formatEventDate } from '../../utils/formatDate';
import { eventsService } from '../../services';
import type { LiveEvent } from '../../types';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

type Navigation = NativeStackNavigationProp<PlanningStackParamList>;

type FilterTab = 'all' | 'scheduled' | 'live' | 'ended';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'scheduled', label: 'Programmes' },
  { key: 'live', label: 'En direct' },
  { key: 'ended', label: 'Termines' },
];

export function PlanningScreen() {
  const navigation = useNavigation<Navigation>();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventsService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter((e) => e.status === activeFilter);
  }, [activeFilter, events]);

  const handleDeleteEvent = (event: LiveEvent) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${event.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.deleteEvent(event.id);
              await fetchEvents();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'event.');
            }
          },
        },
      ],
    );
  };

  const renderFilterTab = (tab: { key: FilterTab; label: string }) => {
    const isActive = activeFilter === tab.key;
    return (
      <Pressable
        key={tab.key}
        onPress={() => setActiveFilter(tab.key)}
        style={[styles.filterTab, isActive && styles.filterTabActive]}
      >
        <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  const renderEvent = ({ item }: { item: LiveEvent }) => (
    <Card
      style={styles.eventCard}
      onPress={() => navigation.navigate('StreamSetup', { eventId: item.id })}
    >
      <View style={styles.eventRow}>
        <View style={styles.eventInfo}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={styles.eventMeta}>
            <Ionicons
              name="musical-notes"
              size={13}
              color={colors.accentLight}
            />
            <Text style={styles.eventDj}>{item.djName}</Text>
          </View>
          <View style={styles.eventMeta}>
            <Ionicons
              name="time-outline"
              size={13}
              color={colors.textMuted}
            />
            <Text style={styles.eventDate}>
              {formatEventDate(item.scheduledStartTime)}
            </Text>
          </View>
        </View>

        <View style={styles.eventActions}>
          <EventStatusBadge status={item.status} />
          <IconButton
            icon="trash-outline"
            onPress={() => handleDeleteEvent(item)}
            size={18}
            color={colors.textMuted}
            style={styles.deleteButton}
          />
        </View>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
      <Text style={styles.emptyText}>Aucun event dans cette categorie</Text>
      {activeFilter === 'all' && (
        <Pressable
          onPress={() => navigation.navigate('CreateEvent')}
          style={styles.emptyButton}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accentLight} />
          <Text style={styles.emptyButtonText}>Planifier un live</Text>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Planning" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header
        title="Planning"
        right={
          <IconButton
            icon="add-circle-outline"
            onPress={() => navigation.navigate('CreateEvent')}
            size={26}
            color={colors.accentLight}
          />
        }
      />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(renderFilterTab)}
      </View>

      {/* Events list */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: `${colors.accentLight}20`,
    borderColor: colors.accentLight,
  },
  filterTabText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.accentLight,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eventCard: {
    marginBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  eventTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.accentLight,
    marginLeft: spacing.xs + 2,
  },
  eventDate: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.xs + 2,
  },
  eventActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: `${colors.accentLight}15`,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.accentLight}40`,
  },
  emptyButtonText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.accentLight,
  },
});
