'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  href: string;
  label: string;
}

/**
 * Plain anchors on purpose: the portal subdomain is served through a proxy
 * rewrite that the Next client router cannot see, so client-side navigation
 * would resolve against the internal route tree. Full navigations are always
 * rewritten correctly. The browser pathname is '/x' on the subdomain and
 * '/portal/x' on direct access: normalize before computing the active tab.
 */
export function PortalNav({ items, base }: { items: PortalNavItem[]; base: string }) {
  const pathname = usePathname();
  const current = pathname.startsWith('/portal')
    ? pathname.slice('/portal'.length) || '/'
    : pathname;

  return (
    <nav className="mx-auto w-full max-w-5xl overflow-x-auto px-5">
      <div className="flex gap-1 pb-2.5">
        {items.map((item) => {
          const active = item.href === '/' ? current === '/' : current.startsWith(item.href);
          const href = item.href === '/' ? base || '/' : `${base}${item.href}`;
          return (
            <a
              key={item.href}
              href={href}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-950',
              )}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
