import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExperienceLevel } from '../../types/profile';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

const LABELS: Record<ExperienceLevel, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
  professionnel: 'Professionnel',
};

interface Props {
  level: ExperienceLevel;
}

export function ExperienceTag({ level }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{LABELS[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(151, 77, 251, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'center',
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
  },
});
