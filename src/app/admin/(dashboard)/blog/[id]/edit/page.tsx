import { notFound } from 'next/navigation';

import { getAdminPostById } from '@/lib/admin/blog';
import { PostForm } from '../../PostForm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function EditPostPage({ params, searchParams }: RouteParams) {
  const { id } = await params;
  const { saved } = await searchParams;
  const post = await getAdminPostById(id);
  if (!post) notFound();

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">
          Édition · {post.locale.toUpperCase()} · {post.status}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
          {post.title}
        </h1>
      </header>
      {saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ✓ Enregistré. {post.status === 'draft' && post.content ? 'Contenu généré par l\'IA — relisez et publiez.' : null}
        </div>
      ) : null}
      <PostForm post={post} />
    </div>
  );
}
