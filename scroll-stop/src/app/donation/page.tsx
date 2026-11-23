"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { I18nProvider, useI18n } from "@/lib/i18n";

const API_BASE = "https://europe-west1-shut-app-preprod.cloudfunctions.net";

interface MonthData {
  month: string;
  totalCents: number;
  supporterCount: number;
  goalCents: number;
}

const MONTH_LABELS_FR: Record<string, string> = {
  "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
  "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
  "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre",
};
const MONTH_LABELS_EN: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

function formatMonth(key: string, locale: string) {
  const [year, m] = key.split("-");
  const labels = locale === "fr" ? MONTH_LABELS_FR : MONTH_LABELS_EN;
  return `${labels[m] ?? m} ${year}`;
}

function DonationPageContent() {
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState<MonthData | null>(null);
  const [history, setHistory] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateBar, setAnimateBar] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/getDonationStats`).then((r) => r.json()),
      fetch(`${API_BASE}/getDonationHistory`).then((r) => r.json()),
    ])
      .then(([statsData, historyData]) => {
        setCurrent({
          month: statsData.month,
          totalCents: statsData.totalCents ?? 0,
          supporterCount: statsData.supporterCount ?? 0,
          goalCents: statsData.goalCents ?? 30000,
        });
        // History: skip the first entry (current month) since we show it separately
        const allMonths: MonthData[] = historyData.history ?? [];
        setHistory(allMonths.slice(1));
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setTimeout(() => setAnimateBar(true), 100);
      });
  }, []);

  const pct = current
    ? Math.min(Math.round((current.totalCents / current.goalCents) * 100), 100)
    : 0;
  const currentEuros = current ? (current.totalCents / 100) : 0;
  const goalEuros = current ? (current.goalCents / 100) : 300;

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-light))",
              boxShadow: "0 0 40px rgba(102, 36, 131, 0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1
            className="font-[family-name:var(--font-syne)] font-bold gradient-text mb-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {t.donationPageTitle}
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-base max-w-md mx-auto">
            {t.donationPageSubtitle}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
            />
          </div>
        ) : (
          <>
            {/* Current month card */}
            <div className="glassmorphism rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-[family-name:var(--font-syne)] font-semibold text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {current ? formatMonth(current.month, locale) : ""} — {t.donationMonthlyGoal}
                </h2>
                <span className="font-[family-name:var(--font-mono)] text-sm font-semibold" style={{ color: "var(--color-accent-light)" }}>
                  {pct}%
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-end gap-2 mb-3">
                <span className="font-[family-name:var(--font-syne)] font-bold text-3xl text-white">
                  {currentEuros.toFixed(2)}&nbsp;&euro;
                </span>
                <span className="text-sm pb-1" style={{ color: "var(--color-text-muted)" }}>
                  / {goalEuros.toFixed(2)}&nbsp;&euro;
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animateBar ? `${pct}%` : "0%",
                    background: "linear-gradient(90deg, var(--color-accent-dark), var(--color-accent), var(--color-accent-light))",
                    transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="glassmorphism rounded-xl p-3 text-center">
                  <span className="font-[family-name:var(--font-syne)] font-bold text-lg text-white block">
                    {current?.supporterCount ?? 0}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {t.donationSupporters}
                  </span>
                </div>
                <div className="glassmorphism rounded-xl p-3 text-center">
                  <span className="font-[family-name:var(--font-syne)] font-bold text-lg text-white block">
                    {currentEuros.toFixed(2)}&nbsp;&euro;
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {t.donationCollected}
                  </span>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="glassmorphism rounded-2xl p-6 mb-8">
              <h2 className="font-[family-name:var(--font-syne)] font-semibold text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                {t.donationHistoryTitle}
              </h2>

              {history.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                  {t.donationHistoryEmpty}
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((m) => {
                    const euros = m.totalCents / 100;
                    const goal = m.goalCents / 100;
                    const p = m.goalCents > 0
                      ? Math.min(Math.round((m.totalCents / m.goalCents) * 100), 100)
                      : 0;
                    return (
                      <div key={m.month} className="glassmorphism rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-[family-name:var(--font-syne)] font-semibold text-sm text-white">
                            {formatMonth(m.month, locale)}
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-xs" style={{ color: "var(--color-accent-light)" }}>
                            {p}%
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: animateBar ? `${p}%` : "0%",
                              background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
                              transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)",
                              transitionDelay: "0.3s",
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                          <span>
                            {euros.toFixed(2)}&nbsp;&euro; / {goal.toFixed(2)}&nbsp;&euro;
                          </span>
                          <span>
                            {m.supporterCount} {t.donationSupporters}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
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
                  href="/"
                  className="text-sm no-underline transition-colors hover:underline"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t.donationBackSite}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DonationPage() {
  return (
    <I18nProvider>
      <DonationPageContent />
    </I18nProvider>
  );
}
