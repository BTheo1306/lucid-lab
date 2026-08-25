import nodemailer, { type Transporter } from 'nodemailer';
import { adminBaseUrl } from '@/lib/admin/urls';
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
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
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
    attachments: input.attachments,
  });
}

function safeAttachmentFileName(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized || 'documents-lucid-lab-signes';
}

async function downloadPdfAttachment(url: string, fileName: string): Promise<SendEmailInput['attachments']> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const content = Buffer.from(await response.arrayBuffer());
    return [{ filename: fileName, content, contentType: 'application/pdf' }];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.warn(`[email] Could not attach signed PDF ${fileName}: ${message}`);
    return undefined;
  }
}

const INTEREST_LABELS: Record<string, string> = {
  source: 'Source',
  role: 'Rôle',
  company_registration: 'N° société',
  headquarters_address: 'Siège',
  team_size: 'Taille équipe',
  sector: 'Secteur',
  requested_call: 'Call demandé',
  tidycal_url: 'Lien de réservation',
  urgency: 'Urgence',
  budget_range: 'Budget',
  timeline: 'Échéance',
};

/** Drop empty values so the email shows real context instead of a wall of `null`. */
function interestEntries(interest: Record<string, unknown> | null): [string, string][] {
  if (!interest) return [];
  return Object.entries(interest)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => [INTEREST_LABELS[key] ?? key, String(value)]);
}

