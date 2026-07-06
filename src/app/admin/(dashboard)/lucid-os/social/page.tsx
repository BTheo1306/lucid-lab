import Link from 'next/link';
import { config } from '@/lib/bot/config';
import { listSocialPosts, type SocialPost, type SocialPostStatus } from '@/lib/admin/social';
import { getLinkedInAccount, type LinkedInAccountSummary } from '@/lib/admin/linkedin/account';
import { getLinkedInOrgAccount, type LinkedInOrgAccountSummary } from '@/lib/admin/linkedin/org-account';
import { blogPublicUrl, getBlogVersionsBySocialPostIds, type BlogStatus, type BlogVersionRef } from '@/lib/admin/blog';
import { cn } from '@/lib/utils';
import { EmptyState, LucidOsHeader, StatusBadge, formatAdminDate } from '../components';
import {
  approveSocialPostAction,
  createSocialPostAction,
  editSocialPostAction,
  queueSocialPostAction,
  rejectSocialPostAction,
} from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<SocialPostStatus, string> = {
  draft: 'brouillon',
  queued: 'à valider',
  approved: 'approuvé',
  posted: 'publié',
  rejected: 'rejeté',
  skipped: 'passé',
};

const BLOG_STATUS_LABELS: Record<BlogStatus, string> = {
  idea: 'idée',
  draft: 'brouillon',
  queued: 'à valider',
  approved: 'approuvé',
  scheduled: 'programmé',
  published: 'publié',
  archived: 'archivé',
  rejected: 'rejeté',
};

type ViewKey = 'a-valider' | 'postes' | 'brouillons';

const VIEWS: { key: ViewKey; label: string; statuses: SocialPostStatus[]; empty: string }[] = [
  { key: 'a-valider', label: 'À valider', statuses: ['queued', 'approved'], empty: 'Rien à valider pour le moment.' },
  { key: 'postes', label: 'Postés', statuses: ['posted'], empty: 'Aucun post publié pour l’instant.' },
  { key: 'brouillons', label: 'Brouillons', statuses: ['draft', 'rejected', 'skipped'], empty: 'Aucun brouillon.' },
];

