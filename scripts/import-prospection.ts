/**
 * Charge les listes de prospection produites dans docs/prospection/ vers Lucid OS.
 *
 * Usage :
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/import-prospection.ts --dry
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/import-prospection.ts
 *
 * Idempotent : importProspectionTargets ignore une cible déjà présente pour le
 * même nom et le même secteur, donc relancer le script ne crée pas de doublons.
 * Aucune fiche client n'est créée ici : une cible n'entre dans le CRM qu'au
 * moment où elle répond ou pose un rendez-vous.
 */

// Charge .env.local comme le fait Next.js, avant toute lecture de process.env.
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import { readFileSync } from 'node:fs';
import { importProspectionTargets, type ProspectionImportRow } from '../src/lib/admin/prospection';

const DRY_RUN = process.argv.includes('--dry');

function clean(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\*\*|\*\*$/g, '');
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (lowered === 'non trouvé' || lowered === 'non trouve' || lowered === '-' || lowered === 'n/a') return null;
  return trimmed;
}

/** Première valeur numérique d'une tranche du type « 50-99 » ou « environ 120 ». */
function parseHeadcount(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function parseCsv(path: string): string[][] {
  const rows: string[][] = [];
  const text = readFileSync(path, 'utf8');
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

/**
 * Lignes du PREMIER tableau markdown seulement, en-tête et séparateur exclus.
 *
 * Les fichiers de liste contiennent aussi des tableaux annexes (« pistes à
 * qualifier », « cibles écartées ») que les agents ont volontairement sortis de
 * la liste d'appel : on ne les importe pas.
 */
function parseMarkdownTable(path: string, headerStartsWith: string): string[][] {
  const lines = readFileSync(path, 'utf8').split('\n');
  const rows: string[][] = [];
  let inTable = false;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      if (inTable) break;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (!inTable) {
      if (cells[0]?.startsWith(headerStartsWith)) inTable = true;
      continue;
    }
    if (cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, '')) || cell === '')) continue;
    rows.push(cells);
  }
  return rows;
}

/**
 * Lignes de TOUS les tableaux dont l'en-tête est exactement celui passé en
 * paramètre.
 *
 * Les listes avocats et crèches contiennent plusieurs tableaux : les blocs
 * d'appel, mais aussi des tableaux de méthode, de cibles écartées et de pistes
 * à qualifier. Matcher l'en-tête complet évite d'importer ces derniers, et
 * permet de distinguer le bloc Centre-Val de Loire (colonne CAP'TN) du bloc
 * métropoles, qui ne la porte pas.
 */
function parseMarkdownTablesByHeader(path: string, header: string[]): string[][] {
  const lines = readFileSync(path, 'utf8').split('\n');
  const rows: string[][] = [];
  let inTable = false;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      inTable = false;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (!inTable) {
      if (cells.length === header.length && header.every((label, i) => cells[i] === label)) {
        inTable = true;
      }
      continue;
    }
    if (cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, '')) || cell === '')) continue;
    rows.push(cells);
  }
  return rows;
}

const ENTETE_AVOCATS_CVL = [
  'Cabinet', 'Ville', 'Dépt', 'Effectif', 'Contact à joindre', 'Fonction',
  'Téléphone', 'Email', 'Site', 'SIREN', "CAP'TN", 'Source contact',
];
const ENTETE_AVOCATS_METROPOLES = [
  'Cabinet', 'Ville', 'Dépt', 'Effectif', 'Contact à joindre', 'Fonction',
  'Téléphone', 'Email', 'Site', 'SIREN', 'Source contact',
];
const ENTETE_CRECHES = [
  'Gestionnaire', 'Ville', 'Dépt', 'Sites', 'Effectif', 'Contact à joindre', 'Fonction',
  'Téléphone', 'Email', 'Site', 'SIREN', "CAP'TN", 'Source contact',
];

const HOOK_CAPTN = 'Éligible à la subvention régionale CAP TN (Centre-Val de Loire).';

function avocatsRows(): ProspectionImportRow[] {
  const chemin = 'docs/prospection/liste-avocats-france.md';
  const cvl = parseMarkdownTablesByHeader(chemin, ENTETE_AVOCATS_CVL).map((cells) => ({
    cells,
    // Le mois d'août est le seul sans audience : c'est l'ouverture du script.
    hook: [HOOK_CAPTN, "Appeler en août : c'est le seul mois sans audience."].join(' '),
  }));
  const metropoles = parseMarkdownTablesByHeader(chemin, ENTETE_AVOCATS_METROPOLES).map((cells) => ({
    cells,
    hook: "Appeler en août : c'est le seul mois sans audience.",
  }));

  return [...cvl, ...metropoles].map(({ cells, hook }) => ({
    name: cells[0].replace(/\*\*/g, '').trim(),
    sector: 'avocats',
    city: clean(cells[1]),
    country: 'France',
    employeeCount: parseHeadcount(clean(cells[3])),
    contactName: clean(cells[4]),
    contactTitle: clean(cells[5]),
    contactPhone: clean(cells[6]),
    contactEmail: clean(cells[7]),
    websiteUrl: clean(cells[8]),
    // La colonne source est la dernière : son index dépend du bloc.
    sourceUrl: clean(cells[cells.length - 1]),
    hook,
  }));
}

