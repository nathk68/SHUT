import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, fontSize, borderRadius } from '../../config/theme';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 40, style }: Props) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image as ImageStyle,
          { width: size, height: size, borderRadius: size / 2 } as ImageStyle,
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.backgroundElevated,
  },
  placeholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.heading.semiBold,
    color: colors.textPrimary,
  },
});
