import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Lucid-Lab's privacy policy — how we handle your personal data.",
}

export default function Privacy() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/en"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Back
      </Link>

      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-zinc-900">
        Privacy Policy
      </h1>
      <p className="mb-10 text-[13px] text-zinc-400">Last updated: April 2026</p>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900">
        <h2>Data controller</h2>
        <p>
          <strong>Lucid-Lab</strong>, Paris, France<br />
          Email: <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>
        </p>

        <h2>Data collected</h2>
        <p>
          When you visit the site or get in touch with us, we may collect:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>First name, last name, email address (contact form / booking)</li>
          <li>Information about your company and your project</li>
          <li>Browsing data: pages visited, session duration (via anonymised analytics)</li>
        </ul>

        <h2>Purposes of processing</h2>
        <p>Your data is used to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Respond to your requests and schedule meetings</li>
          <li>Improve our services and the website's content</li>
          <li>Send you information about our services (with your consent)</li>
        </ul>

        <h2>Legal basis</h2>
        <p>
          Processing is based on your consent and on Lucid-Lab's legitimate interest in
          developing its commercial activity.
        </p>

        <h2>Retention period</h2>
        <p>
          Your data is retained for 3 years from the last contact, unless a longer legal
          retention obligation applies.
        </p>

        <h2>Data sharing</h2>
        <p>
          Lucid-Lab does not sell or rent your personal data. It may be shared with
          technical processors (hosting, CRM, scheduling tool) in compliance with the GDPR.
        </p>

        <h2>Your rights</h2>
        <p>
          In accordance with the GDPR and the French Data Protection Act, you have a right
          of access, rectification, erasure, portability and objection regarding your data.
          To exercise these rights, contact us at{" "}
          <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">
            info@lucid-lab.fr
          </a>.
        </p>
        <p>
          You also have the right to lodge a complaint with the{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2">
            CNIL
          </a>.
        </p>

        <h2>Cookies</h2>
        <p>
          This site uses functional cookies necessary for its proper operation.
          No advertising or third-party tracking cookies are used without your consent.
        </p>
      </div>
    </main>
  )
}
