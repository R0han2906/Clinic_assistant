import Link from 'next/link'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

export const dynamic = 'force-static'

const reportLinks = [
  { icon: Calendar,    label: 'Appointment Report',  desc: 'Daily, weekly, monthly appointment summaries',    href: '/reservations', color: 'bg-sky-50 text-sky-700' },
  { icon: DollarSign,  label: 'Revenue Report',       desc: 'Income breakdown by treatment and payment method', href: '/sales',        color: 'bg-emerald-50 text-emerald-700' },
  { icon: Users,       label: 'Patient Report',       desc: 'New patients, retention, and demographics',       href: '/patients',     color: 'bg-purple-50 text-purple-700' },
  { icon: TrendingUp,  label: 'Growth Report',        desc: 'Month-over-month growth and KPI trends',          href: '/accounts',     color: 'bg-amber-50 text-amber-700' },
  { icon: BarChart3,   label: 'Treatment Report',     desc: 'Most popular treatments and revenue per service', href: '/treatments',   color: 'bg-rose-50 text-rose-700' },
]

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="mt-1 text-sm text-muted-foreground">Analytics and exportable reports</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportLinks.map((r) => (
          <Link
            key={r.label}
            href={r.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <div className={`flex size-12 items-center justify-center rounded-xl ${r.color}`}>
              <r.icon className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold">{r.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
            <p className="mt-4 text-xs font-semibold text-primary">View report →</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-1 font-semibold">Export Center</h3>
        <p className="text-sm text-muted-foreground">Export reports as PDF or CSV for offline use</p>
        <div className="mt-4 flex gap-3">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
            📄 Export as PDF
          </button>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">
            📊 Export as CSV
          </button>
        </div>
      </div>
    </div>
  )
}
