import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePreferences, type Language } from '../../contexts/PreferencesContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

export function LanguageScreen() {
  const navigation = useNavigation();
  const { language, setLanguage } = usePreferences();
  const { t } = useTranslation();

  const OPTIONS: { value: Language; label: string; native: string }[] = [
    { value: 'fr', label: t('languageScreen.french'), native: 'Français' },
    { value: 'en', label: t('languageScreen.english'), native: 'English' },
  ];

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('languageScreen.title')}</Text>
      </View>

      <View style={styles.card}>
        {OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.row,
              i === OPTIONS.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}
            onPress={() => handleSelect(opt.value)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.label}>{opt.label}</Text>
              <Text style={styles.native}>{opt.native}</Text>
            </View>
            {language === opt.value ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            ) : (
              <View style={styles.circle} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>
        {t('languageScreen.note')}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowLeft: { gap: 2 },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
  },
  native: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  note: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
