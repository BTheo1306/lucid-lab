import Link from 'next/link';

import { blogPublicUrl, listAllAdminPosts, type BlogPostRow, type BlogStatus } from '@/lib/admin/blog';
import { cn } from '@/lib/utils';
import { EmptyState, LucidOsHeader, StatusBadge, formatAdminDate, formatAdminDateTime } from '../lucid-os/components';
import { approveBlogPostAction, queueBlogPostAction, rejectBlogPostAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<BlogStatus, string> = {
  idea: 'idée',
  draft: 'brouillon',
  queued: 'à valider',
  approved: 'approuvé',
  scheduled: 'programmé',
  published: 'publié',
  archived: 'archivé',
  rejected: 'rejeté',
};

type ViewKey = 'a-valider' | 'publies' | 'brouillons';

const VIEWS: { key: ViewKey; label: string; statuses: BlogStatus[]; empty: string }[] = [
  { key: 'a-valider', label: 'À valider', statuses: ['queued', 'approved'], empty: 'Rien à valider pour le moment.' },
  { key: 'publies', label: 'Publiés', statuses: ['published'], empty: 'Aucun article publié pour l’instant.' },
  { key: 'brouillons', label: 'Brouillons', statuses: ['idea', 'draft', 'rejected', 'archived', 'scheduled'], empty: 'Aucun brouillon.' },
];

const BTN_BASE = 'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50';
const BTN_PRIMARY = cn(BTN_BASE, 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20 hover:bg-blue-500/25');
const BTN_NEUTRAL = cn(BTN_BASE, 'bg-white/[0.04] text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.08]');
const BTN_DANGER = cn(BTN_BASE, 'bg-red-500/10 text-red-300 ring-1 ring-red-400/20 hover:bg-red-500/20');

function statusTone(status: BlogStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'published':
    case 'approved':
      return 'good';
    case 'queued':
    case 'scheduled':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

function sortKey(post: BlogPostRow): number {
  if (post.status === 'published') return -(post.published_at ? new Date(post.published_at).getTime() : 0);
  if (post.scheduled_for) return new Date(post.scheduled_for).getTime();
  return new Date(post.created_at).getTime();
}

function dateLabel(post: BlogPostRow): string {
  if (post.status === 'published') return post.published_at ? `publié le ${formatAdminDate(post.published_at)}` : 'publié';
  return post.scheduled_for ? `prévu le ${formatAdminDateTime(post.scheduled_for)}` : 'non planifié';
}

function HiddenContext({ activeView, postId }: { activeView: ViewKey; postId: string }) {
  return (
    <>
      <input type="hidden" name="vue" value={activeView} />
      <input type="hidden" name="id" value={postId} />
    </>
  );
}

function EditLink({ id }: { id: string }) {
  return (
    <Link href={`/admin/blog/${id}/edit`} className={BTN_NEUTRAL}>
      Éditer en détail
    </Link>
  );
}

function PostActions({ post, activeView }: { post: BlogPostRow; activeView: ViewKey }) {
  if (post.status === 'published') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {post.slug ? (
          <a href={blogPublicUrl(post.locale, post.slug)} target="_blank" rel="noreferrer" className={BTN_NEUTRAL}>
            Voir l’article ↗
          </a>
        ) : null}
        <EditLink id={post.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {post.status === 'queued' ? (
        <>
          <form action={approveBlogPostAction}>
            <HiddenContext activeView={activeView} postId={post.id} />
            <button type="submit" className={BTN_PRIMARY}>Approuver</button>
          </form>
          <form action={rejectBlogPostAction}>
            <HiddenContext activeView={activeView} postId={post.id} />
            <button type="submit" className={BTN_DANGER}>Rejeter</button>
          </form>
        </>
      ) : null}

      {post.status === 'approved' ? (
        <form action={queueBlogPostAction}>
          <HiddenContext activeView={activeView} postId={post.id} />
          <button type="submit" className={BTN_NEUTRAL}>Repasser en revue</button>
        </form>
      ) : null}

      {post.status === 'draft' || post.status === 'idea' || post.status === 'rejected' || post.status === 'archived' || post.status === 'scheduled' ? (
        <form action={queueBlogPostAction}>
          <HiddenContext activeView={activeView} postId={post.id} />
          <button type="submit" className={BTN_PRIMARY}>Mettre en file</button>
        </form>
      ) : null}

      <EditLink id={post.id} />
    </div>
  );
}

function PostCard({ post, activeView }: { post: BlogPostRow; activeView: ViewKey }) {
  return (
    <article className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-zinc-500">
          <span className="uppercase">{post.locale}</span>
          {post.category ? <> · <span className="text-zinc-400">{post.category}</span></> : null}
          {' · '}{dateLabel(post)}
        </p>
        <StatusBadge tone={statusTone(post.status)}>{STATUS_LABELS[post.status]}</StatusBadge>
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-zinc-50">{post.title}</h3>

      {post.description ? (
        <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-zinc-400">{post.description}</p>
      ) : null}

      {post.social_post_id ? (
        <p className="mt-3 text-xs text-zinc-500">
          ↔ Version longue d’un{' '}
          <Link href="/admin/lucid-os/social" className="text-zinc-300 underline-offset-2 hover:underline">
            post LinkedIn
          </Link>
        </p>
      ) : null}

      {post.status === 'rejected' && post.review_note ? (
        <p className="mt-3 text-xs text-red-300/80">Note : {post.review_note}</p>
      ) : null}

      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <PostActions post={post} activeView={activeView} />
      </div>
    </article>
  );
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ vue?: string | string[] }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const rawView = Array.isArray(resolved.vue) ? resolved.vue[0] : resolved.vue;
  const activeView: ViewKey = VIEWS.some((v) => v.key === rawView) ? (rawView as ViewKey) : 'a-valider';

  const posts = await listAllAdminPosts();
  const countFor = (view: (typeof VIEWS)[number]) => posts.filter((p) => view.statuses.includes(p.status)).length;

  const active = VIEWS.find((v) => v.key === activeView)!;
  const visiblePosts = posts
    .filter((p) => active.statuses.includes(p.status))
    .sort((a, b) => sortKey(a) - sortKey(b));

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        title="Blog"
        action={
          <Link
            href="/admin/blog/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-white/[0.06] px-3 text-sm font-medium text-zinc-100 ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
          >
            + Nouvel article
          </Link>
        }
      />

      <p className="-mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
        Les articles sont générés automatiquement à partir des posts LinkedIn et arrivent dans « À valider ». Modifiez ou rejetez ce qui doit l’être ; sans retour de votre part, ils sont approuvés puis publiés à l’heure prévue (le silence vaut accord). À la publication, le post LinkedIn pointe automatiquement vers l’article.
      </p>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => {
          const isActive = view.key === activeView;
          return (
            <Link
              key={view.key}
              href={`/admin/blog?vue=${view.key}`}
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
          {visiblePosts.map((post) => <PostCard key={post.id} post={post} activeView={activeView} />)}
        </div>
      )}
    </div>
  );
}
