import Link from 'next/link'
import {
  CalendarDays, TrendingUp, TrendingDown, Users, DollarSign,
  Printer, Plus, UserPlus, Clock, CheckCircle2,
  Bell, AlertCircle, FileText, Phone, MessageSquare,
  ArrowRight,
} from 'lucide-react'
import { appointments, dentists, activities, alerts, kpiData } from '@/lib/mock-data'
import { formatRelativeTime, getInitials } from '@/lib/formatters'
import type { KpiData, Activity, Alert } from '@/types'

export const dynamic = 'force-static'

// ─── Greeting Header ─────────────────────────────────────────────────────────

function GreetingHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Good morning, Darrell 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You have <strong className="text-foreground">16 appointments</strong> today, 2 walk-ins waiting
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/reservations"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" /> New Appointment
        </Link>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]">
          <UserPlus className="size-4" /> Walk-in
        </button>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ kpi }: { kpi: KpiData }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
      <div
        className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
          kpi.trendUp ? 'text-emerald-600' : 'text-amber-600'
        }`}
      >
        {kpi.trendUp ? (
          <TrendingUp className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        {kpi.trend}
      </div>
      {kpi.progressPct != null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${kpi.progressPct}%` }}
            />
          </div>
          {kpi.subLabel && (
            <p className="mt-1 text-xs text-muted-foreground">{kpi.subLabel}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Up Next Card ─────────────────────────────────────────────────────────────

function UpNextCard() {
  const nextAppt = appointments.find((a) => a.status === 'Registered')
  const upcoming = appointments.filter((a) => a.status === 'Registered').slice(1, 4)

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Up Next</h3>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          In 15 min
        </span>
      </div>

      {nextAppt && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-lg font-bold text-fuchsia-700">
              {getInitials(nextAppt.patient)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{nextAppt.patient}</p>
              <p className="truncate text-xs text-muted-foreground">
                {nextAppt.time} · {nextAppt.treatment}
              </p>
              <p className="truncate text-xs text-muted-foreground">{nextAppt.dentist}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]">
              Check In
            </button>
            <button className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted active:scale-[0.98]">
              Reschedule
            </button>
            <button className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted active:scale-[0.98]">
              Message
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex-1">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Then coming up
        </p>
        <div className="space-y-1">
          {upcoming.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {getInitials(a.patient)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.patient}</p>
                <p className="truncate text-xs text-muted-foreground">{a.treatment}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {a.time.split(' › ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { icon: CalendarDays, label: 'Book Appointment', href: '/reservations', bg: 'bg-primary/10', fg: 'text-primary' },
    { icon: UserPlus,     label: 'Walk-in Check-in', href: '/patients',     bg: 'bg-emerald-50', fg: 'text-emerald-700' },
    { icon: DollarSign,   label: 'Take Payment',     href: '/accounts',     bg: 'bg-amber-50',   fg: 'text-amber-700' },
    { icon: Printer,      label: 'Print Schedule',   href: '/reports',      bg: 'bg-purple-50',  fg: 'text-purple-700' },
  ]
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h3 className="mb-4 font-semibold">Quick Actions</h3>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2.5 rounded-xl border border-border p-4 text-center transition hover:border-primary/30 hover:bg-muted active:scale-[0.98]"
          >
            <div className={`flex size-10 items-center justify-center rounded-full ${action.bg}`}>
              <action.icon className={`size-5 ${action.fg}`} />
            </div>
            <p className="text-xs font-medium leading-tight">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Schedule Timeline ────────────────────────────────────────────────────────

function ScheduleTimeline() {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Today&apos;s Schedule</h3>
        <span className="text-xs text-muted-foreground">9 AM – 5 PM</span>
      </div>
      <Link href="/reservations" className="block">
        <div className="flex overflow-hidden rounded-xl border border-border">
          {hours.map((h) => {
            const appts = appointments.filter((a) => Math.floor(a.startHour) === h)
            const hasInProgress = appts.some((a) => a.status === 'In Progress')
            const hasWaiting   = appts.some((a) => a.status === 'Waiting payment')
            const hasRegistered = appts.some((a) => a.status === 'Registered')
            const hasFinished  = appts.some((a) => a.status === 'Finished')
            const bg = hasInProgress ? 'bg-purple-200 hover:bg-purple-300'
              : hasWaiting ? 'bg-amber-200 hover:bg-amber-300'
              : hasRegistered ? 'bg-blue-200 hover:bg-blue-300'
              : hasFinished ? 'bg-emerald-200 hover:bg-emerald-300'
              : 'bg-muted/40 hover:bg-muted'
            return (
              <div
                key={h}
                className={`flex flex-1 flex-col items-center justify-center border-r border-border/50 py-4 text-[10px] font-medium last:border-0 transition ${bg}`}
              >
                <span>{h > 12 ? h - 12 : h}{h >= 12 ? 'pm' : 'am'}</span>
                {appts.length > 0 && (
                  <span className="mt-0.5 text-[9px] opacity-70">{appts.length}</span>
                )}
              </div>
            )
          })}
        </div>
      </Link>
      <div className="mt-3 flex flex-wrap gap-4">
        {[
          ['bg-emerald-200', 'Finished'],
          ['bg-blue-200', 'Upcoming'],
          ['bg-amber-200', 'Unpaid'],
          ['bg-purple-200', 'In Progress'],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`size-2.5 rounded-sm ${color}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dentist Status List ──────────────────────────────────────────────────────

function DentistStatusList() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h3 className="mb-4 font-semibold">Dentist Availability</h3>
      <div className="space-y-3">
        {dentists.map((dentist) => (
          <div
            key={dentist.id}
            className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-muted"
          >
            <div className="relative shrink-0">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted font-bold text-sm">
                {dentist.initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                  dentist.statusToday === 'in-session'
                    ? 'bg-amber-400'
                    : dentist.statusToday === 'available'
                    ? 'bg-emerald-400'
                    : 'bg-neutral-300'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{dentist.name}</p>
              <p className="text-xs text-muted-foreground">
                {dentist.statusToday === 'in-session'
                  ? 'In Session'
                  : dentist.statusToday === 'available'
                  ? 'Available'
                  : 'Off Today'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {dentist.appointmentsToday} appts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Icon ────────────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<
  Activity['type'],
  { bg: string; text: string; symbol: string }
> = {
  'check-in':    { bg: 'bg-emerald-50', text: 'text-emerald-700', symbol: '✓' },
  'payment':     { bg: 'bg-blue-50',    text: 'text-blue-700',    symbol: '$' },
  'sms':         { bg: 'bg-purple-50',  text: 'text-purple-700',  symbol: '✉' },
  'new-patient': { bg: 'bg-pink-50',    text: 'text-pink-700',    symbol: '+' },
  'appointment': { bg: 'bg-sky-50',     text: 'text-sky-700',     symbol: '📅' },
  'reschedule':  { bg: 'bg-amber-50',   text: 'text-amber-700',   symbol: '↻' },
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivity() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent Activity</h3>
        <button className="text-xs text-primary transition hover:underline">View all</button>
      </div>
      <div className="space-y-3">
        {activities.map((act) => {
          const cfg = ACTIVITY_CONFIG[act.type]
          return (
            <div key={act.id} className="flex items-start gap-3">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}
              >
                {cfg.symbol}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{act.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(act.timestamp)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

const PRIORITY_CLASSES: Record<Alert['priority'], string> = {
  high:   'border-l-rose-400 bg-rose-50/50',
  medium: 'border-l-amber-400 bg-amber-50/50',
  low:    'border-l-sky-400 bg-sky-50/50',
}

function AlertsPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Action Items</h3>
        <span className="flex size-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-xl border border-l-4 p-3 ${PRIORITY_CLASSES[alert.priority]}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {alert.description}
              </p>
            </div>
            <button className="shrink-0 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium transition hover:bg-muted active:scale-[0.98]">
              {alert.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Row 1: Greeting */}
      <GreetingHeader />

      {/* Row 2: KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Row 3: Up Next + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <UpNextCard />
        </div>
        <div className="md:col-span-4">
          <QuickActions />
        </div>
      </div>

      {/* Row 4: Schedule Timeline + Dentist Status */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <ScheduleTimeline />
        </div>
        <div className="md:col-span-4">
          <DentistStatusList />
        </div>
      </div>

      {/* Row 5: Activity + Alerts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RecentActivity />
        <AlertsPanel />
      </div>
    </div>
  )
}
