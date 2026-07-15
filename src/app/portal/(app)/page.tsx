import { requirePortalUser } from '@/lib/portal/auth';
import { portalStrings } from '@/lib/portal/strings';
import { PortalCard } from '../components';

export default async function PortalHomePage() {
  const session = await requirePortalUser();
  const s = portalStrings.home;
  const firstName = session.contactName.split(' ')[0] || session.contactName;

  return (
    <div>
      <h1
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-syne), sans-serif' }}
      >
        {s.greeting} {firstName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{s.intro}</p>

      <div className="mt-8">
        <PortalCard>
          <p className="text-sm text-zinc-600">{s.nothingOpen}</p>
        </PortalCard>
      </div>
    </div>
  );
}
