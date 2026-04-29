'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

type Lang = 'fr' | 'en';

const COPY = {
  fr: { placeholder: 'Votre message…', label: 'Message', send: 'Envoyer' },
  en: { placeholder: 'Your message…', label: 'Message', send: 'Send' },
} as const;

export function InputBox({
  disabled,
  onSend,
  lang = 'fr',
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  lang?: Lang;
}) {
  const t = COPY[lang];
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue('');
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e as unknown as FormEvent);
    }
  };

  return (
    <form className="ll-chat-input" onSubmit={submit}>
      <textarea
        value={value}
        disabled={disabled}
        placeholder={t.placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        rows={1}
        aria-label={t.label}
      />
      <button type="submit" disabled={disabled || !value.trim()} aria-label={t.send}>
        ➤
      </button>
    </form>
  );
}
