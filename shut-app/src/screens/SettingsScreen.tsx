import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

type MenuItem = {
  label: string;
  value?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    { label: 'Mon profil', icon: 'person-outline', onPress: () => navigation.navigate('Profile') },
    { label: 'Notifications', icon: 'notifications-outline' },
    { label: 'Langue', icon: 'globe-outline', value: 'Français' },
    { label: 'Qualité vidéo', icon: 'videocam-outline', value: 'Auto' },
    { label: 'Confidentialité', icon: 'shield-outline' },
    { label: 'Aide & support', icon: 'help-circle-outline' },
    { label: 'À propos de SHUT', icon: 'information-circle-outline' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>PARAMÈTRES</Text>

      {/* Profile card */}
      <Pressable
        style={styles.profileCard}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.handle}>@{user?.handle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      {/* Menu items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={17} color={colors.accentLight} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <View style={styles.menuRight}>
              {item.value && (
                <Text style={styles.menuValue}>{item.value}</Text>
              )}
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    marginBottom: 2,
  },
  handle: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  menuSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuValue: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  signOutButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.error,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
});
