import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface Props {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title = 'SHUT', subtitle, right }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.logo}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  left: {
    flex: 1,
  },
  logo: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    marginLeft: spacing.md,
  },
});
