'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { PaymentMethodResponse } from '@/types/api'
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
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadMethods = async () => {
    try {
      const data = await api.sales.listPaymentMethods()
      setMethods(data || [])
    } catch {
      setMethods([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMethods()
  }, [])

  const handleToggle = async (pm: PaymentMethodResponse) => {
    try {
      setTogglingId(pm.method_id)
      const updated = await api.sales.updatePaymentMethod(pm.method_id, !pm.enabled)
      setMethods((prev) =>
        prev.map((m) => (m.method_id === pm.method_id ? { ...m, enabled: updated.enabled } : m))
      )
    } catch (err) {
      console.error('Failed to toggle payment method:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const enabledCount = methods.filter((p) => p.enabled).length

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Loading payment methods...' : `Accepted payment methods · ${enabledCount} enabled`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm">Loading live payment channels...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((pm: any, idx: number) => (
            <div
              key={pm.method_id || pm.id || `pm-${idx}`}
              className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-2xl">
                  {TYPE_ICONS[pm.type || 'Cash'] ?? '💱'}
                </div>
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(pm)}
                  disabled={togglingId === pm.method_id}
                  className={`relative h-6 w-11 rounded-full transition ${pm.enabled ? 'bg-primary' : 'bg-muted'} ${togglingId === pm.method_id ? 'opacity-50' : ''}`}
                  aria-label={`Toggle ${pm.name}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${pm.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <h3 className="mt-3 font-semibold">{pm.name}</h3>
              <p className="text-xs text-muted-foreground">{pm.type || 'Standard'}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Processing fee: {pm.processing_fee ?? 'None'}</span>
                <span className={pm.enabled ? 'text-emerald-600 font-medium' : 'text-neutral-400'}>
                  {pm.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
