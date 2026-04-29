import type { Metadata } from "next";

import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  title: { default: "Blog", template: "%s | Lucid-Lab" },
  description:
    "Cas concrets d'automatisation et d'IA en PME. Stratégies, coûts, ROI. Pas de slide, pas de fluff.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-[68px]">{children}</div>
    </>
  );
}
