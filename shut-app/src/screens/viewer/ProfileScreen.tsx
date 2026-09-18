import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const { user, isAuthenticated, isGuest, logout, exitGuestMode } = useAuth();
  const { currentRole, switchRole } = useRole();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleLogin = useCallback(() => {
    // Exit guest mode to trigger the auth flow
    exitGuestMode();
  }, [exitGuestMode]);

  const handleSwitchRole = useCallback(() => {
    switchRole();
  }, [switchRole]);

  // ------------------------------------------------------------------
  // Guest / unauthenticated view
  // ------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <Header title="Profil" />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconContainer}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.guestIconGradient}
            >
              <Ionicons name="person-outline" size={40} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </View>
          <Text style={styles.guestTitle}>
            {isGuest ? 'Mode Invité' : 'Non connecté'}
          </Text>
          <Text style={styles.guestMessage}>
            Connectez-vous pour accéder à votre profil
          </Text>
          <Button
            title="Se connecter"
            onPress={handleLogin}
            size="lg"
            style={styles.guestButton}
          />
          <Text style={styles.versionText}>SHUT v0.1.0 (MVP)</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ------------------------------------------------------------------
  // Authenticated view
  // ------------------------------------------------------------------
  const displayName = user?.displayName ?? 'Utilisateur';
  const email = user?.email ?? '';
  const roleLabelMap = { viewer: 'Spectateur', broadcaster: 'Diffuseur' } as const;
  const roleLabel = roleLabelMap[currentRole] ?? currentRole;

  return (
    <ScreenContainer>
      <Header title="Profil" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + identity */}
        <View style={styles.profileHeader}>
          <Avatar
            uri={user?.avatarUrl}
            name={displayName}
            size={80}
            style={styles.avatar}
          />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <Badge label={roleLabel} color={colors.accentLight} style={styles.roleBadge} />
        </View>

        {/* Account section */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Compte</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{roleLabel}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                  })
                : '-'}
            </Text>
          </View>
        </GlassCard>

        {/* Role switch card */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Changer de mode</Text>
          <Text style={styles.switchDescription}>
            Passez en mode Diffuseur pour gérer vos streams et vos événements.
          </Text>
          <Button
            title="Passer en mode Diffuseur"
            onPress={handleSwitchRole}
            variant="secondary"
            size="md"
            style={styles.switchButton}
          />
        </GlassCard>

        {/* Preferences placeholder */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Préférences</Text>

          <View style={styles.prefRow}>
            <Ionicons name="notifications-outline" size={18} color={colors.textMuted} />
            <Text style={styles.prefLabel}>Notifications</Text>
            <View style={styles.prefChip}>
              <Text style={styles.prefChipText}>Activées</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.prefRow}>
            <Ionicons name="language-outline" size={18} color={colors.textMuted} />
            <Text style={styles.prefLabel}>Langue</Text>
            <View style={styles.prefChip}>
              <Text style={styles.prefChipText}>Français</Text>
            </View>
          </View>
        </GlassCard>

        {/* Logout */}
        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />

        {/* Version */}
        <Text style={styles.versionText}>SHUT v0.1.0 (MVP)</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Guest view
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  guestIconContainer: {
    marginBottom: spacing.lg,
  },
  guestIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  guestMessage: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  guestButton: {
    width: '100%',
    marginBottom: spacing.xxl,
  },

  // Authenticated view
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  displayName: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    alignSelf: 'center',
  },

  // Section cards
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    maxWidth: '50%',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Switch role
  switchDescription: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  switchButton: {
    alignSelf: 'flex-start',
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prefLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  prefChip: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefChipText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textPrimary,
  },

  // Logout
  logoutButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  // Version
  versionText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
