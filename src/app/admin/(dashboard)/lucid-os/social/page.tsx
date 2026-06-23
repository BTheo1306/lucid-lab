import Link from 'next/link';
import { listSocialPosts, type SocialPost, type SocialPostStatus } from '@/lib/admin/social';
import { cn } from '@/lib/utils';
import { EmptyState, LucidOsHeader, StatusBadge, formatAdminDate } from '../components';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<SocialPostStatus, string> = {
  draft: 'brouillon',
  queued: 'à valider',
  approved: 'approuvé',
  posted: 'publié',
  rejected: 'rejeté',
  skipped: 'passé',
};

type ViewKey = 'a-valider' | 'postes' | 'brouillons';

const VIEWS: { key: ViewKey; label: string; statuses: SocialPostStatus[]; empty: string }[] = [
  { key: 'a-valider', label: 'À valider', statuses: ['queued', 'approved'], empty: 'Rien à valider pour le moment.' },
  { key: 'postes', label: 'Postés', statuses: ['posted'], empty: 'Aucun post publié pour l’instant.' },
  { key: 'brouillons', label: 'Brouillons', statuses: ['draft', 'rejected', 'skipped'], empty: 'Aucun brouillon.' },
];

function statusTone(status: SocialPostStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'posted':
    case 'approved':
      return 'good';
    case 'queued':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

function sortKey(post: SocialPost): number {
  if (post.status === 'posted') return -(post.postedAt ? new Date(post.postedAt).getTime() : 0);
  if (post.scheduledFor) return new Date(post.scheduledFor).getTime();
  return new Date(post.createdAt).getTime();
}

/** The seeded body repeats the hook as its first line; strip it so the card isn't redundant. */
function bodyWithoutHook(post: SocialPost): string {
  if (post.hook && post.body.startsWith(post.hook)) {
    return post.body.slice(post.hook.length).trim();
  }
  return post.body;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-zinc-200">{value ?? '—'}</span> <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const dateLabel = post.status === 'posted'
    ? post.postedAt ? `publié le ${formatAdminDate(post.postedAt)}` : 'publié'
    : post.scheduledFor ? `prévu le ${formatAdminDate(post.scheduledFor)}` : 'non planifié';
  const body = bodyWithoutHook(post);

  return (
    <article className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-zinc-500">
          {post.authorLabel}
          {post.pillar ? <> · <span className="text-zinc-400">{post.pillar}</span></> : null}
          {' · '}{dateLabel}
        </p>
        <StatusBadge tone={statusTone(post.status)}>{STATUS_LABELS[post.status]}</StatusBadge>
      </div>

      {post.hook ? (
        <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-zinc-50">{post.hook}</h3>
      ) : null}

      {body ? (
        <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-zinc-300">{body}</p>
      ) : null}

      {post.linkInComment ? (
        <p className="mt-3 text-xs text-zinc-500">
          Lien (1er commentaire) : <span className="text-zinc-300">{post.linkInComment}</span>
        </p>
      ) : null}

      {post.status === 'posted' ? (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/[0.06] pt-3 text-xs">
          <Metric label="impressions" value={post.impressions} />
          <Metric label="réactions" value={post.reactions} />
          <Metric label="commentaires" value={post.comments} />
          <Metric label="partages" value={post.reposts} />
          <Metric label="clics" value={post.clicks} />
        </div>
      ) : null}
    </article>
  );
}

export default async function LucidOsSocialPage({ searchParams }: { searchParams?: Promise<{ vue?: string | string[] }> }) {
  const resolved = searchParams ? await searchParams : {};
  const rawView = Array.isArray(resolved.vue) ? resolved.vue[0] : resolved.vue;
  const activeView: ViewKey = VIEWS.some((v) => v.key === rawView) ? (rawView as ViewKey) : 'a-valider';

  const posts = await listSocialPosts(200);
  const countFor = (view: (typeof VIEWS)[number]) => posts.filter((p) => view.statuses.includes(p.status)).length;

  const active = VIEWS.find((v) => v.key === activeView)!;
  const visiblePosts = posts
    .filter((p) => active.statuses.includes(p.status))
    .sort((a, b) => sortKey(a) - sortKey(b));

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="LinkedIn" />

      <p className="-mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
        « À valider » est la file de la semaine. Modifiez ou rejetez ce qui doit l’être ; sans retour de votre part, les posts sont publiés (le silence vaut accord). Les posts publiés affichent leurs métriques.
      </p>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => {
          const isActive = view.key === activeView;
          return (
            <Link
              key={view.key}
              href={`/admin/lucid-os/social?vue=${view.key}`}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                isActive ? 'bg-[#17171a] text-zinc-50 ring-1 ring-white/10' : 'text-zinc-400 hover:bg-[#121215] hover:text-zinc-100',
              )}
            >
              {view.label}
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', isActive ? 'bg-[#3b82f6]/20 text-[#93c5fd]' : 'bg-white/[0.06] text-zinc-500')}>
                {countFor(view)}
              </span>
            </Link>
          );
        })}
      </div>

      {visiblePosts.length === 0 ? (
        <EmptyState>{active.empty}</EmptyState>
      ) : (
        <div className="grid gap-3">
          {visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
