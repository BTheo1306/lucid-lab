import Link from 'next/link';
import { ArrowRight, CalendarClock, Mail } from 'lucide-react';
import { getAdminBookingsPageData } from '@/lib/admin/dashboard';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function formatDateTime(value: string | null): string {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'cancelled':
      return 'bg-zinc-100 text-zinc-600 ring-zinc-200';
    default:
      return 'bg-white text-zinc-700 ring-zinc-200';
  }
}

export default async function AdminBookingsPage() {
  const { bookings } = await getAdminBookingsPageData();

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Discovery calls</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">Bookings</h1>
            <p className="mt-2 text-sm text-zinc-500">The latest 100 TidyCal booking records.</p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        {bookings.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">No bookings yet.</div>
        ) : bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-950">{booking.name}</p>
                  <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(booking.status))}>
                    {booking.status}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                  <Mail className="size-4" />
                  {booking.email}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                  <CalendarClock className="size-4" />
                  {formatDateTime(booking.startsAt)} - {booking.timezone}
                </p>
              </div>
              {booking.contactId ? (
                <Link href={`/admin/contacts/${booking.contactId}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Open contact <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
