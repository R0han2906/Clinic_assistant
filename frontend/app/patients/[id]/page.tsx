import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, HeartPulse, MessageSquare } from 'lucide-react'
import { patients, appointments } from '@/lib/mock-data'
import { PATIENT_STATUS_CLASSES } from '@/lib/constants'
import { calcAge, formatShortDate } from '@/lib/formatters'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return patients.map((p) => ({ id: p.id }))
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = patients.find((p) => p.id === params.id)
  if (!patient) notFound()

  const patientAppts = appointments.filter((a) => a.patientId === patient.id)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Back */}
      <Link
        href="/patients"
        className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Patients
      </Link>

      {/* Patient header card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-2xl font-bold text-fuchsia-700">
            {patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{patient.fullName}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PATIENT_STATUS_CLASSES[patient.status]}`}>
                {patient.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.gender} · {calcAge(patient.dateOfBirth)} years old
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Phone className="size-4" />{patient.phone}</span>
              <span className="flex items-center gap-1.5"><Mail className="size-4" />{patient.email}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4" />{patient.address}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/reservations"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
            >
              <Calendar className="size-4" /> Book Appointment
            </Link>
            <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]">
              <HeartPulse className="size-4" /> Start Checkup
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]">
              <MessageSquare className="size-4" /> Message
            </button>
          </div>
        </div>
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contact Info */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="mb-4 font-semibold">Contact Information</h3>
          <div className="space-y-4 text-sm">
            {[
              ['Full Name', patient.fullName],
              ['Phone', patient.phone],
              ['Email', patient.email],
              ['Gender', patient.gender],
              ['Date of Birth', patient.dateOfBirth],
              ['Address', patient.address],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-2">
                <span className="text-xs uppercase text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h3 className="mb-4 font-semibold">Appointments</h3>
          {patientAppts.length > 0 ? (
            <div className="space-y-3">
              {patientAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.treatment}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                    <p className="text-xs text-muted-foreground">{a.dentist}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Calendar className="mb-2 size-10 opacity-30" />
              <p className="text-sm">No appointments recorded</p>
            </div>
          )}
          <Link
            href="/reservations"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            <Calendar className="size-4" /> Book New Appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
