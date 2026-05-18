import 'server-only';

import type { DocuSealHtmlDocumentPayload } from './types';

type UnknownRecord = Record<string, unknown>;

interface BuildBonDeCommandeHtmlInput {
  document: UnknownRecord;
  recipient: UnknownRecord;
  generationPayload: UnknownRecord;
}

const LUCID_FOOTER = 'Lucid-Lab · SAS au capital de 999 € · RCS Paris 104 672 050 · TVA FR 02 104 672 050 · 47 rue Vivienne, 75002 Paris, France';

const DEFAULT_DELIVERABLES = [
  'Cadrage du besoin, des accès, des contraintes opérationnelles et des indicateurs de réussite.',
  'Conception, configuration ou développement des systèmes convenus avec le Client.',
  'Tests, mise en production, documentation de passation et ajustements prévus au périmètre.',
];

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatEuro(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`;
}

function formatDate(value: string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('fr-FR').format(new Date());
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function lines(value: string | null, fallback: string[] = []): string[] {
  const source = value ? value.split(/\r?\n/) : fallback;
  return source
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function paragraph(value: string | null, fallback = 'À compléter.'): string {
  const text = value ?? fallback;
  return `<p>${escapeHtml(text).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
}

function bulletList(items: string[]): string {
  if (items.length === 0) return '<p>À compléter.</p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function timelineList(items: string[]): string {
  if (items.length === 0) return '<p>Calendrier à confirmer au démarrage.</p>';
  return `<div class="timeline-list">${items.map((item) => {
    const match = item.match(/^(Semaine(?:s)?\s+[0-9–\-]+)\s+(.+)$/i);
    if (match) return `<p><strong>${escapeHtml(match[1])}</strong> ${escapeHtml(match[2])}</p>`;
    return `<p>${escapeHtml(item)}</p>`;
  }).join('')}</div>`;
}

function checkbox(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function styles(): string {
  return `
    <style>
      @page { size: A4; margin: 18mm 17mm 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; }
      h1 { margin: 0 0 18px; font-size: 24pt; line-height: 1.08; letter-spacing: 0; }
      h2 { margin: 22px 0 10px; font-size: 15pt; line-height: 1.2; page-break-after: avoid; }
      h3 { margin: 14px 0 6px; font-size: 11.5pt; }
      p { margin: 0 0 8px; }
      ul { margin: 5px 0 12px 18px; padding: 0; }
      li { margin: 4px 0; }
      .topline { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
      .brand { font-size: 18pt; font-weight: 750; }
      .meta { color: #555; font-size: 9.5pt; text-align: right; }
      .muted { color: #666; }
      .section { break-inside: avoid; margin-top: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .panel { border: 1px solid #d8d8d8; border-radius: 6px; padding: 11px 12px; break-inside: avoid; }
      .panel-title { margin: 0 0 6px; font-size: 9.5pt; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: .02em; }
      .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      .table th, .table td { padding: 8px 9px; border: 1px solid #d8d8d8; vertical-align: top; }
      .table th { width: 42%; background: #f6f6f6; text-align: left; }
      .checkline { display: flex; gap: 10px; align-items: baseline; margin: 7px 0; }
      .timeline-list p { margin-bottom: 7px; }
      .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 18px; page-break-inside: avoid; }
      .signature-box { border: 1px solid #d8d8d8; border-radius: 6px; padding: 12px; min-height: 150px; }
      text-field, signature-field, date-field, checkbox-field { display: inline-block; background: #fff; }
      .full-field { width: 100%; height: 42px; }
      .mention-field { width: 100%; height: 46px; }
      .place-field { width: 190px; height: 22px; vertical-align: middle; }
      .date-field { width: 130px; height: 22px; vertical-align: middle; }
      .signature-field { width: 100%; height: 68px; margin-top: 8px; }
      .accept-field { width: 14px; height: 14px; vertical-align: -2px; }
      .page-break { page-break-before: always; }
    </style>
  `;
}

function footer(): string {
  return `<!doctype html><html><head><meta charset="UTF-8"><style>body{margin:0 17mm 7mm;font-family:Inter,Arial,Helvetica,sans-serif;color:#666;font-size:9pt;line-height:1.2}.footer{white-space:nowrap}</style></head><body><div class="footer">${escapeHtml(LUCID_FOOTER)}</div></body></html>`;
}

function buildData(input: BuildBonDeCommandeHtmlInput) {
  const payload = input.generationPayload;
  const client = asRecord(payload.client) ?? {};
  const opportunity = asRecord(payload.opportunity) ?? {};
  const signer = asRecord(payload.signer) ?? {};
  const payloadDocument = asRecord(payload.document) ?? {};
  const clientLegal = asRecord(client.legal) ?? {};
  const pricingModel = asString(payloadDocument.pricing_model) === 'monthly' ? 'monthly' : 'one_shot';

  return {
    documentNumber: asString(input.document.document_number) ?? asString(payloadDocument.number) ?? '—',
    issuedAt: formatDate(asString(input.document.issued_at)),
    title: asString(opportunity.title) ?? asString(input.document.title) ?? 'Mission Lucid-Lab',
    clientName: asString(clientLegal.name) ?? asString(client.name) ?? 'Client',
    clientSiret: asString(clientLegal.siret),
    clientAddress: asString(clientLegal.address),
    signerName: asString(input.recipient.name) ?? asString(signer.name),
    signerEmail: asString(input.recipient.email) ?? asString(signer.email),
    scopePerimeter: asString(payloadDocument.scope_perimeter),
    syntheticDescription: asString(payloadDocument.synthetic_description) ?? asString(payloadDocument.notes),
    deliverables: lines(asString(payloadDocument.deliverables), DEFAULT_DELIVERABLES),
    calendarTimeline: lines(asString(payloadDocument.calendar_timeline)),
    nextSteps: lines(asString(payloadDocument.next_steps)),
    setupAmount: asNumber(input.document.setup_amount_eur) ?? asNumber(opportunity.setup_value_eur),
    monthlyAmount: asNumber(input.document.monthly_amount_eur) ?? asNumber(opportunity.monthly_value_eur),
    amountHt: asNumber(input.document.amount_ht_eur) ?? asNumber(payloadDocument.amount_ht_eur),
    vatRate: asNumber(input.document.vat_rate) ?? asNumber(payloadDocument.vat_rate),
    vatAmount: asNumber(input.document.vat_amount_eur) ?? asNumber(payloadDocument.vat_amount_eur),
    amountTtc: asNumber(input.document.amount_ttc_eur) ?? asNumber(payloadDocument.amount_ttc_eur),
    pricingModel,
  };
}

function partyBlock(data: ReturnType<typeof buildData>): string {
  const legal = [
    data.clientSiret ? `SIRET ${data.clientSiret}` : null,
    data.clientAddress,
  ].filter(Boolean).join(' · ');

  return `
    <div class="grid section">
      <div class="panel">
        <p class="panel-title">Prestataire</p>
        <p><strong>Lucid-Lab</strong>, SAS au capital de 999 €, RCS Paris 104 672 050, TVA FR 02 104 672 050.</p>
        <p>47 rue Vivienne, 75002 Paris, France.</p>
      </div>
      <div class="panel">
        <p class="panel-title">Client</p>
        <p><strong>${escapeHtml(data.clientName)}</strong></p>
        <p>${legal ? escapeHtml(legal) : 'Adresse et SIRET à compléter dans le dossier client.'}</p>
        <p class="muted">Signataire : ${escapeHtml(data.signerName ?? 'À compléter')}${data.signerEmail ? ` · ${escapeHtml(data.signerEmail)}` : ''}</p>
      </div>
    </div>
  `;
}

function signatureBlock(prefix: 'BDC' | 'Contract'): string {
  const acceptedName = prefix === 'BDC' ? 'BDC Accepted' : 'Contract Accepted';
  const mentionName = prefix === 'BDC' ? 'Mention manuscrite BDC' : 'Mention manuscrite Contrat';
  const placeName = prefix === 'BDC' ? 'Client Signing Place' : 'Contract Signing Place';
  const dateName = prefix === 'BDC' ? 'Signed Date' : 'Contract Signed Date';
  const signatureName = prefix === 'BDC' ? 'Client Signature' : 'Contract Signature';

  return `
    <div class="section signature-grid">
      <div class="signature-box">
        <p><checkbox-field class="accept-field" name="${acceptedName}" role="Client" required="true"></checkbox-field> J'accepte le présent document et ses conditions.</p>
        <p><strong>Mention manuscrite obligatoire :</strong><br>« Lu et approuvé — Bon pour accord et commande ferme — Prix : [Total TTC] € — Modalité : [one-shot / mensuel 12 mois] »</p>
        <text-field class="mention-field" name="${mentionName}" role="Client" required="true" title="Mention manuscrite"></text-field>
      </div>
      <div class="signature-box">
        <p>Fait à <text-field class="place-field" name="${placeName}" role="Client" required="false"></text-field></p>
        <p>Le <date-field class="date-field" name="${dateName}" role="Client" required="true" format="DD/MM/YYYY"></date-field></p>
        <signature-field class="signature-field" name="${signatureName}" role="Client" required="true" format="drawn_or_typed"></signature-field>
      </div>
    </div>
  `;
}

function bonDeCommandeHtml(input: BuildBonDeCommandeHtmlInput): string {
  const data = buildData(input);
  return `<!doctype html>
<html>
<head><meta charset="UTF-8">${styles()}</head>
<body>
  <div class="topline">
    <div class="brand">Lucid-Lab</div>
    <div class="meta">Proposition valant Bon de commande<br>Référence ${escapeHtml(data.documentNumber)}<br>${escapeHtml(data.issuedAt)}</div>
  </div>
  <h1>Proposition valant Bon de commande</h1>
  <p>La signature de la présente Proposition vaut acceptation de l'offre, formation du Contrat et commande ferme, puis déclenche l'émission d'une facture pro forma et l'exécution des Prestations à compter de la réception effective du premier paiement.</p>
  ${partyBlock(data)}
  <h2>Objet et périmètre de la prestation</h2>
  <p><strong>Intitulé :</strong> ${escapeHtml(data.title)}</p>
  <p><strong>Référence interne Lucid-Lab :</strong> ${escapeHtml(data.documentNumber)}</p>
  <div class="section">
    <h3>Description synthétique</h3>
    ${paragraph(data.syntheticDescription)}
  </div>
  <div class="section">
    <h3>Périmètre de la prestation</h3>
    ${paragraph(data.scopePerimeter)}
  </div>
  <div class="section">
    <h3>Livrables attendus</h3>
    ${bulletList(data.deliverables)}
  </div>
  <div class="section">
    <h3>Calendrier</h3>
    ${timelineList(data.calendarTimeline)}
  </div>
  <div class="section">
    <h3>Prochaines étapes</h3>
    ${bulletList(data.nextSteps)}
  </div>
  <h2>Conditions financières</h2>
  <table class="table">
    <tr><th>Prestation initiale / mise en place</th><td>${formatEuro(data.setupAmount)}</td></tr>
    <tr><th>Abonnement mensuel, le cas échéant</th><td>${formatEuro(data.monthlyAmount)}</td></tr>
    <tr><th>Prix HT total</th><td>${formatEuro(data.amountHt)}</td></tr>
    <tr><th>TVA</th><td>${formatPercent(data.vatRate)} — ${formatEuro(data.vatAmount)}</td></tr>
    <tr><th>Prix TTC total</th><td>${formatEuro(data.amountTtc)}</td></tr>
  </table>
  <div class="section">
    <p><strong>Modalité retenue :</strong></p>
    <p class="checkline"><span>${checkbox(data.pricingModel === 'one_shot')}</span><span>One-shot (${formatEuro(data.setupAmount ?? data.amountHt)} HT)</span></p>
    <p class="checkline"><span>${checkbox(data.pricingModel === 'monthly')}</span><span>Mensuel 12 mois (${formatEuro(data.monthlyAmount)} HT/mois)</span></p>
    <p class="muted">Paiement par virement SEPA exclusivement, sur le compte indiqué par Lucid-Lab.</p>
  </div>
  ${signatureBlock('BDC')}
</body>
</html>`;
}

function contractHtml(input: BuildBonDeCommandeHtmlInput): string {
  const data = buildData(input);
  return `<!doctype html>
<html>
<head><meta charset="UTF-8">${styles()}</head>
<body>
  <div class="topline">
    <div class="brand">Lucid-Lab</div>
    <div class="meta">Contrat de prestation de services<br>Référence ${escapeHtml(data.documentNumber)}<br>${escapeHtml(data.issuedAt)}</div>
  </div>
  <h1>Contrat de prestation de services</h1>
  ${partyBlock(data)}
  <h2>Article 1 — Formation du contrat</h2>
  <p>Le présent Contrat est formé entre Lucid-Lab et le Client à compter de la signature du Bon de commande et du présent Contrat par le Client.</p>
  <h2>Article 2 — Objet et périmètre de la prestation</h2>
  <p><strong>Intitulé de la mission :</strong> ${escapeHtml(data.title)}</p>
  <h3>Périmètre des Prestations</h3>
  ${paragraph(data.scopePerimeter)}
  <h3>Livrables attendus</h3>
  ${bulletList(data.deliverables)}
  <h3>Hors périmètre</h3>
  <p>Toute prestation non explicitement listée dans le Bon de commande ou le présent Contrat, notamment les refontes graphiques, nouveaux services, intégrations supplémentaires, contenus ou développements non prévus, fera l'objet d'un devis ou accord écrit distinct.</p>
  <h2>Article 3 — Calendrier et conditions de démarrage</h2>
  ${timelineList(data.calendarTimeline)}
  <p>Le démarrage effectif est conditionné à la signature des documents, à la réception du premier paiement, et à la transmission par le Client des accès, contenus et informations nécessaires.</p>
  <h2>Article 4 — Prix et modalités de paiement</h2>
  <table class="table">
    <tr><th>Prix total HT</th><td>${formatEuro(data.amountHt)}</td></tr>
    <tr><th>TVA</th><td>${formatPercent(data.vatRate)} — ${formatEuro(data.vatAmount)}</td></tr>
    <tr><th>Prix TTC</th><td>${formatEuro(data.amountTtc)}</td></tr>
    <tr><th>Modalité retenue</th><td>${data.pricingModel === 'monthly' ? `Mensuel 12 mois — ${formatEuro(data.monthlyAmount)} HT/mois` : `One-shot — ${formatEuro(data.setupAmount ?? data.amountHt)} HT`}</td></tr>
  </table>
  <h2>Article 5 — Collaboration du Client</h2>
  <p>Le Client s'engage à fournir les accès, validations, contenus et retours nécessaires dans des délais raisonnables. Tout retard significatif dans ces éléments peut décaler le calendrier indicatif.</p>
  <h2>Article 6 — Prochaines étapes</h2>
  ${bulletList(data.nextSteps)}
  ${signatureBlock('Contract')}
</body>
</html>`;
}

export function buildBonDeCommandeHtmlDocuments(input: BuildBonDeCommandeHtmlInput): DocuSealHtmlDocumentPayload[] {
  return [
    {
      name: 'lucid-lab-bon-de-commande',
      html: bonDeCommandeHtml(input),
      html_footer: footer(),
      size: 'A4',
      position: 0,
    },
    {
      name: 'lucid-lab-contrat-prestation',
      html: contractHtml(input),
      html_footer: footer(),
      size: 'A4',
      position: 1,
    },
  ];
}
