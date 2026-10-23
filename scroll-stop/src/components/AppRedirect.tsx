"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface AppRedirectProps {
  type: "live" | "replay" | "profile";
}

const messages: Record<string, string> = {
  live: "Ce live est disponible sur l'app SHUT. Telecharge-la pour regarder en direct !",
  replay: "Cette rediffusion est disponible sur l'app SHUT. Telecharge-la pour ecouter !",
  profile: "Decouvre ce profil sur l'app SHUT. Telecharge-la pour suivre cet artiste !",
};

export default function AppRedirect({ type }: AppRedirectProps) {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
  }, []);

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
          {messages[type]}
        </p>

        <div className="flex flex-col gap-4 items-center">
          {(platform === "ios" || platform === "desktop") && (
            <a href={iosUrl}>
              <Image
                src="/images/badge-app-store.svg"
                alt="Telecharger sur l'App Store"
                width={180}
                height={54}
              />
            </a>
          )}
          {(platform === "android" || platform === "desktop") && (
            <a href={androidUrl}>
              <Image
                src="/images/badge-google-play.png"
                alt="Disponible sur Google Play"
                width={180}
                height={54}
                style={{ objectFit: "contain" }}
              />
            </a>
          )}
        </div>

        <p className="text-xs mt-6" style={{ color: "var(--color-text-secondary)" }}>ou</p>
        <a
          href="https://shutdiffusion.com"
          className="text-sm mt-2 inline-block no-underline hover:underline"
          style={{ color: "var(--color-accent-light)" }}
        >
          Visiter shutdiffusion.com
        </a>
      </div>
    </div>
  );
}
