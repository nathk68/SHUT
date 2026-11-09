import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { Report, ReportStatus } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminReports'>;

const TARGET_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  user: 'person-outline',
  event: 'videocam-outline',
  replay: 'play-circle-outline',
};

// Cache resolved display names so we don't re-fetch per render
const usernameCache = new Map<string, string>();

async function resolveUsername(userId: string): Promise<string> {
  if (usernameCache.has(userId)) return usernameCache.get(userId)!;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    const name = snap.data()?.username || snap.data()?.displayName || userId.slice(0, 8);
    usernameCache.set(userId, name);
    return name;
  } catch {
    return userId.slice(0, 8);
  }
}

interface TargetData {
  ownerId: string | null;
  // event
  eventTitle?: string;
  // replay
  playbackUrl?: string;
  replayTitle?: string;
  trimStart?: number;
  trimEnd?: number;
  replayId?: string;
  djUserId?: string;
  eventId?: string;
}

async function resolveTarget(targetType: string, targetId: string): Promise<TargetData> {
  const empty: TargetData = { ownerId: null };
  try {
    if (targetType === 'event') {
      const snap = await getDoc(doc(db, 'events', targetId));
      const d = snap.data();
      return { ownerId: d?.userId ?? null, eventTitle: d?.title ?? targetId.slice(0, 10) };
    }
    if (targetType === 'replay') {
      const snap = await getDoc(doc(db, 'replays', targetId));
      const d = snap.data();
      return {
        ownerId: d?.userId ?? d?.djUserId ?? null,
        playbackUrl: d?.playbackUrl,
        replayTitle: d?.title ?? 'Replay',
        trimStart: d?.trimStart,
        trimEnd: d?.trimEnd,
        replayId: targetId,
        djUserId: d?.djUserId ?? d?.userId,
        eventId: d?.eventId,
      };
    }
  } catch {}
  return empty;
}

interface ResolvedNames {
  reporter: string;
  reportedUser: string | null;
  reportedUserId: string | null;
  target: TargetData | null;
}

