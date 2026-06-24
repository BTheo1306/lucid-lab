export default function AdminBlogLoading() {
  return (
    <div className="grid animate-pulse gap-6">
      <div className="h-10 w-40 rounded-sm bg-white/[0.04]" />
      <div className="h-12 rounded-sm bg-white/[0.02]" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-28 rounded-md bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-lg border border-white/[0.06] bg-white/[0.02]" />
        ))}
      </div>
    </div>
  );
}
