import Link from 'next/link';
import { CalendarClock, FileText, Lightbulb, NotebookPen, Plus, Archive } from 'lucide-react';

import { listAllAdminPosts, type BlogPostRow, type BlogStatus } from '@/lib/admin/blog';

export const dynamic = 'force-dynamic';

const STATUSES: { key: BlogStatus; label: string; icon: typeof Lightbulb; tone: string }[] = [
  { key: 'idea', label: 'Idées', icon: Lightbulb, tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { key: 'draft', label: 'Brouillons', icon: NotebookPen, tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
  { key: 'scheduled', label: 'Programmés', icon: CalendarClock, tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { key: 'published', label: 'Publiés', icon: FileText, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { key: 'archived', label: 'Archivés', icon: Archive, tone: 'bg-zinc-50 text-zinc-500 ring-zinc-200' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function PostCard({ post }: { post: BlogPostRow }) {
  const dateLine =
    post.status === 'scheduled'
      ? `Pub. ${formatDateTime(post.scheduled_for)}`
      : post.status === 'published'
        ? `Publié ${formatDate(post.published_at)}`
        : `Maj ${formatDate(post.updated_at)}`;

  return (
    <Link
      href={`/admin/blog/${post.id}/edit`}
      className="block rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-400 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-zinc-950">{post.title}</p>
        <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-600">
          {post.locale}
        </span>
      </div>
      {post.category ? (
        <p className="mt-1 text-[11px] text-zinc-500">{post.category}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-zinc-500">{dateLine}</p>
    </Link>
  );
}

export default async function AdminBlogPage() {
  const posts = await listAllAdminPosts();
  const byStatus = new Map<BlogStatus, BlogPostRow[]>();
  for (const s of STATUSES) byStatus.set(s.key, []);
  for (const p of posts) {
    const list = byStatus.get(p.status as BlogStatus);
    if (list) list.push(p);
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">
                Éditorial
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                Blog
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Idées, brouillons, articles programmés et publiés. Drag and drop bientôt.
              </p>
            </div>
          </div>
          <Link
            href="/admin/blog/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            Nouvelle idée
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STATUSES.map((s) => {
          const list = byStatus.get(s.key) ?? [];
          const Icon = s.icon;
          return (
            <section
              key={s.key}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"
            >
              <header className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.tone}`}
                >
                  <Icon className="size-3" />
                  {s.label}
                </span>
                <span className="text-xs text-zinc-500">{list.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
                    Vide
                  </p>
                ) : (
                  list.map((p) => <PostCard key={p.id} post={p} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
