import type { Metadata } from "next";

import { Header } from "@/components/ui/header";
import { MarketingFooter } from "@/components/marketing/HomePage";

export const metadata: Metadata = {
  title: { default: "Blog", template: "%s | Lucid-Lab" },
  description:
    "Real cases on automation and AI in SMEs. Strategies, costs, ROI. No slides, no fluff.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col min-h-screen bg-[#FDFDFB]">
      <Header />
      <div className="pt-[68px] grow">{children}</div>
      <MarketingFooter lang="en" />
    </div>
  );
}
