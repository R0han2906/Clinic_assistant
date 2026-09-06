import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { salesRecords } from '@/lib/mock-data'
import { SALE_STATUS_CLASSES } from '@/lib/constants'

export const dynamic = 'force-static'

const totalRevenue = salesRecords.reduce((s, r) => s + (r.status === 'Paid' ? r.amount : 0), 0)
const pending = salesRecords.reduce((s, r) => s + (r.status === 'Pending' ? r.amount : 0), 0)
const overdue = salesRecords.reduce((s, r) => s + (r.status === 'Overdue' ? r.amount : 0), 0)

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales</h2>
        <p className="mt-1 text-sm text-muted-foreground">Revenue overview and transaction history</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Collected Revenue', value: totalRevenue, color: 'text-emerald-600', trend: '↑8% vs yesterday' },
          { label: 'Pending',           value: pending,      color: 'text-amber-600',   trend: `${salesRecords.filter(r=>r.status==='Pending').length} invoices` },
          { label: 'Overdue',           value: overdue,      color: 'text-red-600',     trend: `${salesRecords.filter(r=>r.status==='Overdue').length} invoices` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className={`mt-2 text-3xl font-bold ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Simple CSS bar chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h3 className="mb-4 font-semibold">Revenue by Treatment Type</h3>
        <div className="space-y-3">
          {[
            { label: 'Veneers',         amount: 1200, max: 2500 },
            { label: 'Root Canal',      amount: 650,  max: 2500 },
            { label: 'Whitening',       amount: 700,  max: 2500 },
            { label: 'General Checkup', amount: 170,  max: 2500 },
            { label: 'Scaling',         amount: 240,  max: 2500 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-muted-foreground">{item.label}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(item.amount / item.max) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-semibold">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-[1fr_160px_120px_100px_100px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Patient / Treatment</div>
          <div>Date</div>
          <div>Method</div>
          <div>Amount</div>
          <div>Status</div>
        </div>
        {salesRecords.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_160px_120px_100px_100px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted transition">
            <div>
              <p className="font-medium">{r.patient}</p>
              <p className="text-xs text-muted-foreground">{r.treatment}</p>
            </div>
            <div className="text-sm text-muted-foreground">{formatShortDate(r.date)}</div>
            <div className="text-sm text-muted-foreground">{r.method}</div>
            <div className="font-semibold">{formatCurrency(r.amount)}</div>
            <div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SALE_STATUS_CLASSES[r.status]}`}>
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
