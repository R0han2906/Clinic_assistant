import { formatCurrency } from '@/lib/formatters'

export const dynamic = 'force-static'

const accounts = [
  { id: 'acc1', name: 'Main Operations Account', type: 'Checking',   bank: 'BCA',         balance: 48250,  currency: 'USD', status: 'Active' },
  { id: 'acc2', name: 'Payroll Account',          type: 'Savings',    bank: 'Mandiri',     balance: 22100,  currency: 'USD', status: 'Active' },
  { id: 'acc3', name: 'Tax Reserve',              type: 'Savings',    bank: 'BNI',         balance: 8750,   currency: 'USD', status: 'Active' },
  { id: 'acc4', name: 'Equipment Fund',           type: 'Investment', bank: 'BRI',         balance: 15000,  currency: 'USD', status: 'Active' },
  { id: 'acc5', name: 'Insurance Claims Pool',    type: 'Escrow',     bank: 'Permata',     balance: 5300,   currency: 'USD', status: 'Pending' },
  { id: 'acc6', name: 'Petty Cash',               type: 'Cash',       bank: 'On-site',     balance: 420,    currency: 'USD', status: 'Active' },
]

const TYPE_COLORS: Record<string, string> = {
  Checking:   'bg-sky-50 text-sky-700',
  Savings:    'bg-emerald-50 text-emerald-700',
  Investment: 'bg-purple-50 text-purple-700',
  Escrow:     'bg-amber-50 text-amber-700',
  Cash:       'bg-neutral-100 text-neutral-600',
}

export default function AccountsPage() {
  const total = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Financial accounts overview</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + Add Account
        </button>
      </div>

      {/* Total balance card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <p className="text-sm text-muted-foreground">Total Balance (All Accounts)</p>
        <p className="mt-2 text-4xl font-bold">{formatCurrency(total)}</p>
        <p className="mt-1 text-xs text-emerald-600">↑ All accounts healthy</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_COLORS[acc.type] ?? 'bg-muted text-muted-foreground'}`}>
                {acc.type}
              </span>
              <span className={`text-xs font-medium ${acc.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {acc.status}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{acc.name}</h3>
            <p className="text-xs text-muted-foreground">{acc.bank}</p>
            <p className="mt-3 text-2xl font-bold">{formatCurrency(acc.balance)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
