import React, { useCallback } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { user, logout, deleteAccount, resetPassword } = useAuth();
  const { language, videoQuality, notifications, recordLives, setRecordLives } = usePreferences();
  const { t } = useTranslation();

  const displayName = user?.artistName ?? user?.firstName ?? user?.displayName ?? '';

  const handleToggleRecord = useCallback(
    (newValue: boolean) => {
      Alert.alert(
        t('settings.recordLivesAlertTitle'),
        t('settings.recordLivesAlertMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: async () => {
              setRecordLives(newValue);
              await removeStoredData('@shut_quick_stream');
            },
          },
        ],
      );
    },
    [setRecordLives, t],
  );

  const notifCount = Object.values(notifications).filter(Boolean).length;
  const notifLabel = notifCount === 0 ? t('settings.disabled') : `${notifCount}/3 ${t('settings.enabled')}`;
  const qualityLabel = videoQuality === 'auto' ? t('settings.auto') : videoQuality;
  const langLabel = language === 'fr' ? t('settings.french') : 'English';

  const handleLogout = useCallback(() => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logoutTitle'), style: 'destructive', onPress: logout },
    ]);
  }, [logout, t]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e: any) {
              if (e?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  t('settings.deleteAccountReauthTitle'),
                  t('settings.deleteAccountReauthMessage'),
                );
              }
            }
          },
        },
      ],
    );
  }, [deleteAccount, t]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

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
          <Text style={styles.profileBadgeText}>{t('settings.viewProfile')}</Text>
        </View>
      </Pressable>

      {/* Compte */}
      <Section title={t('settings.account')}>
        <Row icon="mail-outline" label={t('common.email')} value={user?.email ?? '-'} />
        <Row
          icon="key-outline"
          label={t('settings.changePassword')}
          onPress={() =>
            Alert.alert(
              t('settings.resetPasswordTitle'),
              t('settings.resetPasswordMessage') + (user?.email ?? ''),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.sendResetEmail'),
                  onPress: async () => {
                    if (!user?.email) return;
                    const result = await resetPassword(user.email);
                    if (result.success) {
                      Alert.alert(
                        t('settings.resetEmailSentTitle'),
                        t('settings.resetEmailSentMessage'),
                      );
                    } else {
                      Alert.alert(t('common.error'), result.error || t('settings.resetEmailError'));
                    }
                  },
                },
              ],
            )
          }
          isLast
        />
      </Section>

      {/* Préférences */}
      <Section title={t('settings.preferences')}>
        <Row
          icon="notifications-outline"
          label={t('settings.notifications')}
          value={notifLabel}
          onPress={() => navigation.navigate('Notifications')}
        />
        <Row
          icon="globe-outline"
          label={t('settings.language')}
          value={langLabel}
          onPress={() => navigation.navigate('Language')}
        />
        <Row
          icon="videocam-outline"
          label={t('settings.videoQuality')}
          value={qualityLabel}
          onPress={() => navigation.navigate('Quality')}
          isLast
        />
      </Section>

      {/* Diffusion (DJs only) */}
      {user?.role === 'broadcaster' && (
        <Section title={t('settings.broadcasting')}>
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.rowIcon}>
              <Ionicons name="recording-outline" size={16} color={colors.accentLight} />
            </View>
            <View style={styles.recordLabelWrap}>
              <Text style={styles.rowLabel}>{t('settings.recordLives')}</Text>
              <Text style={styles.recordDesc}>
                {t('settings.recordLivesDesc')}
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
      <Section title={t('settings.privacy')}>
        <Row
          icon="shield-checkmark-outline"
          label={t('settings.privacyPolicy')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <Row
          icon="document-text-outline"
          label={t('settings.termsOfUse')}
          onPress={() => navigation.navigate('Terms')}
        />
        <Row
          icon="lock-closed-outline"
          label={t('settings.dataManagement')}
          onPress={() => navigation.navigate('RGPD')}
          isLast
        />
      </Section>

      {/* Support */}
      <Section title={t('settings.support')}>
        <Row
          icon="help-circle-outline"
          label={t('settings.helpCenter')}
          onPress={() => Linking.openURL('https://shutdiffusion.com/help')}
        />
        <Row
          icon="bug-outline"
          label={t('settings.reportIssue')}
          onPress={() => Linking.openURL('mailto:support@shutdiffusion.com')}
          isLast
        />
      </Section>

      {/* À propos */}
      <Section title={t('settings.about')}>
        <Row icon="information-circle-outline" label={t('settings.version')} value="0.1.0 (beta)" />
        <Row
          icon="globe-outline"
          label={t('settings.website')}
          onPress={() => Linking.openURL('https://shutdiffusion.com')}
          isLast
        />
      </Section>

      {/* Zone de danger */}
      <Section title={t('settings.dangerZone')}>
        <Row
          icon="trash-outline"
          label={t('settings.deleteAccount')}
          onPress={handleDeleteAccount}
          danger
          isLast
        />
      </Section>

      {/* Déconnexion */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('settings.logoutTitle')}</Text>
      </Pressable>

      <Text style={styles.legalNote}>{t('settings.footer')}</Text>
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
