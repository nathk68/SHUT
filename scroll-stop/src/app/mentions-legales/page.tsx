"use client";

import Link from "next/link";

export default function MentionsLegales() {
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
          Mentions légales
        </h1>

        <div className="space-y-8 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">1. Éditeur du site</h2>
            <p>
              Le site <strong>shutdiffusion.com</strong> est édité par :<br />
              <strong>Nathan Kiss</strong><br />
              3 Rue Albert Schweitzer, 68260 Kingersheim, France<br />
              SIRET : 94515738600018<br />
              Email : <a href="mailto:nathankiss0@gmail.com" className="underline" style={{ color: "var(--color-accent-light)" }}>nathankiss0@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">2. Directeur de la publication</h2>
            <p>
              Le directeur de la publication est <strong>Selim Douib</strong>.<br />
              Contact : <a href="mailto:selim@shutdiffusion.com" className="underline" style={{ color: "var(--color-accent-light)" }}>selim@shutdiffusion.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">3. Hébergement</h2>
            <p>
              Le site est hébergé par :<br />
              <strong>IONOS SE</strong><br />
              Elgendorfer Str. 57, 56410 Montabaur, Allemagne<br />
              Site web : <a href="https://www.ionos.fr" className="underline" style={{ color: "var(--color-accent-light)" }} target="_blank" rel="noopener noreferrer">www.ionos.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">4. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur le site shutdiffusion.com (textes, images, logos, icônes,
              éléments graphiques, vidéos, mises en page) sont protégés par les lois françaises et internationales
              relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou
              adaptation, totale ou partielle, de ces éléments est strictement interdite sans l&apos;autorisation
              écrite préalable de Selim Douib.
            </p>
            <p className="mt-2">
              La marque SHUT, le logo et l&apos;identité visuelle associée sont la propriété exclusive de Selim Douib.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">5. Limitation de responsabilité</h2>
            <p>
              Selim Douib s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées
              sur le site, mais ne saurait être tenu responsable des erreurs, omissions ou résultats qui
              pourraient être obtenus par un mauvais usage de ces informations. L&apos;accès au site peut être
              interrompu à tout moment pour des raisons de maintenance ou de mise à jour.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">6. Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers d&apos;autres sites internet. Selim Douib ne dispose d&apos;aucun
              moyen de contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur
              contenu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-white">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux
              français seront seuls compétents.
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
