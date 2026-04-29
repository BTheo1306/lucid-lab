import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, ExternalLink, Sparkles, Trash2 } from 'lucide-react';
import { getCustomCampaign } from '@/lib/admin/lead-engine-sandbox';
import { LeadEngineHeader, LeadEngineTabs, Section, StatusBadge } from '../../../components';
import { discardCustomCampaignAction, saveCustomCampaignSelectionAction } from '../../../actions';

export const dynamic = 'force-dynamic';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewCustomCampaignPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const campaign = await getCustomCampaign(id);
  if (!campaign) notFound();

  const isSaved = campaign.status === 'saved';

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title={campaign.name}
        description="Review the AI-generated candidates and the custom outreach drafts. Pick the ones you want to keep, then save them as prospects."
        icon={Sparkles}
      />

      <LeadEngineTabs active="campaigns" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-950">Target prompt</h2>
              <StatusBadge tone={isSaved ? 'good' : 'warning'}>{campaign.status.replace('_', ' ')}</StatusBadge>
              <StatusBadge>{campaign.language === 'fr' ? 'FR' : 'EN'}</StatusBadge>
            </div>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-zinc-600">{campaign.prompt}</p>
          </div>
          {!isSaved ? (
            <form action={discardCustomCampaignAction}>
              <input type="hidden" name="campaign_id" value={campaign.id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="size-4" />Discard campaign
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <Section
        title={isSaved ? 'Saved prospects' : 'Select prospects to save'}
        description={
          isSaved
            ? 'These prospects have been added to the Lead Engine. Drafts are ready in the Outreach tab.'
            : 'Tick the prospects you want to keep, then save the selection. Unselected ones are discarded.'
        }
      >
        {campaign.candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">No candidates were generated for this campaign.</p>
        ) : (
          <form action={saveCustomCampaignSelectionAction} className="grid gap-4">
            <input type="hidden" name="campaign_id" value={campaign.id} />

            <div className="grid gap-3">
              {campaign.candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="grid cursor-pointer gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-start gap-3">
                    {!isSaved ? (
                      <input
                        type="checkbox"
                        name="candidate_id"
                        value={candidate.id}
                        defaultChecked
                        className="mt-1 size-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-500"
                      />
                    ) : null}
                    <div className="grid flex-1 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-950">{candidate.companyName}</p>
                        <StatusBadge>{candidate.niche}</StatusBadge>
                        <StatusBadge tone="neutral">{candidate.city}, {candidate.country}</StatusBadge>
                        <StatusBadge tone="neutral">~{candidate.employeeCount} emp.</StatusBadge>
                      </div>
                      <p className="text-sm text-zinc-600">
                        {candidate.decisionMaker} · {candidate.decisionMakerTitle}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {candidate.websiteUrl ? (
                          <a
                            href={candidate.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 hover:bg-zinc-200"
                          >
                            Website <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                        {candidate.linkedinSearchUrl ? (
                          <a
                            href={candidate.linkedinSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 hover:bg-zinc-200"
                          >
                            Company LinkedIn <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                        {candidate.decisionMakerLinkedinUrl ? (
                          <a
                            href={candidate.decisionMakerLinkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100"
                          >
                            Person LinkedIn <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                        {candidate.decisionMakerEmail ? (
                          <a
                            href={`mailto:${candidate.decisionMakerEmail}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 hover:bg-emerald-100"
                          >
                            {candidate.decisionMakerEmail}
                          </a>
                        ) : null}
                        {candidate.decisionMakerPhone ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                            {candidate.decisionMakerPhone}
                          </span>
                        ) : null}
                      </div>
                      {candidate.whyFit.length > 0 ? (
                        <ul className="list-inside list-disc text-sm text-zinc-600">
                          {candidate.whyFit.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="rounded-lg bg-zinc-50 p-3">
                        <p className="text-xs font-medium uppercase text-zinc-500">Draft subject</p>
                        <p className="mt-1 text-sm font-medium text-zinc-950">{candidate.draftSubject}</p>
                        <p className="mt-3 text-xs font-medium uppercase text-zinc-500">Draft message</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">{candidate.draftBody}</p>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {!isSaved ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <CheckSquare className="size-4" />Save selected as prospects
                </button>
                <Link
                  href="/admin/lead-engine/campaigns"
                  className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Back to campaigns
                </Link>
              </div>
            ) : (
              <Link
                href="/admin/lead-engine/outreach"
                className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Open outreach drafts
              </Link>
            )}
          </form>
        )}
      </Section>
    </div>
  );
}
