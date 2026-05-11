export default function LucidClientsLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      <div className="h-14 animate-pulse rounded-xl border border-zinc-200 bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-zinc-200 bg-white" />
    </div>
  );
}
