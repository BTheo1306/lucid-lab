import type {
  LucidClientIntakeStage,
  LucidClientLifecycleStage,
  LucidClientMeetingStatus,
  LucidClientStatus,
} from './lucid-os';

export type VaultClientDocument = {
  title: string;
  kind: 'proposal' | 'contract' | 'signed_pdf' | 'audit' | 'source' | 'other';
  status: 'draft' | 'needs_review' | 'sent' | 'signed' | 'test_artifact' | 'unknown';
  location: string;
  note?: string;
  url?: string;
};

export type VaultClientProfile = {
  slug: string;
  name: string;
  status: LucidClientStatus;
  lifecycleStage: LucidClientLifecycleStage;
  intakeStage: LucidClientIntakeStage;
  meetingStatus: LucidClientMeetingStatus;
  industry: string | null;
  websiteUrl: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  source: string;
  budgetRange: string | null;
  timeline: string | null;
  desiredOutcome: string;
  nextStep: string | null;
  healthSummary: string | null;
  relationshipNotes: string[];
  deliveryTracks: string[];
  documents: VaultClientDocument[];
  warnings: string[];
  openQuestions: string[];
  agentHandoff: string[];
  sourceRefs: Array<{ label: string; vaultPath: string }>;
  rawContext: string;
};

