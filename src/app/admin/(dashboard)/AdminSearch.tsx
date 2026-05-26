'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/admin/lucid-os/clients?q=${encodeURIComponent(value)}` : '/admin/lucid-os/clients');
  }

  return (
    <form onSubmit={submitSearch} className="hidden min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-500 md:flex md:w-[360px]">
      <Search className="size-4 shrink-0 text-zinc-600" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
        placeholder="Rechercher un client"
      />
    </form>
  );
}