'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './useChat';

const TIDYCAL_RE = /https?:\/\/tidycal\.com\/[^\s)>\]"'*]*/g;
// Also strip surrounding markdown bold/italic markers left behind after URL removal
const ORPHAN_MD_RE = /\*{1,2}\s*\*{1,2}/g;

function extractBookingUrls(text: string): { bookingUrls: string[]; cleanText: string } {
  const bookingUrls: string[] = [];
  const cleanText = text
    // strip [label](tidycal-url) or bare tidycal URLs, capture the URL
    .replace(/\[([^\]]+)\]\((https?:\/\/tidycal\.com\/[^)]+)\)/g, (_m, _label, url) => {
      bookingUrls.push(url);
      return '';
    })
    .replace(TIDYCAL_RE, (url) => {
      bookingUrls.push(url);
      return '';
    })
    // clean up orphan bold/italic markers
    .replace(ORPHAN_MD_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { bookingUrls: [...new Set(bookingUrls)], cleanText };
}

const QUICK_CHIPS = [
  { label: '📅 Réserver l\'audit gratuit', text: 'Je voudrais réserver un audit gratuit.' },
  { label: '⚙️ J\'ai un process à automatiser', text: 'J\'ai un process manuel que je veux automatiser.' },
  { label: '🔍 Vos services en 2 min', text: 'Pouvez-vous me présenter vos services rapidement ?' },
];

export function MessageList({
  messages,
  sending,
  onChipClick,
}: {
  messages: ChatMessage[];
  sending: boolean;
  onChipClick?: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div className="ll-chat-messages">
      {messages.length === 0 && !sending ? (
        <>
          <div className="ll-chat-welcome">
            <strong>Bonjour</strong>
            <p>Posez une question sur nos services, notre méthode, ou demandez un RDV découverte.</p>
          </div>
          {onChipClick ? (
            <div className="ll-chat-chips">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.text}
                  type="button"
                  className="ll-chat-chip"
                  onClick={() => onChipClick(chip.text)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {messages.map((m) => {
        const { bookingUrls, cleanText } =
          m.role === 'assistant' ? extractBookingUrls(m.text) : { bookingUrls: [], cleanText: m.text };
        return (
          <div
            key={m.id}
            className={`ll-chat-msg ll-chat-msg-${m.role}`}
          >
            <div className="ll-chat-bubble-wrap">
              <div className="ll-chat-bubble">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {cleanText}
                </ReactMarkdown>
              </div>
              {bookingUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ll-chat-booking-btn"
                >
                  <span className="ll-chat-booking-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <span className="ll-chat-booking-text">
                    <strong>Réserver mon audit gratuit</strong>
                    <span>30 min &bull; Appel découverte</span>
                  </span>
                  <span className="ll-chat-booking-arrow">→</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}

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
