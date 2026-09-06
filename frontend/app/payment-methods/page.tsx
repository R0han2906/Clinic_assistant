import { paymentMethods } from '@/lib/mock-data'

export const dynamic = 'force-static'

const TYPE_ICONS: Record<string, string> = {
  Cash:        '💵',
  Card:        '💳',
  Digital:     '📱',
  Bank:        '🏦',
  Insurance:   '🏥',
  'E-Wallet':  '📲',
  Installment: '🗓',
}

export default function PaymentMethodsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accepted payment methods · {paymentMethods.filter(p=>p.enabled).length} enabled
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + Add Method
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-2xl">
                {TYPE_ICONS[pm.type] ?? '💱'}
              </div>
              {/* Toggle */}
              <button
                className={`relative h-6 w-11 rounded-full transition ${pm.enabled ? 'bg-primary' : 'bg-muted'}`}
                aria-label={`Toggle ${pm.name}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${pm.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            <h3 className="mt-3 font-semibold">{pm.name}</h3>
            <p className="text-xs text-muted-foreground">{pm.type}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Processing fee: {pm.processingFee ?? 'None'}</span>
              <span className={pm.enabled ? 'text-emerald-600' : 'text-neutral-400'}>
                {pm.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
