'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

export function AdminAwareChatWidget({ lang }: { lang: 'fr' | 'en' }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal') || pathname.startsWith('/demo')) return null;

  return <ChatWidget lang={lang} />;
}