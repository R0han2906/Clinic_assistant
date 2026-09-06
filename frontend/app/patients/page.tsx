import Link from 'next/link'
import { Search, Download, UserPlus, ChevronRight } from 'lucide-react'
import { patients } from '@/lib/mock-data'
import { PATIENT_STATUS_CLASSES } from '@/lib/constants'
import { calcAge, formatShortDate } from '@/lib/formatters'

export const dynamic = 'force-static'

// ─── Avatar Initials ──────────────────────────────────────────────────────────

function PatientAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = [
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className="size-10 rounded-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>
      {initials}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all patient records · {patients.length} total
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]">
            <Download className="size-4" /> Export
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]">
            <UserPlus className="size-4" /> New Patient
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <input className="w-full bg-transparent outline-none" placeholder="Search patients…" />
        </label>
        <select className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>New</option>
        </select>
        <select className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All genders</option>
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_80px_120px_120px_100px_90px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="w-10" />
          <div>Name</div>
          <div>Age</div>
          <div className="hidden md:block">Last Visit</div>
          <div className="hidden lg:block">Phone</div>
          <div>Status</div>
          <div />
        </div>

        {/* Rows */}
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/patients/${patient.id}`}
            className="grid grid-cols-[auto_1fr_80px_120px_120px_100px_90px] items-center gap-4 border-b border-border px-5 py-4 transition hover:bg-muted last:border-0"
          >
            <PatientAvatar name={patient.name} avatarUrl={patient.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium">{patient.name}</p>
              <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {calcAge(patient.dateOfBirth)} yr
            </div>
            <div className="hidden text-sm text-muted-foreground md:block">
              {formatShortDate(patient.lastVisit)}
            </div>
            <div className="hidden truncate text-sm text-muted-foreground lg:block">
              {patient.phone}
            </div>
            <div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  PATIENT_STATUS_CLASSES[patient.status]
                }`}
              >
                {patient.status}
              </span>
            </div>
            <div className="flex justify-end">
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing 1–{patients.length} of {patients.length} patients</p>
        <div className="flex gap-1">
          <button className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40" disabled>Previous</button>
          <button className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">1</button>
          <button className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40" disabled>Next</button>
        </div>
      </div>
    </div>
  )
}
