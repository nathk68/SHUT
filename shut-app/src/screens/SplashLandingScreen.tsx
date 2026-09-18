import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../navigation/AuthStack';
import { colors, fonts, fontSize, spacing } from '../config/theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SplashLanding'>;

export function SplashLandingScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      {/* Logo top */}
      <View style={styles.logoRow}>
        <Ionicons name="radio-outline" size={20} color={colors.accent} />
        <Text style={styles.logo}>SHUT</Text>
      </View>

      {/* Globe hero */}
      <View style={styles.globeContainer}>
        {/* Outer glow ring */}
        <View style={styles.glowRing} />
        {/* Middle ring */}
        <View style={styles.midRing} />
        {/* Globe icon */}
        <View style={styles.globeInner}>
          <Ionicons name="globe" size={140} color={colors.accent} />
        </View>

        {/* Partner country dots */}
        <View style={[styles.countryDot, styles.dotCH]}>
          <Text style={styles.countryFlag}>🇨🇭</Text>
        </View>
        <View style={[styles.countryDot, styles.dotFR]}>
          <Text style={styles.countryFlag}>🇫🇷</Text>
        </View>
        <View style={[styles.countryDot, styles.dotBE]}>
          <Text style={styles.countryFlag}>🇧🇪</Text>
        </View>
        <View style={[styles.countryDot, styles.dotDE]}>
          <Text style={styles.countryFlag}>🇩🇪</Text>
        </View>
      </View>

      {/* Hero text */}
      <View style={styles.hero}>
        <Text style={styles.title}>LA PLANÈTE DES DJ</Text>
        <Text style={styles.titleAccent}>EN LIVE</Text>
        <Text style={styles.tagline}>
          Des DJ. Des villes. Des cultures.{'\n'}Un seul endroit.
        </Text>
      </View>

      {/* CTA */}
      <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Ionicons name="compass-outline" size={18} color={colors.white} style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Explorer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 6,
  },
  globeContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
  },
  midRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  globeInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryDot: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCH: { top: 60, right: 20 },
  dotFR: { top: 80, left: 18 },
  dotBE: { bottom: 80, left: 30 },
  dotDE: { top: 30, left: 80 },
  countryFlag: { fontSize: 14 },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    textAlign: 'center',
    letterSpacing: 2,
  },
  titleAccent: {
    color: colors.accent,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    textAlign: 'center',
    letterSpacing: 4,
  },
  tagline: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
});
