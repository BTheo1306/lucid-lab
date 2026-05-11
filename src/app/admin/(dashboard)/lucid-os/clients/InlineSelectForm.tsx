'use client';

import { useTransition } from 'react';

export function InlineSelectForm({
  action,
  name,
  defaultValue,
  options,
  clientArgs,
}: {
  action: (formData: FormData) => void;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  clientArgs: { id: string; slug: string };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      className="w-full"
    >
      <input type="hidden" name="client_id" value={clientArgs.id} />
      <input type="hidden" name="client_slug" value={clientArgs.slug} />
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-sm font-medium text-zinc-950 focus:border-zinc-400 focus:ring-zinc-100 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}