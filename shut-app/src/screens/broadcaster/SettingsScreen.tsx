import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '../../config/theme';

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const { switchRole } = useRole();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  return (
    <ScreenContainer>
      <Header title="Parametres" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account section */}
        <GlassCard style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Avatar name={user?.displayName ?? 'Utilisateur'} uri={user?.avatarUrl ?? null} size={56} />
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{user?.displayName ?? 'Utilisateur'}</Text>
              <Text style={styles.accountEmail}>{user?.email ?? ''}</Text>
            </View>
          </View>
          <View style={styles.roleRow}>
            <Badge label="Diffuseur" color={colors.accentLight} />
          </View>
        </GlassCard>

        {/* Switch role */}
        <Button
          title="Passer en mode Spectateur"
          onPress={switchRole}
          variant="secondary"
          size="lg"
          style={styles.switchRoleButton}
        />

        {/* Notifications section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Notifications push</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{
                false: colors.backgroundInput,
                true: `${colors.accentLight}60`,
              }}
              thumbColor={pushNotifications ? colors.accentLight : colors.textMuted}
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Notifications email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{
                false: colors.backgroundInput,
                true: `${colors.accentLight}60`,
              }}
              thumbColor={emailNotifications ? colors.accentLight : colors.textMuted}
            />
          </View>
        </GlassCard>

        {/* About section */}
        <Text style={styles.sectionTitle}>A propos</Text>
        <GlassCard style={styles.settingsCard}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={styles.settingDivider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Politique de confidentialite</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Version</Text>
            </View>
            <Text style={styles.settingValue}>0.1.0 (MVP)</Text>
          </View>
        </GlassCard>

        {/* Logout */}
        <Button
          title="Se deconnecter"
          onPress={logout}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />

        {/* App version footer */}
        <Text style={styles.versionText}>SHUT v0.1.0 (MVP)</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  accountCard: {
    marginBottom: spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  accountName: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  accountEmail: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  roleRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRoleButton: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  settingsCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  settingValue: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
  versionText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    letterSpacing: 0.5,
  },
});