export function AdminReportsScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending');
  const [resolvedNames, setResolvedNames] = useState<Record<string, ResolvedNames>>({});

  const resolveNamesForReports = useCallback(async (items: Report[]) => {
    const result: Record<string, ResolvedNames> = {};
    await Promise.all(
      items.map(async (r) => {
        const reporter = await resolveUsername(r.reporterId);
        let reportedUserId: string | null = null;
        let reportedUser: string | null = null;
        let target: TargetData | null = null;

        if (r.targetType === 'user') {
          reportedUserId = r.targetId;
          reportedUser = await resolveUsername(r.targetId);
        } else {
          target = await resolveTarget(r.targetType, r.targetId);
          reportedUserId = target.ownerId;
          if (reportedUserId) {
            reportedUser = await resolveUsername(reportedUserId);
          }
        }
        result[r.id] = { reporter, reportedUser, reportedUserId, target };
      }),
    );
    setResolvedNames((prev) => ({ ...prev, ...result }));
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const constraints = filter === 'all'
        ? [orderBy('createdAt', 'desc')]
        : [where('status', '==', filter), orderBy('createdAt', 'desc')];
      const snap = await getDocs(query(collection(db, 'reports'), ...constraints));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      setReports(items);
      resolveNamesForReports(items);
    } catch (e) {
      console.error('Failed to fetch reports', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, resolveNamesForReports]);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  const handleAction = (reportId: string, action: 'dismissed' | 'warning' | 'content_removed' | 'user_banned') => {
    Alert.alert(t('admin.reports.confirmAction'), t(`admin.reports.actions.${action}`), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            const fn = httpsCallable(functions, 'reviewReport');
            await fn({ reportId, action });
            setReports((prev) =>
              prev.map((r) => (r.id === reportId ? { ...r, status: action === 'dismissed' ? 'dismissed' : 'reviewed' } : r)),
            );
          } catch {
            Alert.alert(t('common.error'), t('admin.reports.actionError'));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Report }) => {
    const names = resolvedNames[item.id];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.targetBadge}>
            <Ionicons name={TARGET_ICONS[item.targetType] ?? 'alert-outline'} size={16} color={colors.accent} />
            <Text style={styles.targetText}>{t(`admin.reports.targetTypes.${item.targetType}`)}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.reasonRow}>
          <Ionicons name="warning-outline" size={16} color="#f59e0b" />
          <Text style={styles.reasonText}>{t(`report.reasons.${item.reason}`)}</Text>
        </View>

        {item.description ? (
          <Text style={styles.descText} numberOfLines={3}>{item.description}</Text>
        ) : null}

        {/* Links to profiles & content */}
        <View style={styles.linksSection}>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.reporterId })}
          >
            <Ionicons name="person-outline" size={15} color={colors.textMuted} />
            <Text style={styles.linkLabel}>{t('admin.reports.reporter')}</Text>
            <Text style={styles.linkValue} numberOfLines={1}>{names?.reporter ?? '...'}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </Pressable>

          {names?.reportedUserId && (
            <Pressable
              style={styles.linkRow}
              onPress={() => navigation.navigate('PublicProfile', { userId: names.reportedUserId! })}
            >
              <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
              <Text style={styles.linkLabel}>{t('admin.reports.reportedUser')}</Text>
              <Text style={styles.linkValue} numberOfLines={1}>{names.reportedUser ?? '...'}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          )}

          {item.targetType === 'event' && (
            <Pressable
              style={styles.linkRow}
              onPress={() => navigation.navigate('LivePlayer', { eventId: item.targetId })}
            >
              <Ionicons name="videocam-outline" size={15} color={colors.live} />
              <Text style={styles.linkLabel}>{t('admin.reports.targetTypes.event')}</Text>
              <Text style={styles.linkValue} numberOfLines={1}>{names?.target?.eventTitle ?? item.targetId.slice(0, 12)}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          )}

          {item.targetType === 'replay' && names?.target?.playbackUrl && (
            <Pressable
              style={styles.linkRow}
              onPress={() => navigation.navigate('ReplayPlayer', {
                playbackUrl: names.target!.playbackUrl!,
                title: names.target!.replayTitle ?? 'Replay',
                trimStart: names.target!.trimStart,
                trimEnd: names.target!.trimEnd,
                replayId: names.target!.replayId,
                djUserId: names.target!.djUserId,
                eventId: names.target!.eventId,
              })}
            >
              <Ionicons name="play-circle-outline" size={15} color="#3b82f6" />
              <Text style={styles.linkLabel}>{t('admin.reports.targetTypes.replay')}</Text>
              <Text style={styles.linkValue} numberOfLines={1}>{names.target.replayTitle ?? 'Replay'}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <Pressable style={styles.dismissBtn} onPress={() => handleAction(item.id, 'dismissed')}>
              <Text style={styles.dismissText}>{t('admin.reports.dismiss')}</Text>
            </Pressable>
            <Pressable style={styles.warnBtn} onPress={() => handleAction(item.id, 'warning')}>
              <Text style={styles.warnText}>{t('admin.reports.warn')}</Text>
            </Pressable>
            <Pressable style={styles.banBtn} onPress={() => handleAction(item.id, 'user_banned')}>
              <Text style={styles.banText}>{t('admin.reports.ban')}</Text>
            </Pressable>
          </View>
        )}

        {item.status !== 'pending' && (
          <View style={styles.resolvedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
            <Text style={styles.resolvedText}>{t(`admin.reports.statusLabels.${item.status}`)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('admin.reports.title')}</Text>
      </View>

      <View style={styles.filterRow}>
        {(['pending', 'reviewed', 'dismissed', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(`admin.reports.filter.${f}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('admin.reports.empty')}</Text>
            </View>
          }
        />
      )}
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
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundInput,
  },
  filterBtnActive: { backgroundColor: colors.accent },
  filterText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.accent}15`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  targetText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  descText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  linksSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    gap: 4,
    marginBottom: spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  linkLabel: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  linkValue: {
    flex: 1,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  warnBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  warnText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.white,
  },
  banBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  banText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.white,
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  resolvedText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
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
