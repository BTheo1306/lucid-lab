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
    slug: 'eden-jardin-d-eden',
    name: "Eden (Jardin d'Eden)",
    status: 'lead',
    lifecycleStage: 'proposal_sent',
    intakeStage: 'proposal_sent',
    meetingStatus: 'done',
    industry: 'Crèche / opérations petite enfance',
    websiteUrl: null,
    primaryContactName: null,
    primaryContactEmail: null,
    primaryContactPhone: null,
    source: 'Résumé de proposition client 2026-05 et instantané de proposition Drive',
    budgetRange: 'Prix de proposition à confirmer : le résumé indique 259 EUR HT/mois ; les propositions Drive affichent 1 100 et 1 200 EUR HT/mois.',
    timeline: 'Rendez-vous détectés les 2026-05-11 et 2026-05-13 ; proposition révisée activement autour du 2026-05-13.',
    desiredOutcome: 'Construire un back-office opérationnel simple pour l’administration de la crèche : Google Sheets, synchronisation Drive/email, contrôles documentaires, rappels, demandes d’avis, Meta Ads, WhatsApp Business et posts SEO mensuels.',
    nextStep: 'Confirmer le nom légal/client, le contact principal, le site web, le prix final de la proposition et si une fiche CRM Lucid OS doit être créée.',
    healthSummary: 'Prospect d’automatisation opérationnelle à fort potentiel. Le risque principal est l’identité/contact incomplet et la contradiction de prix.',
    relationshipNotes: [
      'Aucun tableau de bord n’était prévu dans la source ; l’objectif est un back-office opérationnel simple.',
      'Le périmètre marketing/acquisition est lié au remplissage de la crèche et à la disponibilité de Meta Ads.',
      'Le compte Meta Ads peut nécessiter une récupération ou un remplacement.',
    ],
    deliveryTracks: [
      'Migration Excel vers Google Sheets avec formules et automatisations',
      'Synchronisation Drive/email et classification documentaire',
      'Détection des documents manquants, vérification, rappels et demandes de signature/documents',
      'Meta Ads, WhatsApp Business, avis Google et posts SEO mensuels',
    ],
    documents: [
      {
        title: 'eden-creche-proposition-lucid-lab.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Eden',
        note: 'La proposition au nom du client semble indiquer 1 100 EUR HT/mois.',
      },
      {
        title: '06_Proposition-Creche-Eden.docx',
        kind: 'proposal',
        status: 'needs_review',
        location: 'Export Drive : dossier Eden',
        note: 'La proposition numérotée semble indiquer 1 200 EUR HT/mois.',
      },
    ],
    warnings: [
      'Conflit de prix : 259 EUR HT/mois dans le résumé du 2026-05-14 contre 1 100/1 200 EUR HT/mois dans les propositions Drive.',
      'L’identité client et les coordonnées ne sont pas confirmées dans le vault.',
    ],
    openQuestions: [
      'Confirmer le nom légal/client, le contact principal, le site, l’email et le téléphone.',
      'Confirmer si Eden a déjà une fiche CRM Lucid OS ou si elle doit être créée.',
      'Confirmer le statut de récupération du compte Meta Ads et le prix final de la proposition.',
    ],
    agentHandoff: [
      'Avant de générer des documents, demander à Jules quel prix fait foi commercialement.',
      'Si les coordonnées arrivent, créer/mettre à jour la fiche client et ajouter un contact principal.',
      'Garder le modèle de production opérationnel et orienté back-office plutôt que dashboard.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/eden-jardin-d-eden.md' },
      { label: 'Résumé de proposition', vaultPath: 'wiki/sources/2026-05-14--resume-projets-prestations.md' },
      { label: 'Documents client Drive', vaultPath: 'wiki/sources/2026-05-18--drive-client-documents.md' },
      { label: 'Signaux rendez-vous Gmail', vaultPath: 'wiki/sources/2026-05-18--jules-personal-gmail-lucid-lab.md' },
    ],
    rawContext: 'Eden / Jardin d Eden : prospect d’automatisation crèche. Périmètre : Excel vers Google Sheets, synchronisation Drive/email, classification documentaire et rappels, demandes d’avis, Meta Ads, WhatsApp Business, posts SEO. Aucun tableau de bord prévu. Prix non résolu entre 259 EUR/mois, 1100 EUR/mois et 1200 EUR/mois selon les versions.',
  },
  {
    slug: 'brasserie-du-port-test-1779042487565',
    name: 'Brasserie du Port',
    status: 'active',
    lifecycleStage: 'won',
    intakeStage: 'won',
    meetingStatus: 'done',
    industry: 'Restauration',
    websiteUrl: 'https://brasserie-du-port.fr',
    primaryContactName: 'Pierre Dumont',
    primaryContactEmail: 'info@lucid-lab.fr',
    primaryContactPhone: '+33 6 12 34 56 78',
    source: 'Synchronisation CRM Lucid OS et artefacts de test d’automatisation documentaire DocuSeal',
    budgetRange: null,
    timeline: null,
    desiredOutcome: 'Automatisation IA - réservations et avis Google. Considérer les documents signés actuels comme des données de test du processus documentaire tant que ce n’est pas confirmé.',
    nextStep: 'Confirmer s’il s’agit d’un vrai client/prospect ou seulement de données de test pour le processus DocuSeal.',
    healthSummary: 'Le processus prouve le chemin d’archivage DocuSeal, mais la réalité commerciale doit être confirmée.',
    relationshipNotes: [
      'Opportunité ouverte enregistrée comme Automatisation IA - Réservations & Avis Google, gagnée à 90 %.',
      'Dernière interaction : brouillon BDC créé le 2026-05-17.',
      'La boîte mail et Drive montrent des notifications de documents signés et des artefacts d’archive, mais pas une preuve de production réelle.',
    ],
    deliveryTracks: [
      'Automatisation des réservations',
      'Automatisation des avis Google',
      'Génération BDC + contrat via DocuSeal',
      'Processus d’archive Drive et artefacts d’audit',
    ],
    documents: [
      {
        title: 'BDC-20260518-BRASSERIE-DU-PORT-TEST-1779042487565-bdc-contrat-signes_1.pdf',
        kind: 'signed_pdf',
        status: 'test_artifact',
        location: 'Export Drive : dossier Bistrot-test',
        note: 'Artefact PDF BDC/contrat signé issu du processus de test.',
      },
      {
        title: 'BDC-20260518-BRASSERIE-DU-PORT-TEST-1779042487565-audit-docuseal_1.pdf',
        kind: 'audit',
        status: 'test_artifact',
        location: 'Export Drive : dossier Bistrot-test',
        note: 'Artefact d’audit DocuSeal issu du processus de test.',
      },
    ],
    warnings: [
      'Considérer les documents signés comme des artefacts de test jusqu’à confirmation de Jules.',
      'L’email principal pointe actuellement vers info@lucid-lab.fr, ce qui suggère des données de test.',
    ],
    openQuestions: [
      'Confirmer si Brasserie du Port est un vrai client/prospect ou une fiche de test uniquement.',
      'Confirmer l’email destinataire final et les informations légales avant tout envoi réel.',
    ],
    agentHandoff: [
      'Ne pas présenter les PDF signés comme preuve commerciale tant que ce n’est pas confirmé.',
      'Utile comme jeu de test pour le processus DocuSeal, l’archive et les contrôles d’idempotence.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/brasserie-du-port-test-1779042487565.md' },
      { label: 'Documents client Drive', vaultPath: 'wiki/sources/2026-05-18--drive-client-documents.md' },
      { label: 'Boîte mail info', vaultPath: 'wiki/sources/2026-05-18--lucid-lab-info-mailbox.md' },
      { label: 'Passe Gmail outils/infra', vaultPath: 'wiki/sources/2026-05-18--jules-gmail-tools-infra-pass.md' },
    ],
    rawContext: 'Brasserie du Port : fiche CRM Lucid OS avec artefacts de test d’automatisation documentaire DocuSeal. Opportunité : automatisation IA pour réservations et avis Google. Des PDF signés/journaux d’audit existent dans l’export Drive mais doivent être traités comme artefacts de test jusqu’à confirmation.',
  },
  {
    slug: 'universal',
    name: 'Universal',
    status: 'active',
    lifecycleStage: 'in_delivery',
    intakeStage: 'won',
    meetingStatus: 'done',
    industry: null,
    websiteUrl: null,
    primaryContactName: null,
    primaryContactEmail: null,
    primaryContactPhone: null,
    source: 'Bootstrap Lucid-Lab / référence site public',
    budgetRange: null,
    timeline: null,
    desiredOutcome: 'Bots LinkedIn / mission de génération autonome de leads.',
    nextStep: 'Confirmer le nom complet de l’entreprise, le contact, le secteur et les termes du contrat.',
    healthSummary: 'Client actif référencé publiquement, mais les détails opérationnels sont rares dans le vault.',
    relationshipNotes: [
      'Mentionné publiquement sur lucid-lab.fr aux côtés de Turismo et Periscope.',
      'Catégorie de mission : bots LinkedIn / génération autonome de leads.',
    ],
    deliveryTracks: [
      'Génération autonome de leads LinkedIn',
      'Potentiellement lié au modèle de POC d’enrichissement LinkedIn Consulteis',
    ],
    documents: [],
    warnings: [
      'Confiance vault faible ; les détails complets d’entreprise et de contrat manquent.',
    ],
    openQuestions: [
      'Confirmer le nom complet de l’entreprise et le contact principal.',
      'Confirmer si cette mission utilise le même code/pipeline que Consulteis.',
      'Confirmer le revenu et les termes du contrat.',
    ],
    agentHandoff: [
      'Demander les documents sources avant de générer des propositions ou factures.',
      'Si des données de bot LinkedIn arrivent, les importer comme connaissance client avant le travail de l’agent.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/universal.md' },
      { label: 'Bootstrap Lucid-Lab', vaultPath: 'wiki/sources/2026-05-03--lucid-lab-bootstrap.md' },
    ],
    rawContext: 'Universal : client actif Lucid-Lab référencé pour bots LinkedIn / génération autonome de leads. Détails rares ; besoin du nom complet, contact, secteur, codebase et termes du contrat.',
  },
  {
    slug: 'consulteis',
    name: 'Consulteis',
    status: 'active',
    lifecycleStage: 'in_delivery',
    intakeStage: 'won',
    meetingStatus: 'done',
    industry: 'Agence de conseil',
    websiteUrl: null,
    primaryContactName: 'Tom Lefranc',
    primaryContactEmail: null,
    primaryContactPhone: null,
    source: 'Bootstrap Lucid-Lab / notes client brutes',
    budgetRange: 'Pro bono / POC',
    timeline: null,
    desiredOutcome: 'Automatisation d’enrichissement de leads LinkedIn : enrichir les listes de prospects avec noms, rôles, entreprises, activité récente, puis router les résultats vers Sheets/Excel pour la prospection.',
    nextStep: 'Transformer les apprentissages en offre Lucid-Lab d’outreach/enrichissement LinkedIn et confirmer le statut actuel du POC.',
    healthSummary: 'POC pro bono actif. Utile comme référence de productisation pour l’offre de génération de leads.',
    relationshipNotes: [
      'Introduit via Tom Lefranc, ami de Theo.',
      'Des notes brutes de rendez-vous et un prompt existent dans le dossier raw du vault ; le wiki indique de les utiliser pour plus de détails opérationnels si nécessaire.',
    ],
    deliveryTracks: [
      'Enrichissement de prospects LinkedIn',
      'Routage Sheets/Excel pour prospection',
      'Référence de productisation pour le lead engine Lucid-Lab',
    ],
    documents: [
      {
        title: 'prompt.txt',
        kind: 'source',
        status: 'unknown',
        location: 'raw/docs/lucid-lab/clients/consulteis/prompt.txt',
        note: 'Source brute du vault référencée par le wiki ; non ouverte ici car le wiki maintenu contenait assez de contexte pour cette passe UI.',
      },
    ],
    warnings: [
      'Mission pro bono ; ne pas compter comme revenu normal sans confirmation.',
    ],
    openQuestions: [
      'Confirmer le statut actuel du POC et s’il doit rester actif.',
      'Confirmer si les sorties ont été packagées dans l’offre lead-engine.',
    ],
    agentHandoff: [
      'Utiliser comme client de référence pour les processus d’enrichissement LinkedIn.',
      'Garder le statut pro bono/commercial explicite dans les résumés et prévisions.',
    ],
    sourceRefs: [
      { label: 'Fiche client Obsidian', vaultPath: 'wiki/entities/consulteis.md' },
      { label: 'Bootstrap Lucid-Lab', vaultPath: 'wiki/sources/2026-05-03--lucid-lab-bootstrap.md' },
    ],
    rawContext: 'Consulteis : POC pro bono actif pour enrichissement de leads LinkedIn. Contact principal Tom Lefranc. Objectif : enrichir les listes de prospects et router vers un pipeline Sheets/Excel pour prospection. Référence utile de productisation pour le lead engine.',
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
