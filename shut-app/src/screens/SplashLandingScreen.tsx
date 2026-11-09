import React, { useCallback } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../navigation/AuthStack';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import { setStoredData } from '../utils/storage';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SplashLanding'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SplashLandingScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleExplore = useCallback(async () => {
    await setStoredData('@shut_has_seen_splash', true);
    navigation.navigate('OnboardingRole');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Planet image — positioned as background layer */}
      <View style={styles.planetWrapper}>
        <Image
          source={require('../../assets/Planet_connected.jpeg')}
          style={styles.planetImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[colors.background, 'transparent']}
          style={styles.imageFadeTop}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.imageFade}
        />
      </View>

      {/* Content overlaid */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* Logo */}
        <Image
          source={require('../../assets/icon-nobg.png')}
          style={styles.logo}
          resizeMode="contain"
          testID="logo-shut"
        />

        <View style={styles.spacer} />

        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={styles.title}>{t('splash.title')}</Text>
          <Text style={styles.titleAccent}>{t('splash.titleAccent')}</Text>
          <Text style={styles.tagline}>{t('splash.tagline')}</Text>
        </View>

        {/* CTA */}
        <Pressable style={styles.button} onPress={handleExplore}>
          <Text style={styles.buttonText}>{t('splash.explore')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  planetWrapper: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.12,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
  },
  planetImage: {
    width: '100%',
    height: '100%',
  },
  imageFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  imageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: SCREEN_HEIGHT * 0.14,
    height: SCREEN_HEIGHT * 0.14,
    maxWidth: 140,
    maxHeight: 140,
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display.regular,
    fontSize: 80,
    textAlign: 'center',
    letterSpacing: 8,
  },
  titleAccent: {
    color: colors.accent,
    fontFamily: fonts.display.regular,
    fontSize: 52,
    textAlign: 'center',
    letterSpacing: 6,
    marginTop: -4,
  },
  tagline: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
});
