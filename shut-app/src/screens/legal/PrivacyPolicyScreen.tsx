import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '../../config/theme';

function H1({ children }: { children: string }) {
  return <Text style={styles.h1}>{children}</Text>;
}
function H2({ children }: { children: string }) {
  return <Text style={styles.h2}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}
function Li({ children }: { children: string }) {
  return <Text style={styles.li}>{'• '}{children}</Text>;
}

export function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Politique de confidentialité</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Dernière mise à jour : 23 septembre 2026</Text>

        <P>
          SHUT (« nous », « notre ») s'engage à protéger la vie privée de ses utilisateurs.
          Cette politique explique quelles données nous collectons, pourquoi, et comment vous
          pouvez exercer vos droits.
        </P>

        <H1>1. Responsable du traitement</H1>
        <P>
          SHUT SAS, société en cours d'immatriculation, joignable à privacy@shut.live.
        </P>

        <H1>2. Données collectées</H1>
        <H2>2.1 Données que vous nous fournissez</H2>
        <Li>Adresse e-mail et mot de passe (authentification)</Li>
        <Li>Nom, prénom ou nom d'artiste</Li>
        <Li>Photo de profil</Li>
        <Li>Biographie, genres musicaux, liens réseaux sociaux</Li>
        <Li>Ville et pays de résidence</Li>
        <Li>Date de naissance (vérification de l'âge minimum)</Li>

        <H2>2.2 Données collectées automatiquement</H2>
        <Li>Adresse IP et type d'appareil</Li>
        <Li>Historique des lives regardés</Li>
        <Li>Interactions (likes, follows, commentaires)</Li>
        <Li>Données de performance des streams (si vous êtes DJ)</Li>
        <Li>Journaux de connexion</Li>

        <H1>3. Finalités du traitement</H1>
        <P>Vos données sont utilisées pour :</P>
        <Li>Vous authentifier et gérer votre compte</Li>
        <Li>Afficher votre profil aux autres utilisateurs</Li>
        <Li>Vous recommander des DJs et des lives pertinents</Li>
        <Li>Améliorer la qualité du service</Li>
        <Li>Vous envoyer des notifications (avec votre accord)</Li>
        <Li>Respecter nos obligations légales</Li>

        <H1>4. Base légale</H1>
        <Li>Exécution du contrat (CGU) : authentification, profil, streaming</Li>
        <Li>Intérêt légitime : sécurité, amélioration du service</Li>
        <Li>Consentement : notifications marketing, cookies optionnels</Li>

        <H1>5. Destinataires des données</H1>
        <P>
          Vos données peuvent être transmises aux sous-traitants suivants, uniquement dans
          le cadre de la fourniture du service :
        </P>
        <Li>Google Firebase (authentification, base de données, stockage) — UE</Li>
        <Li>Mux, Inc. (infrastructure vidéo) — États-Unis, accord SCCs</Li>

        <P>
          Nous ne vendons jamais vos données personnelles à des tiers.
        </P>

        <H1>6. Durée de conservation</H1>
        <Li>Compte actif : données conservées pendant toute la durée du compte</Li>
        <Li>Après suppression du compte : suppression immédiate des données personnelles</Li>
        <Li>Journaux de sécurité : 1 an maximum</Li>
        <Li>Données anonymisées : conservation indéfinie à des fins statistiques</Li>

        <H1>7. Transferts hors UE</H1>
        <P>
          Certains sous-traitants (Mux) sont établis aux États-Unis. Ces transferts sont
          encadrés par des clauses contractuelles types (CCT) de la Commission européenne.
        </P>

        <H1>8. Vos droits</H1>
        <P>Conformément au RGPD, vous disposez des droits suivants :</P>
        <Li>Droit d'accès à vos données (Art. 15)</Li>
        <Li>Droit de rectification (Art. 16)</Li>
        <Li>Droit à l'effacement (Art. 17) — suppression de compte depuis les paramètres</Li>
        <Li>Droit à la limitation du traitement (Art. 18)</Li>
        <Li>Droit à la portabilité (Art. 20)</Li>
        <Li>Droit d'opposition (Art. 21)</Li>
        <Li>Droit de retirer votre consentement à tout moment</Li>

        <P>
          Pour exercer vos droits : privacy@shut.live{'\n'}
          Réponse sous 30 jours maximum.
        </P>

        <H1>9. Cookies et traceurs</H1>
        <P>
          L'application mobile n'utilise pas de cookies. Des identifiants techniques
          (device ID) peuvent être utilisés pour le bon fonctionnement de l'application.
        </P>

        <H1>10. Sécurité</H1>
        <P>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
          chiffrement en transit (TLS), chiffrement au repos, contrôle d'accès, audits
          réguliers.
        </P>

        <H1>11. Mineurs</H1>
        <P>
          SHUT est réservé aux personnes de 16 ans et plus. Nous ne collectons pas
          sciemment de données sur des enfants de moins de 16 ans.
        </P>

        <H1>12. Réclamations</H1>
        <P>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire
          une réclamation auprès de la CNIL (France) : www.cnil.fr
        </P>

        <H1>13. Modifications</H1>
        <P>
          Cette politique peut être mise à jour. Toute modification significative sera
          notifiée par e-mail ou notification in-app.
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
  h2: {
    color: colors.textSecondary,
    fontFamily: fonts.heading.semiBold,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginBottom: 2,
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
