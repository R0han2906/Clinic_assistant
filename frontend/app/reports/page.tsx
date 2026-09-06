import Link from 'next/link'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Lock, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-static'

const operationalReports = [
  {
    icon: Calendar,
    label: 'Appointment Report',
    desc: 'Daily, weekly, and monthly appointment throughput and provider schedules',
    href: '/reservations',
    color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  },
  {
    icon: Users,
    label: 'Patient Report',
    desc: 'Patient registrations, check-in retention, and demographic summaries',
    href: '/patients',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  {
    icon: BarChart3,
    label: 'Treatment & Service Report',
    desc: 'Active clinical services catalog, visit durations, and common procedures',
    href: '/treatments',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
]

const financialReports = [
  {
    icon: DollarSign,
    label: 'Revenue Report',
    desc: 'Income breakdown by procedure and payment method (Restricted)',
    href: '#',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    restricted: true,
  },
  {
    icon: TrendingUp,
    label: 'Growth & Ledger Report',
    desc: 'Month-over-month clinic profitability and ledger trends (Restricted)',
    href: '#',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    restricted: true,
  },
]

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Clinic Reports</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            Receptionist View
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational analytics and reports tailored for clinic front-desk management
        </p>
      </div>

      {/* Operational Reports Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Operational Reports
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operationalReports.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] group"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${r.color}`}>
                <r.icon className="size-6" />
              </div>
              <h4 className="mt-4 font-bold text-foreground group-hover:text-primary transition-colors">
                {r.label}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
              <p className="mt-4 text-xs font-bold text-primary">View report →</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Financial Reports (Role-Filtered / Restricted for Receptionist) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Financial Reports (Executive / Admin Access Only)
          </h3>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
            <Lock className="size-3 text-muted-foreground" /> Restricted for Receptionist role
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {financialReports.map((r) => (
            <div
              key={r.label}
              className="rounded-2xl border border-border/60 bg-muted/20 p-5 opacity-75 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className={`flex size-10 items-center justify-center rounded-xl ${r.color} opacity-70`}>
                  <r.icon className="size-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  <Lock className="size-2.5" /> Admin Only
                </span>
              </div>
              <h4 className="mt-3 font-semibold text-foreground/80">{r.label}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Center */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-1 font-bold text-foreground">Receptionist Export Center</h3>
        <p className="text-sm text-muted-foreground">
          Export operational rosters, attendance logs, and patient appointment manifests
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/reservations"
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
          >
            📄 View Schedule Manifest
          </Link>
          <Link
            href="/reservations"
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
          >
            📊 Appointments Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
