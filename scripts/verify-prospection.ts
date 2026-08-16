/**
 * Verifie que les fiches du CRM disent la meme chose que les listes de
 * docs/prospection. A relancer apres chaque import.
 *
 * Usage :
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/verify-prospection.ts
 *
 * Sort en code 1 des qu'un champ diverge, et affiche la ligne concernee.
 *
 * Volontairement ecrit sans reutiliser les parseurs de import-prospection.ts :
 * ceux-ci lisent des index de colonnes en dur, et les reutiliser reproduirait
 * une eventuelle erreur d'index au lieu de la reveler. Ici on lit par NOM de
 * colonne.
 *
 * C'est ce controle qui a revele que l'import jetait telephone et email des
 * cibles sans contact nomme : trois cartes annoncaient « Telephone non trouve »
 * alors que la liste en avait un.
 */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import { readFileSync } from 'node:fs';
import { supabase } from '../src/lib/bot/db/supabase';

type Ligne = Record<string, string>;

function vide(valeur: string | null | undefined): string | null {
  if (!valeur) return null;
  const v = valeur.trim();
  if (!v || v.toLowerCase() === 'non trouvé' || v.toLowerCase() === 'non renseigné') return null;
  return v;
}

/** Tous les tableaux markdown du fichier, chacun en lignes {colonne: valeur}. */
function tableauxMarkdown(chemin: string): Ligne[][] {
  const tableaux: Ligne[][] = [];
  let entetes: string[] | null = null;
  let courant: Ligne[] = [];

  for (const brut of readFileSync(chemin, 'utf8').split('\n')) {
    const ligne = brut.trim();
    if (!ligne.startsWith('|')) {
      if (entetes && courant.length) tableaux.push(courant);
      entetes = null;
      courant = [];
      continue;
    }
    const cellules = ligne.split('|').slice(1, -1).map((c) => c.trim());
    if (!entetes) {
      entetes = cellules;
      continue;
    }
    if (cellules.every((c) => /^-*$/.test(c))) continue;
    const objet: Ligne = {};
    entetes.forEach((h, i) => (objet[h] = cellules[i] ?? ''));
    courant.push(objet);
  }
  if (entetes && courant.length) tableaux.push(courant);
  return tableaux;
}

function parseCsv(chemin: string): Ligne[] {
  const texte = readFileSync(chemin, 'utf8');
  const lignes: string[][] = [];
  let champ = '';
  let ligne: string[] = [];
  let dansGuillemets = false;
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte[i];
    if (dansGuillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i += 1; }
      else if (c === '"') dansGuillemets = false;
      else champ += c;
      continue;
    }
    if (c === '"') dansGuillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n') { ligne.push(champ); if (ligne.some((x) => x.trim())) lignes.push(ligne); ligne = []; champ = ''; }
    else if (c !== '\r') champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); if (ligne.some((x) => x.trim())) lignes.push(ligne); }
  const [entetes, ...reste] = lignes;
  return reste.map((cells) => Object.fromEntries(entetes.map((h, i) => [h, cells[i] ?? ''])));
}

let ecarts = 0;

async function verifier(label: string, secteur: string, lignes: Ligne[], colonneNom: string): Promise<void> {
  const { data } = await supabase
    .from('prospect_companies')
    .select('id,name,city,website_url,prospect_people(full_name,title,phone,email)')
    .eq('source', 'prospection_manuelle')
    .eq('industry', secteur);

  const parNom = new Map((data ?? []).map((r) => [String(r.name), r]));
  let controles = 0;

  for (const ligne of lignes) {
    const nom = ligne[colonneNom]?.replace(/\*\*/g, '').trim();
    const fiche = parNom.get(nom);
    if (!fiche) {
      console.log(`  MANQUANTE en base : ${nom}`);
      ecarts += 1;
      continue;
    }
    const personne = (fiche.prospect_people as Array<Record<string, string>> | null)?.[0] ?? {};
    const attendus: Array<[string, string | null, string | null]> = [
      ['ville', vide(ligne['Ville']), vide(fiche.city as string)],
      ['contact', vide(ligne['Contact à joindre']), vide(personne.full_name)],
      ['fonction', vide(ligne['Fonction']), vide(personne.title)],
      ['telephone', vide(ligne['Téléphone']), vide(personne.phone)],
      ['email', vide(ligne['Email']), vide(personne.email)],
      ['site', vide(ligne['Site']), vide(fiche.website_url as string)],
    ];
    for (const [champ, doc, base] of attendus) {
      controles += 1;
      if (doc !== base) {
        console.log(`  ECART ${nom} [${champ}]\n     doc  : ${JSON.stringify(doc)}\n     base : ${JSON.stringify(base)}`);
        ecarts += 1;
      }
    }
  }
  console.log(`${label} : ${lignes.length} lignes, ${controles} champs compares`);
}

async function main(): Promise<void> {
  const avocats = tableauxMarkdown('docs/prospection/liste-avocats-france.md')
    .filter((t) => 'Contact à joindre' in t[0])
    .flat();
  await verifier('Avocats France', 'avocats', avocats, 'Cabinet');

  const creches = tableauxMarkdown('docs/prospection/liste-creches-france.md')
    .filter((t) => 'Contact à joindre' in t[0])
    .flat();
  await verifier('Creches France', 'creches', creches, 'Gestionnaire');

  const ec = parseCsv('docs/prospection/liste-experts-comptables-france.csv');
  await verifier('Experts-comptables France (CSV, source de l import)', 'experts-comptables', ec, 'Cabinet');

  // Le tableau du bloc 3 doit dire exactement la meme chose que la fin du CSV.
  const bloc3 = tableauxMarkdown('docs/prospection/liste-experts-comptables-france.md')
    .filter((t) => 'CAP\'TN' in t[0])
    .flat()
    .filter((l) => l["CAP'TN"] === 'Non');
  const csvNoms = new Set(ec.map((l) => l['Cabinet']));
  const absents = bloc3.filter((l) => !csvNoms.has(l['Cabinet'])).map((l) => l['Cabinet']);
  if (absents.length) {
    console.log(`  ECART markdown/CSV : ${absents.length} cabinets du markdown absents du CSV`);
    absents.forEach((n) => console.log(`     ${n}`));
    ecarts += absents.length;
  } else {
    console.log(`Coherence markdown <-> CSV : ${bloc3.length} lignes verifiees`);
  }

  console.log(`\n${ecarts === 0 ? 'AUCUN ECART' : `${ecarts} ECARTS`} entre les listes et le CRM`);
  if (ecarts > 0) process.exitCode = 1;
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