function crechesRows(): ProspectionImportRow[] {
  const rows = parseMarkdownTablesByHeader('docs/prospection/liste-creches-france.md', ENTETE_CRECHES);
  return rows.map((cells) => {
    const sites = clean(cells[3]);
    return {
      name: cells[0].replace(/\*\*/g, '').trim(),
      sector: 'creches',
      city: clean(cells[1]),
      country: 'France',
      employeeCount: parseHeadcount(clean(cells[4])),
      contactName: clean(cells[5]),
      contactTitle: clean(cells[6]),
      contactPhone: clean(cells[7]),
      contactEmail: clean(cells[8]),
      websiteUrl: clean(cells[9]),
      sourceUrl: clean(cells[12]),
      // Le nombre de sites est le vrai critère de qualification de cette
      // verticale : c'est lui qui doit s'afficher sur la fiche d'appel.
      hook: [
        sites ? `${sites} établissements ouverts : la coordination est le sujet.` : null,
        clean(cells[11])?.toLowerCase() === 'oui' ? HOOK_CAPTN : null,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
}

function franceRows(): ProspectionImportRow[] {
  const rows = parseCsv('docs/prospection/liste-experts-comptables-france.csv').slice(1);
  return rows.map((cells) => ({
    name: cells[0].trim(),
    sector: 'experts-comptables',
    city: clean(cells[1]),
    country: 'France',
    employeeCount: parseHeadcount(clean(cells[3])),
    websiteUrl: clean(cells[8]),
    contactName: clean(cells[4]),
    contactTitle: clean(cells[5]),
    contactPhone: clean(cells[6]),
    contactEmail: clean(cells[7]),
    sourceUrl: clean(cells[11]),
    hook: clean(cells[10])?.toLowerCase() === 'oui' ? 'Éligible à la subvention régionale CAP TN (Centre-Val de Loire).' : null,
  }));
}

function belgiqueRows(): ProspectionImportRow[] {
  const rows = parseMarkdownTable('docs/prospection/liste-experts-comptables-belgique.md', 'Cabinet');
  return rows.map((cells) => ({
    name: cells[0].replace(/\*\*/g, '').trim(),
    sector: 'experts-comptables',
    city: clean(cells[1]),
    country: 'Belgique',
    employeeCount: parseHeadcount(clean(cells[2])),
    websiteUrl: clean(cells[7]),
    contactName: clean(cells[3]),
    contactTitle: clean(cells[4]),
    contactPhone: clean(cells[5]),
    contactEmail: clean(cells[6]),
    sourceUrl: clean(cells[8]),
  }));
}

function banquesRows(): ProspectionImportRow[] {
  const rows = parseMarkdownTable('docs/prospection/liste-banques-privees.md', 'Établissement');
  return rows.map((cells) => {
    const group = clean(cells[3]);
    return {
      name: cells[0].replace(/\*\*/g, '').trim(),
      sector: 'banques-privees',
      city: clean(cells[1]),
      employeeCount: parseHeadcount(clean(cells[2])),
      contactName: clean(cells[4]),
      contactTitle: clean(cells[5]),
      contactLinkedin: clean(cells[6])?.startsWith('http') ? clean(cells[6]) : null,
      sourceUrl: clean(cells[7]),
      // On n'appelle pas un standard de banque privée : l'entrée se fait par
      // LinkedIn ou l'équipe technique. Le rappel vit avec la cible.
      hook: [
        'Entrée par LinkedIn ou par l équipe technique, jamais par le standard.',
        group ? `Groupe : ${group}. Si ça marche ici, ça se déroule dans le groupe.` : null,
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
}

async function main(): Promise<void> {
  const groups: Array<{ label: string; rows: ProspectionImportRow[] }> = [
    { label: 'Experts-comptables France', rows: franceRows() },
    { label: 'Experts-comptables Belgique', rows: belgiqueRows() },
    { label: 'Banques privées', rows: banquesRows() },
    { label: 'Avocats France', rows: avocatsRows() },
    { label: 'Crèches France', rows: crechesRows() },
  ];

  for (const group of groups) {
    const named = group.rows.filter((row) => row.contactName).length;
    console.log(`${group.label} : ${group.rows.length} lignes, ${named} avec un contact nommé`);

    if (DRY_RUN) {
      console.log('  exemple :', JSON.stringify(group.rows[0], null, 2));
      continue;
    }

    const result = await importProspectionTargets(group.rows);
    console.log(`  importées : ${result.created}, déjà présentes : ${result.skipped}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
