import { listSocialPosts, type SocialPost, type SocialPostStatus } from '@/lib/admin/social';
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

function scheduledTime(post: SocialPost): number {
  return post.scheduledFor ? new Date(post.scheduledFor).getTime() : Number.MAX_SAFE_INTEGER;
}

function postedTime(post: SocialPost): number {
  return post.postedAt ? new Date(post.postedAt).getTime() : 0;
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-zinc-300">{value ?? '-'}</span> {label}
    </span>
  );
}

function PostRow({ post }: { post: SocialPost }) {
  const meta = [
    post.authorLabel,
    post.pillar,
    post.scheduledFor && post.status !== 'posted' ? `prévu ${formatAdminDate(post.scheduledFor)}` : null,
    post.postedAt ? `publié ${formatAdminDate(post.postedAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="border-t border-white/[0.08] px-1 py-4 first:border-t-0 sm:px-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-50">
            {post.hook ?? post.body.slice(0, 90)}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">{meta}</p>
        </div>
        <StatusBadge tone={statusTone(post.status)}>{STATUS_LABELS[post.status]}</StatusBadge>
      </div>
      <p className="mt-2 line-clamp-3 whitespace-pre-line text-[13px] leading-6 text-zinc-400">{post.body}</p>
      {post.status === 'posted' ? (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
          <Metric label="impressions" value={post.impressions} />
          <Metric label="réactions" value={post.reactions} />
          <Metric label="commentaires" value={post.comments} />
          <Metric label="partages" value={post.reposts} />
          <Metric label="clics" value={post.clicks} />
        </div>
      ) : null}
    </div>
  );
}

function PostSection({ title, posts, emptyLabel }: { title: string; posts: SocialPost[]; emptyLabel: string }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">{title}</h2>
        <span className="text-xs text-zinc-600">{posts.length}</span>
      </div>
      <div className="border-t border-white/[0.08] pt-1">
        {posts.length === 0 ? (
          <EmptyState>{emptyLabel}</EmptyState>
        ) : (
          posts.map((post) => <PostRow key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}

export default async function LucidOsSocialPage() {
  const posts = await listSocialPosts(200);

  const toReview = posts
    .filter((post) => post.status === 'queued' || post.status === 'approved')
    .sort((a, b) => scheduledTime(a) - scheduledTime(b));
  const posted = posts
    .filter((post) => post.status === 'posted')
    .sort((a, b) => postedTime(b) - postedTime(a));
  const drafts = posts
    .filter((post) => post.status === 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="grid gap-7">
      <LucidOsHeader title="LinkedIn" />
      <p className="-mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
        File de contenu LinkedIn. Les posts « à valider » sont la file de la semaine : modifiez ou rejetez ce qui doit l’être. Sans retour de votre part, ils sont publiés (le silence vaut accord). Les posts publiés affichent leurs métriques pour voir ce qui marche.
      </p>

      <PostSection title="À valider cette semaine" posts={toReview} emptyLabel="Rien à valider pour le moment." />
      <PostSection title="Postés" posts={posted} emptyLabel="Aucun post publié pour l’instant." />
      <PostSection title="Brouillons" posts={drafts} emptyLabel="Aucun brouillon." />
    </div>
  );
}
