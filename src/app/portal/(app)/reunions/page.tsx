import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { requirePortalUser } from '@/lib/portal/auth';
import { listPortalMeetings } from '@/lib/portal/data';
import { portalStrings } from '@/lib/portal/strings';
import { PortalCard, PortalEmptyState, PortalPageHeader, formatPortalDate } from '../../components';

export const metadata: Metadata = {
  title: 'Réunions',
};

export default async function PortalMeetingsPage() {
  const session = await requirePortalUser();
  const meetings = await listPortalMeetings(session);
  const s = portalStrings.meetings;

  return (
    <div>
      <PortalPageHeader
        title={portalStrings.nav.meetings}
        description="Le compte rendu de chaque échange avec l'équipe Lucid-Lab : réunions, appels, décisions et points de livraison."
      />

      {meetings.length === 0 ? (
        <PortalEmptyState message={s.empty} />
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <PortalCard key={meeting.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <CalendarDays className="size-3.5" />
                <span>
                  {meeting.kind} du {formatPortalDate(meeting.occurredAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-950">
                {meeting.title.replace(/^Réunion\s*:\s*/, '')}
              </p>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-zinc-600">
                {meeting.clientSummary}
              </p>
              {meeting.nextStep ? (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    {portalStrings.home.nextStep}
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">{meeting.nextStep}</p>
                  {meeting.nextStepDueAt ? (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {portalStrings.home.nextStepDue} {formatPortalDate(meeting.nextStepDueAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
