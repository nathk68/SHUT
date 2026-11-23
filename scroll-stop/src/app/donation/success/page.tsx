"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { I18nProvider, useI18n } from "@/lib/i18n";

interface DonationStats {
  totalAmount: number;
  goal: number;
  supportersCount: number;
}

const DEFAULT_STATS: DonationStats = {
  totalAmount: 0,
  goal: 300,
  supportersCount: 0,
};

function DonationSuccessContent() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DonationStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [animateBar, setAnimateBar] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Read session_id from URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    if (sid) setSessionId(sid);

    // Fetch donation stats
    fetch("https://europe-west1-shut-app-preprod.cloudfunctions.net/getDonationStats")
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data: { totalCents?: number; goalCents?: number; supporterCount?: number }) => {
        setStats({
          totalAmount: data.totalCents ? Math.round(data.totalCents / 100) : DEFAULT_STATS.totalAmount,
          goal: data.goalCents ? Math.round(data.goalCents / 100) : DEFAULT_STATS.goal,
          supportersCount: data.supporterCount ?? DEFAULT_STATS.supportersCount,
        });
      })
      .catch(() => {
        // Keep default stats on error
      })
      .finally(() => {
        setLoading(false);
        // Trigger bar animation after a short delay so the browser paints 0% first
        setTimeout(() => setAnimateBar(true), 100);
      });
  }, []);

  const percentage = Math.min(
    Math.round((stats.totalAmount / stats.goal) * 100),
    100
  );

  const costBreakdown = [
    { label: t.donationCostStreaming, pct: 60 },
    { label: t.donationCostInfra, pct: 25 },
    { label: t.donationCostDev, pct: 15 },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-lg">
        {/* ---------- Header ---------- */}
        <div className="text-center mb-10">
          {/* Animated heart icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 animate-[pulse_2s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
              boxShadow: "0 0 40px rgba(102, 36, 131, 0.4)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          <h1
            className="font-[family-name:var(--font-syne)] font-bold gradient-text mb-3"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {t.donationThankTitle}
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-base">
            {t.donationThankSubtitle}
          </p>
        </div>

        {/* ---------- Progress card ---------- */}
        <div className="glassmorphism rounded-2xl p-6 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <>
              {/* Amount / goal */}
              <div className="flex items-end justify-between mb-3">
                <span className="font-[family-name:var(--font-syne)] font-bold text-2xl text-white">
                  {stats.totalAmount}&nbsp;&euro; <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>/ {stats.goal}&nbsp;&euro;</span>
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-sm font-semibold"
                  style={{ color: "var(--color-accent-light)" }}
                >
                  {percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animateBar ? `${percentage}%` : "0%",
                    background: "linear-gradient(90deg, var(--color-accent-dark), var(--color-accent), var(--color-accent-light))",
                    transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>

              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                {t.donationMonthlyGoal}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {/* Supporters */}
                <div className="glassmorphism rounded-xl p-4 text-center">
                  <svg
                    className="mx-auto mb-2"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--color-accent-light)" }}
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="font-[family-name:var(--font-syne)] font-bold text-xl text-white block">
                    {stats.supportersCount}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {t.donationSupporters}
                  </span>
                </div>

                {/* Total collected */}
                <div className="glassmorphism rounded-xl p-4 text-center">
                  <svg
                    className="mx-auto mb-2"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--color-accent-light)" }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="font-[family-name:var(--font-syne)] font-bold text-xl text-white block">
                    {stats.totalAmount}&nbsp;&euro;
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {t.donationCollected}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---------- Cost breakdown ---------- */}
        <div className="glassmorphism rounded-2xl p-6 mb-8">
          <h2
            className="font-[family-name:var(--font-syne)] font-semibold text-sm mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t.donationCostTitle}
          </h2>
          <div className="space-y-3">
            {costBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                  <span className="font-[family-name:var(--font-mono)]" style={{ color: "var(--color-text-muted)" }}>
                    {item.pct}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: animateBar ? `${item.pct}%` : "0%",
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
                      transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)",
                      transitionDelay: "0.4s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Actions ---------- */}
        <div className="text-center space-y-4">
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
              href="/donation"
              className="text-sm no-underline transition-colors hover:underline"
              style={{ color: "var(--color-accent-light)" }}
            >
              {t.donationViewHistory}
            </Link>
          </div>

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

export default function DonationSuccessPage() {
  return (
    <I18nProvider>
      <DonationSuccessContent />
    </I18nProvider>
  );
}
