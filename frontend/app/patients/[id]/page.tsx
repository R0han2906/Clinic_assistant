'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, HeartPulse, Loader2, AlertCircle, Pencil } from 'lucide-react'
import { api } from '@/lib/api-client'
import { PatientResponse, AppointmentResponse, VisitResponse, PatientUpdate } from '@/types/api'
import { PatientAvatar } from '@/components/patients/PatientAvatar'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params?.id as string

  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [visits, setVisits] = useState<VisitResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<PatientUpdate>({})

  useEffect(() => {
    if (!patientId) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [patData, apptData, visitData] = await Promise.all([
          api.patients.get(patientId),
          api.appointments.list({ patient_id: patientId }),
          api.patients.getVisits(patientId).catch(() => []),
        ])
        setPatient(patData)
        setAppointments(apptData || [])
        setVisits(visitData || [])
        setEditForm({
          full_name: patData.full_name,
          phone: patData.phone,
          email: patData.email,
          dob_or_age: patData.dob_or_age,
          gender: patData.gender,
          address: patData.address,
          emergency_contact: patData.emergency_contact,
          allergies: patData.allergies,
          medical_conditions: patData.medical_conditions,
        })
      } catch (err: any) {
        setError(err?.message || `Patient record for ID ${patientId} was not found.`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [patientId])

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading patient record...</p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="size-12 text-destructive" />
        <h3 className="text-lg font-bold">Patient Not Found</h3>
        <p className="text-sm text-muted-foreground">{error || `No patient record with ID ${patientId}`}</p>
        <Link
          href="/patients"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to Patients
        </Link>
      </div>
    )
  }

  const initials = (patient.full_name || 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
          <PatientAvatar name={patient.full_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{patient.full_name}</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {patient.consent_status || 'Active'}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.patient_id} · {patient.gender || 'Not specified'} · {patient.dob_or_age ? `${patient.dob_or_age} yrs` : 'Age unrecorded'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Phone className="size-4 text-primary" />{patient.phone || 'No phone'}</span>
              <span className="flex items-center gap-1.5"><Mail className="size-4 text-primary" />{patient.email || 'No email'}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{patient.address || 'No address'}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!editing) {
                  setEditing(true)
                  return
                }
                setSaving(true)
                try {
                  const updated = await api.patients.update(patientId, editForm)
                  setPatient(updated)
                  setEditing(false)
                } catch (err: any) {
                  alert(err.message || 'Failed to update patient')
                } finally {
                  setSaving(false)
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <Pencil className="size-4" /> {editing ? (saving ? 'Saving…' : 'Save') : 'Edit'}
            </button>
            <Link
              href="/reservations"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
            >
              <Calendar className="size-4" /> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Medical & Contact Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 font-semibold text-foreground">Contact & Profile</h3>
            <div className="space-y-4 text-sm">
              {[
                ['Patient ID', patient.patient_id],
                ['Full Name', editing ? undefined : patient.full_name],
                ['Phone', editing ? undefined : (patient.phone || '—')],
                ['Email', editing ? undefined : (patient.email || '—')],
                ['Emergency Contact', editing ? undefined : (patient.emergency_contact || '—')],
                ['Gender', editing ? undefined : (patient.gender || '—')],
                ['Age / DOB', editing ? undefined : (patient.dob_or_age || '—')],
                ['Address', editing ? undefined : (patient.address || '—')],
              ].filter((row) => row[1] !== undefined).map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2 last:border-0">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
              {editing && (
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Full name" />
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.emergency_contact || ''} onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })} placeholder="Emergency contact" />
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.gender || ''} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} placeholder="Gender" />
                  <input className="rounded-xl border border-border p-2 text-sm" value={editForm.dob_or_age || ''} onChange={(e) => setEditForm({ ...editForm, dob_or_age: e.target.value })} placeholder="Age / DOB" />
                  <input className="col-span-2 rounded-xl border border-border p-2 text-sm" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Address" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <HeartPulse className="size-4 text-rose-500" /> Medical Conditions & Allergies
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Known Allergies</p>
                <p className="mt-1 font-medium text-foreground">
                  {patient.allergies || 'None reported'}
                </p>
              </div>
              <div className="border-t border-border/50 pt-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Underlying Conditions</p>
                <p className="mt-1 font-medium text-foreground">
                  {patient.medical_conditions || 'None reported'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments History */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Appointments History</h3>
            <span className="text-xs text-muted-foreground">{appointments.length} record(s)</span>
          </div>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((a: any, idx: number) => (
                <div key={`pat-appt-${a.appointment_id || a.id || 'apt'}-${idx}`} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{a.treatment_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.date} · {a.start_time} - {a.end_time}
                    </p>
                    <p className="text-xs text-muted-foreground">Dentist: {a.dentist_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {a.status}
                    </span>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {a.payment_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Calendar className="mb-2 size-10 opacity-30" />
              <p className="text-sm">No appointments recorded for this patient.</p>
            </div>
          )}
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Visit History</h3>
              <span className="text-xs text-muted-foreground">{visits.length} visit(s)</span>
            </div>
            {visits.length === 0 ? (
              <p className="text-xs text-muted-foreground">No clinical visit records yet.</p>
            ) : (
              <div className="space-y-3">
                {visits.map((v, idx) => (
                  <div key={`pat-visit-${v.visit_id || 'v'}-${idx}`} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{v.visit_type || 'Visit'} · {v.visit_date}</p>
                    <p className="text-xs text-muted-foreground mt-1">{v.summary || v.diagnosis || 'No summary'}</p>
                    {v.follow_up_recommendation && (
                      <p className="text-[11px] text-muted-foreground mt-1">Follow-up: {v.follow_up_recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
