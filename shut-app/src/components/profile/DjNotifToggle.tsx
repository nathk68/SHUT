import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function DjNotifToggle({ enabled, onToggle }: Props) {
  return (
    <Pressable onPress={onToggle} hitSlop={8} style={styles.button}>
      <Ionicons
        name={enabled ? 'notifications' : 'notifications-outline'}
        size={20}
        color={enabled ? colors.accent : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(240,239,244,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
