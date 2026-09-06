export default function RootLoading() {
  return (
    <div className="flex h-full flex-col gap-6 p-6 md:p-8">
      {/* Greeting skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      {/* KPI skeletons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-9 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Row skeletons */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-56 animate-pulse rounded-2xl bg-muted md:col-span-8" />
        <div className="col-span-12 h-56 animate-pulse rounded-2xl bg-muted md:col-span-4" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-40 animate-pulse rounded-2xl bg-muted md:col-span-8" />
        <div className="col-span-12 h-40 animate-pulse rounded-2xl bg-muted md:col-span-4" />
      </div>
    </div>
  )
}
