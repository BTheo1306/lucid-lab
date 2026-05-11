export default function LucidClientDetailLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      <div className="h-14 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      <div className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border border-zinc-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-zinc-200 bg-white" />
    </div>
  );
}
