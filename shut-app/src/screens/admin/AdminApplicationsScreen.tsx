import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { DJApplication, ApplicationStatus } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminApplications'>;

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
};

export function AdminApplicationsScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState<DJApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('pending');

  const fetchApplications = useCallback(async () => {
    try {
      const constraints = filter === 'all'
        ? [orderBy('submittedAt', 'desc')]
        : [where('status', '==', filter), orderBy('submittedAt', 'desc')];

      const [djSnap, daSnap] = await Promise.all([
        getDocs(query(collection(db, 'dj_applications'), ...constraints)),
        getDocs(query(collection(db, 'da_applications'), ...constraints)),
      ]);
      const djApps = djSnap.docs.map((d) => ({ id: d.id, ...d.data(), _type: 'dj' as const } as DJApplication & { _type: 'dj' }));
      const daApps = daSnap.docs.map((d) => ({ id: d.id, ...d.data(), _type: 'da' as const } as DJApplication & { _type: 'da' }));
      const all = [...djApps, ...daApps].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setApplications(all);
    } catch (e) {
      console.error('Failed to fetch applications', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchApplications();
    }, [fetchApplications]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const renderItem = ({ item }: { item: DJApplication }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('AdminApplicationDetail', { applicationId: item.id, type: (item as any)._type || 'dj' })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.artistName}>{item.artistName}</Text>
          <Text style={styles.dateText}>
            {new Date(item.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {t(`admin.applications.status.${item.status}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.bioPreview} numberOfLines={2}>{item.bio}</Text>

      {item.genres?.length > 0 && (
        <View style={styles.genreRow}>
          {item.genres.slice(0, 3).map((g) => (
            <View key={g} style={styles.genreChip}>
              <Text style={styles.genreChipText}>{g}</Text>
            </View>
          ))}
          {item.genres.length > 3 && (
            <Text style={styles.moreGenres}>+{item.genres.length - 3}</Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.locationText}>{item.cityName}{item.countryCode ? `, ${item.countryCode}` : ''}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('admin.applications.title')}</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(`admin.applications.filter.${f}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('admin.applications.empty')}</Text>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  artistName: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bioPreview: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  genreChip: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent}15`,
  },
  genreChipText: {
    fontFamily: fonts.body.medium,
    fontSize: 10,
    color: colors.accent,
  },
  moreGenres: {
    fontFamily: fonts.body.medium,
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
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
