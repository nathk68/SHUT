import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences, type Language } from '../../contexts/PreferencesContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
];

export function LanguageToggle() {
  const { language, setLanguage } = usePreferences();

  return (
    <View style={styles.container}>
      {LANGUAGES.map(lang => (
        <Pressable
          key={lang.value}
          onPress={() => setLanguage(lang.value)}
          style={[styles.option, language === lang.value && styles.optionActive]}
        >
          <Text style={[styles.label, language === lang.value && styles.labelActive]}>
            {lang.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  option: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.white,
  },
});
