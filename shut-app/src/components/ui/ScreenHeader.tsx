import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, subtitle, rightAction, onBack }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ?? null}
      </View>
      <View style={styles.accentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginRight: spacing.sm,
    paddingTop: 2,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  accentLine: {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
    marginTop: spacing.md,
    opacity: 0.3,
  },
});
