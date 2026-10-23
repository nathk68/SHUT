import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../config/theme';

interface TabAvatarProps {
  size: number;
  color: string;
  avatarUrl: string | null;
  displayName: string;
  focused: boolean;
  isGuest: boolean;
}

export function TabAvatar({ size, color, avatarUrl, displayName, focused, isGuest }: TabAvatarProps) {
  if (isGuest) {
    return <Ionicons name="person-outline" size={size} color={color} />;
  }

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          { width: size, height: size, borderRadius: size / 2 },
          focused && styles.focusedBorder,
        ]}
      />
    );
  }

  const initial = (displayName || '').charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        focused && styles.focusedBorder,
      ]}
    >
      <Text style={{ color, fontFamily: fonts.heading.bold, fontSize: size * 0.5 }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedBorder: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
