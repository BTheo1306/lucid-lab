'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

export function AdminAwareChatWidget({ lang }: { lang: 'fr' | 'en' }) {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return <ChatWidget lang={lang} />;
}