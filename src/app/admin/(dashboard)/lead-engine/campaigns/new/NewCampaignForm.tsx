'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import { createCustomCampaignAction, type CreateCustomCampaignState } from '../../actions';

const initialState: CreateCustomCampaignState = { status: 'idle' };

const examplePrompt = `Cabinets de courtage en assurance francais (10-50 employes) qui gerent beaucoup de demandes entrantes par formulaire web et email. Cible : courtiers IARD ou sante en region parisienne ou Lyon. Probleme probable a resoudre : qualifier et router les demandes entrantes 24/7 sans embaucher.`;

export function NewCampaignForm() {
  const [state, formAction, pending] = useActionState(createCustomCampaignAction, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="campaign-name" className="text-sm font-medium text-zinc-950">
          Campaign name
        </label>
        <input
          id="campaign-name"
          name="name"
          required
          minLength={3}
          maxLength={80}
          placeholder="French insurance brokers - inbound automation"
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="campaign-prompt" className="text-sm font-medium text-zinc-950">
          Who do you want to target?
        </label>
        <p className="text-xs text-zinc-500">
          Describe the ICP in plain language: industry, geography, size, signals, the kind of automation problem they probably have.
          The AI uses this to find real companies that would plausibly hire Lucid-Lab as an AI agency.
        </p>
        <textarea
          id="campaign-prompt"
          name="prompt"
          required
          minLength={20}
          rows={8}
          defaultValue=""
          placeholder={examplePrompt}
          className="rounded-lg border border-zinc-200 bg-white p-3 text-sm leading-6 shadow-sm focus:border-zinc-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="campaign-language" className="text-sm font-medium text-zinc-950">
            Outreach language
          </label>
          <select
            id="campaign-language"
            name="language"
            defaultValue="fr"
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm"
          >
            <option value="fr">Francais</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="campaign-count" className="text-sm font-medium text-zinc-950">
            How many prospects?
          </label>
          <input
            id="campaign-count"
            name="count"
            type="number"
            min={1}
            max={10}
            defaultValue={5}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm shadow-sm"
          />
          <p className="text-xs text-zinc-500">Between 1 and 10. You can review and select before saving.</p>
        </div>
      </div>

      {state.status === 'error' && state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? 'Generating candidates...' : 'Generate prospects with AI'}
        </button>
        <Link
          href="/admin/lead-engine/campaigns"
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
