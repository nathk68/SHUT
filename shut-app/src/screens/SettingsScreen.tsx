import React, { useCallback } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { removeStoredData } from '../utils/storage';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';
import { ScreenHeader } from '../components/ui/ScreenHeader';

// ─── Primitives ───────────────────────────────────────────────────────────────

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
};

function Row({ icon, label, value, onPress, isLast, danger }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && onPress && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={16}
          color={danger ? colors.error : colors.accentLight}
        />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? (
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, deleteAccount } = useAuth();
  const { language, videoQuality, notifications, recordLives, setRecordLives } = usePreferences();

  const displayName = user?.artistName ?? user?.firstName ?? user?.displayName ?? '';

  const handleToggleRecord = useCallback(
    (newValue: boolean) => {
      Alert.alert(
        'Enregistrement des lives',
        'Cela réinitialisera vos identifiants RTMP. Vous devrez les régénérer avant votre prochain live.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              setRecordLives(newValue);
              await removeStoredData('@shut_quick_stream');
            },
          },
        ],
      );
    },
    [setRecordLives],
  );

  const notifCount = Object.values(notifications).filter(Boolean).length;
  const notifLabel = notifCount === 0 ? 'Désactivées' : `${notifCount}/3 activées`;
  const qualityLabel = videoQuality === 'auto' ? 'Automatique' : videoQuality;
  const langLabel = language === 'fr' ? 'Français' : 'English';

  const handleLogout = useCallback(() => {
    Alert.alert('Se déconnecter', 'Tu vas être déconnecté de SHUT.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données (profil, historique, sets) seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e: any) {
              if (e?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Reconnexion requise',
                  'Pour des raisons de sécurité, déconnecte-toi puis reconnecte-toi avant de supprimer ton compte.',
                );
              }
            }
          },
        },
      ],
    );
  }, [deleteAccount]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Paramètres" onBack={() => navigation.goBack()} />

      {/* Profile card */}
      <Pressable
        style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {displayName.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          {user?.username ? (
            <Text style={styles.profileHandle}>@{user.username}</Text>
          ) : null}
        </View>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>Voir le profil</Text>
        </View>
      </Pressable>

      {/* Compte */}
      <Section title="Compte">
        <Row icon="mail-outline" label="Email" value={user?.email ?? '-'} />
        <Row
          icon="key-outline"
          label="Changer le mot de passe"
          onPress={() =>
            Alert.alert(
              'Réinitialisation',
              'Un email de réinitialisation va être envoyé à ' + (user?.email ?? ''),
              [{ text: 'OK' }],
            )
          }
          isLast
        />
      </Section>

      {/* Préférences */}
      <Section title="Préférences">
        <Row
          icon="notifications-outline"
          label="Notifications"
          value={notifLabel}
          onPress={() => navigation.navigate('Notifications')}
        />
        <Row
          icon="globe-outline"
          label="Langue"
          value={langLabel}
          onPress={() => navigation.navigate('Language')}
        />
        <Row
          icon="videocam-outline"
          label="Qualité vidéo"
          value={qualityLabel}
          onPress={() => navigation.navigate('Quality')}
          isLast
        />
      </Section>

      {/* Diffusion (DJs only) */}
      {user?.role === 'broadcaster' && (
        <Section title="Diffusion">
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.rowIcon}>
              <Ionicons name="recording-outline" size={16} color={colors.accentLight} />
            </View>
            <View style={styles.recordLabelWrap}>
              <Text style={styles.rowLabel}>Enregistrer mes lives</Text>
              <Text style={styles.recordDesc}>
                Chaque live sera enregistre pour creer une rediffusion
              </Text>
            </View>
            <Switch
              value={recordLives}
              onValueChange={handleToggleRecord}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        </Section>
      )}

      {/* Confidentialité & Légal */}
      <Section title="Confidentialité & Légal">
        <Row
          icon="shield-checkmark-outline"
          label="Politique de confidentialité"
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <Row
          icon="document-text-outline"
          label="Conditions d'utilisation"
          onPress={() => navigation.navigate('Terms')}
        />
        <Row
          icon="lock-closed-outline"
          label="Gestion des données (RGPD)"
          onPress={() => navigation.navigate('RGPD')}
          isLast
        />
      </Section>

      {/* Support */}
      <Section title="Support">
        <Row
          icon="help-circle-outline"
          label="Centre d'aide"
          onPress={() => Linking.openURL('https://shut.live/help')}
        />
        <Row
          icon="bug-outline"
          label="Signaler un problème"
          onPress={() => Linking.openURL('mailto:support@shut.live')}
          isLast
        />
      </Section>

      {/* À propos */}
      <Section title="À propos">
        <Row icon="information-circle-outline" label="Version" value="0.1.0 (beta)" />
        <Row
          icon="globe-outline"
          label="Site web SHUT"
          onPress={() => Linking.openURL('https://shut.live')}
          isLast
        />
      </Section>

      {/* Zone de danger */}
      <Section title="Zone de danger">
        <Row
          icon="trash-outline"
          label="Supprimer mon compte"
          onPress={handleDeleteAccount}
          danger
          isLast
        />
      </Section>

      {/* Déconnexion */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>

      <Text style={styles.legalNote}>SHUT v0.1.0 — © 2026 SHUT. Tous droits réservés.</Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + 16 },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  profileCardPressed: {
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },
  profileHandle: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  profileBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileBadgeText: {
    color: colors.textSecondary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: 'rgba(239,68,68,0.12)' },
  rowLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  rowLabelDanger: { color: colors.error },
  recordLabelWrap: { flex: 1, gap: 2 },
  recordDesc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowValue: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },

  // Logout
  logoutButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoutText: {
    color: colors.error,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
  },

  // Footer
  legalNote: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    textAlign: 'center',
    opacity: 0.5,
  },
});
