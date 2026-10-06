import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

function H1({ children }: { children: string }) {
  return <Text style={styles.h1}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}
function Li({ children }: { children: string }) {
  return <Text style={styles.li}>{'• '}{children}</Text>;
}

export function TermsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{"Conditions d'utilisation"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Dernière mise à jour : 23 septembre 2026</Text>

        <P>
          Bienvenue sur SHUT. En utilisant notre application, vous acceptez les présentes
          conditions d'utilisation (« CGU »). Veuillez les lire attentivement.
        </P>

        <H1>1. Description du service</H1>
        <P>
          SHUT est une plateforme de diffusion live dédiée à la musique électronique.
          Elle permet aux DJs de diffuser leurs sets en direct et aux spectateurs de les
          regarder, de les commenter et de les soutenir.
        </P>

        <H1>2. Conditions d'accès</H1>
        <Li>Avoir au moins 16 ans</Li>
        <Li>Fournir des informations exactes lors de l'inscription</Li>
        <Li>Ne pas créer de compte au nom d'une autre personne</Li>
        <Li>Être responsable de la sécurité de votre compte</Li>

        <H1>3. Contenu des utilisateurs</H1>
        <P>
          Vous conservez la propriété intellectuelle de votre contenu (sets, profil,
          photos). En le publiant sur SHUT, vous nous accordez une licence mondiale,
          non exclusive, gratuite pour afficher, distribuer et promouvoir votre contenu
          dans le cadre du service.
        </P>

        <H1>4. Comportements interdits</H1>
        <P>Il est strictement interdit de :</P>
        <Li>Diffuser du contenu illégal, haineux, pornographique ou violent</Li>
        <Li>Diffuser des œuvres musicales sans avoir les droits nécessaires (SACEM, etc.)</Li>
        <Li>Harceler, menacer ou intimider d'autres utilisateurs</Li>
        <Li>Usurper l'identité d'une autre personne ou d'une entité</Li>
        <Li>Tenter de pirater, décompiler ou altérer le service</Li>
        <Li>Utiliser des bots, scrapers ou outils automatisés sans autorisation</Li>
        <Li>Vendre ou louer votre compte à un tiers</Li>

        <H1>5. Droits musicaux</H1>
        <P>
          Les DJs diffusant sur SHUT sont seuls responsables de l'obtention des droits
          nécessaires pour diffuser leurs sets (droits d'auteur, droits voisins, licences
          SACEM/SDRM ou équivalent). SHUT ne saurait être tenu responsable des contenus
          diffusés par les utilisateurs.
        </P>

        <H1>6. Modération</H1>
        <P>
          SHUT se réserve le droit de supprimer tout contenu ou de suspendre tout compte
          qui ne respecte pas les présentes CGU, sans préavis et sans justification
          obligatoire. Les décisions de modération peuvent faire l'objet d'un recours
          par e-mail à support@shutdiffusion.com.
        </P>

        <H1>7. Disponibilité du service</H1>
        <P>
          Nous nous efforçons de maintenir le service disponible 24h/24, 7j/7, sans
          pouvoir le garantir. Des interruptions de maintenance ou des événements
          imprévus peuvent survenir. SHUT n'est pas responsable des pertes liées à
          une indisponibilité.
        </P>

        <H1>8. Limitation de responsabilité</H1>
        <P>
          SHUT est fourni « en l'état ». Dans les limites permises par la loi, nous
          excluons toute garantie implicite. Notre responsabilité totale envers vous
          ne peut excéder 100 € au cours des 12 derniers mois.
        </P>

        <H1>9. Propriété intellectuelle de SHUT</H1>
        <P>
          L'application, son design, ses marques, logos et contenus originaux sont
          protégés par le droit de la propriété intellectuelle et restent la propriété
          exclusive de SHUT. Toute reproduction non autorisée est interdite.
        </P>

        <H1>10. Modification des CGU</H1>
        <P>
          Nous pouvons modifier ces CGU à tout moment. En cas de modification
          substantielle, nous vous en informerons 30 jours à l'avance par e-mail
          ou notification in-app. La poursuite de l'utilisation du service vaut
          acceptation des nouvelles conditions.
        </P>

        <H1>11. Résiliation</H1>
        <P>
          Vous pouvez supprimer votre compte à tout moment depuis les paramètres
          de l'application. SHUT peut résilier votre accès en cas de violation des CGU.
        </P>

        <H1>12. Droit applicable et juridiction</H1>
        <P>
          Les présentes CGU sont soumises au droit français. En cas de litige,
          les parties s'engagent à rechercher une solution amiable avant toute
          action judiciaire. À défaut, les tribunaux compétents de Paris seront
          seuls compétents.
        </P>

        <H1>13. Contact</H1>
        <P>
          Pour toute question relative aux présentes CGU : legal@shutdiffusion.com
        </P>
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
    fontSize: fontSize.lg,
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
});
