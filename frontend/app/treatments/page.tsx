import { formatCurrency, formatDuration } from '@/lib/formatters'
import { treatments } from '@/lib/mock-data'

export const dynamic = 'force-static'

const CATEGORY_COLORS: Record<string, string> = {
  Preventive:   'bg-sky-50 text-sky-700 border-sky-200',
  Surgical:     'bg-rose-50 text-rose-700 border-rose-200',
  Restorative:  'bg-amber-50 text-amber-700 border-amber-200',
  Endodontic:   'bg-red-50 text-red-700 border-red-200',
  Cosmetic:     'bg-purple-50 text-purple-700 border-purple-200',
  Orthodontic:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  Periodontic:  'bg-rose-50 text-rose-700 border-rose-200',
  Diagnostic:   'bg-neutral-100 text-neutral-600 border-neutral-200',
}

const CARD_ACCENTS: Record<string, string> = {
  sky:    'border-t-sky-400',
  sage:   'border-t-emerald-400',
  rose:   'border-t-rose-400',
  amber:  'border-t-amber-400',
  purple: 'border-t-purple-400',
}

export default function TreatmentsPage() {
  const categories = [...new Set(treatments.map((t) => t.category))]

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Treatments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Service catalog · {treatments.length} treatments across {categories.length} categories
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]">
          + Add Treatment
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">All</button>
        {categories.map((cat) => (
          <button key={cat} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition">
            {cat}
          </button>
        ))}
      </div>

      {/* Treatment cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {treatments.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border border-t-4 border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${CARD_ACCENTS[t.color] ?? 'border-t-neutral-300'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{t.name}</h3>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[t.category] ?? 'bg-muted text-muted-foreground'}`}>
                {t.category}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>⏱</span>
                <span>{formatDuration(t.durationMinutes)}</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(t.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
