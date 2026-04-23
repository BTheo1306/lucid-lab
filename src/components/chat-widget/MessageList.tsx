'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from './useChat';

export function MessageList({
  messages,
  sending,
}: {
  messages: ChatMessage[];
  sending: boolean;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div className="ll-chat-messages">
      {messages.length === 0 && !sending ? (
        <div className="ll-chat-welcome">
          <strong>Bonjour 👋</strong>
          <p>Posez une question sur nos services, notre méthode, ou demandez un RDV découverte.</p>
        </div>
      ) : null}

      {messages.map((m) => (
        <div
          key={m.id}
          className={`ll-chat-msg ll-chat-msg-${m.role}`}
        >
          <div className="ll-chat-bubble">
            <ReactMarkdown>{m.text}</ReactMarkdown>
          </div>
        </div>
      ))}

      {sending ? (
        <div className="ll-chat-msg ll-chat-msg-assistant">
          <div className="ll-chat-bubble ll-chat-typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}
