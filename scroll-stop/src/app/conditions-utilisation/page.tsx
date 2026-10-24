"use client";

import Link from "next/link";

export default function ConditionsUtilisation() {
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
          className="font-[family-name:var(--font-syne)] font-bold mb-8"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Conditions générales d&apos;utilisation
        </h1>

        <div className="space-y-8 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation du site
              web shutdiffusion.com et de l&apos;application mobile SHUT (ci-après &quot;le Service&quot;), édités
              par Nathan Kiss (SIRET : 94515738600018). En accédant ou en utilisant le Service, vous acceptez les présentes CGU dans
              leur intégralité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Description du service</h2>
            <p>
              SHUT est une plateforme de streaming musical en direct qui permet aux DJs de diffuser leurs
              sets live et aux auditeurs de les regarder en temps réel. Le Service comprend notamment :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La diffusion de sets DJ en direct (audio et vidéo)</li>
              <li>Le visionnage de lives en temps réel</li>
              <li>L&apos;exploration des DJs par pays et par ville</li>
              <li>Un système de chat en direct pendant les sets</li>
              <li>Le suivi de DJs et les notifications de nouveaux lives</li>
              <li>Le replay de sets précédents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Inscription et compte</h2>
            <p>
              L&apos;utilisation de certaines fonctionnalités du Service nécessite la création d&apos;un compte.
              Vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir des informations exactes et complètes lors de l&apos;inscription</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Informer immédiatement SHUT de toute utilisation non autorisée de votre compte</li>
              <li>Être âgé d&apos;au moins 13 ans (ou l&apos;âge minimum légal dans votre pays)</li>
            </ul>
            <p className="mt-2">
              Vous êtes responsable de toutes les activités effectuées sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Utilisation du service</h2>
            <p>En utilisant le Service, vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Diffuser du contenu illégal, offensant, haineux ou portant atteinte aux droits d&apos;autrui</li>
              <li>Diffuser de la musique sans détenir les droits nécessaires ou les licences appropriées</li>
              <li>Utiliser le Service à des fins commerciales non autorisées</li>
              <li>Tenter de perturber le fonctionnement du Service (attaques, spam, etc.)</li>
              <li>Contourner les mesures de sécurité ou les restrictions d&apos;accès</li>
              <li>Collecter des données personnelles d&apos;autres utilisateurs sans leur consentement</li>
              <li>Utiliser le chat pour du harcèlement, de l&apos;intimidation ou du contenu inapproprié</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Contenu des utilisateurs</h2>
            <p>
              Les DJs sont responsables du contenu qu&apos;ils diffusent sur SHUT, y compris le respect des
              droits d&apos;auteur et des licences musicales. SHUT ne revendique aucun droit de propriété sur
              le contenu diffusé par les utilisateurs.
            </p>
            <p className="mt-2">
              SHUT se réserve le droit de supprimer tout contenu violant les présentes CGU ou la législation
              en vigueur, et de suspendre ou supprimer les comptes concernés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Propriété intellectuelle</h2>
            <p>
              L&apos;application SHUT, son code source, son design, ses fonctionnalités, sa marque et son logo
              sont la propriété exclusive de Selim Douib. Toute reproduction ou utilisation non autorisée
              est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Disponibilité du service</h2>
            <p>
              SHUT s&apos;efforce d&apos;assurer la disponibilité du Service 24h/24, 7j/7. Toutefois, le Service
              peut être interrompu pour des raisons de maintenance, de mise à jour ou en cas de force majeure.
              SHUT ne garantit pas un fonctionnement ininterrompu et ne saurait être tenu responsable des
              interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">8. Limitation de responsabilité</h2>
            <p>
              Le Service est fourni &quot;en l&apos;état&quot;. SHUT ne saurait être tenu responsable des dommages
              directs ou indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le
              Service, y compris la perte de données, l&apos;interruption d&apos;activité ou les problèmes
              techniques liés aux appareils des utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">9. Modification des CGU</h2>
            <p>
              SHUT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
              informés des modifications par notification dans l&apos;application ou par email. La poursuite de
              l&apos;utilisation du Service après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">10. Résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l&apos;application ou
              en contactant <a href="mailto:support@shutdiffusion.com" className="underline" style={{ color: "var(--color-accent-light)" }}>support@shutdiffusion.com</a>.
            </p>
            <p className="mt-2">
              SHUT se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">11. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont soumises au droit français. Tout litige relatif à l&apos;utilisation du
              Service sera soumis aux tribunaux compétents de France.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">12. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à :<br />
              <a href="mailto:contact@shutdiffusion.com" className="underline" style={{ color: "var(--color-accent-light)" }}>contact@shutdiffusion.com</a>
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
