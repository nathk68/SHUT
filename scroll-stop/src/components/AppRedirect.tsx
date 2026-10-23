"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface AppRedirectProps {
  type: "live" | "replay" | "profile";
}

const texts = {
  fr: {
    live: "Ce live est disponible sur l'app SHUT. Telecharge-la pour regarder en direct !",
    replay: "Cette rediffusion est disponible sur l'app SHUT. Telecharge-la pour ecouter !",
    profile: "Decouvre ce profil sur l'app SHUT. Telecharge-la pour suivre cet artiste !",
    or: "ou",
    visit: "Visiter shutdiffusion.com",
    badgeAppStore: "/images/badge-app-store.svg",
    badgeGooglePlay: "/images/badge-google-play-fr.png",
    altAppStore: "Telecharger sur l'App Store",
    altGooglePlay: "Disponible sur Google Play",
  },
  en: {
    live: "This live is available on the SHUT app. Download it to watch live!",
    replay: "This replay is available on the SHUT app. Download it to listen!",
    profile: "Discover this profile on the SHUT app. Download it to follow this artist!",
    or: "or",
    visit: "Visit shutdiffusion.com",
    badgeAppStore: "/images/badge-app-store.svg",
    badgeGooglePlay: "/images/badge-google-play.png",
    altAppStore: "Download on the App Store",
    altGooglePlay: "Get it on Google Play",
  },
} as const;

export default function AppRedirect({ type }: AppRedirectProps) {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [lang, setLang] = useState<"fr" | "en">("en");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");

    if ((navigator.language || "").startsWith("fr")) setLang("fr");
  }, []);

  const t = texts[lang];
  const iosUrl = "https://apps.apple.com/app/shut/idXXXXXXXXXX";
  const androidUrl = "https://play.google.com/store/apps/details?id=com.nathk68.shutapp";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      <div className="text-center max-w-[400px]">
        {/* Logo */}
        <Image
          src="/images/logo.png"
          alt="SHUT"
          width={80}
          height={80}
          className="mx-auto mb-6"
        />

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">
          SHUT
        </h1>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--color-text-secondary)" }}>
          {t[type]}
        </p>

        <div className="flex flex-col gap-4 items-center">
          {(platform === "ios" || platform === "desktop") && (
            <a href={iosUrl}>
              <Image
                src={t.badgeAppStore}
                alt={t.altAppStore}
                width={180}
                height={54}
              />
            </a>
          )}
          {(platform === "android" || platform === "desktop") && (
            <a href={androidUrl}>
              <Image
                src={t.badgeGooglePlay}
                alt={t.altGooglePlay}
                width={180}
                height={54}
                style={{ objectFit: "contain" }}
              />
            </a>
          )}
        </div>

        <p className="text-xs mt-6" style={{ color: "var(--color-text-secondary)" }}>{t.or}</p>
        <a
          href="https://shutdiffusion.com"
          className="text-sm mt-2 inline-block no-underline hover:underline"
          style={{ color: "var(--color-accent-light)" }}
        >
          {t.visit}
        </a>
      </div>
    </div>
  );
}
