import Link from 'next/link';
import { ArrowRight, FileText, MapPin, MessageSquare, Sparkles, Target, Users } from 'lucide-react';
import { getLeadEngineCampaignsPageData, type LeadEngineCampaignStatus } from '@/lib/admin/lead-engine';
import { listCustomCampaigns } from '@/lib/admin/lead-engine-sandbox';
import { runLeadEngineDryRunAction } from '../actions';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function PillList({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">{item}</span>
      ))}
    </div>
  );
}

function statusTone(status: LeadEngineCampaignStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'paused': return 'warning';
    case 'archived': return 'danger';
    default: return 'neutral';
  }
}

function formatDate(value: string): string {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function LeadEngineCampaignsPage() {
  const [{ campaigns, defaultCampaign }, customCampaigns] = await Promise.all([
    getLeadEngineCampaignsPageData(),
    listCustomCampaigns(),
  ]);

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="Campaigns"
        description="Campaigns define the ICP, geography, scoring rules, excluded niches, outreach sequence, and sender settings."
        icon={FileText}
      />

      <LeadEngineTabs active="campaigns" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-950">Start a new AI campaign</h2>
            <p className="mt-1 text-sm text-zinc-500">Describe the target you want to reach. The AI proposes real companies and personalized drafts. You review and pick before saving.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/lead-engine/campaigns/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Sparkles className="size-4" />Start a new campaign
            </Link>
            <form action={runLeadEngineDryRunAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Target className="size-4" />Run starter dry-run
              </button>
            </form>
          </div>
        </div>
      </section>

      <Section title="Your AI campaigns" description="Campaigns generated from a prompt. Pending ones are waiting for your review.">
        {customCampaigns.length === 0 ? (
          <EmptyState>No AI campaigns yet. Click &quot;Start a new campaign&quot; to describe a target and let the AI propose prospects.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {customCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/admin/lead-engine/campaigns/${campaign.id}/review`}
                className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950">{campaign.name}</h3>
                      <StatusBadge tone={campaign.status === 'saved' ? 'good' : 'warning'}>
                        {campaign.status === 'pending_review' ? 'pending review' : campaign.status}
                      </StatusBadge>
                      <StatusBadge>{campaign.language === 'fr' ? 'FR' : 'EN'}</StatusBadge>
                      <StatusBadge>{campaign.candidates.length} prospects</StatusBadge>
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-zinc-600">{campaign.prompt}</p>
                    <p className="mt-2 text-xs text-zinc-500">Created {formatDate(campaign.createdAt)}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-zinc-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Campaign queue" description="Saved campaigns will appear here once the database slice is added.">
        {campaigns.length === 0 ? (
          <EmptyState>No campaigns yet. Create a campaign with a target niche, geography, scoring rules, and outreach angle.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-zinc-950">{campaign.name}</h2>
                      <StatusBadge tone={statusTone(campaign.status)}>{campaign.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">Created {formatDate(campaign.createdAt)}. Ideal size {campaign.idealEmployeeMin}-{campaign.idealEmployeeMax} employees.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PillList items={campaign.targetNiches.slice(0, 5)} />
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500">{campaign.targetLocations.join(', ') || 'No geography set'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recommended starter campaign" description="Default campaign configuration from the Lead Engine plan.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950">{defaultCampaign.name}</h2>
              <StatusBadge>Draft template</StatusBadge>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950"><Target className="size-4 text-zinc-500" />Target niches</div>
                <div className="mt-3"><PillList items={defaultCampaign.targetNiches} /></div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950"><MapPin className="size-4 text-zinc-500" />Locations</div>
                <div className="mt-3"><PillList items={defaultCampaign.targetLocations} /></div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950"><Users className="size-4 text-zinc-500" />Company size</div>
                <p className="mt-3 text-sm text-zinc-600">Minimum {defaultCampaign.minEmployeeCount} employees. Ideal range {defaultCampaign.idealEmployeeMin}-{defaultCampaign.idealEmployeeMax} employees.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950"><MessageSquare className="size-4 text-zinc-500" />Message angles</div>
                <div className="mt-3"><PillList items={defaultCampaign.coreMessageAngles} /></div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-950">Commercial guardrails</p>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-zinc-600">
              <p>{defaultCampaign.cta}</p>
              <p>{defaultCampaign.auditOffer}</p>
              <p>{defaultCampaign.buildOffer}</p>
              <p>Proof point: {defaultCampaign.proofPoint}</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}