import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { followService, userService } from '../services';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import type { User } from '../types/user';

type Mode = 'followers' | 'following';

type Params = { userId: string; mode: Mode };

export function FollowListScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ FollowList: Params }, 'FollowList'>>();
  const { userId, mode } = route.params;
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const ids = mode === 'followers'
        ? await followService.getFollowers(userId)
        : await followService.getFollowing(userId);
      const resolved = await Promise.all(ids.map((id) => userService.getUserById(id)));
      setUsers(resolved.filter(Boolean) as User[]);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [userId, mode]);

  const title = mode === 'followers' ? 'Abonnés' : 'Abonnements';

  const renderItem = ({ item }: { item: User }) => {
    const label = item.artistName ?? item.firstName ?? item.displayName;
    return (
      <Pressable
        style={styles.row}
        onPress={() => (navigation as any).navigate('PublicProfile', { userId: item.id })}
      >
        <AvatarPicker avatarUrl={item.avatarUrl ?? null} displayName={label} size={44} editable={false} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{label}</Text>
          {item.username ? <Text style={styles.username} numberOfLines={1}>@{item.username}</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>
            {mode === 'followers' ? 'Aucun abonné' : 'Aucun abonnement'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.textSecondary, fontFamily: fonts.body.regular, fontSize: fontSize.md },
  list: { paddingHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  info: { flex: 1 },
  name: { color: colors.textPrimary, fontFamily: fonts.body.medium, fontSize: fontSize.md },
  username: { color: colors.textMuted, fontFamily: fonts.body.regular, fontSize: fontSize.sm },
});
