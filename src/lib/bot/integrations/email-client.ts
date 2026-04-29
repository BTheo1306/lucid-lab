import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (!isSmtpConfigured()) {
    throw new Error('SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing)');
  }
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true for 465, false for 587/25 (STARTTLS)
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
  return transporter;
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn(
      `[email] SMTP not configured \u2014 skipping "${input.subject}" to ${Array.isArray(input.to) ? input.to.join(',') : input.to}`,
    );
    return;
  }
  const tx = getTransporter();
  await tx.sendMail({
    from: `Lucid-Lab <${config.emailFrom}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });
}

/** New lead captured by the bot — notify the team immediately. */
export async function sendTeamLeadNotification(input: {
  email: string;
  firstName?: string | null;
  company?: string | null;
  language: string;
  projectBrief: string;
  interest: Record<string, unknown> | null;
  conversationId: string;
}): Promise<void> {
  const interestLines = input.interest
    ? Object.entries(input.interest)
        .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</li>`)
        .join('')
    : '';

  const html = `
    <h2>Nouveau lead capturé par le bot</h2>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    ${input.firstName ? `<p><strong>Prénom:</strong> ${escapeHtml(input.firstName)}</p>` : ''}
    ${input.company ? `<p><strong>Société:</strong> ${escapeHtml(input.company)}</p>` : ''}
    <p><strong>Langue:</strong> ${escapeHtml(input.language)}</p>
    <h3>Brief projet</h3>
    <p>${escapeHtml(input.projectBrief).replace(/\n/g, '<br>')}</p>
    ${interestLines ? `<h3>Contexte</h3><ul>${interestLines}</ul>` : ''}
    <p style="color:#666;font-size:12px;">Conversation ID: ${escapeHtml(input.conversationId)}</p>
  `;

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Lucid-Lab Bot] Nouveau lead — ${input.email}`,
    html,
    replyTo: input.email,
  });
}

/** Escalation email with conversation transcript. */
export async function sendEscalationEmail(input: {
  contactEmail: string | null;
  reason: string;
  transcript: { role: string; content: string }[];
  conversationId: string;
}): Promise<void> {
  const transcriptHtml = input.transcript
    .map(
      (m) =>
        `<p><strong>${escapeHtml(m.role)}:</strong><br>${escapeHtml(m.content).replace(
          /\n/g,
          '<br>',
        )}</p>`,
    )
    .join('<hr>');

  const html = `
    <h2>Escalade bot → humain</h2>
    <p><strong>Raison:</strong> ${escapeHtml(input.reason)}</p>
    ${input.contactEmail ? `<p><strong>Visiteur:</strong> ${escapeHtml(input.contactEmail)}</p>` : '<p><em>Visiteur anonyme</em></p>'}
    <h3>Transcript</h3>
    <div style="border-left:3px solid #ddd;padding-left:12px;">${transcriptHtml}</div>
    <p style="color:#666;font-size:12px;">Conversation ID: ${escapeHtml(input.conversationId)}</p>
  `;

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Lucid-Lab Bot] Escalade — ${input.reason}`,
    html,
    replyTo: input.contactEmail ?? undefined,
  });
}

/** Nurture sequence — step 1 (24h), 2 (72h), 3 (7d). */
export async function sendLeadFollowup(input: {
  to: string;
  firstName: string | null;
  language: 'fr' | 'en';
  step: 1 | 2 | 3;
}): Promise<void> {
  const name = input.firstName || (input.language === 'fr' ? 'bonjour' : 'hello');
  const templates = buildFollowupTemplate(name, input.language, input.step);

  await sendEmail({
    to: input.to,
    subject: templates.subject,
    html: templates.html,
    text: templates.text,
  });
}

