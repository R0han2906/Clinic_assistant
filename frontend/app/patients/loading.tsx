export default function PatientsLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
      <div className="mb-4 flex gap-3">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <div className="size-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
