export default function AdminBlogLoading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="h-10 w-40 rounded-sm bg-zinc-100" />
      <div className="h-12 rounded-sm bg-white" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-28 rounded-md bg-zinc-100" />
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-lg border border-zinc-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
