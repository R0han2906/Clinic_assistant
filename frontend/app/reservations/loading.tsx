export default function ReservationsLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex h-14 items-end gap-8 border-b border-border bg-card px-8">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-8 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-[72px_1fr_1fr_1fr]">
          <div className="border-r border-border" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-r border-border p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
