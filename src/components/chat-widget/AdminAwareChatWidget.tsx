'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

export function AdminAwareChatWidget({ lang }: { lang: 'fr' | 'en' }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) return null;

  return <ChatWidget lang={lang} />;
}