/** New lead captured by the bot — notify the team immediately, in full. */
export async function sendTeamLeadNotification(input: {
  email: string;
  firstName?: string | null;
  company?: string | null;
  language: string;
  projectBrief: string;
  interest: Record<string, unknown> | null;
  conversationId: string;
  /** Enables the deep link to the full record (brief, transcripts, bookings). */
  contactId?: string | null;
  /** Full conversation, when the lead came from the chat widget. */
  transcript?: { role: string; content: string }[];
  /** Slug of the CRM prospect this lead was mirrored into, when it succeeded. */
  crmClientSlug?: string | null;
  /** Human label of where the lead was captured. */
  sourceLabel?: string | null;
}): Promise<void> {
  const context = interestEntries(input.interest);
  const contextHtml = context
    .map(([label, value]) => `<li><strong>${escapeHtml(label)} :</strong> ${escapeHtml(value)}</li>`)
    .join('');

  const transcript = input.transcript ?? [];
  const transcriptHtml = transcript
    .map(
      (m) =>
        `<p style="margin:0 0 10px;"><strong>${escapeHtml(m.role)} :</strong><br>${escapeHtml(m.content).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

  const contactUrl = input.contactId ? `${adminBaseUrl()}/contacts/${input.contactId}` : null;
  const crmUrl = input.crmClientSlug ? `${adminBaseUrl()}/lucid-os/clients/${input.crmClientSlug}` : null;
  const links = [
    crmUrl ? `<li><a href="${escapeHtml(crmUrl)}">Fiche prospect dans le CRM</a></li>` : null,
    contactUrl ? `<li><a href="${escapeHtml(contactUrl)}">Fiche contact (brief complet + transcript)</a></li>` : null,
  ]
    .filter(Boolean)
    .join('');

  const html = `
    <h2>Nouveau lead capturé${input.sourceLabel ? ` via le ${escapeHtml(input.sourceLabel)}` : ''}</h2>
    <p><strong>Email :</strong> <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></p>
    ${input.firstName ? `<p><strong>Prénom :</strong> ${escapeHtml(input.firstName)}</p>` : ''}
    ${input.company ? `<p><strong>Société :</strong> ${escapeHtml(input.company)}</p>` : ''}
    <p><strong>Langue :</strong> ${escapeHtml(input.language)}</p>
    <h3>Brief projet</h3>
    <div style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:12px;">${escapeHtml(input.projectBrief)}</div>
    ${contextHtml ? `<h3>Contexte</h3><ul>${contextHtml}</ul>` : ''}
    ${transcriptHtml ? `<h3>Conversation complète (${transcript.length} messages)</h3><div style="border-left:3px solid #ddd;padding-left:12px;">${transcriptHtml}</div>` : ''}
    ${links ? `<h3>Ouvrir dans Lucid OS</h3><ul>${links}</ul>` : ''}
    <p style="color:#666;font-size:12px;">Conversation ID : ${escapeHtml(input.conversationId)}</p>
  `;

  const text = [
    `Nouveau lead capturé${input.sourceLabel ? ` via le ${input.sourceLabel}` : ''}`,
    ``,
    `Email : ${input.email}`,
    input.firstName ? `Prénom : ${input.firstName}` : null,
    input.company ? `Société : ${input.company}` : null,
    `Langue : ${input.language}`,
    ``,
    `Brief projet :`,
    input.projectBrief,
    context.length ? `\nContexte :\n${context.map(([l, v]) => `- ${l} : ${v}`).join('\n')}` : null,
    transcript.length
      ? `\nConversation complète :\n${transcript.map((m) => `${m.role} : ${m.content}`).join('\n\n')}`
      : null,
    crmUrl ? `\nFiche prospect CRM : ${crmUrl}` : null,
    contactUrl ? `Fiche contact : ${contactUrl}` : null,
    ``,
    `Conversation ID : ${input.conversationId}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Lucid-Lab Bot] Nouveau lead — ${input.email}`,
    html,
    text,
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
  recentLeads: { email: string; firstName: string | null; projectBrief: string | null; contactId?: string | null }[];
  /** Tickets clients encore ouverts (portail), toutes anciennetés confondues. */
  openTickets?: {
    count: number;
    oldest: { reference: number; title: string; clientName: string | null; ageDays: number }[];
    adminUrl: string;
  };
}): Promise<void> {
  // Full brief, never truncated: the digest is where leads are triaged.
  const leadsHtml = input.recentLeads
    .map((l) => {
      const contactUrl = l.contactId ? `${adminBaseUrl()}/contacts/${l.contactId}` : null;
      return `<li style="margin-bottom:12px;"><strong>${escapeHtml(l.email)}</strong>${
        l.firstName ? ` (${escapeHtml(l.firstName)})` : ''
      }${
        l.projectBrief
          ? `<div style="white-space:pre-wrap;color:#444;margin-top:4px;">${escapeHtml(l.projectBrief)}</div>`
          : ''
      }${contactUrl ? `<div style="margin-top:4px;"><a href="${escapeHtml(contactUrl)}">Ouvrir la fiche</a></div>` : ''}</li>`;
    })
    .join('');

  const tickets = input.openTickets;
  const ticketsHtml = tickets
    ? tickets.count === 0
      ? '<p>Aucun ticket client ouvert.</p>'
      : `<ul>${tickets.oldest
          .map(
            (t) =>
              `<li><strong>#${t.reference}</strong> ${escapeHtml(t.title)}${
                t.clientName ? ` (${escapeHtml(t.clientName)})` : ''
              } <em style="color:#888;">ouvert depuis ${t.ageDays} j</em></li>`,
          )
          .join('')}</ul><p><a href="${escapeHtml(tickets.adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Voir les tickets</a></p>`
    : '';

  const html = `
    <h2>Digest bot : ${escapeHtml(input.dateLabel)}</h2>
    <ul>
      <li>Conversations: <strong>${input.conversationsCount}</strong></li>
      <li>Leads capturés: <strong>${input.leadsCount}</strong></li>
      <li>Escalades: <strong>${input.escalationsCount}</strong></li>
    </ul>
    ${input.recentLeads.length ? `<h3>Leads récents</h3><ul>${leadsHtml}</ul>` : ''}
    ${tickets ? `<h3>Tickets clients ouverts (${tickets.count})</h3>${ticketsHtml}` : ''}
  `;

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Lucid-Lab Bot] Digest : ${input.dateLabel}`,
    html,
  });
}

/** Weekly LinkedIn digest: this week's queue + last week's performance. */
export async function sendLinkedInWeeklyDigest(input: {
  adminUrl: string;
  upcoming: { dateLabel: string; pillar: string | null; title: string; statusLabel: string }[];
  recent: { title: string; postUrl: string | null; reactions: number | null; comments: number | null }[];
}): Promise<void> {
  const upcomingHtml = input.upcoming.length
    ? `<ul>${input.upcoming
        .map(
          (p) =>
            `<li><strong>${escapeHtml(p.dateLabel)}</strong>${
              p.pillar ? ` (${escapeHtml(p.pillar)})` : ''
            } : ${escapeHtml(p.title)} <em style="color:#888;">[${escapeHtml(p.statusLabel)}]</em></li>`,
        )
        .join('')}</ul>`
    : '<p>Aucun post programmé cette semaine.</p>';

  const recentHtml = input.recent.length
    ? `<ul>${input.recent
        .map((p) => {
          const stats = `${p.reactions ?? 0} réactions, ${p.comments ?? 0} commentaires`;
          const link = p.postUrl ? ` (<a href="${escapeHtml(p.postUrl)}">voir</a>)` : '';
          return `<li>${escapeHtml(p.title)} : ${stats}${link}</li>`;
        })
        .join('')}</ul>`
    : '<p>Aucun post publié la semaine dernière.</p>';

  const html = `
    <h2>LinkedIn : la semaine</h2>
    <p>Voici les posts prévus cette semaine et la performance des posts publiés la semaine dernière. Sans action de votre part, les posts en file sont approuvés puis publiés à l'heure prévue (le silence vaut accord).</p>
    <p><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Gérer les posts dans Lucid OS</a></p>
    <h3>À venir cette semaine (${input.upcoming.length})</h3>
    ${upcomingHtml}
    <h3>Publiés la semaine dernière (${input.recent.length})</h3>
    ${recentHtml}
    <p style="color:#666;font-size:12px;">Les impressions ne sont pas exposées par l'API LinkedIn pour les posts personnels. Réactions et commentaires, eux, sont fiables.</p>
  `;

  await sendEmail({
    to: config.teamNotificationEmail,
    subject: '[Lucid-Lab] LinkedIn : posts de la semaine',
    html,
  });
}

export async function sendDocumentSignatureRequest(input: {
  to: string;
  signerName?: string | null;
  documentNumber?: string | null;
  documentTitle: string;
  signingUrl: string;
  replyTo?: string | null;
}): Promise<void> {
  const signerName = input.signerName?.trim();
  const greeting = signerName ? `Bonjour ${signerName},` : 'Bonjour,';
  const documentLabel = input.documentNumber || input.documentTitle;
  const subject = `Signature des documents Lucid-Lab ${documentLabel}`;
  const safeSigningUrl = escapeHtml(input.signingUrl);

  if (!isSmtpConfigured()) {
    throw new Error('SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing)');
  }

  await sendEmail({
    to: input.to,
    subject,
    replyTo: input.replyTo ?? undefined,
    text: `${greeting}\n\nVotre bon de commande et votre contrat de prestation Lucid-Lab sont prêts à être signés : ${input.signingUrl}\n\nBien à vous,\nL'équipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Votre bon de commande et votre contrat de prestation Lucid-Lab sont prêts à être signés.</p>
      <p><a href="${safeSigningUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Signer les documents</a></p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${safeSigningUrl}">${safeSigningUrl}</a></p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
  });
}

