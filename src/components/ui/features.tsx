'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AiArchitecture } from '@/components/ui/ai-architecture'
import { Shield, Users, MessageSquare, Globe, Workflow, Share2 } from 'lucide-react'

export function Features() {
  return (
    <section id="solutions" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative">
          <div className="relative z-10 grid grid-cols-6 gap-3">
            {/* Card 1 — AI Architecture chip */}
            <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
              <CardContent className="relative m-auto size-fit pt-6">
                <div className="relative flex h-24 w-56 items-center">
                  <AiArchitecture />
                </div>
                <h2 className="mt-6 text-center text-3xl font-semibold">IA sur-mesure</h2>
              </CardContent>
            </Card>

            {/* Card 2 — WhatsApp / Chatbots */}
            <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="relative mx-auto flex aspect-square size-32 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                  <MessageSquare className="m-auto size-12 text-muted-foreground" strokeWidth={1} />
                </div>
                <div className="relative z-10 mt-6 space-y-2 text-center">
                  <h2 className="text-lg font-medium transition">Chatbots automatisés</h2>
                  <p className="text-foreground">WhatsApp Business, Messenger, chat web — vos clients reçoivent des réponses instantanées 24/7 sans intervention humaine.</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 — Workflows & Automations (chart-like visual) */}
            <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="pt-6 lg:px-6">
                  <svg className="dark:text-muted-foreground w-full" viewBox="0 0 386 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="386" height="123" rx="10" />
                    <g clipPath="url(#clip0_feat)">
                      <circle className="text-muted-foreground dark:text-muted" cx="29" cy="29" r="15" fill="currentColor" />
                      <path d="M29 23V35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M35 29L29 35L23 29" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path
                        d="M55.2373 32H58.7988C61.7383 32 63.4404 30.1816 63.4404 27.0508V27.0371C63.4404 23.9404 61.7246 22.1357 58.7988 22.1357H55.2373V32ZM56.7686 30.6807V23.4551H58.6279C60.6719 23.4551 61.8818 24.7881 61.8818 27.0576V27.0713C61.8818 29.3613 60.6924 30.6807 58.6279 30.6807H56.7686Z"
                        fill="currentColor"
                      />
                    </g>
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3 123C3 123 14.3298 94.153 35.1282 88.0957C55.9266 82.0384 65.9333 80.5508 65.9333 80.5508C65.9333 80.5508 80.699 80.5508 92.1777 80.5508C103.656 80.5508 100.887 63.5348 109.06 63.5348C117.233 63.5348 117.217 91.9728 124.78 91.9728C132.343 91.9728 142.264 78.03 153.831 80.5508C165.398 83.0716 186.825 91.9728 193.761 91.9728C200.697 91.9728 206.296 63.5348 214.07 63.5348C221.844 63.5348 238.653 93.7771 244.234 91.9728C249.814 90.1684 258.8 60 266.19 60C272.075 60 284.1 88.057 286.678 88.0957C294.762 88.2171 300.192 72.9284 305.423 72.9284C312.323 72.9284 323.377 65.2437 335.553 63.5348C347.729 61.8259 348.218 82.07 363.639 80.5508C367.875 80.1335 372.949 82.2017 376.437 87.1008C379.446 91.3274 381.054 97.4325 382.521 104.647C383.479 109.364 382.521 123 382.521 123"
                      fill="url(#paint0_feat)"
                    />
                    <path
                      className="text-primary-600 dark:text-primary-500"
                      d="M3 121.077C3 121.077 15.3041 93.6691 36.0195 87.756C56.7349 81.8429 66.6632 80.9723 66.6632 80.9723C66.6632 80.9723 80.0327 80.9723 91.4656 80.9723C102.898 80.9723 100.415 64.2824 108.556 64.2824C116.696 64.2824 117.693 92.1332 125.226 92.1332C132.759 92.1332 142.07 78.5115 153.591 80.9723C165.113 83.433 186.092 92.1332 193 92.1332C199.908 92.1332 205.274 64.2824 213.017 64.2824C220.76 64.2824 237.832 93.8946 243.39 92.1332C248.948 90.3718 257.923 60.5 265.284 60.5C271.145 60.5 283.204 87.7182 285.772 87.756C293.823 87.8746 299.2 73.0802 304.411 73.0802C311.283 73.0802 321.425 65.9506 333.552 64.2824C345.68 62.6141 346.91 82.4553 362.27 80.9723C377.629 79.4892 383 106.605 383 106.605"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <defs>
                      <linearGradient id="paint0_feat" x1="3" y1="60" x2="3" y2="123" gradientUnits="userSpaceOnUse">
                        <stop className="text-primary/15 dark:text-primary/35" stopColor="currentColor" />
                        <stop className="text-transparent" offset="1" stopColor="currentColor" stopOpacity="0.103775" />
                      </linearGradient>
                      <clipPath id="clip0_feat">
                        <rect width="358" height="30" fill="white" transform="translate(14 14)" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div className="relative z-10 mt-14 space-y-2 text-center">
                  <h2 className="text-lg font-medium transition">ROI mesurable</h2>
                  <p className="text-foreground">Chaque automatisation est trackée. Vous voyez en temps réel l&apos;impact sur vos coûts, leads et conversions.</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 4 — n8n / Slack / Workflows — wide left */}
            <Card className="relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                    <Workflow className="m-auto size-5" strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium transition">Automatisation n8n</h2>
                    <p className="text-foreground">Slack, CRM, ERP, e-commerce — on connecte tous vos outils dans des workflows intelligents qui tournent en continu.</p>
                  </div>
                </div>
                <div className="rounded-tl-(--radius) relative -mb-6 -mr-6 mt-6 h-fit border-l border-t p-6 py-6 sm:ml-6">
                  <div className="absolute left-3 top-2 flex gap-1">
                    <span className="block size-2 rounded-full border dark:border-white/10 dark:bg-white/10"></span>
                    <span className="block size-2 rounded-full border dark:border-white/10 dark:bg-white/10"></span>
                    <span className="block size-2 rounded-full border dark:border-white/10 dark:bg-white/10"></span>
                  </div>
                  {/* Workflow visual — tool logos grid */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { name: 'WhatsApp', icon: MessageSquare },
                      { name: 'Slack', icon: Share2 },
                      { name: 'Meta', icon: Globe },
                      { name: 'n8n', icon: Workflow },
                      { name: 'CRM', icon: Users },
                      { name: 'API', icon: Shield },
                    ].map((tool) => (
                      <div key={tool.name} className="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/50 p-3 text-center">
                        <tool.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-[10px] font-medium text-muted-foreground">{tool.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5 — Meta Business / Sites web — wide right */}
            <Card className="relative col-span-full overflow-hidden lg:col-span-3">
              <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                  <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                    <Globe className="m-auto size-6" strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium transition">Sites web & landing pages</h2>
                    <p className="text-foreground">Sites de conversion, funnels, landing pages avec IA intégrée — optimisés pour capturer et qualifier vos prospects.</p>
                  </div>
                </div>
                <div className="before:bg-(--color-border) relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6">
                  <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                    <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                      <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">WhatsApp</span>
                      <div className="ring-background flex size-7 items-center justify-center rounded-full bg-muted ring-4">
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                      <div className="ring-background flex size-8 items-center justify-center rounded-full bg-muted ring-4">
                        <Share2 className="size-4 text-muted-foreground" />
                      </div>
                      <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">Meta Ads</span>
                    </div>
                    <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                      <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">Slack</span>
                      <div className="ring-background flex size-7 items-center justify-center rounded-full bg-muted ring-4">
                        <Shield className="size-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
