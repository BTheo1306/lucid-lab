'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

export function InputBox({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
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
        placeholder="Votre message…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        rows={1}
        aria-label="Message"
      />
      <button type="submit" disabled={disabled || !value.trim()} aria-label="Envoyer">
        ➤
      </button>
    </form>
  );
}
