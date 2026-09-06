import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { purchaseOrders } from '@/lib/mock-data'
import { PURCHASE_STATUS_CLASSES } from '@/lib/constants'

export const dynamic = 'force-static'

const totalSpend = purchaseOrders.reduce((s, p) => s + p.amount, 0)

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchases</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase orders · {purchaseOrders.length} orders · Total spend: {formatCurrency(totalSpend)}
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + New Order
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Received',  count: purchaseOrders.filter(p => p.status === 'Received').length, color: 'text-emerald-600' },
          { label: 'Pending',   count: purchaseOrders.filter(p => p.status === 'Pending').length,  color: 'text-amber-600' },
          { label: 'Ordered',   count: purchaseOrders.filter(p => p.status === 'Ordered').length,  color: 'text-blue-600' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className={`mt-2 text-3xl font-bold ${k.color}`}>{k.count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-[1fr_160px_200px_100px_100px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Vendor</div>
          <div>Date</div>
          <div>Items</div>
          <div>Amount</div>
          <div>Status</div>
        </div>
        {purchaseOrders.map((po) => (
          <div key={po.id} className="grid grid-cols-[1fr_160px_200px_100px_100px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted transition">
            <div className="font-medium">{po.vendor}</div>
            <div className="text-sm text-muted-foreground">{formatShortDate(po.date)}</div>
            <div className="truncate text-sm text-muted-foreground">{po.items}</div>
            <div className="font-semibold">{formatCurrency(po.amount)}</div>
            <div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PURCHASE_STATUS_CLASSES[po.status]}`}>
                {po.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
