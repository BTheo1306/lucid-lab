import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { ensureWorkspaceId, missingLeadEngineRelation } from './lead-engine-store';
import {
  upsertLucidClientIntake,
  createLucidClientContact,
  createLucidClientInteraction,
  createLucidClientTask,
  recordLucidAuditEvent,
} from './lucid-os';

/**
 * Prospection sortante : appels et emails.
 *
 * Une cible vit dans prospect_companies / prospect_people tant qu'elle n'a pas
 * répondu. Chaque tentative écrit une ligne dans prospection_touches, ce qui
 * donne l'historique horodaté. Le statut large reste porté par
 * prospect_companies.status, dont l'enum couvre déjà contacted, replied,
 * meeting_booked et disqualified.
 *
 * Règle métier posée par Jules : la fiche CRM n'est créée qu'au moment où le
 * prospect répond ou qu'un rendez-vous est posé. Avant ça, rien n'entre dans le
 * CRM clients.
 */

export type ProspectionChannel = 'call' | 'email' | 'linkedin' | 'other';

export type ProspectionOutcome =
  | 'barrage'
  | 'repondeur'
  | 'injoignable'
  | 'refus'
  | 'a_rappeler'
  | 'interesse'
  | 'rdv_pris'
  | 'email_envoye'
  | 'relance'
  | 'note'
  | 'mauvais_numero'
  | 'pas_le_bon_interlocuteur';

type OutcomeConfig = {
  label: string;
  tone: 'neutral' | 'good' | 'warning' | 'danger';
  /** Statut porté par prospect_companies après cette touche. null = inchangé. */
  companyStatus: 'contacted' | 'replied' | 'meeting_booked' | 'disqualified' | null;
  /** Cette issue fait entrer le prospect dans le CRM clients. */
  promotesToCrm: boolean;
  defaultChannel: ProspectionChannel;
};

export const PROSPECTION_OUTCOMES: Record<ProspectionOutcome, OutcomeConfig> = {
  barrage: { label: 'Barrage', tone: 'warning', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'call' },
  repondeur: { label: 'Répondeur', tone: 'warning', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'call' },
  injoignable: { label: 'Injoignable', tone: 'neutral', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'call' },
  refus: { label: 'Refus', tone: 'danger', companyStatus: 'disqualified', promotesToCrm: false, defaultChannel: 'call' },
  a_rappeler: { label: 'À rappeler', tone: 'warning', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'call' },
  interesse: { label: 'A répondu', tone: 'good', companyStatus: 'replied', promotesToCrm: true, defaultChannel: 'call' },
  rdv_pris: { label: 'RDV pris', tone: 'good', companyStatus: 'meeting_booked', promotesToCrm: true, defaultChannel: 'call' },
  email_envoye: { label: 'Email envoyé', tone: 'neutral', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'email' },
  relance: { label: 'Relancé', tone: 'neutral', companyStatus: 'contacted', promotesToCrm: false, defaultChannel: 'email' },
  note: { label: 'Note', tone: 'neutral', companyStatus: null, promotesToCrm: false, defaultChannel: 'other' },
  // Ces deux issues disent que la fiche est fausse, pas que le prospect refuse.
  // Elles laissent donc le statut inchangé : une fois le numéro ou le contact
  // corrigé depuis le board, la cible reste dans « À appeler ».
  mauvais_numero: { label: 'Mauvais numéro', tone: 'warning', companyStatus: null, promotesToCrm: false, defaultChannel: 'call' },
  pas_le_bon_interlocuteur: { label: 'Pas le bon interlocuteur', tone: 'warning', companyStatus: null, promotesToCrm: false, defaultChannel: 'call' },
};

export const PROSPECTION_OUTCOME_KEYS = Object.keys(PROSPECTION_OUTCOMES) as ProspectionOutcome[];

export function isProspectionOutcome(value: string): value is ProspectionOutcome {
  return Object.prototype.hasOwnProperty.call(PROSPECTION_OUTCOMES, value);
}

export type ProspectionTouch = {
  id: string;
  channel: ProspectionChannel;
  outcome: ProspectionOutcome;
  notes: string | null;
  ownerLabel: string | null;
  occurredAt: string;
  callbackAt: string | null;
};

