export default function AdminDashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-24 animate-pulse rounded-xl bg-white" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl bg-white" />
        <div className="h-32 animate-pulse rounded-xl bg-white" />
        <div className="h-32 animate-pulse rounded-xl bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-white" />
    </div>
  );
}
