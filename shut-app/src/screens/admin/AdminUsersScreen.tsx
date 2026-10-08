import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, orderBy, limit, startAfter, where, QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase.config';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import type { User } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminUsers'>;

const PAGE_SIZE = 20;

const ROLE_COLORS: Record<string, string> = {
  viewer: colors.textMuted,
  broadcaster: '#22c55e',
  admin: colors.accent,
  dj: '#3b82f6',
  artistic_director: '#f59e0b',
};

const ASSIGNABLE_ROLES = ['viewer', 'broadcaster', 'admin'] as const;

export function AdminUsersScreen({ navigation }: { navigation: Nav }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingMore(true);
      const constraints: any[] = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
      if (!isRefresh && lastDoc) constraints.push(startAfter(lastDoc));
      if (filterCountry) constraints.unshift(where('countryCode', '==', filterCountry));
      if (filterCity) constraints.unshift(where('cityName', '==', filterCity));

      const snap = await getDocs(query(collection(db, 'users'), ...constraints));
      const newUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      if (isRefresh) {
        setUsers(newUsers);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
      }
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [lastDoc, filterCountry, filterCity]);

  useEffect(() => {
    setLoading(true);
    setLastDoc(null);
    setUsers([]);
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCountry, filterCity]);

  const onRefresh = () => {
    setRefreshing(true);
    setLastDoc(null);
    fetchUsers(true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !searchText) fetchUsers();
  };

  // Extract unique countries/cities from loaded users for filter chips
  const { countries, cities } = useMemo(() => {
    const countrySet = new Set<string>();
    const citySet = new Set<string>();
    users.forEach((u) => {
      if (u.countryCode) countrySet.add(u.countryCode);
      if (u.cityName) citySet.add(u.cityName);
    });
    return {
      countries: Array.from(countrySet).sort(),
      cities: Array.from(citySet).sort(),
    };
  }, [users]);

  const handleChangeRole = (user: User, newRole: string) => {
    if (newRole === user.role) return;
    setActionLoading(user.id);
    const fn = httpsCallable(functions, 'adminSetUserRole');
    fn({ userId: user.id, role: newRole })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole as User['role'] } : u))
        );
        Alert.alert(t('common.success'), t('admin.users.roleChanged'));
      })
      .catch(() => Alert.alert('Error', t('admin.users.actionError')))
      .finally(() => setActionLoading(null));
  };

  const handleToggleBlock = (user: User) => {
    const isBlocked = !!user.blocked;
    const confirmMsg = isBlocked
      ? t('admin.users.confirmUnblock')
      : t('admin.users.confirmBlock');

    Alert.alert(
      isBlocked ? t('admin.users.unblock') : t('admin.users.block'),
      confirmMsg,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isBlocked ? t('admin.users.unblock') : t('admin.users.block'),
          style: isBlocked ? 'default' : 'destructive',
          onPress: () => {
            setActionLoading(user.id);
            const fn = httpsCallable(functions, 'adminBlockUser');
            fn({ userId: user.id, blocked: !isBlocked })
              .then(() => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === user.id ? { ...u, blocked: !isBlocked } : u
                  )
                );
                Alert.alert(
                  t('common.success'),
                  isBlocked ? t('admin.users.userUnblocked') : t('admin.users.userBlocked')
                );
              })
              .catch(() => Alert.alert('Error', t('admin.users.actionError')))
              .finally(() => setActionLoading(null));
          },
        },
      ]
    );
  };

  const showRolePicker = (user: User) => {
    Alert.alert(
      t('admin.users.selectRole'),
      undefined,
      [
        ...ASSIGNABLE_ROLES.map((role) => ({
          text: `${t(`admin.users.roles.${role}`)}${role === user.role ? ' ✓' : ''}`,
          onPress: () => handleChangeRole(user, role),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  };

  const filtered = searchText.trim()
    ? users.filter((u) => {
        const s = searchText.toLowerCase();
        return (
          u.displayName?.toLowerCase().includes(s) ||
          u.username?.toLowerCase().includes(s) ||
          u.artistName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s)
        );
      })
    : users;

  const renderItem = ({ item }: { item: User }) => {
    const isExpanded = expandedUserId === item.id;
    const isBlocked = !!item.blocked;
    const isLoading = actionLoading === item.id;

    return (
      <View>
        <Pressable
          style={styles.userRow}
          onPress={() => setExpandedUserId(isExpanded ? null : item.id)}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(item.artistName || item.displayName || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.artistName || item.displayName}
              </Text>
              {isBlocked && (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedText}>{t('admin.users.blocked')}</Text>
                </View>
              )}
            </View>
            {item.username && <Text style={styles.userHandle}>@{item.username}</Text>}
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            {(item.cityName || item.countryCode) && (
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.locationText}>
                  {[item.cityName, item.countryCode].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[item.role] ?? colors.textMuted}20` }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] ?? colors.textMuted }]}>
              {item.role}
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {isExpanded && (
          <View style={styles.actionsContainer}>
            {isLoading ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => showRolePicker(item)}
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} />
                  <Text style={styles.actionBtnText}>{t('admin.users.changeRole')}</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, isBlocked ? styles.actionBtnUnblock : styles.actionBtnBlock]}
                  onPress={() => handleToggleBlock(item)}
                >
                  <Ionicons
                    name={isBlocked ? 'lock-open-outline' : 'ban-outline'}
                    size={18}
                    color={isBlocked ? '#22c55e' : '#ef4444'}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: isBlocked ? '#22c55e' : '#ef4444' },
                    ]}
                  >
                    {isBlocked ? t('admin.users.unblock') : t('admin.users.block')}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const clearFilters = () => {
    setFilterCountry(null);
    setFilterCity(null);
  };

  const hasFilters = !!filterCountry || !!filterCity;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('admin.users.title')}</Text>
        <Text style={styles.countText}>{users.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('admin.users.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {/* Country filters */}
          {countries.map((c) => (
            <Pressable
              key={`c-${c}`}
              style={[styles.filterChip, filterCountry === c && styles.filterChipActive]}
              onPress={() => {
                setFilterCountry(filterCountry === c ? null : c);
                setFilterCity(null);
              }}
            >
              <Ionicons name="flag-outline" size={12} color={filterCountry === c ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipText, filterCountry === c && styles.filterChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
          {/* City filters (show only if country selected or few cities) */}
          {cities.map((c) => (
            <Pressable
              key={`v-${c}`}
              style={[styles.filterChip, filterCity === c && styles.filterChipActive]}
              onPress={() => setFilterCity(filterCity === c ? null : c)}
            >
              <Ionicons name="business-outline" size={12} color={filterCity === c ? colors.white : colors.textSecondary} />
              <Text style={[styles.filterChipText, filterCity === c && styles.filterChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
          {hasFilters && (
            <Pressable style={styles.clearBtn} onPress={clearFilters}>
              <Ionicons name="close" size={14} color={colors.accent} />
              <Text style={styles.clearBtnText}>{t('admin.users.clearFilters')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('admin.users.empty')}</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && !searchText ? (
              <Pressable style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Text style={styles.loadMoreText}>{t('admin.users.loadMore')}</Text>
                )}
              </Pressable>
            ) : null
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
    flex: 1,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  countText: {
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  filtersSection: {
    marginBottom: spacing.sm,
  },
  filtersRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundInput,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterChipText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearBtnText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  userInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  userHandle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  userEmail: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontFamily: fonts.body.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  roleBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontFamily: fonts.body.semiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blockedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  blockedText: {
    fontFamily: fonts.body.semiBold,
    fontSize: 9,
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(151, 77, 251, 0.1)',
  },
  actionBtnBlock: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionBtnUnblock: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  actionBtnText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.accent,
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
