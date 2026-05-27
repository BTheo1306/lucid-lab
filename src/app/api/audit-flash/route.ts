import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createContact } from '@/lib/bot/db/queries/contacts'
import { syncAuditFlashProspect } from '@/lib/bot/db/queries/lead-engine-prospects'
import { createLead } from '@/lib/bot/db/queries/leads'
import { sendTeamLeadNotification } from '@/lib/bot/integrations/email-client'
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check'
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter'
import { hashIp } from '@/lib/bot/utils/crypto'
import { getClientIp } from '@/lib/bot/utils/request'

export const runtime = 'nodejs'
export const maxDuration = 15

const schema = z.object({
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(180),
  company: z.string().trim().max(160).optional(),
  company_registration: z.string().trim().max(80).optional(),
  headquarters_address: z.string().trim().max(280).optional(),
  role: z.string().trim().max(140).optional(),
  need: z.string().trim().min(10).max(2500),
  team_size: z.string().trim().max(80).optional(),
  sector: z.string().trim().max(120).optional(),
  marketing_consent: z.union([z.literal('true'), z.literal(true)]).optional(),
  language: z.enum(['fr', 'en']).default('fr'),
  source: z.enum(['audit_flash_form', 'lex_teaser']).default('audit_flash_form'),
  website: z.string().optional(),
})

function clean(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildProjectBrief(input: z.infer<typeof schema>) {
  const name = [clean(input.first_name), clean(input.last_name)].filter(Boolean).join(' ')
  const lines = [
    `Source: ${input.source}`,
    name ? `Représentant: ${name}` : null,
    clean(input.role) ? `Rôle: ${clean(input.role)}` : null,
    clean(input.company) ? `Société: ${clean(input.company)}` : null,
    clean(input.company_registration) ? `N° société: ${clean(input.company_registration)}` : null,
    clean(input.headquarters_address) ? `Siège: ${clean(input.headquarters_address)}` : null,
    clean(input.team_size) ? `Taille équipe: ${clean(input.team_size)}` : null,
    clean(input.sector) ? `Secteur: ${clean(input.sector)}` : null,
    '',
    input.need.trim(),
  ]

  return lines.filter((line) => line !== null).join('\n')
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  if (!(await checkOrigin(req))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers })
  }

  let parsed: z.infer<typeof schema>
  try {
    const body = await req.json()
    parsed = schema.parse(body)
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid audit flash payload', details: error instanceof Error ? error.message : String(error) },
      { status: 400, headers },
    )
  }

  if (parsed.website?.trim()) {
    return NextResponse.json({ ok: true }, { headers })
  }

  const ipHash = hashIp(getClientIp(req))
  const rateLimit = await checkRateLimit(`ip:${ipHash}:audit-flash`, {
    limit: 5,
    windowSec: 3600,
    ipHash,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many submissions' }, { status: 429, headers })
  }

  const now = new Date().toISOString()
  const sessionId = randomUUID()
  const contact = await createContact({
    session_id: sessionId,
    email: parsed.email.toLowerCase(),
    first_name: clean(parsed.first_name),
    last_name: clean(parsed.last_name),
    company: clean(parsed.company),
    language: parsed.language,
    source: 'website_form',
    visitor_ip_hash: ipHash,
    user_agent: req.headers.get('user-agent'),
    marketing_consent: Boolean(parsed.marketing_consent),
    marketing_consent_at: parsed.marketing_consent ? now : null,
    privacy_notice_shown: true,
    privacy_notice_shown_at: now,
  })

  const interest = {
    source: parsed.source,
    role: clean(parsed.role),
    company_registration: clean(parsed.company_registration),
    headquarters_address: clean(parsed.headquarters_address),
    team_size: clean(parsed.team_size),
    sector: clean(parsed.sector),
    requested_call: 'audit_flash',
    tidycal_url: 'https://tidycal.com/lucid-lab/audit-flash-30-minutes',
  }

  const projectBrief = buildProjectBrief(parsed)
  const lead = await createLead({
    contact_id: contact.id,
    status: 'new',
    project_brief: projectBrief,
    interest,
    notes: parsed.source === 'lex_teaser' ? 'Lead capturé via teaser Lex sur la home.' : 'Pré-qualification Audit Flash.',
    marketing_consent: Boolean(parsed.marketing_consent),
    marketing_consent_source: parsed.marketing_consent ? parsed.source : null,
    followup_step: 0,
  })

  try {
    await syncAuditFlashProspect({
      contact,
      lead,
      email: parsed.email,
      name: [clean(parsed.first_name), clean(parsed.last_name)].filter(Boolean).join(' '),
      role: clean(parsed.role),
      company: clean(parsed.company),
      companyRegistration: clean(parsed.company_registration),
      headquartersAddress: clean(parsed.headquarters_address),
      teamSize: clean(parsed.team_size),
      sector: clean(parsed.sector),
      projectBrief,
      status: 'validated',
    })
  } catch (error) {
    console.error('[audit-flash] lead engine prospect sync failed:', error)
  }

  try {
    await sendTeamLeadNotification({
      email: parsed.email.toLowerCase(),
      firstName: clean(parsed.first_name),
      company: clean(parsed.company),
      language: parsed.language,
      projectBrief,
      interest,
      conversationId: `audit_flash:${lead.id}`,
    })
  } catch (error) {
    console.error('[audit-flash] team notification failed:', error)
  }

  return NextResponse.json({ ok: true, lead_id: lead.id, session_id: sessionId }, { headers })
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}
