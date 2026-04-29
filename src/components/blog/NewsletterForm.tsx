"use client";

import { useState } from "react";

/**
 * Minimal newsletter signup. Single email field, posts to /api/blog/subscribe.
 * No drip, no email confirmation in v1 — just stores in `contacts` for future use.
 */
export function NewsletterForm({ lang = "fr" }: { lang?: "fr" | "en" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const t =
    lang === "en"
      ? {
          errorRetry: "Error, please try again.",
          subscribed: "Subscribed. Talk soon.",
          networkError: "Network error.",
          title: "One article a month, nothing else.",
          subtitle: "Real automation and AI cases in SMEs. Zero spam.",
          placeholder: "you@company.com",
          loading: "...",
          done: "✓ Subscribed",
          submit: "Subscribe",
        }
      : {
          errorRetry: "Erreur, réessayez.",
          subscribed: "Inscrit. À bientôt.",
          networkError: "Erreur réseau.",
          title: "Un article par mois, rien d'autre.",
          subtitle: "Cas concrets d'automatisation et d'IA en PME. Zéro spam.",
          placeholder: "vous@entreprise.fr",
          loading: "...",
          done: "✓ Inscrit",
          submit: "S'inscrire",
        };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/blog/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? t.errorRetry);
        return;
      }
      setStatus("ok");
      setMessage(t.subscribed);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t.networkError);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="not-prose my-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
    >
      <p className="text-[15px] font-semibold text-zinc-900">{t.title}</p>
      <p className="mt-1 text-[13px] text-zinc-600">{t.subtitle}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          className="h-[44px] flex-1 rounded-[10px] border border-zinc-200 bg-white px-4 text-[14px] text-zinc-900 outline-none focus:border-zinc-900"
          disabled={status === "loading" || status === "ok"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "ok"}
          className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-black px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-60"
        >
          {status === "loading" ? t.loading : status === "ok" ? t.done : t.submit}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-[12px] ${status === "error" ? "text-red-600" : "text-zinc-600"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