const BTN_BASE = 'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50';
const BTN_PRIMARY = cn(BTN_BASE, 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20 hover:bg-blue-500/25');
const BTN_NEUTRAL = cn(BTN_BASE, 'bg-white/[0.04] text-zinc-300 ring-1 ring-white/10 hover:bg-white/[0.08]');
const BTN_DANGER = cn(BTN_BASE, 'bg-red-500/10 text-red-300 ring-1 ring-red-400/20 hover:bg-red-500/20');
const FIELD = 'w-full rounded-md border border-white/10 bg-[#0d0d10] px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/25';
const LABEL = 'mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500';

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

/** ISO -> value accepted by <input type="datetime-local"> (YYYY-MM-DDTHH:mm). */
function toDateTimeLocal(iso: string | null): string {
  return iso ? iso.slice(0, 16) : '';
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-zinc-200">{value ?? '—'}</span> <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function HiddenContext({ activeView, postId }: { activeView: ViewKey; postId?: string }) {
  return (
    <>
      <input type="hidden" name="vue" value={activeView} />
      {postId ? <input type="hidden" name="post_id" value={postId} /> : null}
    </>
  );
}

function PostActions({ post, activeView }: { post: SocialPost; activeView: ViewKey }) {
  if (post.status === 'posted') {
    return post.postUrl ? (
      <a href={post.postUrl} target="_blank" rel="noreferrer" className={BTN_NEUTRAL}>
        Voir le post ↗
      </a>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {post.status === 'queued' ? (
        <>
          <form action={approveSocialPostAction}>
            <HiddenContext activeView={activeView} postId={post.id} />
            <button type="submit" className={BTN_PRIMARY}>Approuver</button>
          </form>
          <form action={rejectSocialPostAction}>
            <HiddenContext activeView={activeView} postId={post.id} />
            <button type="submit" className={BTN_DANGER}>Rejeter</button>
          </form>
        </>
      ) : null}

      {post.status === 'approved' ? (
        <form action={queueSocialPostAction}>
          <HiddenContext activeView={activeView} postId={post.id} />
          <button type="submit" className={BTN_NEUTRAL}>Repasser en revue</button>
        </form>
      ) : null}

      {post.status === 'draft' || post.status === 'rejected' || post.status === 'skipped' ? (
        <form action={queueSocialPostAction}>
          <HiddenContext activeView={activeView} postId={post.id} />
          <button type="submit" className={BTN_PRIMARY}>Mettre en file</button>
        </form>
      ) : null}

      <details className="group">
        <summary className={cn(BTN_NEUTRAL, 'cursor-pointer list-none')}>Éditer</summary>
        <form action={editSocialPostAction} className="mt-3 grid gap-3 rounded-lg border border-white/[0.08] bg-[#0b0b0e] p-4">
          <HiddenContext activeView={activeView} postId={post.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Pilier</label>
              <input name="pillar" defaultValue={post.pillar ?? ''} className={FIELD} />
            </div>
            <div>
              <label className={LABEL}>Programmé le</label>
              <input type="datetime-local" name="scheduled_for" defaultValue={toDateTimeLocal(post.scheduledFor)} className={FIELD} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Accroche</label>
            <input name="hook" defaultValue={post.hook ?? ''} className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Texte du post</label>
            <textarea name="body" defaultValue={post.body} rows={10} className={cn(FIELD, 'resize-y leading-6')} />
          </div>
          <div>
            <label className={LABEL}>Lien (1er commentaire)</label>
            <input name="link_in_comment" defaultValue={post.linkInComment ?? ''} className={FIELD} />
          </div>
          <div>
            <button type="submit" className={BTN_PRIMARY}>Enregistrer</button>
          </div>
        </form>
      </details>
    </div>
  );
}

function PostCard({ post, activeView, blogVersion }: { post: SocialPost; activeView: ViewKey; blogVersion?: BlogVersionRef }) {
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

      {blogVersion ? (
        <p className="mt-2 text-xs text-zinc-500">
          Version blog :{' '}
          <Link href={`/admin/blog/${blogVersion.id}/edit`} className="text-zinc-300 underline-offset-2 hover:underline">
            {BLOG_STATUS_LABELS[blogVersion.status]}
          </Link>
          {blogVersion.status === 'published' && blogVersion.slug ? (
            <>
              {' · '}
              <a href={blogPublicUrl(blogVersion.locale, blogVersion.slug)} target="_blank" rel="noreferrer" className="text-zinc-300 underline-offset-2 hover:underline">
                voir ↗
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {post.status === 'rejected' && post.reviewNote ? (
        <p className="mt-3 text-xs text-red-300/80">Note : {post.reviewNote}</p>
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

      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <PostActions post={post} activeView={activeView} />
      </div>
    </article>
  );
}

function ConnectionBanner({ account }: { account: LinkedInAccountSummary | null }) {
  const configured = config.linkedinClientId.length > 0;

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] p-4 text-[13px] leading-6 text-amber-200/90">
        <strong className="font-semibold text-amber-100">App LinkedIn non configurée.</strong> Ajoutez les variables
        d’environnement <code className="rounded bg-black/30 px-1">LINKEDIN_CLIENT_ID</code> et{' '}
        <code className="rounded bg-black/30 px-1">LINKEDIN_CLIENT_SECRET</code> (Vercel), puis connectez le compte
        d’Anthony pour activer la publication automatique.
      </div>
    );
  }

  const connected = account && account.status === 'active';
  const needsReauth = account && account.status === 'needs_reauth';

  return (
    <div className={cn(
      'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-[13px]',
      connected ? 'border-emerald-400/20 bg-emerald-500/[0.05]' : 'border-white/[0.08] bg-white/[0.02]',
    )}>
      <div className="min-w-0 leading-6">
        {connected ? (
          <span className="text-emerald-200/90">
            <strong className="font-semibold text-emerald-100">LinkedIn connecté</strong>
            {account?.memberName ? ` · ${account.memberName}` : ''}. Les posts approuvés se publient automatiquement à l’heure prévue.
          </span>
        ) : needsReauth ? (
          <span className="text-amber-200/90">
            <strong className="font-semibold text-amber-100">Reconnexion LinkedIn requise.</strong>{' '}
            {account?.lastError ?? 'Le jeton a expiré.'}
          </span>
        ) : (
          <span className="text-zinc-300">
            <strong className="font-semibold text-zinc-100">LinkedIn non connecté.</strong> Connectez le profil d’Anthony
            pour publier automatiquement après validation.
          </span>
        )}
      </div>
      <a href="/admin/integrations/linkedin/connect" className={connected ? BTN_NEUTRAL : BTN_PRIMARY}>
        {connected ? 'Reconnecter' : 'Connecter LinkedIn'}
      </a>
    </div>
  );
}

function OrgConnectionBanner({ account }: { account: LinkedInOrgAccountSummary | null }) {
  const configured = config.linkedinOrgClientId.length > 0;

  if (!configured) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] leading-6 text-zinc-500">
        <strong className="font-semibold text-zinc-300">Reshare sur la page Lucid-Lab : app non configurée.</strong>{' '}
        Nécessite une candidature LinkedIn approuvée au produit « Community Management API » sur un app développeur
        dédié (LinkedIn interdit ce produit sur le même app que « Share on LinkedIn »), puis{' '}
        <code className="rounded bg-black/30 px-1">LINKEDIN_ORG_CLIENT_ID</code> /{' '}
        <code className="rounded bg-black/30 px-1">LINKEDIN_ORG_CLIENT_SECRET</code> sur Vercel.
      </div>
    );
  }

  const connected = account && account.status === 'active';
  const needsReauth = account && account.status === 'needs_reauth';

  return (
    <div className={cn(
      'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-[13px]',
      connected ? 'border-emerald-400/20 bg-emerald-500/[0.05]' : 'border-white/[0.08] bg-white/[0.02]',
    )}>
      <div className="min-w-0 leading-6">
        {connected ? (
          <span className="text-emerald-200/90">
            <strong className="font-semibold text-emerald-100">Page Lucid-Lab connectée.</strong> Chaque post publié
            est reposté sur le feed de la page.
          </span>
        ) : needsReauth ? (
          <span className="text-amber-200/90">
            <strong className="font-semibold text-amber-100">Reconnexion de la page requise.</strong>{' '}
            {account?.lastError ?? 'Le jeton a expiré.'}
          </span>
        ) : (
          <span className="text-zinc-300">
            <strong className="font-semibold text-zinc-100">Page Lucid-Lab non connectée.</strong> Connectez-la (en
            tant qu’admin de la page) pour reposter automatiquement chaque post publié.
          </span>
        )}
      </div>
      <a href="/admin/integrations/linkedin-org/connect" className={connected ? BTN_NEUTRAL : BTN_PRIMARY}>
        {connected ? 'Reconnecter' : 'Connecter la page'}
      </a>
    </div>
  );
}

function NewPostForm({ activeView }: { activeView: ViewKey }) {
  return (
    <details className="rounded-lg border border-white/[0.08] bg-white/[0.02]">
      <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-medium text-zinc-200 hover:text-white">
        + Nouveau post
      </summary>
      <form action={createSocialPostAction} className="grid gap-3 border-t border-white/[0.06] p-4">
        <HiddenContext activeView={activeView} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>Auteur</label>
            <input name="author_label" defaultValue="Anthony Poirier" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Pilier</label>
            <input name="pillar" placeholder="ai-readiness" className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Programmé le</label>
            <input type="datetime-local" name="scheduled_for" className={FIELD} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Accroche</label>
          <input name="hook" placeholder="La phrase d’ouverture qui arrête le scroll" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Texte du post</label>
          <textarea name="body" rows={8} placeholder="Le contenu complet du post LinkedIn…" className={cn(FIELD, 'resize-y leading-6')} />
        </div>
        <div>
          <label className={LABEL}>Lien (1er commentaire)</label>
          <input name="link_in_comment" placeholder="https://lucid-lab.fr/audit-flash" className={FIELD} />
        </div>
        <div>
          <button type="submit" className={BTN_PRIMARY}>Créer le brouillon</button>
        </div>
      </form>
    </details>
  );
}

export default async function LucidOsSocialPage({
  searchParams,
}: {
  searchParams?: Promise<{
    vue?: string | string[];
    linkedin_connected?: string;
    linkedin_error?: string;
    linkedin_org_connected?: string;
    linkedin_org_error?: string;
  }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const rawView = Array.isArray(resolved.vue) ? resolved.vue[0] : resolved.vue;
  const activeView: ViewKey = VIEWS.some((v) => v.key === rawView) ? (rawView as ViewKey) : 'a-valider';

  const [posts, account, orgAccount] = await Promise.all([
    listSocialPosts(200),
    getLinkedInAccount(),
    getLinkedInOrgAccount(),
  ]);
  const blogVersions = await getBlogVersionsBySocialPostIds(posts.map((p) => p.id));
  const countFor = (view: (typeof VIEWS)[number]) => posts.filter((p) => view.statuses.includes(p.status)).length;

  const active = VIEWS.find((v) => v.key === activeView)!;
  const visiblePosts = posts
    .filter((p) => active.statuses.includes(p.status))
    .sort((a, b) => sortKey(a) - sortKey(b));

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="LinkedIn" />

      {resolved.linkedin_connected ? (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] p-3 text-[13px] text-emerald-200/90">
          Compte LinkedIn connecté.
        </div>
      ) : null}
      {resolved.linkedin_error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-3 text-[13px] text-red-200/90">
          Connexion LinkedIn échouée : {resolved.linkedin_error}
        </div>
      ) : null}
      {resolved.linkedin_org_connected ? (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] p-3 text-[13px] text-emerald-200/90">
          Page Lucid-Lab connectée.
        </div>
      ) : null}
      {resolved.linkedin_org_error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-3 text-[13px] text-red-200/90">
          Connexion de la page échouée : {resolved.linkedin_org_error}
        </div>
      ) : null}

      <ConnectionBanner account={account} />
      <OrgConnectionBanner account={orgAccount} />

      <p className="-mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
        « À valider » est la file de la semaine. Modifiez ou rejetez ce qui doit l’être ; sans retour de votre part, les posts sont approuvés puis publiés à l’heure prévue (le silence vaut accord). Les posts publiés affichent leurs métriques.
      </p>

      <NewPostForm activeView={activeView} />

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
          {visiblePosts.map((post) => <PostCard key={post.id} post={post} activeView={activeView} blogVersion={blogVersions[post.id]} />)}
        </div>
      )}
    </div>
  );
}