export async function sendDocumentSignedNotification(input: {
  to?: string | null;
  clientName?: string | null;
  signerName?: string | null;
  documentNumber?: string | null;
  documentTitle: string;
  signedAt?: string | null;
  signedPdfUrl?: string | null;
  googleDriveUrl?: string | null;
  googleDriveFolderUrl?: string | null;
  auditLogUrl?: string | null;
  adminUrl?: string | null;
  driveStatus?: string | null;
}): Promise<void> {
  const documentLabel = input.documentNumber || input.documentTitle;
  const signedAt = input.signedAt ? new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(input.signedAt)) : 'date inconnue';
  const lines = [
    `Document: ${documentLabel}`,
    `Client: ${input.clientName ?? 'non renseigné'}`,
    `Signataire: ${input.signerName ?? 'non renseigné'}`,
    `Signé le: ${signedAt}`,
    input.googleDriveUrl ? `PDF Drive: ${input.googleDriveUrl}` : null,
    input.signedPdfUrl ? `PDF DocuSeal: ${input.signedPdfUrl}` : null,
    input.auditLogUrl ? `Audit log: ${input.auditLogUrl}` : null,
    input.adminUrl ? `Admin: ${input.adminUrl}` : null,
    input.driveStatus ? `Drive: ${input.driveStatus}` : null,
  ].filter(Boolean).join('\n');

  const links = [
    input.googleDriveUrl ? `<li><a href="${escapeHtml(input.googleDriveUrl)}">PDF signé dans Google Drive</a></li>` : null,
    input.googleDriveFolderUrl ? `<li><a href="${escapeHtml(input.googleDriveFolderUrl)}">Dossier client Google Drive</a></li>` : null,
    input.signedPdfUrl ? `<li><a href="${escapeHtml(input.signedPdfUrl)}">PDF signé DocuSeal</a></li>` : null,
    input.auditLogUrl ? `<li><a href="${escapeHtml(input.auditLogUrl)}">Journal d'audit DocuSeal</a></li>` : null,
    input.adminUrl ? `<li><a href="${escapeHtml(input.adminUrl)}">Fiche client Lucid OS</a></li>` : null,
  ].filter(Boolean).join('');

  await sendEmail({
    to: input.to ?? config.teamNotificationEmail,
    subject: `Document signé - ${documentLabel}`,
    text: `Le bon de commande et le contrat ont été signés.\n\n${lines}`,
    html: `
      <h2>Documents signés</h2>
      <p>Le bon de commande et le contrat de prestation ont été signés.</p>
      <ul>
        <li><strong>Document:</strong> ${escapeHtml(documentLabel)}</li>
        <li><strong>Client:</strong> ${escapeHtml(input.clientName ?? 'non renseigné')}</li>
        <li><strong>Signataire:</strong> ${escapeHtml(input.signerName ?? 'non renseigné')}</li>
        <li><strong>Signé le:</strong> ${escapeHtml(signedAt)}</li>
        ${input.driveStatus ? `<li><strong>Drive:</strong> ${escapeHtml(input.driveStatus)}</li>` : ''}
      </ul>
      ${links ? `<h3>Liens</h3><ul>${links}</ul>` : ''}
    `,
  });
}

