import Link from "next/link";

const BOOKING_BASE = "/?utm_source=blog&utm_medium=organic";

interface AuditFlashCTAProps {
  /** Slug of the current post — sets utm_campaign for attribution. */
  campaign?: string;
  /** Topic-specific hook line (e.g. "automatiser votre facturation"). */
  topic?: string;
  /** Visual variant: small inline banner mid-article, or full block at the end. */
  variant?: "inline" | "block";
  /** Language. */
  lang?: "fr" | "en";
}

const COPY = {
  fr: {
    inlineTopicFallback: "ce sujet",
    inlineTitle: (topic: string) => `Bloqué sur ${topic} ?`,
    inlineBody: "En 30 minutes, on identifie ce qui est faisable et combien ça coûte. Zéro PowerPoint.",
    inlineCta: "Réserver l'Audit Flash →",
    blockHref: `${BOOKING_BASE}`,
    bookingHash: "#booking",
    blockTitle: "Audit Flash : 30 minutes pour savoir si c'est faisable.",
    blockBullet1: (topic: string | undefined) => `→ On qualifie votre besoin${topic ? ` sur ${topic}` : ""}.`,
    blockBullet2: "→ Vous repartez avec une estimation claire (faisabilité, coût, délai).",
    blockBullet3: "→ Pas de slide, pas de relance commerciale lourde.",
    blockCta: "Réserver l'Audit Flash gratuit",
    ceoLine: "Théo, CTO — France & Belgique",
    ceoAlt: "Théo, CTO de Lucid-Lab",
  },
  en: {
    inlineTopicFallback: "this topic",
    inlineTitle: (topic: string) => `Stuck on ${topic}?`,
    inlineBody: "In 30 minutes, we identify what's feasible and what it will cost. Zero PowerPoint.",
    inlineCta: "Book the Audit Flash →",
    blockHref: `${BOOKING_BASE}`,
    bookingHash: "#booking",
    blockTitle: "Audit Flash: 30 minutes to know if it's feasible.",
    blockBullet1: (topic: string | undefined) => `→ We qualify your need${topic ? ` on ${topic}` : ""}.`,
    blockBullet2: "→ You leave with a clear estimate (feasibility, cost, timeline).",
    blockBullet3: "→ No slides, no heavy sales follow-up.",
    blockCta: "Book the free Audit Flash",
    ceoLine: "Théo, CTO — France & Belgium",
    ceoAlt: "Théo, CTO of Lucid-Lab",
  },
};

/**
 * Single conversion goal: book the Audit Flash call.
 * Drops the user into the existing TidyCal flow at `/#booking` with UTMs.
 */
export function AuditFlashCTA({
  campaign,
  topic,
  variant = "inline",
  lang = "fr",
}: AuditFlashCTAProps) {
  const t = COPY[lang];
  const base = lang === "en" ? "/en/?utm_source=blog&utm_medium=organic" : BOOKING_BASE;
  const href = `${base}${campaign ? `&utm_campaign=${campaign}` : ""}${t.bookingHash}`;

  if (variant === "inline") {
    return (
      <aside className="not-prose my-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:flex md:items-center md:gap-6">
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-zinc-900">
            {t.inlineTitle(topic ?? t.inlineTopicFallback)}
          </p>
          <p className="mt-1 text-[14px] text-zinc-600">{t.inlineBody}</p>
        </div>
        <Link
          href={href}
          className="mt-4 inline-flex h-[44px] items-center justify-center rounded-[10px] bg-black px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#333] md:mt-0 md:shrink-0"
        >
          {t.inlineCta}
        </Link>
      </aside>
    );
  }

  return (
    <aside className="not-prose my-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:gap-8">
        <div className="flex shrink-0 items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team/theo.png"
            alt={t.ceoAlt}
            className="size-16 rounded-full object-cover"
          />
          <div className="md:hidden">
            <p className="text-[14px] font-semibold text-zinc-900">Théo</p>
            <p className="text-[12px] text-zinc-500">CTO, Lucid-Lab</p>
          </div>
        </div>

        <div className="flex-1">
          <p
            className="text-[20px] font-bold tracking-tight text-zinc-900"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {t.blockTitle}
          </p>
          <ul className="mt-3 space-y-1.5 text-[14px] text-zinc-600">
            <li>{t.blockBullet1(topic)}</li>
            <li>{t.blockBullet2}</li>
            <li>{t.blockBullet3}</li>
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={href}
              className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-black px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#333]"
            >
              {t.blockCta}
            </Link>
            <span className="text-[13px] text-zinc-500">{t.ceoLine}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