export const vaultClientProfiles: VaultClientProfile[] = [
  {
    slug: 'fany-rother-kinesiologie-coaching-bien-etre',
    name: 'Fany Rother',
    status: 'lead',
    lifecycleStage: 'discovery_done',
    intakeStage: 'meeting_done',
    meetingStatus: 'done',
    industry: 'Santé, bien-être et coaching',
    websiteUrl: null,
    primaryContactName: 'Fany Rother',
    primaryContactEmail: 'fany.rother@gmail.com',
    primaryContactPhone: null,
    source: 'Recommandation interne / Anthony Poirier / qualification Lucid OS',
    budgetRange: 'Dépenses outils actuelles autour de 200 EUR/mois ; budget Meta Ads attendu autour de 200-300 EUR/mois. Le prix de la proposition doit être confirmé.',
    timeline: 'Lancement Meta Ads imminent en mai 2026 ; suivi Fany/Clem prévu le 2026-05-27 de 11:00 à 12:00 CEST.',
    desiredOutcome: 'Automatiser la capture de leads, les réponses Instagram/WhatsApp, le suivi post-session, les demandes d’avis Google et les points de contact du cycle client pour que Fany se concentre sur le coaching live et les interactions à forte valeur.',
    nextStep: 'Préparer le suivi du 2026-05-27 avec le prix clair, la décision propriété/refonte du site, le statut de vérification WhatsApp Business et le statut du contrat agence.',
    healthSummary: 'Découverte active. Le risque principal est l’ambiguïté commerciale/prix et la dépendance à la vérification Meta/WhatsApp.',
    relationshipNotes: [
      'L’offre principale est un programme de coaching de groupe en ligne sur 4 mois autour de la dépendance affective et des schémas relationnels toxiques.',
      'Instagram doit rester le canal d’acquisition principal, avec DM, WhatsApp, Meta et tunnel centralisés autour d’un site propriétaire.',
      'Un bot ne peut pas répondre directement dans une communauté WhatsApp Business ; il faut plutôt router les utilisateurs vers un parcours site/bot.',
    ],
    deliveryTracks: [
      'Bot WhatsApp et support communauté',
      'Bot Instagram pour les réponses clients/prospects',
      'Relances d’avis Google dans Systeme.io',
      'Décision propriété/refonte du site et centralisation du tunnel',
    ],
    documents: [
      {
        title: 'fany-rother-proposition-lucid-lab.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Fanny',
        note: 'La proposition au nom du client semble indiquer 750 EUR HT/mois.',
      },
      {
        title: '05_Proposition-Fanny-Rother.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Fanny',
        note: 'La proposition numérotée semble indiquer 800 EUR HT/mois.',
      },
    ],
    warnings: [
      'Conflit de prix : 225 EUR HT/mois dans le résumé du 2026-05-14 contre 750/800 EUR HT/mois dans les propositions Drive.',
      'Conflit d’orthographe : le vault utilise Fany ; un dossier/proposition Drive utilise Fanny.',
    ],
    openQuestions: [
      'Confirmer l’orthographe correcte avant d’envoyer d’autres documents.',
      'Confirmer quelle version de proposition a réellement été envoyée et la vérité commerciale voulue.',
      'Confirmer le statut du contrat agence et si la vérification WhatsApp Business a commencé.',
    ],
    agentHandoff: [
      'Quand l’utilisateur donne de nouvelles notes, les ajouter comme source client et les indexer en connaissance.',
      'Ne pas finaliser le prix tant que Jules n’a pas confirmé la source de vérité.',
      'Suivre la prochaine action liée au rendez-vous du 2026-05-27.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/fany-rother-kinesiologie-coaching-bien-etre.md' },
      { label: 'Résumé de proposition', vaultPath: 'wiki/sources/2026-05-14--resume-projets-prestations.md' },
      { label: 'Documents client Drive', vaultPath: 'wiki/sources/2026-05-18--drive-client-documents.md' },
      { label: 'Signaux rendez-vous Gmail', vaultPath: 'wiki/sources/2026-05-18--jules-personal-gmail-lucid-lab.md' },
    ],
    rawContext: 'Fany Rother : cliente/prospect bien-être/coaching. Besoin de bots WhatsApp/Instagram, automatisation des avis Google et automatisation opérationnelle autour d’un programme de coaching de 4 mois. Prix non résolu entre 225 EUR/mois, 750 EUR/mois et 800 EUR/mois selon les versions de proposition. Suivi prévu le 2026-05-27.',
  },
  {
    slug: 'sinibaldi-architecte',
    name: 'Sinibaldi Architecte',
    status: 'lead',
    lifecycleStage: 'discovery_done',
    intakeStage: 'meeting_done',
    meetingStatus: 'done',
    industry: 'Architecture',
    websiteUrl: 'https://sinibaldi-architecte.fr/',
    primaryContactName: 'Clement Sinibaldi',
    primaryContactEmail: 'c.cordier.sinibaldi@gmail.com',
    primaryContactPhone: null,
    source: 'RDV / échange direct',
    budgetRange: 'Prix de proposition à confirmer : le résumé indique 159 EUR HT/mois ; les propositions Drive affichent 850 et 950 EUR HT/mois.',
    timeline: 'Suivi Fany/Clem prévu le 2026-05-27 de 11:00 à 12:00 CEST.',
    desiredOutcome: 'Développer la base client en ajoutant au site WordPress un service de conseil à l’achat, le promouvoir avec Meta Ads, automatiser le contenu blog/social et explorer ensuite un SaaS IA pour dossiers de permis.',
    nextStep: 'Préparer un ordre du jour dédié pour l’appel de faisabilité du SaaS/site de dossiers de permis avant le suivi du 2026-05-27.',
    healthSummary: 'Découverte active. Le risque principal est de mélanger un périmètre court terme site/ads avec une piste SaaS beaucoup plus large.',
    relationshipNotes: [
      'Périmètre immédiat : page de service WordPress, Meta Ads, automatisation blog, idées de contenu Instagram.',
      'Opportunité plus long terme : site/SaaS pour dossiers d’autorisation d’urbanisme.',
      'Estimation SaaS approximative dans les notes : 10-15k EUR, ou équipe externe autour de 2 500 EUR/mois pendant 3 mois.',
    ],
    deliveryTracks: [
      'Page WordPress de service conseil',
      'Campagnes Meta Ads de génération de leads',
      'Agent IA d’idées de contenu Instagram et inspirations mensuelles',
      'Découverte de faisabilité SaaS pour dossiers de permis',
    ],
    documents: [
      {
        title: 'clement-sinibaldi-proposition-lucid-lab.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Clement',
        note: 'La proposition au nom du client semble indiquer 850 EUR HT/mois avec engagement 12 mois.',
      },
      {
        title: '07_Proposition-Clement-Sinibaldi.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Clement',
        note: 'La proposition numérotée semble indiquer 950 EUR HT/mois avec engagement 12 mois.',
      },
    ],
    warnings: [
      'Conflit de prix : 159 EUR HT/mois dans le résumé du 2026-05-14 contre 850/950 EUR HT/mois dans les propositions Drive.',
      'Le périmètre SaaS ne doit pas être vendu comme implémentation tant que la faisabilité, les tâches, les risques et les données sources ne sont pas clarifiés.',
    ],
    openQuestions: [
      'Confirmer le prix final de la proposition et le fichier envoyé.',
      'Clarifier si le SaaS de dossiers de permis est un périmètre payé à court terme, un sujet de découverte ou une idée produit plus tard.',
      'Préparer l’ordre du jour de l’appel faisabilité avant le suivi Fany/Clem.',
    ],
    agentHandoff: [
      'Séparer le périmètre site/ads de la découverte SaaS dans les résumés et propositions.',
      'Si de nouvelles notes sur le processus de permis arrivent, les importer comme sources et les indexer pour les agents.',
      'Signaler toute contradiction de prix ou de périmètre avant de générer un BDC.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/sinibaldi-architecte.md' },
      { label: 'Résumé de proposition', vaultPath: 'wiki/sources/2026-05-14--resume-projets-prestations.md' },
      { label: 'Documents client Drive', vaultPath: 'wiki/sources/2026-05-18--drive-client-documents.md' },
      { label: 'Signaux rendez-vous Gmail', vaultPath: 'wiki/sources/2026-05-18--jules-personal-gmail-lucid-lab.md' },
    ],
    rawContext: 'Sinibaldi Architecte / Clement Sinibaldi : prospect architecture. Besoin d’une page conseil WordPress, Meta Ads, automatisation blog, IA de contenu Instagram et possiblement plus tard un site/SaaS de dossiers de permis. Prix non résolu entre 159 EUR/mois, 850 EUR/mois et 950 EUR/mois selon les versions. Suivi prévu le 2026-05-27.',
  },
  {
    slug: 'turismo',
    name: 'Turismo',
    status: 'offboarded',
    lifecycleStage: 'archived',
    intakeStage: 'lost',
    meetingStatus: 'done',
    industry: 'Location de voitures de luxe',
    websiteUrl: null,
    primaryContactName: 'Sacha',
    primaryContactEmail: null,
    primaryContactPhone: null,
    source: 'Bootstrap Lucid-Lab et suivi Gmail mai 2026',
    budgetRange: null,
    timeline: 'Ancien client ; mission terminée avant ou pendant mai 2026.',
    desiredOutcome: 'Ancien travail sur bot WhatsApp Business et plateforme TCO/pricing pour opérations de location de voitures de luxe au Luxembourg, en Belgique et en France.',
    nextStep: 'Confirmer si la facture Turismo en attente a été envoyée et payée.',
    healthSummary: 'Ancien client. À garder comme référence et suivi de facturation, pas comme production active.',
    relationshipNotes: [
      'Le bot WhatsApp Business couvrait la relance lead, le catalogue véhicules, la réservation, le support, l’urgence, l’escalade Slack et les liens documents protégés par OTP.',
      'La plateforme TCO utilisait du scraping AutoScout24, des valeurs marché quotidiennes, une formule TCO, un tableau de bord flotte et des alertes.',
      'La collaboration s’est terminée d’un commun accord ; les repos restent des références utiles.',
    ],
    deliveryTracks: [
      'Template bot WhatsApp Business',
      'Plateforme TCO/pricing véhicules',
      'Suivi validation/envoi facture',
    ],
    documents: [],
    warnings: [
      'La mission est terminée ; éviter de le traiter comme client actif.',
      'Ne pas exposer ni réutiliser les anciens identifiants ; le vault signale la rotation/révocation séparément.',
    ],
    openQuestions: [
      'Confirmer si la facture a été envoyée et payée.',
      'Confirmer si un revenu restant doit rester dans le prévisionnel.',
    ],
    agentHandoff: [
      'Utiliser comme cas client/référence seulement quand c’est pertinent.',
      'Ne jamais afficher d’identifiants bruts ou de secrets issus des anciens dossiers.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/turismo.md' },
      { label: 'Bootstrap Lucid-Lab', vaultPath: 'wiki/sources/2026-05-03--lucid-lab-bootstrap.md' },
      { label: 'Suivi Gmail', vaultPath: 'wiki/sources/2026-05-18--jules-personal-gmail-lucid-lab.md' },
    ],
    rawContext: 'Turismo : ancien client Lucid-Lab en location de voitures de luxe. Ancien bot WhatsApp Business et plateforme TCO/pricing. Mission terminée. À garder seulement comme référence et suivi de facturation ; confirmer si la facture a été envoyée et payée.',
  },
];

export function getVaultClientProfiles(): VaultClientProfile[] {
  return vaultClientProfiles;
}

export function getVaultClientProfile(slug: string): VaultClientProfile | null {
  return vaultClientProfiles.find((profile) => profile.slug === slug) ?? null;
}

export function profileStatusLabel(profile: VaultClientProfile): string {
  if (profile.status === 'offboarded' || profile.lifecycleStage === 'archived') return 'ancien client';
  if (profile.status === 'active') return 'client actif';
  return 'prospect client';
}
