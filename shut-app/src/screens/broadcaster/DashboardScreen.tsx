import React, { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { GlassCard } from '../../components/ui/GlassCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EventStatusBadge } from '../../components/ui/Badge';
import { DashboardStackParamList } from '../../navigation/BroadcasterTabs';
import { EventStatus } from '../../config/constants';
import { formatEventDate } from '../../utils/formatDate';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';
import { eventsService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { LiveEvent } from '../../types';

type Navigation = NativeStackNavigationProp<DashboardStackParamList>;

interface StatItem {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsService
      .getAllEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // ----- Computed data from fetched events -----

  const stats: StatItem[] = useMemo(() => {
    const totalEvents = events.length;
    const totalViewers = events.reduce((sum, e) => sum + (e.viewerCount ?? 0), 0);

    const now = new Date();
    const nextScheduled = events
      .filter((e) => e.status === 'scheduled' && new Date(e.scheduledStartTime) > now)
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())[0];

    let prochainLiveValue = '--';
    if (nextScheduled) {
      const diffMs = new Date(nextScheduled.scheduledStartTime).getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24);
        prochainLiveValue = `dans ${diffDays}j`;
      } else if (diffHours > 0) {
        prochainLiveValue = `dans ${diffHours}h`;
      } else {
        prochainLiveValue = `dans ${diffMinutes}min`;
      }
    }

    const formatViewerCount = (count: number): string => {
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
      return count.toString();
    };

    return [
      { label: 'Events', value: totalEvents.toString(), icon: 'calendar' },
      { label: 'Viewers', value: formatViewerCount(totalViewers), icon: 'people' },
      { label: 'Prochain live', value: prochainLiveValue, icon: 'time' },
    ];
  }, [events]);

  const featuredEvent = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => e.status === 'scheduled' && new Date(e.scheduledStartTime) > now)
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())[0] ?? null;
  }, [events]);

  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())
      .slice(0, 5);
  }, [events]);

  // ----- Handlers -----

  const handleGoLive = () => {
    if (featuredEvent) {
      navigation.navigate('StreamSetup', { eventId: featuredEvent.id });
    }
  };

  // ----- Render helpers -----

  const renderStatCard = (stat: StatItem, index: number) => (
    <GlassCard
      key={stat.label}
      style={{
        ...styles.statCard,
        ...(index < stats.length - 1 ? styles.statCardMargin : {}),
      }}
    >
      <Ionicons name={stat.icon} size={20} color={colors.accentLight} />
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </GlassCard>
  );

  const renderRecentEvent = ({ item }: { item: LiveEvent }) => (
    <Card
      style={styles.recentCard}
      onPress={() => navigation.navigate('StreamSetup', { eventId: item.id })}
    >
      <View style={styles.recentCardContent}>
        <View style={styles.recentCardLeft}>
          <Text style={styles.recentTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.recentDj}>{item.djName}</Text>
          <Text style={styles.recentDate}>
            {formatEventDate(item.scheduledStartTime)}
          </Text>
        </View>
        <View style={styles.recentCardRight}>
          <EventStatusBadge status={item.status} />
          {item.viewerCount > 0 && (
            <View style={styles.viewerRow}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.viewerCount}>
                {item.viewerCount.toLocaleString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  // ----- Loading state -----

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="SHUT" subtitle="Diffuseur" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      </ScreenContainer>
    );
  }

  // ----- Main render -----

  return (
    <ScreenContainer>
      <Header title="SHUT" subtitle="Diffuseur" />

      <FlatList
        data={recentEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderRecentEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Welcome */}
            <Text style={styles.welcome}>
              Bienvenue,{' '}
              <Text style={styles.welcomeName}>
                {user?.displayName ?? 'Diffuseur'}
              </Text>
            </Text>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              {stats.map((stat, index) => renderStatCard(stat, index))}
            </View>

            {/* Featured next event */}
            {featuredEvent ? (
              <GlassCard style={styles.featuredCard}>
                <View style={styles.featuredBadgeRow}>
                  <View style={styles.nextBadge}>
                    <Ionicons name="flash" size={12} color={colors.warning} />
                    <Text style={styles.nextBadgeText}>Prochain live</Text>
                  </View>
                </View>
                <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
                <View style={styles.featuredMeta}>
                  <Ionicons name="musical-notes" size={14} color={colors.textSecondary} />
                  <Text style={styles.featuredDj}>{featuredEvent.djName}</Text>
                </View>
                <View style={styles.featuredMeta}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.featuredDate}>
                    {formatEventDate(featuredEvent.scheduledStartTime)}
                  </Text>
                </View>
                {featuredEvent.description ? (
                  <Text style={styles.featuredDesc} numberOfLines={2}>
                    {featuredEvent.description}
                  </Text>
                ) : null}
                <Button
                  title="Go Live"
                  onPress={handleGoLive}
                  size="lg"
                  style={styles.goLiveButton}
                />
              </GlassCard>
            ) : (
              <GlassCard style={styles.featuredCard}>
                <Text style={styles.emptyText}>Aucun live programme</Text>
              </GlassCard>
            )}

            {/* Section header */}
            <Text style={styles.sectionTitle}>Events recents</Text>
          </>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontFamily: fonts.heading.medium,
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  welcomeName: {
    fontFamily: fonts.heading.bold,
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statCardMargin: {
    marginRight: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  featuredCard: {
    marginBottom: spacing.lg,
  },
  featuredBadgeRow: {
    marginBottom: spacing.sm,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  nextBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.warning,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  featuredDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  featuredDate: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  featuredDesc: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  goLiveButton: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  recentCard: {
    marginBottom: spacing.sm,
  },
  recentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  recentCardRight: {
    alignItems: 'flex-end',
  },
  recentTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recentDj: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.accentLight,
    marginBottom: spacing.xs,
  },
  recentDate: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewerCount: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
