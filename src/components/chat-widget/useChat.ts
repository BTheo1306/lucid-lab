'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: number;
}

interface UseChatOptions {
  turnstileToken?: string | null;
  language?: 'fr' | 'en';
  enabled?: boolean;
}

const STORAGE_KEY = 'lucidlab_chat_session_v2';

function storageGet(key: string): string | null {
  try {
    // Respect user consent — use sessionStorage if localStorage not allowed
    if (typeof window === 'undefined') return null;
    const consentOk = (window as unknown as { __lucidlab_consent?: boolean }).__lucidlab_consent !== false;
    const store = consentOk ? window.localStorage : window.sessionStorage;
    return store.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, val: string): void {
  try {
    if (typeof window === 'undefined') return;
    const consentOk = (window as unknown as { __lucidlab_consent?: boolean }).__lucidlab_consent !== false;
    const store = consentOk ? window.localStorage : window.sessionStorage;
    store.setItem(key, val);
  } catch {
    // ignore
  }
}

export interface UseChatApi {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  sessionReady: boolean;
  conversationId: string | null;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

export function useChat(opts: UseChatOptions = {}): UseChatApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const lastLanguage = useRef<string | null>(null);

  // Initialise session on mount, and re-init when language changes
  useEffect(() => {
    if (opts.enabled === false) return;
    if (lastLanguage.current === (opts.language ?? 'fr')) return;
    lastLanguage.current = opts.language ?? 'fr';

    const existing = storageGet(STORAGE_KEY);
    const parsed = existing
      ? (JSON.parse(existing) as { session_id?: string; conversation_id?: string; language?: string })
      : null;

    // If we already have a session for this language, resume it without hitting the API.
    // This avoids burning the 20 req/hr rate-limit on every page navigation or remount.
    if (parsed?.session_id && parsed?.conversation_id && parsed?.language === (opts.language ?? 'fr')) {
      setSessionId(parsed.session_id);
      setConversationId(parsed.conversation_id);
      return;
    }

    // Reset conversation state for the new language
    setMessages([]);
    setSessionId(null);
    setConversationId(null);

    fetch('/api/bot/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: parsed?.session_id,
        turnstile_token: opts.turnstileToken,
        language: opts.language,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`session ${r.status}`);
        return r.json() as Promise<{ session_id: string; conversation_id: string; language: string }>;
      })
      .then((data) => {
        setSessionId(data.session_id);
        setConversationId(data.conversation_id);
        storageSet(
          STORAGE_KEY,
          JSON.stringify({
            session_id: data.session_id,
            conversation_id: data.conversation_id,
            language: opts.language ?? 'fr',
          }),
        );
      })
      .catch((err) => {
        setError((err as Error).message);
      });
  }, [opts.enabled, opts.turnstileToken, opts.language]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !conversationId || !text.trim()) return;

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: text.trim(),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      setError(null);

      try {
        const res = await fetch('/api/bot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            conversation_id: conversationId,
            message: text.trim(),
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errBody.error ?? 'chat failed');
        }
        const data = (await res.json()) as { reply: string };
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: 'assistant',
            text: data.reply,
            createdAt: Date.now(),
          },
        ]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSending(false);
      }
    },
    [sessionId, conversationId],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    messages,
    sending,
    error,
    sessionReady: Boolean(sessionId && conversationId),
    conversationId,
    sendMessage,
    reset,
  };
}
