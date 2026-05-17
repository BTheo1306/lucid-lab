#!/usr/bin/env node
import fs from 'node:fs';

const apiBase = process.env.DOCUSEAL_API_BASE_URL || 'https://api.docuseal.com/api';
const apiKey = process.env.DOCUSEAL_API_KEY;
if (!apiKey) {
  throw new Error('DOCUSEAL_API_KEY is required.');
}

const bodyHtml = fs.readFileSync(new URL('../docs/docuseal/bdc-contract-v4.html', import.meta.url), 'utf8');
const footerHtml = fs.readFileSync(new URL('../docs/docuseal/bdc-contract-v4-footer.html', import.meta.url), 'utf8');

const payload = {
  name: 'Lucid-Lab BDC + Contrat v4 (HTML)',
  external_id: 'lucid_lab_bdc_contract_v4_html',
  folder_name: 'Default',
  shared_link: true,
  size: 'A4',
  html: bodyHtml,
  html_footer: footerHtml,
};

const response = await fetch(`${apiBase.replace(/\/+$/, '')}/templates/html`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-Token': apiKey,
  },
  body: JSON.stringify(payload),
});

const data = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`DocuSeal template upsert failed (${response.status}): ${JSON.stringify(data)}`);
}

const templateId = data?.id;
if (!templateId) {
  throw new Error(`DocuSeal template upsert returned no template id: ${JSON.stringify(data)}`);
}

console.log(JSON.stringify({
  templateId,
  name: data.name,
  externalId: data.external_id,
  source: data.source,
  fieldsCount: Array.isArray(data.fields) ? data.fields.length : 0,
}, null, 2));
