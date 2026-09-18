import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function GlassCard({ children, onPress, style }: Props) {
  const Wrapper = onPress ? Pressable : Pressable;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        { opacity: onPress && pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
  },
});
