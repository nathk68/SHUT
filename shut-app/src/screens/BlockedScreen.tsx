import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

export function BlockedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="ban" size={56} color="#ef4444" />
        </View>
        <Text style={styles.title}>{t('blocked.title')}</Text>
        <Text style={styles.message}>{t('blocked.message')}</Text>
      </View>
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.logoutText}>{t('blocked.logout')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl * 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
  },
  logoutText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
