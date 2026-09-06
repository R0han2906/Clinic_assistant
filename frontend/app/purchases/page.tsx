'use client'

import { useState, useEffect } from 'react'
import { Plus, Download, X, Loader2, CheckCircle2, Clock, Truck } from 'lucide-react'
import { api } from '@/lib/api-client'
import { PurchaseCreate, VendorResponse } from '@/types/api'
export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [newOrder, setNewOrder] = useState<PurchaseCreate>({
    vendor_name: 'DentSupply Co.',
    items: '',
    amount: 100.0,
    status: 'Ordered',
    notes: ''
  })

  const loadPurchases = async () => {
    try {
      const [data, vendorData] = await Promise.all([
        api.purchases.list(statusFilter || undefined),
        api.purchases.listVendors(),
      ])
      setPurchases(data || [])
      setVendors(vendorData || [])
    } catch {
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchases()
  }, [statusFilter])

  const totalSpend = purchases.reduce((s, p) => s + Number(p.amount), 0)
  const countReceived = purchases.filter((p) => p.status === 'Received').length
  const countPending = purchases.filter((p) => p.status === 'Pending').length
  const countOrdered = purchases.filter((p) => p.status === 'Ordered').length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrder.vendor_name || !newOrder.items) return
    setSubmitting(true)
    try {
      await api.purchases.create(newOrder)
      setIsModalOpen(false)
      setNewOrder({
        vendor_name: 'DentSupply Co.',
        items: '',
        amount: 100.0,
        status: 'Ordered',
        notes: ''
      })
      loadPurchases()
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkReceived = async (poId: string) => {
    try {
      await api.purchases.updateStatus(poId, 'Received')
      loadPurchases()
    } catch (err: any) {
      alert(err.message || 'Failed to update order status')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchases &amp; Supply Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchases.length} orders in Supabase · Total spend: ${totalSpend.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(api.purchases.exportCsvUrl(), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" /> New Order
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Received</p>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{countReceived}</p>
          <p className="mt-1 text-xs text-muted-foreground">Inventory delivered &amp; stocked</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Delivery</p>
            <Clock className="size-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-500">{countPending}</p>
          <p className="mt-1 text-xs text-muted-foreground">Shipped / Awaiting arrival</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordered</p>
            <Truck className="size-5 text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-600">{countOrdered}</p>
          <p className="mt-1 text-xs text-muted-foreground">Purchase orders placed</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_120px_1fr_100px_110px_90px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>PO Number &amp; Vendor</div>
          <div>Order Date</div>
          <div>Items / Supplies</div>
          <div>Amount</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading purchase orders...
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No purchase orders found. Click &quot;New Order&quot; to place a supply order.
          </div>
        ) : (
          purchases.map((po: any, idx: number) => (
            <div
              key={po.purchase_id || po.id || `po-${idx}`}
              className="grid grid-cols-[1fr_120px_1fr_100px_110px_90px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/40 transition text-sm"
            >
              <div>
                <p className="font-bold text-foreground">{po.vendor_name || po.vendor}</p>
                <p className="text-xs text-muted-foreground">{po.purchase_id || po.id}</p>
              </div>
              <div className="text-xs text-muted-foreground">{po.order_date || po.date}</div>
              <div className="truncate text-xs text-muted-foreground">{po.items}</div>
              <div className="font-bold text-foreground">${Number(po.amount).toFixed(2)}</div>
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    po.status === 'Received'
                      ? 'bg-emerald-100 text-emerald-800'
                      : po.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {po.status}
                </span>
              </div>
              <div className="text-right">
                {po.status !== 'Received' ? (
                  <button
                    onClick={() => handleMarkReceived(po.purchase_id)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Receive
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Delivered</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">New Supply Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Supplier / Vendor *</label>
                <select
                  value={newOrder.vendor_name}
                  onChange={(e) => setNewOrder({ ...newOrder, vendor_name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  {(vendors.length > 0
                    ? vendors.map((v) => v.name)
                    : ['DentSupply Co.', 'Medix Pharma', 'BioTech Dental', 'Global Dental Direct']
                  ).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Items Description *</label>
                <textarea
                  required
                  value={newOrder.items}
                  onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                  placeholder="e.g. 10x Dental Bibs, 5x Lidocaine 2%, 2x Composite Syringes"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Total Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newOrder.amount}
                    onChange={(e) => setNewOrder({ ...newOrder, amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Initial Status</label>
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="Ordered">Ordered</option>
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
