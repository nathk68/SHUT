import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

interface Props {
  onPress: () => void;
}

export function AdminReturnFAB({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Pressable
      style={[styles.fab, { bottom: 70 + insets.bottom }]}
      onPress={onPress}
    >
      <Ionicons name="shield" size={18} color={colors.white} />
      <Text style={styles.label}>{t('admin.returnToAdmin')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
