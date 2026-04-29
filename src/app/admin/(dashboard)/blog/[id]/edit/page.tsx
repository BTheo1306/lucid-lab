import { notFound } from 'next/navigation';

import { getAdminPostById } from '@/lib/admin/blog';
import { PostForm } from '../../PostForm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: RouteParams) {
  const { id } = await params;
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
      <PostForm post={post} />
    </div>
  );
}
