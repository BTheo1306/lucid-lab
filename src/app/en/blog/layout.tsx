import type { Metadata } from "next";

import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  title: { default: "Blog", template: "%s | Lucid-Lab" },
  description:
    "Real cases on automation and AI in SMEs. Strategies, costs, ROI. No slides, no fluff.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-[68px]">{children}</div>
    </>
  );
}
