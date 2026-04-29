'use client';

import Link from 'next/link';

import type { BlogPostRow } from '@/lib/admin/blog';
import { CATEGORIES } from '@/lib/blog/types';
import {
  archivePostAction,
  createPostAction,
  deletePostAction,
  publishNowAction,
  updatePostAction,
} from './actions';

interface PostFormProps {
  post: BlogPostRow | null;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  // datetime-local needs `YYYY-MM-DDTHH:mm` in local time
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idée' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const FUNNEL_OPTIONS = [
  { value: '', label: '—' },
  { value: 'TOFU', label: 'TOFU' },
  { value: 'MOFU', label: 'MOFU' },
  { value: 'BOFU', label: 'BOFU' },
];

export function PostForm({ post }: PostFormProps) {
  const isEdit = post !== null;
  const action = isEdit ? updatePostAction : createPostAction;

  const inputCls =
    'mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-zinc-500';

  return (
    <div className="grid gap-6">
      <form id="blog-post-form" action={action} className="grid gap-6">
        {isEdit ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="md:col-span-2">
          <span className={labelCls}>Titre *</span>
          <input
            type="text"
            name="title"
            required
            defaultValue={post?.title ?? ''}
            className={inputCls}
          />
        </label>

        <label>
          <span className={labelCls}>Statut</span>
          <select
            name="status"
            defaultValue={post?.status ?? 'idea'}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelCls}>Locale</span>
          <select
            name="locale"
            defaultValue={post?.locale ?? 'fr'}
            className={inputCls}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          <span className={labelCls}>Slug</span>
          <input
            type="text"
            name="slug"
            placeholder="mon-article-genial"
            defaultValue={post?.slug ?? ''}
            className={inputCls}
          />
        </label>

        <label>
          <span className={labelCls}>Catégorie</span>
          <select
            name="category"
            defaultValue={post?.category ?? ''}
            className={inputCls}
          >
            <option value="">—</option>
            {Object.values(CATEGORIES).map((c) => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2">
          <span className={labelCls}>Description (meta)</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={post?.description ?? ''}
            className={inputCls}
          />
        </label>

        <label>
          <span className={labelCls}>Funnel stage</span>
          <select
            name="funnel_stage"
            defaultValue={post?.funnel_stage ?? ''}
            className={inputCls}
          >
            {FUNNEL_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelCls}>Tags (séparés par virgules)</span>
          <input
            type="text"
            name="tags"
            defaultValue={(post?.tags ?? []).join(', ')}
            className={inputCls}
          />
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="is_pillar"
            defaultChecked={post?.is_pillar ?? false}
            className="size-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Article pilier</span>
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="is_cornerstone"
            defaultChecked={post?.is_cornerstone ?? false}
            className="size-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Cornerstone</span>
        </label>
      </div>

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label>
          <span className={labelCls}>Contenu MDX</span>
          <textarea
            name="content"
            rows={28}
            defaultValue={post?.content ?? ''}
            className={`${inputCls} font-mono text-[13px] leading-relaxed`}
            placeholder={"## Mon premier H2\n\nLe corps en MDX. Tu peux utiliser <AuditFlashCTA topic=\"…\" />."}
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label>
          <span className={labelCls}>Programmer pour</span>
          <input
            type="datetime-local"
            name="scheduled_for"
            defaultValue={toLocalInputValue(post?.scheduled_for ?? null)}
            className={inputCls}
          />
        </label>

        <label>
          <span className={labelCls}>Date de publication</span>
          <input
            type="date"
            name="published_at"
            defaultValue={toDateInputValue(post?.published_at ?? null)}
            className={inputCls}
          />
        </label>

        <label>
          <span className={labelCls}>Maj contenu</span>
          <input
            type="date"
            name="content_updated_at"
            defaultValue={toDateInputValue(post?.content_updated_at ?? null)}
            className={inputCls}
          />
        </label>

        <label className="md:col-span-3">
          <span className={labelCls}>Notes éditoriales</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={post?.notes ?? ''}
            className={inputCls}
            placeholder="Pour qui, pourquoi maintenant, angle, sources, références…"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label>
          <span className={labelCls}>Hero image (URL)</span>
          <input
            type="text"
            name="hero_image"
            defaultValue={post?.hero_image ?? ''}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Hero image alt</span>
          <input
            type="text"
            name="hero_image_alt"
            defaultValue={post?.hero_image_alt ?? ''}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>OG image (URL)</span>
          <input
            type="text"
            name="og_image"
            defaultValue={post?.og_image ?? ''}
            className={inputCls}
          />
        </label>
      </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Link
          href="/admin/blog"
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          ← Retour
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isEdit && post?.status !== 'published' ? (
            <form action={publishNowAction}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Publier maintenant
              </button>
            </form>
          ) : null}
          {isEdit && post?.status !== 'archived' ? (
            <form action={archivePostAction}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Archiver
              </button>
            </form>
          ) : null}
          {isEdit ? (
            <form action={deletePostAction}>
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  if (!confirm('Supprimer définitivement ?')) e.preventDefault();
                }}
              >
                Supprimer
              </button>
            </form>
          ) : null}
          <button
            type="submit"
            form="blog-post-form"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
