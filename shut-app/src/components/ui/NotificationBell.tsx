import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../contexts/NotificationContext';
import { colors, fonts, fontSize } from '../../config/theme';

export function NotificationBell() {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();

  return (
    <Pressable onPress={() => navigation.navigate('NotificationFeed')} hitSlop={8}>
      <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.live,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontFamily: fonts.body.medium,
    fontSize: 10,
    lineHeight: 14,
  },
});
