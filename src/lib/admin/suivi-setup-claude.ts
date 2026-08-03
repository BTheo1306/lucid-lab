import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { getLucidClientMutationContext, recordLucidAuditEvent } from './lucid-os';

/**
 * Suivi d'une installation Claude + Obsidian.
 *
 * Le process (docs/process-setup-claude.md) prévoit deux calls après la séance :
 * un à une semaine pour vérifier que l'outil sert réellement, un à un mois pour
 * constater la valeur et ouvrir la suite. Planifiés à la main, ils se perdent.
 *
 * Les tâches sont créées visibles sur le portail : le client voit ainsi sa
 * prochaine étape au lieu d'une liste de tâches terminées.
 */

/** Marqueur pour retrouver les tâches déjà posées et ne pas les créer deux fois. */
const MARQUEUR = 'setup-claude';

export const ETAPES_SUIVI = [
  {
    jours: 7,
    titre: 'Call de suivi installation Claude (1 semaine)',
    description: [
      'Call de 20 minutes. On mesure l\'usage, pas la valeur : à une semaine, soit l\'habitude est prise, soit elle est déjà morte.',
      '',
      '1. Combien de fois vous l\'avez ouvert cette semaine ?',
      '2. Qu\'est-ce que vous y avez mis ?',
      '3. Qu\'est-ce qui vous a arrêté ou agacé ?',
      '4. Qu\'est-ce que vous avez continué à faire à l\'ancienne, par réflexe ?',
      '',
      'La question 4 révèle le point de friction que le client ne signale jamais de lui-même. On corrige en direct pendant le call, puis on publie une note de suivi sur le portail.',
    ].join('\n'),
  },
  {
    jours: 28,
    titre: 'Call de suivi installation Claude (1 mois)',
    description: [
      'Call de 30 minutes. On constate la valeur et on ouvre la suite.',
      '',
      '1. Qu\'est-ce que vous faites aujourd\'hui que vous ne faisiez pas il y a un mois ?',
      '2. Combien de temps ça vous fait gagner par semaine, à la louche ?',
      '3. Qu\'est-ce que vous aimeriez qu\'il fasse et qu\'il ne fait pas ?',
      '',
      'La question 3 est le devis suivant (automatisation, accès à un collègue, formation d\'équipe), au tarif courant et non au tarif du setup.',
      '',
      'Envoyer ensuite le bilan à un mois avec le chiffre de la question 2 écrit noir sur blanc, et demander l\'accord pour une étude de cas : le client vient de formuler le bénéfice lui-même, un mois plus tard il ne s\'en souviendra plus.',
    ].join('\n'),
  },
] as const;

function ajouterJours(base: Date, jours: number): string {
  const date = new Date(base.getTime());
  date.setDate(date.getDate() + jours);
  // Créneau en milieu de matinée plutôt qu'à minuit, pour que l'échéance
  // affichée corresponde à un moment où l'on appelle vraiment.
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

export type PlanifierSuiviResult = {
  created: number;
  alreadyScheduled: boolean;
  dueDates: string[];
};

/**
 * Pose les deux tâches de suivi à partir de la date de livraison.
 * Sans effet si elles existent déjà pour ce client.
 */
export async function planifierSuiviSetupClaude(input: {
  clientId: string;
  /** Date de la séance d'installation. Par défaut aujourd'hui. */
  livreLe?: string | null;
  ownerLabel?: string | null;
}): Promise<PlanifierSuiviResult> {
  const client = await getLucidClientMutationContext(input.clientId);

  const { data: existing, error: existingError } = await supabase
    .from('client_tasks')
    .select('id')
    .eq('client_id', client.id)
    .eq('created_by', MARQUEUR)
    .limit(1);

  if (existingError) throw new Error(`planifierSuiviSetupClaude: ${existingError.message}`);
  if (existing && existing.length > 0) {
    return { created: 0, alreadyScheduled: true, dueDates: [] };
  }

  const base = input.livreLe ? new Date(input.livreLe) : new Date();
  if (Number.isNaN(base.getTime())) throw new Error('Date de livraison invalide.');

  const rows = ETAPES_SUIVI.map((etape) => ({
    organization_id: client.organizationId,
    client_id: client.id,
    title: etape.titre,
    description: etape.description,
    status: 'todo',
    priority: 'normal',
    owner_label: input.ownerLabel ?? null,
    due_at: ajouterJours(base, etape.jours),
    client_visible: true,
    created_by: MARQUEUR,
  }));

  const { error } = await supabase.from('client_tasks').insert(rows);
  if (error) throw new Error(`planifierSuiviSetupClaude: ${error.message}`);

  await recordLucidAuditEvent({
    clientId: client.id,
    actorType: 'admin',
    eventType: 'claude_setup_followups_scheduled',
    targetTable: 'client_tasks',
    targetId: client.id,
    summary: `Suivi installation Claude planifié : ${ETAPES_SUIVI.map((e) => `J+${e.jours}`).join(' et ')}`,
    riskLevel: 'low',
  });

  return { created: rows.length, alreadyScheduled: false, dueDates: rows.map((row) => row.due_at) };
}
