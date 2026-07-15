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
        description="Le compte rendu de chaque réunion avec l'équipe Lucid-Lab : décisions et prochaines étapes."
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
                  {s.recordedOn} {formatPortalDate(meeting.occurredAt)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-950">
                {meeting.title.replace(/^Réunion\s*:\s*/, '')}
              </p>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-zinc-600">
                {meeting.clientSummary}
              </p>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
