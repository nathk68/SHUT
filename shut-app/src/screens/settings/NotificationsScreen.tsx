import React from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences, type NotificationPrefs } from '../../contexts/PreferencesContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

type PrefEntry = {
  key: keyof NotificationPrefs;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PREFS: PrefEntry[] = [
  {
    key: 'lives',
    label: 'Lives en cours',
    desc: 'Un DJ que tu suis commence un live',
    icon: 'radio-outline',
  },
  {
    key: 'follows',
    label: 'Nouveaux abonnés',
    desc: 'Quelqu\'un s\'abonne à ton profil',
    icon: 'person-add-outline',
  },
  {
    key: 'news',
    label: 'Actualités SHUT',
    desc: 'Nouveautés et annonces de la plateforme',
    icon: 'megaphone-outline',
  },
];

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { notifications, setNotificationPref } = usePreferences();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.card}>
        {PREFS.map((pref, i) => (
          <View
            key={pref.key}
            style={[styles.row, i === PREFS.length - 1 && styles.rowLast]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={pref.icon} size={16} color={colors.accentLight} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>{pref.label}</Text>
              <Text style={styles.desc}>{pref.desc}</Text>
            </View>
            <Switch
              value={notifications[pref.key]}
              onValueChange={(val) => setNotificationPref(pref.key, val)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </View>

      <Pressable
        style={styles.systemButton}
        onPress={() => Linking.openSettings()}
      >
        <Ionicons name="settings-outline" size={16} color={colors.accentLight} />
        <Text style={styles.systemButtonText}>
          Gérer les autorisations système
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </Pressable>

      <Text style={styles.note}>
        Les préférences ci-dessus contrôlent quels types de notifications tu reçois.
        Pour activer ou désactiver les notifications SHUT globalement, utilise les
        paramètres système de ton appareil.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
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
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
  },
  desc: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  systemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
  },
  systemButtonText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
});