export type ProspectionTarget = {
  companyId: string;
  name: string;
  city: string | null;
  country: string | null;
  sector: string | null;
  employeeCount: number | null;
  websiteUrl: string | null;
  ownerLabel: string | null;
  status: string;
  personId: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactLinkedin: string | null;
  /** Accroche personnalisée, alimentée par l'enrichissement du top 25. */
  hook: string | null;
  touches: ProspectionTouch[];
  lastTouch: ProspectionTouch | null;
  callbackAt: string | null;
  /** Rappel arrivé à échéance. Calculé ici pour que le rendu reste pur. */
  callbackDue: boolean;
};

/**
 * Regroupements de statuts utilisés à la fois par les compteurs et par les
 * filtres, pour qu'une tuile n'annonce jamais un chiffre que le filtre
 * correspondant ne retrouve pas.
 *
 * Le moteur de leads a laissé des cibles en `discovered`, l'import de listes les
 * crée en `approved` : les deux veulent dire la même chose ici, personne ne les
 * a encore appelées.
 */
export const STATUTS_A_APPELER = ['discovered', 'enriched', 'validated', 'approved'];
export const STATUTS_AU_CRM = ['replied', 'meeting_booked', 'converted'];

/**
 * Origine des cibles construites a la main pour la prospection telephonique.
 * Sert a la fois a l'import et au filtrage de l'onglet.
 */
export const SOURCE_PROSPECTION = 'prospection_manuelle';

/** Valeurs de filtre qui recouvrent plusieurs statuts. */
export const FILTRE_A_APPELER = 'a_appeler';
export const FILTRE_AU_CRM = 'au_crm';

export function estAAppeler(status: string): boolean {
  return STATUTS_A_APPELER.includes(status);
}

export function estAuCrm(status: string): boolean {
  return STATUTS_AU_CRM.includes(status);
}

export type ProspectionFilters = {
  sector?: string | null;
  status?: string | null;
  owner?: string | null;
  /** Ne remonte que les rappels arrivés à échéance. */
  callbackDue?: boolean;
};

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** L'accroche vit dans raw_data pour ne pas ajouter une colonne pour un texte libre. */
function readHook(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== 'object') return null;
  return asText((rawData as Record<string, unknown>).hook);
}

