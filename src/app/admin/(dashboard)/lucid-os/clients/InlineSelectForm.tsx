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
        className="h-8 w-full rounded border border-white/10 bg-[#050506] px-2 text-sm font-medium text-zinc-100 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-50"
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