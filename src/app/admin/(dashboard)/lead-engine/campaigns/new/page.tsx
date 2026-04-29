import { Sparkles } from 'lucide-react';
import { LeadEngineHeader, LeadEngineTabs, Section } from '../../components';
import { NewCampaignForm } from './NewCampaignForm';

export const dynamic = 'force-dynamic';

export default function NewLeadEngineCampaignPage() {
  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="New AI campaign"
        description="Describe who you want to target. The AI proposes real companies that would plausibly hire Lucid-Lab as an AI agency, with a custom outreach draft per prospect. You review and pick before anything is saved."
        icon={Sparkles}
      />

      <LeadEngineTabs active="campaigns" />

      <Section title="Define your target" description="One prompt, one campaign. The richer your description, the better the candidates.">
        <NewCampaignForm />
      </Section>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600 shadow-sm">
        <p className="font-medium text-zinc-950">Tips for a good prompt</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Be specific about industry vertical and geography (city or region).</li>
          <li>Add a size hint (e.g. 10-100 employees) so the AI does not propose enterprises.</li>
          <li>Mention the automation angle (inbound qualification, support, internal copilot, voice agent...).</li>
          <li>Exclude what you do NOT want (e.g. &quot;no marketplaces, no agencies&quot;).</li>
        </ul>
      </div>
    </div>
  );
}
