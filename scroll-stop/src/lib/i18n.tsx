"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "fr" | "en";

const translations = {
  fr: {
    // Navbar
    navFeatures: "Fonctionnalités",
    navPerformance: "Performance",
    navJourney: "Parcours",
    navCta: "Commencer",

    // Hero
    heroBadge: "Live Streaming",
    heroTitle: "LA PLANÈTE DES",
    heroTitleAccent: "DJs",
    heroSubtitle: "DJs. Villes. Cultures. Un seul endroit.",
    heroCtaPrimary: "Télécharger SHUT",
    heroCtaSecondary: "Découvrir",
    heroScroll: "Scroll",

    // Features
    featuresTag: "Fonctionnalités",
    featuresTitle: "Tout ce qu'il faut pour le live",
    featuresSubtitle: "Une plateforme complète pensée par et pour les DJs.",
    feature1Title: "Live Streaming",
    feature1Desc: "Diffusez vos sets en direct depuis n'importe quel lieu. Connectez vos platines, lancez le stream, et partagez votre musique avec le monde.",
    feature2Title: "Explore par Pays",
    feature2Desc: "Découvrez les scènes live du monde entier. Parcourez les pays partenaires et trouvez les DJs de chaque ville.",
    feature3Title: "Regarde tes DJs",
    feature3Desc: "Suivez vos DJs préférés et recevez des notifications quand ils passent en live. Ne ratez plus aucun set.",
    feature4Title: "Chat & Reactions",
    feature4Desc: "Interagissez en temps réel pendant le set. Chat live, réactions, et compteur de viewers — votre audience fait partie du show.",

    // Phone mockup
    phoneBadge1: "Audio 320kbps",
    phoneBadge2: "720p Video",
    phoneBadge3: "RTMP natif",
    phoneBadge4: "Reconnexion auto",
    phoneAvailability: "Disponible bientôt sur iOS & Android",

    // Stats
    statUptime: "Uptime garanti",
    statAudio: "Audio stream",
    statVideo: "Qualité vidéo",
    statProtocol: "Protocole",
    statProtocolValue: "RTMP natif",

    // CTA
    ctaTag: "Prêt ?",
    ctaTitle: "Le live commence",
    ctaTitleAccent: "maintenant.",
    ctaSubtitle: "Rejoignez les DJs qui ont choisi SHUT pour diffuser leurs sets en live. Audio haute qualité, zéro compromis.",
    ctaButton: "Lancer SHUT",

    // DJ Journey
    journeyTag: "L'aventure",
    journeyTitle: "De la chambre au",
    journeyTitleAccent: "mainstage.",
    journeyStep1: "Le craft",
    journeyStep1Sub: "Tout commence par les mains sur les platines. Le son, le groove, la technique.",
    journeyStep2: "Les premières soirées",
    journeyStep2Sub: "Les premiers sets devant un public. L'énergie monte, la connexion se crée.",
    journeyStep3: "La maîtrise",
    journeyStep3Sub: "Des heures de pratique. Le setup se perfectionne. Le son devient signature.",
    journeyStep4: "Le grand show",
    journeyStep4Sub: "Face à la foule. Les lumières, la basse, des milliers de personnes. SHUT vous y amène.",
    journeyMarquee: "SHUT DIFFUSION",

    // Footer
    footerPrivacy: "Confidentialité",
    footerTerms: "Conditions",
    footerContact: "Contact",
    footerCopyright: "2026 SHUT. Tous droits réservés.",
  },
  en: {
    // Navbar
    navFeatures: "Features",
    navPerformance: "Performance",
    navJourney: "Journey",
    navCta: "Get Started",

    // Hero
    heroBadge: "Live Streaming",
    heroTitle: "THE DJs",
    heroTitleAccent: "PLANET",
    heroSubtitle: "DJs. Cities. Cultures. One place.",
    heroCtaPrimary: "Download SHUT",
    heroCtaSecondary: "Discover",
    heroScroll: "Scroll",

    // Features
    featuresTag: "Features",
    featuresTitle: "Everything you need to go live",
    featuresSubtitle: "A complete platform built by and for DJs.",
    feature1Title: "Live Streaming",
    feature1Desc: "Broadcast your sets live from anywhere. Connect your decks, start the stream, and share your music with the world.",
    feature2Title: "Explore by Country",
    feature2Desc: "Discover live scenes from around the world. Browse partner countries and find DJs in every city.",
    feature3Title: "Watch your DJs",
    feature3Desc: "Follow your favorite DJs and get notified when they go live. Never miss a set again.",
    feature4Title: "Chat & Reactions",
    feature4Desc: "Interact in real time during the set. Live chat, reactions, and viewer count — your audience is part of the show.",

    // Phone mockup
    phoneBadge1: "Audio 320kbps",
    phoneBadge2: "720p Video",
    phoneBadge3: "Native RTMP",
    phoneBadge4: "Auto-reconnect",
    phoneAvailability: "Coming soon on iOS & Android",

    // Stats
    statUptime: "Guaranteed uptime",
    statAudio: "Audio stream",
    statVideo: "Video quality",
    statProtocol: "Protocol",
    statProtocolValue: "Native RTMP",

    // CTA
    ctaTag: "Ready?",
    ctaTitle: "The live starts",
    ctaTitleAccent: "now.",
    ctaSubtitle: "Join the DJs who chose SHUT to broadcast their sets live. High-quality audio, zero compromise.",
    ctaButton: "Launch SHUT",

    // DJ Journey
    journeyTag: "The journey",
    journeyTitle: "From bedroom to",
    journeyTitleAccent: "mainstage.",
    journeyStep1: "The craft",
    journeyStep1Sub: "It all starts with hands on the decks. The sound, the groove, the technique.",
    journeyStep2: "First gigs",
    journeyStep2Sub: "The first sets in front of an audience. The energy builds, the connection is born.",
    journeyStep3: "Mastery",
    journeyStep3Sub: "Hours of practice. The setup gets refined. The sound becomes a signature.",
    journeyStep4: "The big show",
    journeyStep4Sub: "Facing the crowd. Lights, bass, thousands of people. SHUT takes you there.",
    journeyMarquee: "SHUT DIFFUSION",

    // Footer
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    footerContact: "Contact",
    footerCopyright: "2026 SHUT. All rights reserved.",
  },
} as const;

type Translations = Record<keyof typeof translations.fr, string>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const lang = navigator.language || "";
    if (lang.startsWith("fr")) {
      setLocale("fr");
    }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
