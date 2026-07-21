import { adminBasePath } from '@/lib/admin/auth';
import { PostForm } from '../PostForm';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">
          Nouvelle entrée
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
          Nouvel article
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Commence par un titre — tu peux laisser le reste vide et revenir plus tard.
        </p>
      </header>
      <PostForm post={null} base={base} />
    </div>
  );
}
