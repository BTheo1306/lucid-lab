'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarClock, FileText, MessageSquare, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/lead-engine', label: 'Lead Engine', icon: Search },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarClock },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-7 grid gap-1 text-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
              isActive ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
