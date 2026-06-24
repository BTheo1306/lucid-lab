export default function LucidOsLoading() {
  return (
    <div className="grid animate-pulse gap-5">
      <div className="h-24 rounded-sm border border-white/[0.06] bg-white/[0.02]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 border-t border-white/[0.08]" />
        ))}
      </div>
      <div className="h-72 rounded-sm border border-white/[0.06] bg-white/[0.02]" />
      <div className="h-56 rounded-sm border border-white/[0.06] bg-white/[0.02]" />
    </div>
  );
}
