'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useChat } from './useChat';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';

const TEASER_DELAY_MS = 4000;
const TEASER_DISMISS_KEY = 'll-chat-teaser-dismissed';
const TEASER_TEXT = 'Bonjour \u{1F44B} Une question sur Lucid-Lab\u00A0? Je suis là pour y répondre.';

/**
 * Lucid-Lab chat widget — floating bubble bottom-right.
 * Mount once in app/layout.tsx via next/dynamic({ ssr: false }).
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const { messages, sending, error, sessionReady, sendMessage } = useChat({ language: 'fr' });

  // Show the teaser bubble after a delay, unless the user has already dismissed it this session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(TEASER_DISMISS_KEY) === '1') return;
    const t = window.setTimeout(() => setTeaserVisible(true), TEASER_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const dismissTeaser = () => {
    setTeaserVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TEASER_DISMISS_KEY, '1');
    }
  };

  const handleToggle = () => {
    dismissTeaser();
    setOpen((o) => !o);
  };

  return (
    <>
      <style>{widgetStyles}</style>

      {teaserVisible && !open ? (
        <div className="ll-chat-teaser" role="status">
          <button
            type="button"
            className="ll-chat-teaser-close"
            aria-label="Fermer le message"
            onClick={(e) => {
              e.stopPropagation();
              dismissTeaser();
            }}
          >
            ✕
          </button>
          <button
            type="button"
            className="ll-chat-teaser-body"
            onClick={handleToggle}
          >
            {TEASER_TEXT}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={`ll-chat-toggle${teaserVisible && !open ? ' ll-chat-toggle-pulse' : ''}`}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        onClick={handleToggle}
      >
        {open ? (
          <span className="ll-chat-toggle-close">✕</span>
        ) : (
          <Image
            src="/robot-head.png"
            alt=""
            width={64}
            height={64}
            className="ll-chat-toggle-img"
            priority
          />
        )}
      </button>

      {open ? (
        <div className="ll-chat-panel" role="dialog" aria-label="Assistant Lucid-Lab">
          <header className="ll-chat-header">
            <div>
              <strong>Lucid-Lab</strong>
              <span className="ll-chat-sub">Assistant IA</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
              ✕
            </button>
          </header>
          <MessageList messages={messages} sending={sending} />
          {error ? <div className="ll-chat-error">⚠ {error}</div> : null}
          <InputBox disabled={!sessionReady || sending} onSend={sendMessage} />
          <footer className="ll-chat-footer">
            Powered by Lucid-Lab · <a href="/mentions-legales">Mentions légales</a>
          </footer>
        </div>
      ) : null}
    </>
  );
}

const widgetStyles = `
.ll-chat-toggle {
  position: fixed; bottom: 20px; right: 20px; z-index: 9999;
  width: 64px; height: 64px; border-radius: 50%; border: none;
  background: #0a0a0a; color: #fff; cursor: pointer;
  box-shadow: 0 6px 24px rgba(0,0,0,0.28);
  padding: 0; overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ll-chat-toggle:hover { transform: scale(1.06); box-shadow: 0 10px 32px rgba(0,0,0,0.35); }
.ll-chat-toggle:focus-visible { outline: 2px solid #6366f1; outline-offset: 3px; }
.ll-chat-toggle-img {
  width: 100%; height: 100%; object-fit: cover; object-position: center 30%;
  display: block;
}
.ll-chat-toggle-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; font-size: 22px; color: #fff;
}
.ll-chat-toggle-pulse {
  animation: ll-toggle-pulse 2s ease-in-out infinite;
}
@keyframes ll-toggle-pulse {
  0%, 100% { box-shadow: 0 6px 24px rgba(0,0,0,0.28), 0 0 0 0 rgba(99,102,241,0.5); }
  50%      { box-shadow: 0 6px 24px rgba(0,0,0,0.28), 0 0 0 14px rgba(99,102,241,0); }
}

.ll-chat-teaser {
  position: fixed; bottom: 96px; right: 20px; z-index: 9998;
  max-width: min(300px, calc(100vw - 40px));
  background: #fff; color: #222;
  border: 1px solid #eaeaea; border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13.5px; line-height: 1.45;
  animation: ll-teaser-in 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}
.ll-chat-teaser::after {
  content: ''; position: absolute; bottom: -6px; right: 26px;
  width: 12px; height: 12px; background: #fff;
  border-right: 1px solid #eaeaea; border-bottom: 1px solid #eaeaea;
  transform: rotate(45deg);
}
.ll-chat-teaser-body {
  display: block; width: 100%; padding: 14px 36px 14px 16px;
  background: none; border: none; text-align: left; cursor: pointer;
  color: inherit; font: inherit;
  border-radius: 16px;
}
.ll-chat-teaser-body:hover { background: #fafafa; }
.ll-chat-teaser-close {
  position: absolute; top: 6px; right: 8px; z-index: 1;
  width: 24px; height: 24px; border: none; background: transparent;
  color: #888; font-size: 14px; cursor: pointer; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
}
.ll-chat-teaser-close:hover { background: #f0f0f0; color: #333; }
@keyframes ll-teaser-in {
  0%   { opacity: 0; transform: translateY(8px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .ll-chat-teaser { animation: none; }
  .ll-chat-toggle-pulse { animation: none; }
}

.ll-chat-panel {
  position: fixed; bottom: 90px; right: 20px; z-index: 9999;
  width: min(380px, calc(100vw - 40px));
  height: min(600px, calc(100vh - 120px));
  background: #fff; border: 1px solid #e5e5e5; border-radius: 16px;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 48px rgba(0,0,0,0.18);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}
.ll-chat-header {
  padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
  display: flex; align-items: center; justify-content: space-between;
  background: #fafafa;
}
.ll-chat-header strong { display: block; font-size: 14px; color: #0a0a0a; }
.ll-chat-header .ll-chat-sub { font-size: 11px; color: #777; }
.ll-chat-header button { background: none; border: none; font-size: 18px; cursor: pointer; color: #666; }

.ll-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.ll-chat-welcome { padding: 12px 14px; background: #f6f6f6; border-radius: 10px; font-size: 13px; color: #333; }
.ll-chat-welcome p { margin: 4px 0 0; }

.ll-chat-msg { display: flex; }
.ll-chat-msg-user { justify-content: flex-end; }
.ll-chat-msg-assistant { justify-content: flex-start; }
.ll-chat-bubble {
  max-width: 85%; padding: 9px 12px; border-radius: 14px;
  font-size: 14px; line-height: 1.45;
}
.ll-chat-msg-user .ll-chat-bubble { background: #0a0a0a; color: #fff; border-bottom-right-radius: 4px; }
.ll-chat-msg-assistant .ll-chat-bubble { background: #f1f1f1; color: #222; border-bottom-left-radius: 4px; }
.ll-chat-bubble p { margin: 0; }
.ll-chat-bubble p + p { margin-top: 6px; }
.ll-chat-bubble a { color: inherit; text-decoration: underline; }

.ll-chat-typing { display: inline-flex; gap: 4px; padding: 11px 14px; }
.ll-chat-typing span {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #888; animation: ll-blink 1.2s infinite;
}
.ll-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.ll-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ll-blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

.ll-chat-error { padding: 8px 16px; background: #fff4f4; color: #b00020; font-size: 12px; border-top: 1px solid #f4d4d4; }

.ll-chat-input {
  display: flex; gap: 8px; padding: 10px; border-top: 1px solid #f0f0f0; background: #fff;
}
.ll-chat-input textarea {
  flex: 1; border: 1px solid #e5e5e5; border-radius: 10px; padding: 8px 10px;
  font-family: inherit; font-size: 14px; resize: none; max-height: 100px;
}
.ll-chat-input textarea:focus { outline: none; border-color: #0a0a0a; }
.ll-chat-input button {
  border: none; background: #0a0a0a; color: #fff; border-radius: 10px;
  width: 42px; cursor: pointer; font-size: 16px;
}
.ll-chat-input button:disabled { background: #bbb; cursor: default; }

.ll-chat-footer { padding: 8px 12px; font-size: 11px; color: #888; text-align: center; background: #fafafa; border-top: 1px solid #f0f0f0; }
.ll-chat-footer a { color: #555; }
`;
