import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { colors, fonts, fontSize, spacing, borderRadius } from '../config/theme';

export function GoLiveScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const { currentRole } = useRole();

  const isDJ = isAuthenticated && currentRole === 'broadcaster';

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgDecoration}>
        <View style={styles.bgGlow} />
        <Ionicons name="musical-notes" size={200} color="rgba(124,58,237,0.08)" style={styles.bgIcon} />
      </View>

      {/* DJ icon */}
      <View style={styles.djIconContainer}>
        <View style={styles.djIconRing} />
        <View style={styles.djIconInner}>
          <Ionicons name="person" size={52} color={colors.accent} />
        </View>
      </View>

      <Text style={styles.title}>DJ LIVE</Text>
      <Text style={styles.subtitle}>
        Lance ton live et partage ta musique avec le monde
      </Text>

      {isDJ ? (
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('AudioCheck')}
        >
          <Ionicons name="radio-outline" size={18} color={colors.white} />
          <Text style={styles.buttonText}>Lancer mon live</Text>
        </Pressable>
      ) : (
        <View style={styles.restrictedContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.restrictedText}>
            Cette fonctionnalité est réservée aux comptes DJ
          </Text>
        </View>
      )}

      <Text style={styles.tagline}>
        Partage ton univers. Inspire. Connecte.
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
  bgDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  bgIcon: {
    position: 'absolute',
  },
  djIconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  djIconRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  djIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    letterSpacing: 3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    letterSpacing: 1,
  },
  restrictedContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    maxWidth: 300,
    alignItems: 'center',
  },
  restrictedText: {
    color: colors.textMuted,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textMuted,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
