import { staff } from '@/lib/mock-data'
import { STAFF_STATUS_CLASSES } from '@/lib/constants'

export const dynamic = 'force-static'

export default function StaffPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff List</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Team members · {staff.length} staff
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]">
          + Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {member.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{member.name}</p>
                <p className="truncate text-sm text-muted-foreground">{member.role}</p>
                <p className="truncate text-xs text-muted-foreground">{member.department}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STAFF_STATUS_CLASSES[member.status]}`}>
                {member.status}
              </span>
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>📞 {member.phone}</p>
              <p>✉ {member.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
