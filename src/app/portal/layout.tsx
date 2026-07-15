import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Portail client',
    template: '%s | Portail client Lucid-Lab',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal-root className="relative z-10 min-h-[100dvh] bg-[#F7F5F1] text-zinc-950">
      {/* The chat widget filters on the browser pathname, which stays '/x' on the
          portal subdomain: hide it here too, like the admin layout does. */}
      <style>{`.ll-chat-toggle,.ll-chat-panel,.ll-chat-teaser{display:none!important}`}</style>
      {children}
    </div>
  );
}
