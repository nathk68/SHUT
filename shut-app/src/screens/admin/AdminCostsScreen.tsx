import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminCosts'>;

interface MuxBreakdownItem {
  minutes?: number;
  gb?: number;
  cost: number;
}

interface CostData {
  mux: {
    totalEstimatedCost: number;
    currency: string;
    breakdown: {
      liveInput: MuxBreakdownItem;
      storage: MuxBreakdownItem;
      delivery: MuxBreakdownItem;
    };
    assetsCount: number;
    liveStreamsCount: number;
    recentAssetsCount: number;
  };
  firebase: {
    users: number;
    events: number;
    replays: number;
    reports: number;
  };
  alertThreshold: number;
  lastAlertDate: string | null;
  muxDashboardUrl?: string;
}

function CostCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail?: string;
  color: string;
}) {
  return (
    <View style={styles.costCard}>
      <View style={[styles.costIconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.costCardContent}>
        <Text style={styles.costLabel}>{label}</Text>
        <Text style={[styles.costValue, { color }]}>{value}</Text>
        {detail && <Text style={styles.costDetail}>{detail}</Text>}
      </View>
    </View>
  );
}

export function AdminCostsScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = useCallback(async () => {
    try {
      setError(null);
      const fn = httpsCallable(functions, 'getApiCosts');
      const result = await fn({});
      setData(result.data as CostData);
    } catch (e: any) {
      console.error('Failed to fetch costs', e);
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCosts();
  };

  const muxTotal = data?.mux.totalEstimatedCost ?? 0;
  const threshold = data?.alertThreshold ?? 300;
  const pct = Math.min((muxTotal / threshold) * 100, 100);
  const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('admin.costs.title')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: spacing.xxl }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchCosts}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {/* Mux Total with progress bar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mux</Text>
              <View style={styles.periodBadge}>
                <Text style={styles.periodText}>{t('admin.costs.last30days')}</Text>
              </View>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>{t('admin.costs.estimatedCost')}</Text>
              <Text style={[styles.totalValue, { color: barColor }]}>
                ~${muxTotal.toFixed(2)} USD
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.thresholdText}>
                {t('admin.costs.threshold')}: ${threshold} USD
              </Text>
              {data.lastAlertDate && (
                <Text style={styles.alertSentText}>
                  {t('admin.costs.lastAlert')}: {new Date(data.lastAlertDate).toLocaleDateString()}
                </Text>
              )}
              <Text style={styles.disclaimerText}>
                {t('admin.costs.muxDisclaimer')}
              </Text>
              {data.muxDashboardUrl && (
                <Pressable
                  style={styles.dashboardLink}
                  onPress={() => Linking.openURL(data.muxDashboardUrl!)}
                >
                  <Ionicons name="open-outline" size={14} color={colors.accent} />
                  <Text style={styles.dashboardLinkText}>
                    {t('admin.costs.viewMuxDashboard')}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Breakdown */}
            <Text style={styles.breakdownTitle}>{t('admin.costs.breakdown')}</Text>
            <CostCard
              icon="videocam"
              label={t('admin.costs.liveInput')}
              value={`$${data.mux.breakdown.liveInput.cost.toFixed(2)}`}
              detail={`${data.mux.breakdown.liveInput.minutes} min`}
              color="#8b5cf6"
            />
            <CostCard
              icon="cloud"
              label={t('admin.costs.storage')}
              value={`$${data.mux.breakdown.storage.cost.toFixed(2)}`}
              detail={`${data.mux.breakdown.storage.minutes} min`}
              color="#f59e0b"
            />
            <CostCard
              icon="play-circle"
              label={t('admin.costs.delivery')}
              value={`$${data.mux.breakdown.delivery.cost.toFixed(2)}`}
              detail={`${data.mux.breakdown.delivery.minutes} min`}
              color="#22c55e"
            />

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{data.mux.assetsCount}</Text>
                <Text style={styles.statLabel}>Assets</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{data.mux.liveStreamsCount}</Text>
                <Text style={styles.statLabel}>Live Streams</Text>
              </View>
            </View>
          </View>

          {/* Firebase */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Firebase</Text>
              <View style={styles.periodBadge}>
                <Text style={styles.periodText}>{t('admin.costs.currentUsage')}</Text>
              </View>
            </View>

            <View style={styles.firebaseGrid}>
              <View style={styles.firebaseCard}>
                <Ionicons name="people" size={20} color={colors.accent} />
                <Text style={styles.fbNumber}>{data.firebase.users}</Text>
                <Text style={styles.fbLabel}>{t('admin.costs.fbUsers')}</Text>
              </View>
              <View style={styles.firebaseCard}>
                <Ionicons name="videocam" size={20} color="#22c55e" />
                <Text style={styles.fbNumber}>{data.firebase.events}</Text>
                <Text style={styles.fbLabel}>{t('admin.costs.fbEvents')}</Text>
              </View>
              <View style={styles.firebaseCard}>
                <Ionicons name="play" size={20} color="#3b82f6" />
                <Text style={styles.fbNumber}>{data.firebase.replays}</Text>
                <Text style={styles.fbLabel}>{t('admin.costs.fbReplays')}</Text>
              </View>
              <View style={styles.firebaseCard}>
                <Ionicons name="flag" size={20} color="#f59e0b" />
                <Text style={styles.fbNumber}>{data.firebase.reports}</Text>
                <Text style={styles.fbLabel}>{t('admin.costs.fbReports')}</Text>
              </View>
            </View>

            <Text style={styles.firebaseNote}>
              {t('admin.costs.firebaseNote')}
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: {
    flex: 1,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  periodBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundInput,
  },
  periodText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  totalCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontFamily: fonts.mono.bold,
    fontSize: 32,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.backgroundInput,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  alertSentText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: '#f59e0b',
    marginTop: 4,
  },
  dashboardLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dashboardLinkText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  disclaimerText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  breakdownTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  costCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  costIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costCardContent: { flex: 1 },
  costLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  costValue: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.lg,
    marginTop: 2,
  },
  costDetail: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  firebaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  firebaseCard: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  fbNumber: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  fbLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  firebaseNote: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