export async function sendDocumentSignedClientConfirmation(input: {
  to: string;
  signerName?: string | null;
  documentNumber?: string | null;
  documentTitle: string;
  signedAt?: string | null;
  signedPdfUrl: string;
  replyTo?: string | null;
}): Promise<void> {
  const signerName = input.signerName?.trim();
  const greeting = signerName ? `Bonjour ${signerName},` : 'Bonjour,';
  const documentLabel = input.documentNumber || input.documentTitle;
  const signedAt = input.signedAt ? new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(input.signedAt)) : null;
  const safeSignedPdfUrl = escapeHtml(input.signedPdfUrl);
  const attachmentFileName = `${safeAttachmentFileName(documentLabel)}.pdf`;
  const attachments = await downloadPdfAttachment(input.signedPdfUrl, attachmentFileName);
  const hasAttachment = Boolean(attachments?.length);

  await sendEmail({
    to: input.to,
    subject: `Documents Lucid-Lab signes - ${documentLabel}`,
    replyTo: input.replyTo ?? undefined,
    attachments,
    text: `${greeting}\n\nVos documents Lucid-Lab ont bien ete signes${signedAt ? ` le ${signedAt}` : ''}.\n\n${hasAttachment ? 'Le PDF signe est joint a cet email. ' : ''}Vous pouvez aussi telecharger le PDF signe ici : ${input.signedPdfUrl}\n\nBien a vous,\nL'equipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Vos documents Lucid-Lab ont bien été signés${signedAt ? ` le ${escapeHtml(signedAt)}` : ''}.</p>
      ${hasAttachment ? '<p>Le PDF signé est joint à cet email. Le lien ci-dessous reste disponible en secours.</p>' : ''}
      <p><a href="${safeSignedPdfUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Télécharger le PDF signé</a></p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${safeSignedPdfUrl}">${safeSignedPdfUrl}</a></p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
  });
}

/** Client portal: magic login link (valid 15 minutes, single use). */
export async function sendPortalLoginLink(input: {
  to: string;
  contactName?: string | null;
  loginUrl: string;
}): Promise<void> {
  const name = input.contactName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const safeUrl = escapeHtml(input.loginUrl);

  await sendEmail({
    to: input.to,
    subject: 'Votre lien de connexion au portail client Lucid-Lab',
    text: `${greeting}\n\nVoici votre lien de connexion au portail client Lucid-Lab. Il est valable 15 minutes et ne peut servir qu'une seule fois : ${input.loginUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nBien à vous,\nL'équipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Voici votre lien de connexion au portail client Lucid-Lab. Il est valable 15 minutes et ne peut servir qu'une seule fois.</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Se connecter au portail</a></p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${safeUrl}">${safeUrl}</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
  });
}

