import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors } from '../../config/theme';

interface Props {
  children: string;
  style?: TextStyle;
}

// Note: MaskedView is not available in Expo Go, so we fall back to accent color
export function GradientText({ children, style }: Props) {
  return (
    <Text style={[{ color: colors.accentLight }, style]}>{children}</Text>
  );
}
