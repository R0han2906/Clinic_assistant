export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col gap-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-64 animate-pulse rounded-2xl bg-muted md:col-span-8" />
        <div className="col-span-12 h-64 animate-pulse rounded-2xl bg-muted md:col-span-4" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-44 animate-pulse rounded-2xl bg-muted md:col-span-8" />
        <div className="col-span-12 h-44 animate-pulse rounded-2xl bg-muted md:col-span-4" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-72 animate-pulse rounded-2xl bg-muted md:col-span-6" />
        <div className="col-span-12 h-72 animate-pulse rounded-2xl bg-muted md:col-span-6" />
      </div>
    </div>
  )
}
