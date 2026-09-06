'use client'

import { useState, useEffect } from 'react'
import { Download, Plus, DollarSign, X, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { SaleResponse, SaleSummary, SaleCreate } from '@/types/api'
export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [summary, setSummary] = useState<SaleSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [newSale, setNewSale] = useState<SaleCreate>({
    patient_name: '',
    treatment_name: 'General Consultation',
    amount: 50.0,
    payment_method: 'Cash',
    status: 'Paid',
    notes: ''
  })

  const loadData = async () => {
    try {
      const [salesData, summaryData] = await Promise.all([
        api.sales.list({ status: statusFilter || undefined }),
        api.sales.summary()
      ])
      setSales(salesData || [])
      if (summaryData) setSummary(summaryData)
    } catch {
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSale.patient_name || !newSale.treatment_name) return
    setSubmitting(true)
    try {
      await api.sales.create(newSale)
      setIsModalOpen(false)
      setNewSale({
        patient_name: '',
        treatment_name: 'General Consultation',
        amount: 50.0,
        payment_method: 'Cash',
        status: 'Paid',
        notes: ''
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (saleId: string, newStatus: string) => {
    try {
      await api.sales.updateStatus(saleId, newStatus)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  // Dynamic revenue grouping for chart
  const treatmentTotals: Record<string, number> = {}
  sales.forEach((s) => {
    treatmentTotals[s.treatment_name] = (treatmentTotals[s.treatment_name] || 0) + Number(s.amount)
  })
  const chartItems = Object.entries(treatmentTotals)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
  const maxAmount = Math.max(...chartItems.map((c) => c.amount), 100)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales &amp; Invoicing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Billing history, live Supabase payments, and revenue breakdown
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(api.sales.exportCsvUrl(statusFilter || undefined), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Record Bill / Payment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collected Revenue</p>
            <CheckCircle className="size-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-600">
            ${summary?.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary?.count_paid || 0} bills completed &amp; settled
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Invoices</p>
            <Clock className="size-5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-500">
            ${summary?.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary?.count_pending || 0} invoices awaiting payment
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue</p>
            <AlertTriangle className="size-5 text-rose-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-600">
            ${summary?.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary?.count_overdue || 0} invoices requiring follow-up
          </p>
        </div>
      </div>

      {/* Revenue Breakdown by Treatment */}
      {chartItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Revenue by Treatment Procedure</h3>
          <div className="space-y-3">
            {chartItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">{item.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min((item.amount / maxAmount) * 100, 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-bold text-foreground">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'Paid', 'Pending', 'Overdue'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {st || 'All Bills'}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_120px_130px_100px_110px_90px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Patient / Treatment</div>
          <div>Date</div>
          <div>Payment Method</div>
          <div>Amount</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading sales records...
          </div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No sales records matching filter. Click &quot;Record Bill / Payment&quot; to create one.
          </div>
        ) : (
          sales.map((r: any, idx: number) => (
            <div
              key={r.sale_id || r.id || `sale-${idx}`}
              className="grid grid-cols-[1fr_120px_130px_100px_110px_90px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/40 transition text-sm"
            >
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">{r.patient_name || r.patient}</p>
                <p className="text-xs text-muted-foreground truncate">{r.treatment_name || r.treatment} · {r.bill_number || r.sale_id || r.id}</p>
              </div>
              <div className="text-xs text-muted-foreground">{r.sale_date || r.date}</div>
              <div className="text-xs font-medium text-foreground">{r.payment_method || r.method}</div>
              <div className="font-bold text-foreground">${Number(r.amount).toFixed(2)}</div>
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-right">
                {r.status !== 'Paid' ? (
                  <button
                    onClick={() => handleStatusChange(r.sale_id, 'Paid')}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Settled</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">Record Bill / Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={newSale.patient_name}
                  onChange={(e) => setNewSale({ ...newSale, patient_name: e.target.value })}
                  placeholder="e.g. Courtney Henry"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Treatment Procedure *</label>
                <input
                  type="text"
                  required
                  value={newSale.treatment_name}
                  onChange={(e) => setNewSale({ ...newSale, treatment_name: e.target.value })}
                  placeholder="e.g. Teeth Whitening, Crown"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSale.amount}
                    onChange={(e) => setNewSale({ ...newSale, amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Payment Method</label>
                  <select
                    value={newSale.payment_method}
                    onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="QRIS / Digital Payment">QRIS / Digital Payment</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Insurance (BPJS / Private)">Insurance</option>
                    <option value="GoPay / E-Wallet">E-Wallet</option>
                    <option value="Installment Plan">Installment Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={newSale.status}
                  onChange={(e) => setNewSale({ ...newSale, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
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
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
