import React, { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../contexts/NotificationContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import type { AppNotification } from '../types/notification';

function timeAgo(dateStr: string, t: (key: string, opts?: any) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.timeAgo.now');
  if (mins < 60) return t('notifications.timeAgo.minutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.timeAgo.hours', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notifications.timeAgo.days', { count: days });
}

function getNotifIcon(type: AppNotification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'new_follower': return 'person-add';
    case 'live_started': return 'radio';
    case 'application_approved': return 'checkmark-circle';
    case 'application_rejected': return 'close-circle';
    case 'admin_announcement': return 'megaphone';
    case 'new_application': return 'document-text';
  }
}

function getNotifColor(type: AppNotification['type']): string {
  switch (type) {
    case 'new_follower': return colors.accent;
    case 'live_started': return colors.live;
    case 'application_approved': return '#4CAF50';
    case 'application_rejected': return colors.error;
    case 'admin_announcement': return '#FF9800';
    case 'new_application': return '#FF9800';
  }
}

function NotificationItem({
  item,
  onPress,
  t,
}: {
  item: AppNotification;
  onPress: (n: AppNotification) => void;
  t: (key: string, opts?: any) => string;
}) {
  const message = (() => {
    switch (item.type) {
      case 'new_follower':
        return t('notifications.types.new_follower', { name: item.actorName ?? '?' });
      case 'live_started':
        return t('notifications.types.live_started', { name: item.actorName ?? '?' });
      case 'application_approved':
        return t('notifications.types.application_approved');
      case 'application_rejected':
        return t('notifications.types.application_rejected');
      case 'admin_announcement':
        return item.message ?? t('notifications.types.admin_announcement');
      case 'new_application':
        return item.message ?? t('notifications.types.admin_announcement');
    }
  })();

  return (
    <Pressable
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
    >
      {item.actorAvatarUrl ? (
        <Image source={{ uri: item.actorAvatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: getNotifColor(item.type) + '20' }]}>
          <Ionicons name={getNotifIcon(item.type)} size={20} color={getNotifColor(item.type)} />
        </View>
      )}
      <View style={styles.textBlock}>
        <Text style={[styles.message, !item.read && styles.messageUnread]} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt, t)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export function NotificationFeedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handlePress = useCallback(async (notif: AppNotification) => {
    if (!notif.read) await markAsRead(notif.id);

    switch (notif.type) {
      case 'new_follower':
        if (notif.actorId) navigation.navigate('PublicProfile', { userId: notif.actorId });
        break;
      case 'live_started':
        if (notif.targetId) navigation.navigate('LivePlayer', { eventId: notif.targetId });
        break;
      case 'application_approved':
        navigation.navigate('ApplicationResult', { decision: 'approved' });
        break;
      case 'application_rejected':
        navigation.navigate('ApplicationResult', { decision: 'rejected' });
        break;
      case 'new_application':
        if (notif.targetId) {
          navigation.navigate('Admin', {
            screen: 'AdminApplicationDetail',
            params: {
              applicationId: notif.targetId,
              type: (notif.targetLabel as 'dj' | 'da') ?? 'dj',
            },
          });
        }
        break;
      default:
        break;
    }
  }, [markAsRead, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllAsRead} hitSlop={8}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} t={t} />}
        contentContainerStyle={[
          styles.list,
          notifications.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={32} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
            <Text style={styles.emptyText}>{t('notifications.emptyDesc')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  markAllText: {
    color: colors.accent,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemUnread: {
    backgroundColor: 'rgba(151, 77, 251, 0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundElevated,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  messageUnread: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
  },
  time: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  emptyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(151, 77, 251, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
