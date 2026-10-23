import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize } from '../../config/theme';

export function RotateDeviceOverlay() {
  const { t } = useTranslation();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(
      400,
      withTiming(-90, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [rotation]);

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <Animated.View style={phoneStyle}>
        <Ionicons name="phone-portrait-outline" size={72} color={colors.white} />
      </Animated.View>
      <Text style={styles.text}>{t('player.rotateDevice')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    marginTop: 24,
    opacity: 0.8,
  },
});
