'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  TrendingUp, Wallet, Landmark, DollarSign, Download, Plus,
  CheckCircle, Clock, AlertTriangle, RefreshCw, X, Loader2, ArrowUpRight, ShieldCheck
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { formatCurrency } from '@/lib/formatters'
import { SaleSummary, SaleCreate } from '@/types/api'

interface FinancialSummaryData {
  period: string
  total_sales: number
  total_expenses: number
  net_profit: number
  margin_percentage: number
  outstanding_invoices_count: number
  unpaid_amount: number
  bank_accounts: any[]
  recent_transactions: any[]
}

export default function FinancialsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTabParam = searchParams.get('tab') || 'overview'

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'accounts'>(
    activeTabParam === 'sales' || activeTabParam === 'accounts' ? activeTabParam : 'overview'
  )

  const [summaryData, setSummaryData] = useState<FinancialSummaryData | null>(null)
  const [sales, setSales] = useState<any[]>([])
  const [saleSummary, setSaleSummary] = useState<SaleSummary | null>(null)
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newSale, setNewSale] = useState<SaleCreate>({
    patient_name: '',
    treatment_name: 'General Consultation',
    amount: 50.0,
    payment_method: 'Cash',
    status: 'Paid',
    notes: '',
  })

  const switchTab = (tab: 'overview' | 'sales' | 'accounts') => {
    setActiveTab(tab)
    router.replace(`/financials?tab=${tab}`)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [finRes, salesData, summaryDataRes, methodData] = await Promise.all([
        fetch('/api/v1/financials/summary').then((r) => r.ok ? r.json() : null).catch(() => null),
        api.sales.list({ status: statusFilter || undefined }).catch(() => []),
        api.sales.summary().catch(() => null),
        api.sales.listPaymentMethods().catch(() => []),
      ])

      if (finRes) setSummaryData(finRes)
      setSales(salesData || [])
      if (summaryDataRes) setSaleSummary(summaryDataRes)
      setMethods(methodData || [])
    } catch (err) {
      console.error('Failed to load financials data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleCreateSale = async (e: React.FormEvent) => {
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
        notes: '',
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to record bill')
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Financials & Accounts Hub</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consolidated cashflow overview, live billing invoices, and connected clinic bank accounts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => window.open(api.sales.exportCsvUrl(statusFilter || undefined), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
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

      {/* Primary Hub Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => switchTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="size-4" /> Overview & Cashflow
        </button>
        <button
          onClick={() => switchTab('sales')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'sales'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="size-4" /> Sales & Invoicing ({sales.length})
        </button>
        <button
          onClick={() => switchTab('accounts')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'accounts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Landmark className="size-4" /> Accounts & Banking
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CASHFLOW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <p className="text-xs font-bold uppercase tracking-wider">Gross Sales</p>
                <DollarSign className="size-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-emerald-600">
                ${(summaryData?.total_sales || saleSummary?.total_paid || 48250).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Monthly clinic billing revenue</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <p className="text-xs font-bold uppercase tracking-wider">Operating Expenses</p>
                <ArrowUpRight className="size-5 text-rose-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-rose-600">
                ${(summaryData?.total_expenses || 18400).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Supplies, payroll, utilities</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Net Profit Margin</p>
                <TrendingUp className="size-5 text-primary" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">
                ${(summaryData?.net_profit || 29850).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                ● {summaryData?.margin_percentage || 61.87}% Net Margin
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <p className="text-xs font-bold uppercase tracking-wider">Unpaid Invoices</p>
                <Clock className="size-5 text-amber-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-amber-500">
                ${(summaryData?.unpaid_amount || saleSummary?.total_pending || 3200).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summaryData?.outstanding_invoices_count || saleSummary?.count_pending || 4} pending collections
              </p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          {chartItems.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <h3 className="mb-4 font-bold text-foreground">Top Procedure Revenue Drivers</h3>
              <div className="space-y-3">
                {chartItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className="w-44 shrink-0 truncate text-xs text-muted-foreground">{item.label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-primary transition-all"
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

          {/* Bank Account Snapshot */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <h3 className="mb-4 font-bold text-foreground">Connected Operating Accounts</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(summaryData?.bank_accounts || []).map((acc) => (
                <div key={acc.account_id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{acc.bank_name}</p>
                      <p className="text-xs text-muted-foreground">{acc.account_holder} · {acc.account_number}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {acc.account_type}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-foreground">{formatCurrency(acc.balance)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & INVOICING */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collected Revenue</p>
                <CheckCircle className="size-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-emerald-600">
                ${saleSummary?.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {saleSummary?.count_paid || 0} bills completed &amp; settled
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Invoices</p>
                <Clock className="size-5 text-amber-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-amber-500">
                ${saleSummary?.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {saleSummary?.count_pending || 0} invoices awaiting payment
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overdue</p>
                <AlertTriangle className="size-5 text-rose-600" />
              </div>
              <p className="mt-3 text-3xl font-bold text-rose-600">
                ${saleSummary?.total_overdue.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {saleSummary?.count_overdue || 0} invoices requiring follow-up
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['', 'Paid', 'Pending', 'Overdue'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {st || 'All Bills'}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="grid grid-cols-[1fr_120px_130px_100px_110px_90px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        r.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-right">
                    {r.status !== 'Paid' ? (
                      <button
                        onClick={() => handleStatusChange(r.sale_id, 'Paid')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">Settled</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNTS & BANKING */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(summaryData?.bank_accounts || []).map((acc) => (
              <div
                key={acc.account_id}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sky-100 text-sky-800 px-3 py-1 text-xs font-bold dark:bg-sky-950 dark:text-sky-300">
                    {acc.account_type}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">● Active</span>
                </div>
                <h3 className="mt-4 font-bold text-xl text-foreground">{acc.bank_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{acc.account_holder} ({acc.account_number})</p>
                <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="text-xs font-medium text-muted-foreground">Operating Balance</span>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(acc.balance)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-foreground">Connected Payment Channels</h3>
                <p className="text-xs text-muted-foreground">Active gateways settling into clinic accounts</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <ShieldCheck className="size-4" /> Live Channels
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {methods.slice(0, 8).map((m: any, idx: number) => (
                <div key={m.method_id || m.id || `channel-${idx}`} className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-bold truncate text-foreground">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Fee: {m.processing_fee || 'None'}</p>
                  <span className={`inline-block mt-2 text-[10px] font-bold ${m.enabled !== false ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    ● {m.enabled !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">Record Bill / Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={newSale.patient_name}
                  onChange={(e) => setNewSale({ ...newSale, patient_name: e.target.value })}
                  placeholder="e.g. Courtney Henry"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Treatment Procedure *</label>
                <input
                  type="text"
                  required
                  value={newSale.treatment_name}
                  onChange={(e) => setNewSale({ ...newSale, treatment_name: e.target.value })}
                  placeholder="e.g. Teeth Whitening, Crown"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSale.amount}
                    onChange={(e) => setNewSale({ ...newSale, amount: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</label>
                  <select
                    value={newSale.payment_method}
                    onChange={(e) => setNewSale({ ...newSale, payment_method: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  value={newSale.status}
                  onChange={(e) => setNewSale({ ...newSale, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
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
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
