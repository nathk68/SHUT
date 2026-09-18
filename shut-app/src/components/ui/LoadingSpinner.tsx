import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accentLight} size={size} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
