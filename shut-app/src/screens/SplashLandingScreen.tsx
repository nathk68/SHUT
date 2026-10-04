import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../navigation/AuthStack';
import { colors, fonts, fontSize, spacing } from '../config/theme';
import { setStoredData } from '../utils/storage';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SplashLanding'>;

export function SplashLandingScreen() {
  const navigation = useNavigation<Nav>();

  const handleExplore = useCallback(async () => {
    await setStoredData('@shut_has_seen_splash', true);
    navigation.navigate('OnboardingRole');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Logo top */}
      <Image
        source={require('../../assets/icon-nobg.png')}
        style={styles.logo}
        resizeMode="contain"
        testID="logo-shut"
      />

      {/* Image plein bord */}
      <View style={styles.imageContainer}>
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

      {/* Hero text + CTA — légèrement par-dessus le bas de l'image */}
      <View style={styles.bottom}>
        <View style={styles.hero}>
          <Text style={styles.title}>LA PLANÈTE DES DJ</Text>
          <Text style={styles.titleAccent}>EN LIVE</Text>
          <Text style={styles.tagline}>
            Des DJ. Des villes. Des cultures.{'\n'}Un seul endroit.
          </Text>
        </View>
        <Pressable style={styles.button} onPress={handleExplore}>
          <Text style={styles.buttonText}>Explorer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    // Pas de paddingHorizontal ici — géré par logoRow et bottom
  },
  logo: {
    width: 144,
    height: 144,
    top: 42,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1090 / 960,
    overflow: 'hidden',
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
    height: 100,
  },
  imageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottom: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    marginTop: -100,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.hero,
    textAlign: 'center',
  },
  titleAccent: {
    color: colors.accent,
    fontFamily: fonts.mono.medium,
    fontSize: fontSize.hero,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xs,
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
