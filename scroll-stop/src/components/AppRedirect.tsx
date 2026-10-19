"use client";

import { useEffect, useState } from "react";

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
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-bold text-3xl text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
          }}
        >
          S
        </div>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">
          SHUT
        </h1>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--color-text-secondary)" }}>
          {messages[type]}
        </p>

        <div className="flex flex-col gap-3 items-center">
          {(platform === "ios" || platform === "desktop") && (
            <a
              href={iosUrl}
              className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-sm font-medium no-underline transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-primary)",
              }}
            >
              <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor">
                <path d="M15.77 12.45c-.02-2.37 1.93-3.52 2.02-3.57-1.1-1.61-2.81-1.83-3.42-1.85-1.45-.15-2.85.86-3.59.86-.74 0-1.88-.85-3.1-.82-1.59.02-3.07.93-3.89 2.37-1.67 2.9-.43 7.18 1.19 9.53.8 1.15 1.74 2.44 2.98 2.4 1.2-.05 1.65-.77 3.1-.77 1.44 0 1.85.77 3.1.74 1.29-.02 2.1-1.17 2.88-2.32.92-1.33 1.29-2.63 1.31-2.7-.03-.01-2.51-.96-2.53-3.83z" />
              </svg>
              App Store
            </a>
          )}
          {(platform === "android" || platform === "desktop") && (
            <a
              href={androidUrl}
              className="flex items-center gap-3 px-7 py-3.5 rounded-xl text-sm font-medium no-underline transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--color-text-primary)",
              }}
            >
              <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor">
                <path d="M1.21 0L11.05 10 1.21 20c-.38-.39-.21-1.26-.21-1.79V1.79C1 1.26.83.39 1.21 0zm.71-.41L13.06 5.5 3.5 10 1.92-.41zM13.06 14.5L1.92 20.41 3.5 10l9.56 4.5zm1.24-.73L19 11c.66.36.66 1.64 0 2l-4.7 2.77L10.5 12l3.8-3.23z" />
              </svg>
              Google Play
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
