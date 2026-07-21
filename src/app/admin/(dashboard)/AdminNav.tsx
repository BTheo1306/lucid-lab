'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Building2,
  CalendarClock,
  ChevronDown,
  Compass,
  FileText,
  FolderKanban,
  Globe2,
  History,
  Inbox,
  Megaphone,
  MessageSquare,
  MonitorCheck,
  Palette,
  Search,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  activePaths?: string[];
};

type NavSection = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  items: NavItem[];
};

const primaryItems: NavItem[] = [
  // activePaths [''] is the admin root: '' on the subdomain, '/admin' when
  // reached directly. pathIsActive resolves it against the base.
  { href: '/lucid-os', label: 'Tableau de bord', icon: BarChart3, exact: true, activePaths: [''] },
  { href: '/lucid-os/metrics', label: 'Métriques', icon: Activity },
  { href: '/lucid-os/inbox', label: 'Actions', icon: Inbox },
];

const navSections: NavSection[] = [
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    defaultOpen: true,
    items: [
      { href: '/lucid-os/clients', label: 'Fiches clients', icon: Building2 },
      { href: '/lucid-os/clients#prospects', label: 'Prospects', icon: Users },
    ],
  },
  {
    id: 'growth',
    label: 'Croissance',
    icon: Search,
    items: [
      { href: '/lead-engine', label: 'Moteur de leads', icon: Search, exact: true },
    ],
  },
  {
    id: 'delivery',
    label: 'Production',
    icon: FolderKanban,
    items: [
      { href: '/lucid-os/delivery/projects', label: 'Projets', icon: FolderKanban },
      { href: '/lucid-os/delivery/websites', label: 'Sites web', icon: Globe2 },
      { href: '/lucid-os/delivery/monitoring', label: 'Monitoring', icon: MonitorCheck },
    ],
  },
  {
    id: 'operations',
    label: 'Opérations',
    icon: Compass,
    items: [
      { href: '/conversations', label: 'Conversations bot', icon: MessageSquare, activePaths: ['/contacts'] },
      { href: '/bookings', label: 'Rendez-vous', icon: CalendarClock },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    items: [
      { href: '/lucid-os/agents', label: 'Agents', icon: Bot },
      { href: '/lucid-os/inbox', label: 'Validations', icon: Inbox },
    ],
  },
  {
    id: 'knowledge',
    label: 'Connaissance',
    icon: Brain,
    items: [
      { href: '/lucid-os/knowledge', label: 'Base de connaissance', icon: Brain },
    ],
  },
  {
    id: 'content',
    label: 'Contenu',
    icon: FileText,
    items: [
      { href: '/blog', label: 'Blog', icon: FileText },
      { href: '/lucid-os/social', label: 'LinkedIn', icon: Megaphone },
      { href: '/brand', label: 'Charte graphique', icon: Palette },
    ],
  },
  {
    id: 'system',
    label: 'Système',
    icon: History,
    items: [
      { href: '/lucid-os/system/audit', label: 'Journal d’audit', icon: History },
    ],
  },
];

// `base` is '' on the admin subdomain and '/admin' when the routes are reached
// directly (localhost, Vercel previews). Nav hrefs are stored without it, so
// both the link and the active check resolve against the same space as
// `usePathname()`, which always reports the browser-visible path.
function pathIsActive(pathname: string, item: NavItem, base: string): boolean {
  const candidates = [item.href.split('#')[0], ...(item.activePaths ?? [])];

  return candidates.some((candidate) => {
    // `|| '/'` covers the admin root: base '' + candidate '' is an empty string,
    // but the browser reports '/'.
    const target = `${base}${candidate}` || '/';
    if (item.exact) return pathname === target;
    return pathname === target || pathname.startsWith(`${target}/`);
  });
}

function NavLink({ item, active, base }: { item: NavItem; active: boolean; base: string }) {
  const Icon = item.icon;

  return (
    <Link
      href={`${base}${item.href}`}
      className={cn(
        'group flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-[#17171a] text-zinc-50 ring-1 ring-white/10'
          : 'text-zinc-500 hover:bg-[#121215] hover:text-zinc-100',
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', active ? 'text-[#60a5fa]' : 'text-zinc-600 group-hover:text-zinc-300')} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AdminNav({ base }: { base: string }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(sectionId: string) {
    setOpenGroups((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? navSections.find((section) => section.id === sectionId)?.defaultOpen ?? false),
    }));
  }

  return (
    <nav className="mt-7 grid gap-6 text-sm">
      <div className="grid gap-1">
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} base={base} active={pathIsActive(pathname, item, base)} />
        ))}
      </div>

      <div className="grid gap-4">
        {navSections.map((section) => {
          const SectionIcon = section.icon;
          const sectionIsActive = section.items.some((item) => pathIsActive(pathname, item, base));
          const sectionIsOpen = sectionIsActive || (openGroups[section.id] ?? section.defaultOpen ?? false);

          return (
            <div key={section.id} className="grid gap-1">
              <button
                type="button"
                onClick={() => toggleGroup(section.id)}
                className={cn(
                  'flex h-7 items-center justify-between gap-2 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
                  sectionIsActive ? 'text-zinc-200' : 'text-zinc-600 hover:bg-[#101013] hover:text-zinc-300',
                )}
                aria-expanded={sectionIsOpen}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <SectionIcon className="size-3 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </span>
                <ChevronDown className={cn('size-3 shrink-0 transition-transform', sectionIsOpen && 'rotate-180')} />
              </button>

              {sectionIsOpen ? (
                <div className="grid gap-1">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} base={base} active={pathIsActive(pathname, item, base)} />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