/** Client portal: invitation sent by the agency (link valid 7 days). */
export async function sendPortalInvite(input: {
  to: string;
  contactName?: string | null;
  clientName: string;
  inviteUrl: string;
}): Promise<void> {
  const name = input.contactName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const safeUrl = escapeHtml(input.inviteUrl);

  await sendEmail({
    to: input.to,
    subject: `Votre espace client Lucid-Lab est ouvert - ${input.clientName}`,
    text: `${greeting}\n\nVotre espace client Lucid-Lab est ouvert pour ${input.clientName}. Vous y suivez l'avancement de vos projets, vos documents, votre facturation et nos échanges.\n\nActivez votre accès ici (lien valable 7 jours) : ${input.inviteUrl}\n\nEnsuite, connectez-vous à tout moment sur ${input.inviteUrl.split('/connexion')[0]} avec votre adresse email : vous recevrez un lien de connexion, sans mot de passe.\n\nBien à vous,\nL'équipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Votre espace client Lucid-Lab est ouvert pour <strong>${escapeHtml(input.clientName)}</strong>. Vous y suivez l'avancement de vos projets, vos documents, votre facturation et nos échanges.</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Activer mon accès</a></p>
      <p>Ce lien est valable 7 jours. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${safeUrl}">${safeUrl}</a></p>
      <p>Ensuite, connectez-vous à tout moment avec votre adresse email : vous recevrez un lien de connexion, sans mot de passe.</p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
  });
}

/** Portal: the client dropped a file, notify the team. */
export async function sendPortalUploadTeamNotification(input: {
  clientName: string;
  contactName: string;
  fileName: string;
  note: string | null;
  driveUrl: string;
}): Promise<void> {
  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Portail] ${input.clientName} a déposé un document : ${input.fileName}`,
    html: `
      <h2>Document reçu via le portail client</h2>
      <p><strong>Client :</strong> ${escapeHtml(input.clientName)}</p>
      <p><strong>Déposé par :</strong> ${escapeHtml(input.contactName)}</p>
      <p><strong>Fichier :</strong> ${escapeHtml(input.fileName)}</p>
      ${input.note ? `<p><strong>Message :</strong><br>${escapeHtml(input.note)}</p>` : ''}
      <p>Le fichier est déjà rangé dans le dossier Drive du client.</p>
      <p><a href="${escapeHtml(input.driveUrl)}">Ouvrir le document</a></p>
    `,
  });
}

const PORTAL_REQUEST_TYPE_LABELS: Record<string, string> = {
  question: 'Question',
  change_request: 'Demande de modification',
  asset_request: 'Éléments à fournir',
  approval: 'Validation attendue',
  info_request: 'Informations à compléter',
  incident: 'Incident',
};

const PORTAL_PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

/** "#42 " when a ticket reference is known, empty otherwise. */
function referencePrefix(reference?: number | null): string {
  return reference ? `#${reference} ` : '';
}

/** Portal: a client submitted a request, notify the team. */
export async function sendPortalRequestCreatedTeamNotification(input: {
  clientName: string;
  contactName: string;
  requestType: string;
  title: string;
  body: string | null;
  adminUrl: string;
  reference?: number | null;
  priority?: string | null;
}): Promise<void> {
  const typeLabel = PORTAL_REQUEST_TYPE_LABELS[input.requestType] ?? 'Demande';
  const priorityLabel = input.priority ? (PORTAL_PRIORITY_LABELS[input.priority] ?? input.priority) : null;
  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Portail] ${typeLabel} de ${input.clientName} : ${referencePrefix(input.reference)}${input.title}`,
    html: `
      <h2>Nouvelle demande client via le portail</h2>
      <p><strong>Client :</strong> ${escapeHtml(input.clientName)}</p>
      <p><strong>Contact :</strong> ${escapeHtml(input.contactName)}</p>
      <p><strong>Type :</strong> ${escapeHtml(typeLabel)}</p>
      ${priorityLabel ? `<p><strong>Priorité :</strong> ${escapeHtml(priorityLabel)}</p>` : ''}
      <p><strong>Objet :</strong> ${escapeHtml(`${referencePrefix(input.reference)}${input.title}`)}</p>
      ${input.body ? `<p><strong>Détail :</strong><br>${escapeHtml(input.body).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Ouvrir dans Lucid OS</a></p>
    `,
  });
}