export async function listProspectionTargets(filters: ProspectionFilters = {}): Promise<ProspectionTarget[]> {
  const workspaceId = await ensureWorkspaceId();

  let query = supabase
    .from('prospect_companies')
    .select('id,name,city,country,industry,employee_count,website_url,owner_label,status,raw_data')
    .eq('workspace_id', workspaceId)
    // L'onglet ne montre que les cibles issues des listes de prospection.
    // La table est partagee avec le moteur de leads (TheirStack, API gouv) et
    // avec le formulaire d'audit : ces lignes-la n'ont jamais ete qualifiees
    // pour du telephone, souvent sans numero, et elles noyaient les cibles
    // reelles. Elles restent accessibles depuis Moteur de leads.
    .eq('source', SOURCE_PROSPECTION)
    .order('name', { ascending: true });

  if (filters.sector) query = query.eq('industry', filters.sector);
  if (filters.status === FILTRE_A_APPELER) query = query.in('status', STATUTS_A_APPELER);
  else if (filters.status === FILTRE_AU_CRM) query = query.in('status', STATUTS_AU_CRM);
  else if (filters.status) query = query.eq('status', filters.status);
  if (filters.owner) query = query.eq('owner_label', filters.owner);

  const { data: companies, error } = await query;
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw new Error(`listProspectionTargets companies: ${error.message}`);
  }
  if (!companies || companies.length === 0) return [];

  const companyIds = companies.map((row) => String(row.id));

  const [{ data: people }, { data: touches, error: touchesError }] = await Promise.all([
    supabase
      .from('prospect_people')
      .select('id,company_id,full_name,title,phone,email,linkedin_url')
      .in('company_id', companyIds),
    supabase
      .from('prospection_touches')
      .select('id,company_id,channel,outcome,notes,owner_label,occurred_at,callback_at')
      .in('company_id', companyIds)
      .order('occurred_at', { ascending: false }),
  ]);

  // Tant que la migration n'est pas appliquée, l'écran reste lisible sans historique.
  if (touchesError && !missingLeadEngineRelation(touchesError)) {
    throw new Error(`listProspectionTargets touches: ${touchesError.message}`);
  }

  const personByCompany = new Map<string, Record<string, unknown>>();
  for (const person of people ?? []) {
    const key = String(person.company_id);
    // Le premier trouvé fait office de contact principal : une cible de
    // prospection n'a qu'une personne à joindre par construction.
    if (!personByCompany.has(key)) personByCompany.set(key, person as Record<string, unknown>);
  }

  const touchesByCompany = new Map<string, ProspectionTouch[]>();
  for (const row of touches ?? []) {
    const key = String(row.company_id);
    const list = touchesByCompany.get(key) ?? [];
    list.push({
      id: String(row.id),
      channel: String(row.channel) as ProspectionChannel,
      outcome: String(row.outcome) as ProspectionOutcome,
      notes: asText(row.notes),
      ownerLabel: asText(row.owner_label),
      occurredAt: String(row.occurred_at),
      callbackAt: row.callback_at ? String(row.callback_at) : null,
    });
    touchesByCompany.set(key, list);
  }

  const now = Date.now();

  const targets = companies.map((company) => {
    const companyId = String(company.id);
    const person = personByCompany.get(companyId);
    const companyTouches = touchesByCompany.get(companyId) ?? [];

    // Un rappel n'est en attente que si aucune tentative n'a eu lieu depuis.
    // Chercher simplement le dernier « à rappeler » gardait la date affichée
    // pour toujours : une fois le rappel honoré, la cible restait comptée dans
    // « Rappels dus », et ce compteur ne pouvait que grandir.
    const indexRappel = companyTouches.findIndex((touch) => touch.outcome === 'a_rappeler' && touch.callbackAt);
    const rappelHonore =
      indexRappel >= 0 &&
      // Les notes ne sont pas des tentatives : elles n'annulent pas le rappel.
      companyTouches.slice(0, indexRappel).some((touch) => touch.outcome !== 'note');
    const pendingCallback = indexRappel >= 0 && !rappelHonore ? companyTouches[indexRappel] : undefined;

    return {
      companyId,
      name: String(company.name),
      city: asText(company.city),
      country: asText(company.country),
      sector: asText(company.industry),
      employeeCount: typeof company.employee_count === 'number' ? company.employee_count : null,
      websiteUrl: asText(company.website_url),
      ownerLabel: asText(company.owner_label),
      status: String(company.status),
      personId: person ? String(person.id) : null,
      contactName: person ? asText(person.full_name) : null,
      contactTitle: person ? asText(person.title) : null,
      contactPhone: person ? asText(person.phone) : null,
      contactEmail: person ? asText(person.email) : null,
      contactLinkedin: person ? asText(person.linkedin_url) : null,
      hook: readHook(company.raw_data),
      touches: companyTouches,
      lastTouch: companyTouches[0] ?? null,
      callbackAt: pendingCallback?.callbackAt ?? null,
      callbackDue: Boolean(pendingCallback?.callbackAt) && new Date(pendingCallback!.callbackAt!).getTime() <= now,
    } satisfies ProspectionTarget;
  });

  if (!filters.callbackDue) return targets;
  return targets.filter((target) => target.callbackDue);
}

export type RecordTouchInput = {
  companyId: string;
  personId?: string | null;
  outcome: ProspectionOutcome;
  channel?: ProspectionChannel;
  notes?: string | null;
  ownerLabel?: string | null;
  callbackAt?: string | null;
};

/**
 * Enregistre une tentative et fait avancer le statut de la cible.
 * Si l'issue vaut promotion (a répondu, rendez-vous pris), la fiche CRM est créée.
 */
