import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, borderRadius } from '../../config/theme';

function H1({ children }: { children: string }) {
  return <Text style={styles.h1}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}
function Li({ children }: { children: string }) {
  return <Text style={styles.li}>{'• '}{children}</Text>;
}

type RightCardProps = { article: string; title: string; desc: string; action?: string; onAction?: () => void };
function RightCard({ article, title, desc, action, onAction }: RightCardProps) {
  return (
    <View style={styles.rightCard}>
      <View style={styles.rightCardHeader}>
        <Text style={styles.rightCardArticle}>{article}</Text>
        <Text style={styles.rightCardTitle}>{title}</Text>
      </View>
      <Text style={styles.rightCardDesc}>{desc}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.rightCardAction}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RGPDScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Gestion des données (RGPD)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Dernière mise à jour : 23 septembre 2026</Text>

        <P>
          Le Règlement Général sur la Protection des Données (RGPD, Règlement UE 2016/679)
          vous confère des droits spécifiques sur vos données personnelles. Voici comment
          les exercer sur SHUT.
        </P>

        <H1>Vos droits en détail</H1>

        <RightCard
          article="Art. 15"
          title="Droit d'accès"
          desc="Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous."
          action="Envoyer une demande d'accès"
          onAction={() => Linking.openURL('mailto:legal@shutdiffusion.com?subject=Demande%20d%27acc%C3%A8s%20%E2%80%94%20RGPD%20Art.%2015')}
        />

        <RightCard
          article="Art. 16"
          title="Droit de rectification"
          desc="Si vos données sont inexactes ou incomplètes, vous pouvez les corriger directement depuis votre profil ou nous contacter."
          action="Modifier mon profil"
          onAction={() => (navigation as any).navigate('EditProfile')}
        />

        <RightCard
          article="Art. 17"
          title="Droit à l'effacement"
          desc="Vous pouvez demander la suppression de toutes vos données. Depuis les paramètres, utilisez « Supprimer mon compte » pour une suppression immédiate."
          action="Supprimer mon compte"
          onAction={() => (navigation as any).navigate('SettingsMain')}
        />

        <RightCard
          article="Art. 18"
          title="Droit à la limitation"
          desc="Vous pouvez demander que nous cessions de traiter vos données tout en les conservant, dans certaines circonstances prévues par le RGPD."
          action="Envoyer une demande"
          onAction={() => Linking.openURL('mailto:legal@shutdiffusion.com?subject=Limitation%20du%20traitement%20%E2%80%94%20RGPD%20Art.%2018')}
        />

        <RightCard
          article="Art. 20"
          title="Droit à la portabilité"
          desc="Vous pouvez recevoir vos données dans un format structuré et lisible par machine (JSON), afin de les transférer vers un autre service."
          action="Demander l'export de mes données"
          onAction={() => Linking.openURL('mailto:legal@shutdiffusion.com?subject=Portabilit%C3%A9%20des%20donn%C3%A9es%20%E2%80%94%20RGPD%20Art.%2020')}
        />

        <RightCard
          article="Art. 21"
          title="Droit d'opposition"
          desc="Vous pouvez vous opposer au traitement de vos données à des fins de marketing ou basé sur notre intérêt légitime."
          action="Exercer mon droit d'opposition"
          onAction={() => Linking.openURL('mailto:legal@shutdiffusion.com?subject=Opposition%20au%20traitement%20%E2%80%94%20RGPD%20Art.%2021')}
        />

        <H1>Durées de conservation</H1>
        <Li>Données de compte : pendant la durée d'activité du compte</Li>
        <Li>Données supprimées : suppression effective sous 30 jours</Li>
        <Li>Journaux de sécurité : 12 mois</Li>
        <Li>Données anonymisées : conservation indéfinie (sans lien possible à une personne)</Li>

        <H1>Sous-traitants (sous-processors)</H1>
        <Li>Google Firebase — authentification, BDD, stockage — Union européenne</Li>
        <Li>Mux, Inc. — streaming vidéo — États-Unis (CCT applicables)</Li>

        <H1>Délégué à la Protection des Données</H1>
        <P>
          Pour toute question relative à la protection de vos données :{'\n'}
          legal@shutdiffusion.com{'\n'}
          Délai de réponse : 30 jours maximum.
        </P>

        <H1>Réclamation auprès de la CNIL</H1>
        <P>
          Si vous estimez que vos droits ne sont pas respectés après nous avoir
          contactés, vous pouvez introduire une réclamation auprès de la
          Commission Nationale de l'Informatique et des Libertés (CNIL) :
        </P>
        <Pressable onPress={() => Linking.openURL('https://www.cnil.fr/fr/plaintes')}>
          <Text style={styles.link}>www.cnil.fr/fr/plaintes →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  date: {
    color: colors.textMuted,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    marginBottom: spacing.sm,
  },
  h1: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  p: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  li: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    paddingLeft: spacing.sm,
  },
  rightCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  rightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  rightCardArticle: {
    color: colors.accent,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rightCardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.sm,
  },
  rightCardDesc: {
    color: colors.textSecondary,
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  rightCardAction: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  link: {
    color: colors.accentLight,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
