import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

export function LiveClubScreen() {
  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.bgGlow} />

      <Text style={styles.title}>LIVE CLUB</Text>
      <Text style={styles.subtitle}>Accès prochainement.</Text>

      {/* Lock icon in circle */}
      <View style={styles.lockContainer}>
        <View style={styles.lockRingOuter} />
        <View style={styles.lockRingInner} />
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={40} color={colors.accentLight} />
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Bientôt disponible</Text>
      </View>

      <Text style={styles.description}>
        Le Live Club sera disponible dans une prochaine mise à jour.{'\n'}
        En attendant, reste connecté.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  bgGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(124,58,237,0.04)',
    top: '20%',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  lockContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  lockRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
    backgroundColor: 'rgba(124,58,237,0.04)',
  },
  lockRingInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    letterSpacing: 3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  badgeText: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    letterSpacing: 1,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});