/** Portal: a client replied on a ticket thread, notify the team. */
export async function sendPortalClientMessageTeamNotification(input: {
  clientName: string;
  contactName: string;
  title: string;
  body: string;
  adminUrl: string;
  reference?: number | null;
}): Promise<void> {
  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Portail] Message de ${input.clientName} : ${referencePrefix(input.reference)}${input.title}`,
    html: `
      <h2>Nouveau message client sur un ticket</h2>
      <p><strong>Client :</strong> ${escapeHtml(input.clientName)} (${escapeHtml(input.contactName)})</p>
      <p><strong>Ticket :</strong> ${escapeHtml(`${referencePrefix(input.reference)}${input.title}`)}</p>
      <p><strong>Message :</strong><br>${escapeHtml(input.body).replace(/\n/g, '<br>')}</p>
      <p><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Répondre dans Lucid OS</a></p>
    `,
  });
}

/** Portal: a client answered an agency request, notify the team. */
export async function sendPortalClientResponseTeamNotification(input: {
  clientName: string;
  contactName: string;
  title: string;
  status: string;
  note: string | null;
  adminUrl: string;
}): Promise<void> {
  const statusLabel =
    input.status === 'approved' ? 'Approuvé' : input.status === 'done' ? 'Traité par le client' : 'Modifications demandées';
  await sendEmail({
    to: config.teamNotificationEmail,
    subject: `[Portail] ${statusLabel} par ${input.clientName} : ${input.title}`,
    html: `
      <h2>Réponse client sur le portail</h2>
      <p><strong>Client :</strong> ${escapeHtml(input.clientName)} (${escapeHtml(input.contactName)})</p>
      <p><strong>Demande :</strong> ${escapeHtml(input.title)}</p>
      <p><strong>Décision :</strong> ${escapeHtml(statusLabel)}</p>
      ${input.note ? `<p><strong>Commentaire :</strong><br>${escapeHtml(input.note).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;">Ouvrir la fiche client</a></p>
    `,
  });
}

/** Portal: the agency asks the client for something (validation, assets, info). */
export async function sendPortalRequestToClient(input: {
  to: string;
  contactName?: string | null;
  clientName: string;
  requestType: string;
  title: string;
  body: string | null;
  portalUrl: string;
}): Promise<void> {
  const name = input.contactName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const typeLabel = PORTAL_REQUEST_TYPE_LABELS[input.requestType] ?? 'Demande';
  const safeUrl = escapeHtml(input.portalUrl);

  await sendEmail({
    to: input.to,
    subject: `[Lucid-Lab] ${typeLabel} : ${input.title}`,
    text: `${greeting}\n\nNous avons besoin de vous sur votre espace client Lucid-Lab.\n\n${typeLabel} : ${input.title}\n${input.body ? `\n${input.body}\n` : ''}\nRépondre ici : ${input.portalUrl}\n\nBien à vous,\nL'équipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Nous avons besoin de vous sur votre espace client Lucid-Lab.</p>
      <p><strong>${escapeHtml(typeLabel)} :</strong> ${escapeHtml(input.title)}</p>
      ${input.body ? `<p>${escapeHtml(input.body).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${safeUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Répondre sur le portail</a></p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${safeUrl}">${safeUrl}</a></p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
  });
}

/** Portal: the agency answered a client request. */
export async function sendPortalRequestAnsweredToClient(input: {
  to: string;
  contactName?: string | null;
  title: string;
  status: 'in_progress' | 'waiting' | 'done' | 'declined';
  responseNote: string | null;
  portalUrl: string;
  reference?: number | null;
}): Promise<void> {
  const name = input.contactName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const statusLabel =
    input.status === 'done'
      ? 'a été traitée'
      : input.status === 'declined'
        ? "n'a pas pu être retenue"
        : input.status === 'waiting'
          ? 'a reçu une réponse'
          : 'est en cours de traitement';
  const safeUrl = escapeHtml(input.portalUrl);
  const subjectStatus =
    input.status === 'done'
      ? 'est traitée'
      : input.status === 'in_progress'
        ? 'est en cours'
        : 'a reçu une réponse';

  await sendEmail({
    to: input.to,
    subject: `[Lucid-Lab] Votre demande ${referencePrefix(input.reference)}"${input.title}" ${subjectStatus}`,
    text: `${greeting}\n\nVotre demande "${input.title}" ${statusLabel}.\n${input.responseNote ? `\nNotre réponse : ${input.responseNote}\n` : ''}\nVoir le détail : ${input.portalUrl}\n\nBien à vous,\nL'équipe Lucid-Lab`,
    html: `
      <p>${escapeHtml(greeting)}</p>
      <p>Votre demande <strong>${escapeHtml(input.title)}</strong> ${escapeHtml(statusLabel)}.</p>
      ${input.responseNote ? `<p><strong>Notre réponse :</strong><br>${escapeHtml(input.responseNote).replace(/\n/g, '<br>')}</p>` : ''}
      <p><a href="${safeUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Voir sur le portail</a></p>
      <p>Bien à vous,<br>L'équipe Lucid-Lab</p>
    `,
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
