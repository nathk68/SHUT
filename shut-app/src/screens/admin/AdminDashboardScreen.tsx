import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { AdminStats, StatsPeriod, StatsDataPoint } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

const PERIODS: StatsPeriod[] = ['day', 'week', 'month', 'year'];

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color?: string;
  onPress?: () => void;
}

function StatCard({ icon, label, value, color = colors.accent, onPress }: StatCardProps) {
  return (
    <Pressable style={styles.statCard} onPress={onPress} disabled={!onPress}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function Chart({ data, metricColor }: { data: StatsDataPoint[]; metricColor: string }) {
  if (!data.length) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
        <Text style={styles.chartEmptyText}>Aucune donnee pour cette periode</Text>
      </View>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.chartWrapper}>
      {/* Total header */}
      <View style={styles.chartHeader}>
        <Text style={styles.chartTotal}>{total}</Text>
        <Text style={styles.chartTotalLabel}>total</Text>
      </View>

      {/* Y-axis guidelines */}
      <View style={styles.chartContainer}>
        <View style={styles.chartYAxis}>
          <Text style={styles.chartYLabel}>{maxVal}</Text>
          <Text style={styles.chartYLabel}>{Math.round(maxVal / 2)}</Text>
          <Text style={styles.chartYLabel}>0</Text>
        </View>

        <View style={styles.chartBarsArea}>
          {/* Horizontal grid lines */}
          <View style={[styles.chartGridLine, { top: 0 }]} />
          <View style={[styles.chartGridLine, { top: '50%' }]} />
          <View style={[styles.chartGridLine, { bottom: 0 }]} />

          {/* Bars */}
          <View style={styles.chartBarsRow}>
            {data.map((point, idx) => {
              const pct = (point.value / maxVal) * 100;
              return (
                <View key={idx} style={styles.chartBarCol}>
                  <View style={styles.chartBarTrack}>
                    {point.value > 0 && (
                      <Text style={[styles.chartBarValue, { color: metricColor }]}>{point.value}</Text>
                    )}
                    <View
                      style={[
                        styles.chartBarFill,
                        { height: `${pct}%`, backgroundColor: metricColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel} numberOfLines={1}>{point.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const METRIC_COLORS: Record<string, string> = {
  users: colors.accent,
  events: colors.live,
  replays: '#3b82f6',
};

export function AdminDashboardScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chart state
  const [chartMetric, setChartMetric] = useState<'users' | 'events' | 'replays'>('users');
  const [chartPeriod, setChartPeriod] = useState<StatsPeriod>('week');
  const [chartData, setChartData] = useState<StatsDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const fn = httpsCallable<void, AdminStats>(functions, 'getAdminStats');
      const result = await fn();
      setStats(result.data);
    } catch (e) {
      console.error('Failed to fetch admin stats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const fn = httpsCallable<{ metric: string; period: string }, { dataPoints: StatsDataPoint[] }>(
        functions,
        'getStatsTimeSeries',
      );
      const result = await fn({ metric: chartMetric, period: chartPeriod });
      setChartData(result.data.dataPoints);
    } catch (e) {
      console.error('Failed to fetch chart data', e);
    } finally {
      setChartLoading(false);
    }
  }, [chartMetric, chartPeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchChart();
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={styles.pageTitle}>{t('admin.dashboard.title')}</Text>
      <Text style={styles.pageSubtitle}>{t('admin.dashboard.subtitle')}</Text>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="people" label={t('admin.stats.totalUsers')} value={stats?.totalUsers ?? 0} />
        <StatCard icon="radio" label={t('admin.stats.broadcasters')} value={stats?.totalBroadcasters ?? 0} color="#22c55e" />
        <StatCard icon="videocam" label={t('admin.stats.livesActive')} value={stats?.totalLivesActive ?? 0} color={colors.live} />
        <StatCard icon="play-circle" label={t('admin.stats.replays')} value={stats?.totalReplays ?? 0} color="#3b82f6" />
        <StatCard
          icon="document-text"
          label={t('admin.stats.pendingApps')}
          value={stats?.pendingApplications ?? 0}
          color="#f59e0b"
          onPress={() => navigation.navigate('AdminApplications')}
        />
        <StatCard
          icon="flag"
          label={t('admin.stats.pendingReports')}
          value={stats?.pendingReports ?? 0}
          color={colors.error}
          onPress={() => navigation.navigate('AdminReports')}
        />
      </View>

      {/* Chart section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>{t('admin.dashboard.analytics')}</Text>

        {/* Metric selector */}
        <View style={styles.metricRow}>
          {(['users', 'events', 'replays'] as const).map((m) => (
            <Pressable
              key={m}
              style={[styles.metricBtn, chartMetric === m && styles.metricBtnActive]}
              onPress={() => setChartMetric(m)}
            >
              <Text style={[styles.metricText, chartMetric === m && styles.metricTextActive]}>
                {t(`admin.chart.metrics.${m}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              style={[styles.periodBtn, chartPeriod === p && styles.periodBtnActive]}
              onPress={() => setChartPeriod(p)}
            >
              <Text style={[styles.periodText, chartPeriod === p && styles.periodTextActive]}>
                {t(`admin.chart.periods.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {chartLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />
        ) : (
          <Chart data={chartData} metricColor={METRIC_COLORS[chartMetric] ?? colors.accent} />
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('admin.dashboard.quickActions')}</Text>

        <Pressable style={styles.actionRow} onPress={() => navigation.navigate('AdminApplications')}>
          <Ionicons name="document-text-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>{t('admin.dashboard.reviewApplications')}</Text>
          {(stats?.pendingApplications ?? 0) > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{stats?.pendingApplications}</Text></View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </Pressable>

        <Pressable style={styles.actionRow} onPress={() => navigation.navigate('AdminReports')}>
          <Ionicons name="flag-outline" size={20} color={colors.error} />
          <Text style={styles.actionText}>{t('admin.dashboard.reviewReports')}</Text>
          {(stats?.pendingReports ?? 0) > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}><Text style={styles.badgeText}>{stats?.pendingReports}</Text></View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </Pressable>

        <Pressable style={styles.actionRow} onPress={() => navigation.navigate('AdminUsers')}>
          <Ionicons name="people-outline" size={20} color={colors.accentLight} />
          <Text style={styles.actionText}>{t('admin.dashboard.manageUsers')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </Pressable>

        <Pressable style={styles.actionRow} onPress={() => navigation.navigate('AdminCosts')}>
          <Ionicons name="card-outline" size={20} color="#f59e0b" />
          <Text style={styles.actionText}>{t('admin.dashboard.apiCosts')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  pageTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
  },
  pageSubtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chartSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricBtnActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
  },
  metricText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  metricTextActive: { color: colors.accent },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  periodBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundInput,
  },
  periodBtnActive: { backgroundColor: colors.accent },
  periodText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  periodTextActive: { color: colors.white },
  chartWrapper: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chartTotal: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  chartTotalLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
  },
  chartYAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
    paddingBottom: 18,
  },
  chartYLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: colors.textMuted,
  },
  chartBarsArea: {
    flex: 1,
    position: 'relative',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  chartBarsRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
    paddingBottom: 18,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarTrack: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarValue: {
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    marginBottom: 2,
  },
  chartBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: spacing.xs,
    position: 'absolute',
    bottom: 0,
  },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  chartEmptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: '#f59e0b',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.xs,
    color: colors.white,
  },
});
