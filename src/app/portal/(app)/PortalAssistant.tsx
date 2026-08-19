'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { portalStrings } from '@/lib/portal/strings';
import { cn } from '@/lib/utils';

/**
 * Assistant SAV du portail : bouton flottant + panneau de chat.
 *
 * Composant client volontairement leger : il ne fait que du fetch JSON vers
 * /api/portal/assistant (meme origine, cookie de session envoye tout seul).
 * Toute la logique (IA, outils, tickets) vit cote serveur.
 */

interface AssistantTicket {
  id: string;
  reference: number;
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
  ticket?: AssistantTicket | null;
}

export function PortalAssistant({ base, readOnly }: { base: string; readOnly: boolean }) {
  const s = portalStrings.assistant;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading, open]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading || readOnly) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setLoading(true);
    try {
      const response = await fetch('/api/portal/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, message: text }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as {
        reply: string;
        conversation_id: string;
        ticket: AssistantTicket | null;
      };
      setConversationId(data.conversation_id);
      setMessages((current) => [...current, { role: 'assistant', text: data.reply, ticket: data.ticket }]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: s.error }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? s.close : s.open}
        className="fixed right-5 bottom-5 z-40 inline-flex size-13 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg transition hover:bg-zinc-800"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {open ? (
        <div className="fixed right-5 bottom-21 z-40 flex h-[min(560px,75dvh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="border-b border-zinc-200 bg-[#F7F5F1] px-4 py-3">
            <p
              className="text-sm font-bold tracking-tight text-zinc-950"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {s.title}
            </p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-zinc-100 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-800">
              {s.intro}
            </div>
            {messages.map((message, index) => (
              <div key={index} className={cn('flex flex-col gap-1.5', message.role === 'user' && 'items-end')}>
                <div
                  className={cn(
                    'max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                    message.role === 'user'
                      ? 'rounded-2xl rounded-tr-md bg-zinc-950 text-white'
                      : 'rounded-2xl rounded-tl-md bg-zinc-100 text-zinc-800',
                  )}
                >
                  {message.text}
                </div>
                {message.ticket ? (
                  <a
                    href={`${base}/echanges/${message.ticket.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    {s.viewTicket} #{message.ticket.reference}
                  </a>
                ) : null}
              </div>
            ))}
            {loading ? <p className="text-xs text-zinc-400">{s.thinking}</p> : null}
          </div>

          {readOnly ? (
            <p className="border-t border-zinc-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{s.readOnly}</p>
          ) : (
            <form onSubmit={send} className="flex items-center gap-2 border-t border-zinc-200 px-3 py-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={s.placeholder}
                maxLength={4000}
                className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                aria-label={s.send}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          )}
        </div>
      ) : null}
    </>
  );
}
