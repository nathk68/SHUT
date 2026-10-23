"use client";

import Link from "next/link";

export default function PolitiqueConfidentialite() {
  return (
    <div
      className="min-h-screen px-6 py-20 md:px-16 lg:px-24"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      <div className="max-w-[800px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-10 no-underline transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold mb-8"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Politique de confidentialité
        </h1>

        <div className="space-y-8 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est :<br />
              <strong>Selim Douib</strong> (SIRET : 99392906600013)<br />
              13 rue Jean-Jacques Henner, 68390 Sausheim, France<br />
              Email : <a href="mailto:selim@shutdiffusion.com" className="underline" style={{ color: "var(--color-accent-light)" }}>selim@shutdiffusion.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de l&apos;application et du site SHUT, nous collectons les données suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email, nom d&apos;utilisateur, photo de profil</li>
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d&apos;exploitation, dates et heures de connexion</li>
              <li><strong>Données de géolocalisation :</strong> localisation géographique (avec votre consentement) pour afficher les DJs proches de vous et les scènes par pays</li>
              <li><strong>Données d&apos;utilisation :</strong> interactions avec l&apos;application (lives regardés, DJs suivis, messages envoyés dans le chat)</li>
              <li><strong>Données de diffusion :</strong> pour les DJs, les flux audio/vidéo diffusés en direct</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Finalités du traitement</h2>
            <p>Vos données sont collectées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture du service de streaming live (diffusion et visionnage)</li>
              <li>Affichage des DJs et scènes par localisation géographique</li>
              <li>Fonctionnalité de chat en direct et interactions sociales</li>
              <li>Envoi de notifications (nouveaux lives de DJs suivis)</li>
              <li>Amélioration du service et analyse d&apos;audience</li>
              <li>Sécurité et prévention des fraudes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Votre consentement</strong> (géolocalisation, notifications)</li>
              <li><strong>L&apos;exécution du contrat</strong> (création de compte, accès au service de streaming)</li>
              <li><strong>L&apos;intérêt légitime</strong> (amélioration du service, sécurité)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Destinataires des données</h2>
            <p>Vos données peuvent être transmises aux prestataires techniques suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Firebase (Google)</strong> : authentification, base de données, stockage</li>
              <li><strong>IONOS SE</strong> : hébergement du site web</li>
            </ul>
            <p className="mt-2">
              Vos données ne sont jamais vendues à des tiers. Elles peuvent être transmises aux autorités
              compétentes sur demande légale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Durée de conservation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données de compte :</strong> conservées tant que le compte est actif, puis supprimées dans un délai de 3 mois après la suppression du compte</li>
              <li><strong>Données de connexion :</strong> 12 mois maximum</li>
              <li><strong>Données de géolocalisation :</strong> durée de la session uniquement</li>
              <li><strong>Contenus de chat :</strong> 6 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Vos droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Droit d&apos;accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:selim@shutdiffusion.com" className="underline" style={{ color: "var(--color-accent-light)" }}>selim@shutdiffusion.com</a>
            </p>
            <p className="mt-2">
              Vous pouvez également déposer une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" className="underline" style={{ color: "var(--color-accent-light)" }} target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">8. Cookies</h2>
            <p>
              Le site shutdiffusion.com utilise des cookies strictement nécessaires au fonctionnement du service.
              Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">9. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données contre tout accès non autorisé, modification, divulgation ou destruction. Les
              communications sont chiffrées via HTTPS et les données sont stockées sur des serveurs sécurisés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">10. Transferts internationaux</h2>
            <p>
              Certaines données peuvent être transférées vers les États-Unis (Firebase/Google). Ces transferts
              sont encadrés par les clauses contractuelles types de la Commission européenne et le Data Privacy
              Framework UE-USA.
            </p>
          </section>

          <p className="text-sm mt-12" style={{ color: "var(--color-text-muted)" }}>
            Dernière mise à jour : octobre 2026
          </p>
        </div>
      </div>
    </div>
  );
}