export async function recordProspectionTouch(input: RecordTouchInput): Promise<{ clientId: string | null }> {
  const workspaceId = await ensureWorkspaceId();
  const config = PROSPECTION_OUTCOMES[input.outcome];
  const channel = input.channel ?? config.defaultChannel;
  const callbackAt = input.outcome === 'a_rappeler' ? input.callbackAt ?? null : null;

  if (input.outcome === 'a_rappeler' && !callbackAt) {
    throw new Error('Une date de rappel est requise pour un « à rappeler ».');
  }

  const { error } = await supabase.from('prospection_touches').insert({
    workspace_id: workspaceId,
    company_id: input.companyId,
    person_id: input.personId ?? null,
    channel,
    outcome: input.outcome,
    notes: input.notes ?? null,
    owner_label: input.ownerLabel ?? null,
    callback_at: callbackAt,
  });
  if (error) throw new Error(`recordProspectionTouch: ${error.message}`);

  if (config.companyStatus) {
    await supabase
      .from('prospect_companies')
      .update({ status: config.companyStatus, updated_at: new Date().toISOString() })
      .eq('id', input.companyId);
  }

  if (input.personId) {
    const patch: Record<string, unknown> = { last_contacted_at: new Date().toISOString() };
    if (config.companyStatus) patch.status = config.companyStatus;
    if (config.promotesToCrm) patch.last_replied_at = new Date().toISOString();
    await supabase.from('prospect_people').update(patch).eq('id', input.personId);
  }

  if (!config.promotesToCrm) return { clientId: null };
  return { clientId: await promoteTargetToCrm(input.companyId, input.outcome, input.ownerLabel ?? null) };
}

/**
 * Crée la fiche prospect dans le CRM clients. Appelée uniquement quand la cible
 * a répondu ou posé un rendez-vous, jamais à l'import.
 * Compose les mêmes helpers que le pont LinkedIn (lead-engine-crm-bridge), avec
 * une formulation adaptée à la prospection téléphonique.
 */
async function promoteTargetToCrm(
  companyId: string,
  outcome: ProspectionOutcome,
  ownerLabel: string | null,
): Promise<string | null> {
  const { data: company } = await supabase
    .from('prospect_companies')
    .select('name,industry,website_url,domain,city')
    .eq('id', companyId)
    .maybeSingle();
  if (!company) return null;

  const { data: person } = await supabase
    .from('prospect_people')
    .select('id,full_name,title,email,phone,linkedin_url')
    .eq('company_id', companyId)
    .limit(1)
    .maybeSingle();

  const meetingBooked = outcome === 'rdv_pris';
  const owner = ownerLabel ?? 'Anthony';

  const client = await upsertLucidClientIntake({
    name: String(company.name),
    status: 'lead',
    lifecycleStage: meetingBooked ? 'meeting_booked' : 'qualified',
    industry: company.industry ? String(company.industry) : null,
    websiteUrl: company.website_url
      ? String(company.website_url)
      : company.domain
        ? `https://${String(company.domain)}`
        : null,
    primaryContactName: person?.full_name ? String(person.full_name) : null,
    primaryContactEmail: person?.email ? String(person.email) : null,
    source: 'prospection_telephonique',
    ownerLabel: owner,
  });

  const contactId = person
    ? await createLucidClientContact({
        clientId: client.id,
        fullName: person.full_name ? String(person.full_name) : 'Contact',
        role: person.title ? String(person.title) : null,
        email: person.email ? String(person.email) : null,
        phone: person.phone ? String(person.phone) : null,
        linkedinUrl: person.linkedin_url ? String(person.linkedin_url) : null,
        isPrimary: true,
      })
    : null;

  await createLucidClientInteraction({
    clientId: client.id,
    contactId,
    interactionType: 'call',
    direction: 'outbound',
    summary: meetingBooked
      ? 'Rendez-vous pris en appel sortant (prospection)'
      : 'Retour positif en appel sortant (prospection)',
    sentiment: 'positive',
    sourceSystem: 'admin',
  });

  await createLucidClientTask({
    clientId: client.id,
    contactId,
    title: meetingBooked ? 'Préparer le rendez-vous' : 'Rappeler et proposer un créneau',
    description: `Issu de la prospection sortante${company.city ? ` (${String(company.city)})` : ''}.`,
    priority: 'high',
    ownerLabel: owner,
  });

  await recordLucidAuditEvent({
    eventType: 'prospection_converted_to_crm',
    summary: `Prospect promu depuis la prospection sortante (${String(company.name)})`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'prospect_companies',
    targetId: companyId,
    riskLevel: 'low',
    details: { outcome, source: 'prospection_telephonique' },
  });

  return client.id;
}