/** Morning digest of yesterday's bot activity. */
export async function sendMorningDigest(input: {
  dateLabel: string;
  leadsCount: number;
  conversationsCount: number;
  escalationsCount: number;
  recentLeads: { email: string; firstName: string | null; projectBrief: string | null }[];
}): Promise<void> {
  const leadsHtml = input.recentLeads
    .map(
      (l) =>
        `<li><strong>${escapeHtml(l.email)}</strong>${
          l.firstName ? ` (${escapeHtml(l.firstName)})` : ''
        }${l.projectBrief ? `<br><em>${escapeHtml(l.projectBrief.slice(0, 200))}${l.projectBrief.length > 200 ? '…' : ''}</em>` : ''}</li>`,
    )
    .join('');

  const html = `
    <h2>Digest bot — ${escapeHtml(input.dateLabel)}</h2>
    <ul>
      <li>Conversations: <strong>${input.conversationsCount}</strong></li>
      <li>Leads capturés: <strong>${input.leadsCount}</strong></li>
      <li>Escalades: <strong>${input.escalationsCount}</strong></li>
    </ul>
    ${input.recentLeads.length ? `<h3>Leads récents</h3><ul>${leadsHtml}</ul>` : ''}
  `;

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Lucid-Lab Bot] Digest — ${input.dateLabel}`,
    html,
  });
}

function buildFollowupTemplate(
  name: string,
  lang: 'fr' | 'en',
  step: 1 | 2 | 3,
): { subject: string; html: string; text: string } {
  const bookingUrl = config.tidycalPublicUrl || 'https://tidycal.com/lucid-lab';
  if (lang === 'fr') {
    switch (step) {
      case 1:
        return {
          subject: 'Suite à notre échange',
          text: `Bonjour ${name},\n\nMerci pour votre message via notre bot. Si vous souhaitez approfondir, un créneau de 30 min suffit à cadrer le problème et voir si un système automatisé est pertinent.\n\nÀ bientôt,\nL'équipe Lucid-Lab`,
          html: `<p>Bonjour ${escapeHtml(name)},</p><p>Merci pour votre message via notre bot. Si vous souhaitez approfondir, un créneau de 30 min suffit à cadrer le problème et voir si un système automatisé est pertinent.</p><p>À bientôt,<br>L'équipe Lucid-Lab</p>`,
        };
      case 2:
        return {
          subject: 'Cas concret qui pourrait vous intéresser',
          text: `Bonjour ${name},\n\nPour info — on a récemment déployé un workflow qui a économisé ~15h/semaine à une équipe marketing. Ce genre de transformation est souvent plus simple qu'il n'y paraît.\n\nSi cela résonne, prenons 30 min : ${bookingUrl}\n\nCordialement,\nL'équipe Lucid-Lab`,
          html: `<p>Bonjour ${escapeHtml(name)},</p><p>Pour info — on a récemment déployé un workflow qui a économisé ~15h/semaine à une équipe marketing. Ce genre de transformation est souvent plus simple qu'il n'y paraît.</p><p>Si cela résonne, prenons 30 min : <a href="${escapeHtml(bookingUrl)}">réserver un créneau</a></p><p>Cordialement,<br>L'équipe Lucid-Lab</p>`,
        };
      case 3:
        return {
          subject: 'Dernier mot',
          text: `Bonjour ${name},\n\nDernier message, promis. Si le timing n'est pas bon, aucun souci — on reste à votre disposition le jour où vous voudrez poser le sujet.\n\nBien à vous,\nL'équipe Lucid-Lab`,
          html: `<p>Bonjour ${escapeHtml(name)},</p><p>Dernier message, promis. Si le timing n'est pas bon, aucun souci — on reste à votre disposition le jour où vous voudrez poser le sujet.</p><p>Bien à vous,<br>L'équipe Lucid-Lab</p>`,
        };
    }
  } else {
    switch (step) {
      case 1:
        return {
          subject: 'Following up on your message',
          text: `Hi ${name},\n\nThanks for reaching out via our bot. If you'd like to go deeper, a 30-min call is usually enough to scope the problem and see whether an automated system is a fit.\n\nBest,\nThe Lucid-Lab team`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for reaching out via our bot. If you'd like to go deeper, a 30-min call is usually enough to scope the problem and see whether an automated system is a fit.</p><p>Best,<br>The Lucid-Lab team</p>`,
        };
      case 2:
        return {
          subject: 'A concrete case that might interest you',
          text: `Hi ${name},\n\nQuick note — we recently shipped a workflow that saved a marketing team ~15h/week. This kind of transformation is often simpler than it looks.\n\nIf it resonates, grab 30 min: ${bookingUrl}\n\nBest,\nThe Lucid-Lab team`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Quick note — we recently shipped a workflow that saved a marketing team ~15h/week. This kind of transformation is often simpler than it looks.</p><p>If it resonates, grab 30 min: <a href="${escapeHtml(bookingUrl)}">book a slot</a></p><p>Best,<br>The Lucid-Lab team</p>`,
        };
      case 3:
        return {
          subject: 'Last note',
          text: `Hi ${name},\n\nLast email, promise. If timing is off, no worries — we're around whenever you want to dig in.\n\nBest,\nThe Lucid-Lab team`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Last email, promise. If timing is off, no worries — we're around whenever you want to dig in.</p><p>Best,<br>The Lucid-Lab team</p>`,
        };
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
