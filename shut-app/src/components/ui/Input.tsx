import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Input({ label, error, icon, secureTextEntry, style, ...props }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon && (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accentLight}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  error: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