/** Statuts qu'on peut poser à la main pour rattraper une erreur de saisie. */
export const STATUTS_CORRIGEABLES = [
  'approved',
  'contacted',
  'replied',
  'meeting_booked',
  'disqualified',
] as const;

export type StatutCorrigeable = (typeof STATUTS_CORRIGEABLES)[number];

export function estStatutCorrigeable(value: string): value is StatutCorrigeable {
  return (STATUTS_CORRIGEABLES as readonly string[]).includes(value);
}

/** Libellés français des statuts corrigeables, pour la trace laissée en note. */
const STATUT_LABELS: Record<StatutCorrigeable, string> = {
  approved: 'à appeler',
  contacted: 'contacté',
  replied: 'a répondu',
  meeting_booked: 'rendez-vous pris',
  disqualified: 'écarté',
};

/**
 * Corrige le statut d'une cible sans passer par une issue d'appel.
 *
 * Le statut n'avançait que dans un sens : un « Refus » cliqué par erreur
 * écartait la cible définitivement, et rien ne permettait de la remettre dans
 * la liste à appeler. La correction laisse une trace (touche `note`) pour que
 * l'historique reste lisible, et promeut au CRM si on passe la cible en
 * « a répondu » ou « rendez-vous pris ».
 */
export async function setProspectionStatus(
  companyId: string,
  status: StatutCorrigeable,
  ownerLabel: string | null,
): Promise<{ clientId: string | null }> {
  const workspaceId = await ensureWorkspaceId();

  const { data: avant } = await supabase
    .from('prospect_companies')
    .select('status')
    .eq('id', companyId)
    .maybeSingle();
  const ancien = avant ? String(avant.status) : null;
  if (ancien === status) return { clientId: null };

  const { error } = await supabase
    .from('prospect_companies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', companyId);
  if (error) throw new Error(`setProspectionStatus: ${error.message}`);

  const libelle = (valeur: string | null): string =>
    valeur && estStatutCorrigeable(valeur) ? STATUT_LABELS[valeur] : (valeur ?? 'inconnu');

  await supabase.from('prospection_touches').insert({
    workspace_id: workspaceId,
    company_id: companyId,
    channel: 'other',
    outcome: 'note',
    notes: `Statut corrigé à la main : ${libelle(ancien)} vers ${libelle(status)}.`,
    owner_label: ownerLabel,
  });

  if (status !== 'replied' && status !== 'meeting_booked') return { clientId: null };
  // La cible était déjà passée au CRM : sa fiche client existe, la repromouvoir
  // ne ferait qu'y empiler un deuxième contact, une deuxième interaction et une
  // deuxième tâche.
  if (ancien === 'replied' || ancien === 'meeting_booked' || ancien === 'converted') return { clientId: null };
  return {
    clientId: await promoteTargetToCrm(companyId, status === 'meeting_booked' ? 'rdv_pris' : 'interesse', ownerLabel),
  };
}

export async function setProspectionOwner(companyId: string, ownerLabel: string | null): Promise<void> {
  const { error } = await supabase
    .from('prospect_companies')
    .update({ owner_label: ownerLabel, updated_at: new Date().toISOString() })
    .eq('id', companyId);
  if (error) throw new Error(`setProspectionOwner: ${error.message}`);
}

/**
 * Correction d'une fiche depuis le board.
 *
 * Une clé absente laisse le champ tel quel, une clé présente l'écrase (chaîne
 * vide comprise, qui vide le champ). C'est ce qui permet d'ajouter le seul
 * téléphone manquant sans toucher au reste de la fiche.
 */
export type ProspectionContactPatch = {
  companyId: string;
  contactName?: string | null;
  contactTitle?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  websiteUrl?: string | null;
};

const CHAMPS_PERSONNE: Array<[keyof ProspectionContactPatch, string]> = [
  ['contactName', 'full_name'],
  ['contactTitle', 'title'],
  ['contactPhone', 'phone'],
  ['contactEmail', 'email'],
  ['contactLinkedin', 'linkedin_url'],
];

/**
 * Met à jour les coordonnées d'une cible. Crée la personne à joindre si la fiche
 * n'en avait pas : beaucoup de lignes importées n'ont qu'un standard, et le nom
 * du décideur se découvre au premier appel.
 */
