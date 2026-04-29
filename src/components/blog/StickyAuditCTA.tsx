"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StickyAuditCTAProps {
  campaign?: string;
  lang?: "fr" | "en";
}

const BOOKING_BASE = "/?utm_source=blog&utm_medium=organic";
const BOOKING_BASE_EN = "/en/?utm_source=blog&utm_medium=organic";

/**
 * Sticky Audit Flash CTA.
 * - Desktop: bottom-right floating card, visible after 25% scroll.
 * - Mobile:  full-width bottom bar, visible after 50% scroll.
 * Dismissible per-session via sessionStorage.
 */
export function StickyAuditCTA({ campaign, lang = "fr" }: StickyAuditCTAProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("audit-cta-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) return;
      const ratio = doc.scrollTop / total;
      const threshold = window.innerWidth < 768 ? 0.5 : 0.25;
      setVisible(ratio > threshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const base = lang === "en" ? BOOKING_BASE_EN : BOOKING_BASE;
  const href = `${base}${campaign ? `&utm_campaign=${campaign}` : ""}#booking`;
  const t =
    lang === "en"
      ? {
          title: "30 min to know if it's feasible",
          subtitle: "Free Audit Flash, no follow-up.",
          cta: "Book",
          close: "Close",
        }
      : {
          title: "30 min pour savoir si c'est faisable",
          subtitle: "Audit Flash gratuit, sans relance.",
          cta: "Réserver",
          close: "Fermer",
        };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:left-auto md:right-6 md:bottom-6 md:px-0 md:pb-0">
      <div className="mx-auto flex max-w-[420px] items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-md md:max-w-[360px]">
        <div className="flex-1">
          <p className="text-[13px] font-semibold leading-tight text-zinc-900">
            {t.title}
          </p>
          <p className="text-[12px] text-zinc-500">{t.subtitle}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-[36px] shrink-0 items-center justify-center rounded-[8px] bg-black px-3 text-[12px] font-medium text-white"
        >
          {t.cta}
        </Link>
        <button
          aria-label={t.close}
          onClick={() => {
            sessionStorage.setItem("audit-cta-dismissed", "1");
            setDismissed(true);
          }}
          className="text-zinc-400 transition-colors hover:text-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
