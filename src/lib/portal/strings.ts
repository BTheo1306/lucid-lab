/**
 * Toute la copy francaise du portail client, centralisee pour permettre une
 * duplication EN ulterieure (meme philosophie que src/lib/i18n/dictionaries).
 * Regle d'ecriture : jamais de tiret long, phrases simples.
 */
export const portalStrings = {
  appName: 'Portail client',
  brand: 'Lucid-Lab',

  nav: {
    home: 'Accueil',
    projects: 'Projets',
    requests: 'Échanges',
    meetings: 'Réunions',
    billing: 'Facturation',
    documents: 'Documents',
    website: 'Site web',
    info: 'Mes informations',
    logout: 'Déconnexion',
  },

  login: {
    title: 'Connexion à votre espace client',
    subtitle: 'Saisissez votre adresse email. Vous recevrez un lien de connexion sécurisé, sans mot de passe.',
    emailLabel: 'Adresse email',
    emailPlaceholder: 'vous@entreprise.fr',
    submit: 'Recevoir mon lien de connexion',
    sentTitle: 'Vérifiez votre boîte mail',
    sentBody: 'Si un compte existe pour cette adresse, un lien de connexion vient de vous être envoyé. Il est valable 15 minutes.',
    resend: 'Renvoyer un lien',
    errorInvalid: 'Ce lien de connexion est invalide ou a déjà été utilisé. Demandez un nouveau lien ci-dessous.',
    errorExpired: 'Ce lien de connexion a expiré. Demandez un nouveau lien ci-dessous.',
    errorRevoked: "L'accès au portail n'est pas actif pour ce compte. Contactez votre interlocuteur Lucid-Lab.",
    help: 'Un souci pour vous connecter ? Écrivez-nous à info@lucid-lab.fr.',
  },

  verify: {
    title: 'Connexion au portail',
    body: 'Cliquez sur le bouton ci-dessous pour ouvrir votre espace client sécurisé.',
    submit: 'Se connecter au portail',
    missingToken: 'Ce lien est incomplet. Ouvrez le lien reçu par email ou demandez un nouveau lien de connexion.',
    backToLogin: 'Demander un nouveau lien',
  },

  home: {
    greeting: 'Bonjour',
    intro: 'Voici votre espace client Lucid-Lab. Suivez vos projets, vos documents et vos factures, et échangez avec nous au même endroit.',
    openTasks: 'Tâches en cours',
    pendingRequests: 'En attente de votre action',
    dueInvoices: 'Factures à régler',
    lastMeeting: 'Dernière réunion',
    nothingOpen: 'Rien ne demande votre attention pour le moment.',
    seeAll: 'Tout voir',
  },

  projects: {
    title: 'Projets',
    description: "L'avancement de vos projets et les tâches partagées par l'équipe Lucid-Lab.",
    listTitle: 'Vos projets',
    empty: 'Aucun projet actif pour le moment.',
    typeLabels: {
      website: 'Site web',
      automation: 'Automatisation',
      agent: 'Agent IA',
      app: 'Application',
      strategy: 'Stratégie',
      ops: 'Opérations',
    } as Record<string, string>,
    statusLabels: {
      idea: 'En cadrage',
      planned: 'Planifié',
      active: 'En cours',
      blocked: 'En attente',
      completed: 'Livré',
      archived: 'Archivé',
    } as Record<string, string>,
  },

  tasks: {
    title: 'Tâches',
    todo: 'À faire',
    inProgress: 'En cours',
    waiting: 'En attente',
    done: 'Terminé',
    doneOn: 'Terminé le',
    due: 'Échéance',
    empty: 'Aucune tâche partagée pour le moment.',
    doneEmpty: 'Aucune tâche terminée pour le moment.',
  },

  documents: {
    statusLabels: {
      sent_for_signature: 'À signer',
      viewed: 'À signer',
      in_progress: 'Signature en cours',
      signed: 'Signé',
      declined: 'Refusé',
      expired: 'Expiré',
      archived: 'Archivé',
    } as Record<string, string>,
    typeLabels: {
      bon_de_commande: 'Bon de commande',
      facture: 'Facture',
      contrat: 'Contrat',
      proposal: 'Proposition',
      other: 'Document',
    } as Record<string, string>,
    download: 'Télécharger le PDF',
    empty: 'Aucun document partagé pour le moment.',
  },

  billing: {
    statusLabels: {
      pending: 'En préparation',
      quoted: 'Devis envoyé',
      signed: 'Signé',
      invoiced: 'Facturé',
      due: 'À régler',
      paid: 'Payé',
      overdue: 'En retard',
      cancelled: 'Annulé',
    } as Record<string, string>,
    empty: 'Aucun élément de facturation pour le moment.',
  },

  requests: {
    newRequest: 'Nouvelle demande',
    fromYou: 'Vos demandes',
    fromUs: 'Demandes de Lucid-Lab',
    approve: 'Approuver',
    requestChanges: 'Demander des modifications',
    statusLabels: {
      open: 'Ouverte',
      in_progress: 'En cours',
      waiting: 'En attente',
      approved: 'Approuvée',
      changes_requested: 'Modifications demandées',
      done: 'Traitée',
      declined: 'Déclinée',
    } as Record<string, string>,
    typeLabels: {
      question: 'Question',
      change_request: 'Demande de modification',
      asset_request: 'Éléments à fournir',
      approval: 'Validation',
      info_request: 'Informations à compléter',
    } as Record<string, string>,
    empty: 'Aucun échange pour le moment.',
  },

  meetings: {
    empty: 'Aucun compte rendu de réunion pour le moment.',
    recordedOn: 'Réunion du',
  },

  footer: {
    contact: 'Une question ? Écrivez-nous à info@lucid-lab.fr',
    site: 'lucid-lab.fr',
  },
} as const;

export type PortalStrings = typeof portalStrings;
