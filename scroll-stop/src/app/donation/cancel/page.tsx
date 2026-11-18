"use client";

import Link from "next/link";
import { I18nProvider, useI18n } from "@/lib/i18n";

function DonationCancelContent() {
  const { t } = useI18n();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-md text-center">
        {/* X icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <h1
          className="font-[family-name:var(--font-syne)] font-bold text-white mb-3"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
        >
          {t.donationCancelTitle}
        </h1>
        <p
          className="text-base mb-10 max-w-sm mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.donationCancelSubtitle}
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <a
            href="shutdiffusion://"
            className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 rounded-full font-[family-name:var(--font-syne)] font-semibold text-white text-sm transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
              boxShadow: "0 4px 24px rgba(102, 36, 131, 0.4)",
            }}
          >
            {t.donationBackApp}
          </a>

          <div>
            <Link
              href="/"
              className="text-sm no-underline transition-colors hover:underline"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t.donationBackSite}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonationCancelPage() {
  return (
    <I18nProvider>
      <DonationCancelContent />
    </I18nProvider>
  );
}