export async function updateProspectionContact(
  patch: ProspectionContactPatch,
): Promise<{ personId: string | null }> {
  const workspaceId = await ensureWorkspaceId();

  if ('websiteUrl' in patch) {
    const { error } = await supabase
      .from('prospect_companies')
      .update({ website_url: asText(patch.websiteUrl), updated_at: new Date().toISOString() })
      .eq('id', patch.companyId);
    if (error) throw new Error(`updateProspectionContact company: ${error.message}`);
  }

  const champsPersonne: Record<string, string | null> = {};
  for (const [cle, colonne] of CHAMPS_PERSONNE) {
    if (cle in patch) champsPersonne[colonne] = asText(patch[cle]);
  }
  if (Object.keys(champsPersonne).length === 0) return { personId: null };

  // On relit la personne existante plutôt que de faire confiance au client :
  // listProspectionTargets ne remonte que la première, en créer une deuxième
  // rendrait la fiche ambiguë.
  const { data: existante } = await supabase
    .from('prospect_people')
    .select('id')
    .eq('company_id', patch.companyId)
    .limit(1)
    .maybeSingle();

  if (existante) {
    const { error } = await supabase
      .from('prospect_people')
      .update(champsPersonne)
      .eq('id', existante.id);
    if (error) throw new Error(`updateProspectionContact person: ${error.message}`);
    return { personId: String(existante.id) };
  }

  if (Object.values(champsPersonne).every((valeur) => valeur === null)) return { personId: null };

  const { data: creee, error } = await supabase
    .from('prospect_people')
    .insert({
      workspace_id: workspaceId,
      company_id: patch.companyId,
      status: 'approved',
      ...champsPersonne,
    })
    .select('id')
    .single();
  if (error) throw new Error(`updateProspectionContact insert: ${error.message}`);
  return { personId: String(creee.id) };
}

export type ProspectionImportRow = {
  name: string;
  sector: string;
  city?: string | null;
  country?: string | null;
  employeeCount?: number | null;
  websiteUrl?: string | null;
  ownerLabel?: string | null;
  hook?: string | null;
  contactName?: string | null;
  contactTitle?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  sourceUrl?: string | null;
};

/**
 * Charge une liste de cibles. Idempotent par nom et secteur pour qu'un
 * rechargement de la même liste ne crée pas de doublons.
 */
export async function importProspectionTargets(rows: ProspectionImportRow[]): Promise<{ created: number; skipped: number }> {
  const workspaceId = await ensureWorkspaceId();
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('prospect_companies')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', row.name)
      .eq('industry', row.sector)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const { data: company, error } = await supabase
      .from('prospect_companies')
      .insert({
        workspace_id: workspaceId,
        name: row.name,
        industry: row.sector,
        city: row.city ?? null,
        country: row.country ?? null,
        employee_count: row.employeeCount ?? null,
        website_url: row.websiteUrl ?? null,
        owner_label: row.ownerLabel ?? null,
        source: SOURCE_PROSPECTION,
        source_url: row.sourceUrl ?? null,
        status: 'approved',
        raw_data: row.hook ? { hook: row.hook } : {},
      })
      .select('id')
      .single();
    if (error) throw new Error(`importProspectionTargets: ${error.message}`);

    // Le nom du contact ne conditionne pas la fiche : plusieurs cibles n'ont
    // pas de decideur nomme publiquement mais ont un numero et une adresse.
    // Ne creer la personne que sur le nom jetait ces coordonnees en silence, et
    // la carte annoncait « Telephone non trouve » alors que la liste en avait un.
    const aDesCoordonnees = Boolean(
      row.contactName || row.contactTitle || row.contactPhone || row.contactEmail || row.contactLinkedin,
    );
    if (aDesCoordonnees) {
      await supabase.from('prospect_people').insert({
        workspace_id: workspaceId,
        company_id: company.id,
        full_name: row.contactName ?? null,
        title: row.contactTitle ?? null,
        phone: row.contactPhone ?? null,
        email: row.contactEmail ?? null,
        linkedin_url: row.contactLinkedin ?? null,
        status: 'approved',
      });
    }

    created += 1;
  }

  return { created, skipped };
}
