import { inventory } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/formatters'

export const dynamic = 'force-static'

export default function StocksPage() {
  const lowStock = inventory.filter((i) => i.quantity <= i.minStock)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stocks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory management · {inventory.length} items · {lowStock.length} low stock alerts
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + Add Item
        </button>
      </div>

      {/* Low stock alert bar */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-5 py-4 text-sm">
          <p className="font-semibold text-rose-700">⚠ {lowStock.length} items below minimum stock level</p>
          <p className="mt-1 text-rose-600">
            {lowStock.map((i) => i.name).join(', ')}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-[1fr_100px_100px_100px_120px_80px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Item</div>
          <div>Category</div>
          <div>Qty</div>
          <div>Min Stock</div>
          <div>Unit Price</div>
          <div>Status</div>
        </div>
        {inventory.map((item) => {
          const isLow = item.quantity <= item.minStock
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_100px_100px_100px_120px_80px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted transition"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.supplier}</p>
              </div>
              <div className="text-sm text-muted-foreground">{item.category}</div>
              <div className={`font-semibold text-sm ${isLow ? 'text-red-600' : 'text-foreground'}`}>
                {item.quantity} {item.unit}
              </div>
              <div className="text-sm text-muted-foreground">{item.minStock}</div>
              <div className="text-sm">{formatCurrency(item.unitPrice)}/{item.unit}</div>
              <div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isLow ? 'Low' : 'OK'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
