import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OnboardingRole'>;
};

export function OnboardingRoleScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Qui es-tu ?</Text>
        <Text style={styles.subtitle}>
          Pour te préparer la meilleure expérience possible.
        </Text>

        {/* Spectateur — option principale, très mise en avant */}
        <Pressable
          style={[styles.card, styles.cardPrimary]}
          onPress={() => navigation.navigate('SpectatorOnboarding')}
        >
          <View style={[styles.iconWrapper, styles.iconWrapperPrimary]}>
            <Ionicons name="headset" size={32} color={colors.accent} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, styles.cardTitlePrimary]}>Spectateur</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Populaire</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Découvre des DJs du monde entier et suis leurs lives en temps réel.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.accent} />
        </Pressable>

        {/* DJ — option secondaire */}
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('DJOnboarding')}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="disc-outline" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Je suis DJ</Text>
            <Text style={styles.cardDesc}>
              Tu mixes et veux diffuser tes sets sur SHUT. Soumet ta candidature.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Organisateur — bientôt disponible */}
        <View style={styles.cardDisabled}>
          <View style={styles.iconWrapper}>
            <Ionicons name="business-outline" size={24} color={colors.textMuted} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitleDisabled}>Organisateur</Text>
            <Text style={styles.cardDescDisabled}>
              Collectif, club ou festival.
            </Text>
            <View style={styles.badgeDisabled}>
              <Text style={styles.badgeDisabledText}>Bientôt disponible</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {/* Directeur Artistique — bientôt disponible */}
        <View style={styles.cardDisabled}>
          <View style={styles.iconWrapper}>
            <Ionicons name="people-outline" size={24} color={colors.textMuted} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitleDisabled}>Directeur Artistique</Text>
            <Text style={styles.cardDescDisabled}>
              Tu recherches des talents où programmer.
            </Text>
            <View style={styles.badgeDisabled}>
              <Text style={styles.badgeDisabledText}>Bientôt disponible</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {/* Déjà un compte */}
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>J'ai déjà un compte</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  // Carte générique
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  // Carte Spectateur — plus grande et accentuée
  cardPrimary: {
    backgroundColor: `${colors.accent}10`,
    borderColor: `${colors.accent}40`,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.accent}18`,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  cardTitlePrimary: {
    fontSize: fontSize.xl,
  },
  cardDesc: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: `${colors.accent}25`,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.accent}50`,
  },
  badgeText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  // Cartes désactivées (bientôt disponible)
  cardDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    opacity: 0.5,
  },
  cardTitleDisabled: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  cardDescDisabled: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  badgeDisabled: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.textMuted}20`,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeDisabledText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Lien login
  loginLink: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  loginLinkText: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
