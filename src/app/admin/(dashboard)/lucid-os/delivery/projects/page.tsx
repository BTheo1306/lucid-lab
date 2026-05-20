import { FolderKanban } from 'lucide-react';
import { listLucidProjects, type LucidProjectStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

function projectTone(status: LucidProjectStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
      return 'good';
    case 'active':
      return 'warning';
    case 'blocked':
      return 'danger';
    default:
      return 'neutral';
  }
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    active: 'actif',
    blocked: 'bloqué',
    completed: 'terminé',
    high: 'élevé',
    low: 'faible',
    normal: 'normal',
    urgent: 'urgent',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsProjectsPage() {
  const projects = await listLucidProjects(100);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Production"
        title="Projets"
        description="Travail agence suivi par client, statut, priorité et échéance."
        icon={FolderKanban}
      />

      <Section title="Inventaire projets" description="Travail de production actuel et récent dans Lucid OS.">
        {projects.length === 0 ? (
          <EmptyState>Aucun projet n’est encore enregistré.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {projects.map((project) => (
              <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-950">{project.name}</p>
                      <StatusBadge tone={projectTone(project.status)}>{labelFr(project.status)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{project.clientName ?? 'Lucid-Lab'} · {labelFr(project.projectType)} · {labelFr(project.priority)}</p>
                    {project.summary ? <p className="mt-2 text-sm leading-6 text-zinc-600">{project.summary}</p> : null}
                  </div>
                  <div className="text-sm text-zinc-500 md:text-right">
                    <p>{project.dueAt ? formatAdminDateTime(project.dueAt) : 'Aucune échéance'}</p>
                    <p className="mt-1">Mis à jour {formatAdminDateTime(project.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}