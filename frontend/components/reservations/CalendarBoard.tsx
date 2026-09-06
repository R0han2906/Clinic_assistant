'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  CalendarDays, ChevronLeft, ChevronRight, Filter,
  Download, Plus, Loader2, Clock, CheckCircle2, User,
  Calendar as CalendarIcon, Check, DollarSign, XCircle, AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { DentistResponse, PatientResponse, SlotResponse } from '@/types/api'
import { cn } from '@/lib/utils'
import { normalizeStatus, getStatusMeta, AppointmentStatus } from '@/lib/appointment-lifecycle'

// ─── Lazy Loaded Interactive Dialogs ──────────────────────────────────────────

const ReservationDrawer = dynamic(
  () => import('@/components/appointments/ReservationDrawer').then((m) => m.ReservationDrawer),
  { ssr: false }
)

const VisitSummaryPanel = dynamic(
  () => import('@/components/appointments/VisitSummaryPanel').then((m) => m.VisitSummaryPanel),
  { ssr: false }
)

const TakePaymentDialog = dynamic(
  () => import('@/components/payments/TakePaymentDialog').then((m) => m.TakePaymentDialog),
  { ssr: false }
)

const RescheduleDialog = dynamic(
  () => import('@/components/appointments/RescheduleDialog').then((m) => m.RescheduleDialog),
  { ssr: false }
)

const CancelDialog = dynamic(
  () => import('@/components/appointments/CancelDialog').then((m) => m.CancelDialog),
  { ssr: false }
)

// ─── Helper: Bulletproof Time Parser ──────────────────────────────────────────

function parseTimeToHour(timeStr?: string): number | undefined {
  if (!timeStr) return undefined
  const clean = String(timeStr).trim()

  // Match 12-hour format e.g. "09:00 AM", "2:30 pm", "09:00AM"
  const match12 = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i)
  if (match12) {
    let h = parseInt(match12[1], 10)
    const m = parseInt(match12[2], 10) || 0
    const isPm = match12[3].toLowerCase() === 'pm'
    if (isPm && h < 12) h += 12
    if (!isPm && h === 12) h = 0
    return h + m / 60
  }

  // Match range strings like "09:00 AM › 10:00 AM" or "09:00 - 10:00"
  if (clean.includes('›') || clean.includes(' - ') || clean.includes('-')) {
    const firstPart = clean.split(/[›\-]/)[0].trim()
    const parsedFirst = parseTimeToHour(firstPart)
    if (parsedFirst !== undefined) return parsedFirst
  }

  // Match 24-hour format HH:MM(:SS) e.g. "09:00", "14:30", "09:00:00"
  const match24 = clean.match(/(\d{1,2}):(\d{2})/)
  if (match24) {
    const h = parseInt(match24[1], 10)
    const m = parseInt(match24[2], 10) || 0
    return h + m / 60
  }

  return undefined
}

const DEFAULT_FALLBACK_DENTISTS = [
  {
    id: 'DOC-000001',
    dentist_id: 'DOC-000001',
    name: 'Drg Soap Mactavish',
    specialty: 'Chief Dentist & Orthodontics',
    initials: 'SM',
  },
  {
    id: 'DOC-000002',
    dentist_id: 'DOC-000002',
    name: "Drg Jerald O'Hara",
    specialty: 'Endodontist & Oral Surgery',
    initials: 'JO',
  },
  {
    id: 'DOC-000003',
    dentist_id: 'DOC-000003',
    name: 'Drg Putri Larasati',
    specialty: 'Pediatric & Restorative Dentistry',
    initials: 'PL',
  },
]

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({
  selectedDate,
  dentists: propDentists,
  onClose,
  onCreated,
}: {
  selectedDate: string
  dentists: DentistResponse[]
  onClose: () => void
  onCreated: () => void
}) {
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [dentists, setDentists] = useState<DentistResponse[]>(propDentists || [])
  const [patientQuery, setPatientQuery] = useState('')
  const [patientId, setPatientId] = useState('')
  const [dentistId, setDentistId] = useState('')
  const [treatmentName, setTreatmentName] = useState('General Checkup')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [slots, setSlots] = useState<SlotResponse[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    api.patients.list().then((list) => setPatients(list || [])).catch(() => setPatients([]))
    if (!propDentists || propDentists.length === 0) {
      api.dentists.list().then((dents) => {
        if (dents && dents.length > 0) {
          setDentists(dents)
        }
      }).catch(() => {})
    } else {
      setDentists(propDentists)
    }
  }, [propDentists])

  useEffect(() => {
    if (!dentistId && dentists.length > 0) {
      setDentistId(dentists[0].dentist_id || (dentists[0] as any).id || '')
    }
  }, [dentists, dentistId])

  useEffect(() => {
    if (!dentistId || !selectedDate) return
    setSlotsLoading(true)
    api.dentists
      .getSlots(selectedDate, dentistId, 60)
      .then((list) => setSlots((list || []).filter((s) => s.is_available !== false)))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [dentistId, selectedDate])

  const matchedPatients = patients
    .filter((p) => {
      const q = patientQuery.trim().toLowerCase()
      if (!q) return true
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.patient_id || '').toLowerCase().includes(q)
      )
    })
    .slice(0, 6)

  const selectedPatient = patients.find((p) => p.patient_id === patientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      setErrorMsg('Select an existing patient before booking.')
      return
    }
    if (!dentistId) {
      setErrorMsg('Select a dentist.')
      return
    }
    setSubmitting(true)
    setErrorMsg(null)
    try {
      await api.appointments.create({
        patient_id: patientId,
        dentist_id: dentistId,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        treatment_name: treatmentName,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-auto">
        <h3 className="text-lg font-bold text-foreground mb-4">Book New Appointment</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">{errorMsg}</div>
          )}
          <div>
            <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Patient *
            </label>
            <input
              type="text"
              value={selectedPatient ? selectedPatient.full_name : patientQuery}
              onChange={(e) => {
                setPatientId('')
                setPatientQuery(e.target.value)
              }}
              placeholder="Search name, phone, or ID…"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
            {!patientId && (
              <div className="mt-2 max-h-36 overflow-auto space-y-1">
                {matchedPatients.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground px-1">No matching patients. Register them in Patients first.</p>
                ) : (
                  matchedPatients.map((p, pIdx) => (
                    <button
                      key={p.patient_id || (p as any).id || `pat-${pIdx}`}
                      type="button"
                      onClick={() => {
                        setPatientId(p.patient_id)
                        setPatientQuery(p.full_name)
                      }}
                      className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                    >
                      <p className="font-semibold text-foreground">{p.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.patient_id} · {p.phone}</p>
                    </button>
                  ))
                )}
              </div>
            )}
            {patientId && (
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">Selected: {selectedPatient?.full_name} ({patientId})</p>
            )}
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Dentist *
            </label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            >
              {dentists.map((d: any) => {
                const idVal = d.dentist_id || d.id
                return (
                  <option key={idVal} value={idVal}>
                    {d.name} {d.specialty ? `(${d.specialty})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Treatment
            </label>
            <select
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="General Checkup">General Checkup</option>
              <option value="Tooth Scaling">Tooth Scaling & Cleaning</option>
              <option value="Bleaching">Bleaching / Teeth Whitening</option>
              <option value="Dental Extraction">Dental Extraction</option>
              <option value="Tooth Filling (Composite)">Tooth Filling (Composite)</option>
              <option value="Root Canal Treatment">Root Canal Treatment</option>
              <option value="Dental Consultation">Dental Consultation</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  const [h, m] = e.target.value.split(':').map(Number)
                  const nextH = (h + 1).toString().padStart(2, '0')
                  setEndTime(`${nextH}:${(m || 0).toString().padStart(2, '0')}`)
                }}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-3 animate-spin" />}
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status Indicator Icon Helper ─────────────────────────────────────────────

function StatusIndicatorIcon({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case 'scheduled':
      return <Clock className="size-3 text-sky-600" />
    case 'checked-in':
      return <Check className="size-3 text-blue-600 font-bold" />
    case 'in-progress':
      return <div className="size-2 rounded-full bg-purple-600 animate-pulse" />
    case 'completed':
      return <CheckCircle2 className="size-3 text-emerald-600" />
    case 'paid':
      return <DollarSign className="size-3 text-emerald-700" />
    case 'cancelled':
      return <XCircle className="size-3 text-rose-600" />
    case 'no-show':
      return <AlertCircle className="size-3 text-amber-600" />
    default:
      return <Clock className="size-3 text-muted-foreground" />
  }
}

// ─── Calendar Grid (96px Absolute Hourly Scale) ───────────────────────────────

interface CalendarGridProps {
  dentists: any[]
  appointments: any[]
  onSelectAppt: (appt: any) => void
  onRescheduleDrop: (apptId: string, dentistId: string, startTime: string, endTime: string) => void
  loading: boolean
}

function matchAppointmentToDentist(appt: any, dentist: any, docId: string): boolean {
  const targetId = String(docId || '').toLowerCase()
  const dId = dentist.dentist_id ? String(dentist.dentist_id).toLowerCase() : ''
  const dLegacyId = dentist.id ? String(dentist.id).toLowerCase() : ''
  const dName = dentist.name ? String(dentist.name).trim().toLowerCase() : ''

  const aDentistId = appt.dentist_id ? String(appt.dentist_id).toLowerCase() : ''
  const aDentistLegacyId = appt.dentistId ? String(appt.dentistId).toLowerCase() : ''
  const aDentistName = appt.dentist_name ? String(appt.dentist_name).trim().toLowerCase() : ''
  const aDentist = appt.dentist ? String(appt.dentist).trim().toLowerCase() : ''

  if (aDentistId && (aDentistId === targetId || aDentistId === dId || aDentistId === dLegacyId)) return true
  if (aDentistLegacyId && (aDentistLegacyId === targetId || aDentistLegacyId === dId || aDentistLegacyId === dLegacyId)) return true
  if (aDentistName && dName && (aDentistName === dName || dName.includes(aDentistName) || aDentistName.includes(dName))) return true
  if (aDentist && dName && (aDentist === dName || dName.includes(aDentist) || aDentist.includes(dName))) return true

  return false
}

function CalendarGrid({
  dentists,
  appointments,
  onSelectAppt,
  onRescheduleDrop,
  loading,
}: CalendarGridProps) {
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm']
  const [dragOverSlot, setDragOverSlot] = useState<{ docId: string; hourIdx: number } | null>(null)
  const [draggingApptId, setDraggingApptId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading clinic reservations...</span>
      </div>
    )
  }

  // Use database dentists dynamically; fall back to reference list only if database returns empty
  const cols = dentists && dentists.length > 0 ? dentists : DEFAULT_FALLBACK_DENTISTS

  return (
    <div className="flex-1 overflow-auto">
      {/* Column Headers for Dentists */}
      <div
        className="sticky top-0 z-20 grid border-b border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        style={{ gridTemplateColumns: `84px repeat(${cols.length}, 1fr)` }}
      >
        <div className="flex items-center justify-center border-r border-border p-3 text-xs font-bold text-muted-foreground">
          Time
        </div>
        {cols.map((d, colIdx) => {
          const docId = d.dentist_id || d.id || `doc-${colIdx}`
          const count = appointments.filter((a) => matchAppointmentToDentist(a, d, docId)).length
          const initials =
            d.initials ||
            d.name
              ?.split(' ')
              .map((n: string) => n[0])
              .filter(Boolean)
              .join('')
              .slice(0, 2)
              .toUpperCase() ||
            'DR'

          return (
            <div
              key={`header-${docId}-${colIdx}`}
              className="flex items-center gap-3 border-r border-border p-3.5 last:border-0"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{d.name}</p>
                <p className="text-[11px] text-muted-foreground font-normal">
                  Today&apos;s appointment: {count} patient(s)
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid rows with exact 96px hourly scale */}
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `84px repeat(${cols.length}, 1fr)` }}
      >
        {/* Left Time Column (96px height per hour) */}
        <div className="border-r border-border bg-muted/10">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: '96px' }}
              className="border-b border-border/60 px-3 pt-2 text-xs font-semibold text-muted-foreground"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Dentist Schedule Columns */}
        {cols.map((dentist, colIdx) => {
          const docId = dentist.dentist_id || dentist.id || `doc-${colIdx}`
          
          // Match appointments belonging to this dentist column, plus unassigned appointments in first column
          const dentistAppts = appointments.filter((a) => {
            const matchesCurrent = matchAppointmentToDentist(a, dentist, docId)
            if (matchesCurrent) return true
            
            // Catch-all: if an appointment does not match ANY column, show it in column 0 so it's never hidden
            if (colIdx === 0) {
              const matchesAnyCol = cols.some((c, cIdx) => {
                const cDocId = c.dentist_id || c.id || `doc-${cIdx}`
                return matchAppointmentToDentist(a, c, cDocId)
              })
              return !matchesAnyCol
            }
            return false
          })

          // Deduplication: guarantees no duplicate appointment object renders twice
          const seenIds = new Set<string>()
          const uniqueDentistAppts = dentistAppts.filter((appt) => {
            const rawId = appt.id || appt.appointment_id
            if (!rawId) return true
            if (seenIds.has(rawId)) return false
            seenIds.add(rawId)
            return true
          })

          return (
            <div key={`col-${docId}-${colIdx}`} className="relative border-r border-border">
              {/* Hour slot guidelines & drop targets (96px each) */}
              {hours.map((h, hIdx) => {
                const isOver = dragOverSlot?.docId === docId && dragOverSlot?.hourIdx === hIdx

                return (
                  <div
                    key={`slot-${docId}-${h}`}
                    style={{ height: '96px' }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (dragOverSlot?.docId !== docId || dragOverSlot?.hourIdx !== hIdx) {
                        setDragOverSlot({ docId, hourIdx: hIdx })
                      }
                    }}
                    onDragLeave={() => {
                      setDragOverSlot((curr) =>
                        curr?.docId === docId && curr?.hourIdx === hIdx ? null : curr
                      )
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverSlot(null)
                      setDraggingApptId(null)
                      try {
                        const raw = e.dataTransfer.getData('text/plain')
                        if (!raw) return
                        const payload = JSON.parse(raw)
                        const hourNum = 9 + hIdx
                        const startTime = `${String(hourNum).padStart(2, '0')}:00`
                        const endHour = hourNum + (payload.durationHours || 1)
                        const endTime = `${String(endHour).padStart(2, '0')}:00`
                        onRescheduleDrop(payload.apptId, docId, startTime, endTime)
                      } catch (err) {
                        console.error('Failed to parse drag drop payload:', err)
                      }
                    }}
                    className={cn(
                      'border-b border-border/40 transition-all flex items-center justify-center',
                      isOver
                        ? 'bg-primary/20 border-2 border-dashed border-primary shadow-inner'
                        : 'hover:bg-muted/10'
                    )}
                  >
                    {isOver && (
                      <span className="text-[11px] font-bold text-primary animate-pulse select-none px-2 py-1 rounded bg-background/80 border border-primary/30">
                        Drop to reschedule here ({9 + hIdx}:00)
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Absolutely positioned appointments with safe unique composite keys */}
              {uniqueDentistAppts.map((appt, idx) => {
                const status = normalizeStatus(appt.status || appt.payment_status)
                const statusMeta = getStatusMeta(status)

                // Bulletproof Time calculation: 96px per hour (base 9 AM)
                let startH = appt.startHour !== undefined ? appt.startHour : parseTimeToHour(appt.start_time)
                if (startH === undefined || isNaN(startH)) {
                  startH = parseTimeToHour(appt.time)
                }
                if (startH === undefined || isNaN(startH)) {
                  startH = 9
                }

                let endH = parseTimeToHour(appt.end_time)
                let dur = appt.durationHours
                if (dur === undefined || isNaN(dur)) {
                  if (endH !== undefined && !isNaN(endH) && endH > startH) {
                    dur = endH - startH
                  } else {
                    dur = 1
                  }
                }
                dur = Math.max(0.75, dur)

                const topPx = Math.max((startH - 9) * 96 + 4, 4)
                const heightPx = Math.max(68, dur * 96 - 8)

                const patientName = appt.patient || appt.patient_name || 'Patient'
                const treatment = appt.treatment || appt.treatment_name || 'General Checkup'
                const timeString = appt.time || `${appt.start_time || '09:00 AM'} › ${appt.end_time || '10:00 AM'}`
                const apptId = appt.id || appt.appointment_id || `apt-${idx}`
                const uniqueApptKey = `cal-${docId}-${apptId}-${idx}`
                const isDraggable = status !== 'cancelled' && status !== 'completed' && status !== 'paid'

                return (
                  <div
                    key={uniqueApptKey}
                    role="button"
                    tabIndex={0}
                    draggable={isDraggable}
                    onDragStart={(e) => {
                      setDraggingApptId(apptId)
                      e.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({
                          apptId,
                          durationHours: dur,
                          patientName,
                          currentDentistId: docId,
                        })
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      setDraggingApptId(null)
                      setDragOverSlot(null)
                    }}
                    onClick={() => onSelectAppt(appt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectAppt(appt)
                    }}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                    }}
                    className={cn(
                      'absolute left-2 right-2 rounded-2xl border p-2.5 text-left shadow-sm transition hover:scale-[1.01] hover:shadow-md active:scale-[0.99] z-10 flex flex-col justify-between overflow-hidden group select-none',
                      isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                      statusMeta.cardBgClass,
                      statusMeta.borderClass,
                      draggingApptId === apptId && 'opacity-40 ring-2 ring-primary ring-offset-2 scale-95'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {patientName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {treatment}
                        </p>
                      </div>

                      {/* Status indicator badge */}
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold border shrink-0',
                          statusMeta.badgeClass,
                          statusMeta.borderClass
                        )}
                      >
                        <StatusIndicatorIcon status={status} />
                        <span className="capitalize">{statusMeta.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{timeString}</span>
                      </div>
                      {isDraggable && (
                        <span className="text-[9px] text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                          Drag to move
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Client Component: CalendarBoard ─────────────────────────────────────

interface CalendarBoardProps {
  initialAppointments: any[]
  initialDentists: any[]
}

export function CalendarBoard({
  initialAppointments,
  initialDentists,
}: CalendarBoardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [appointments, setAppointments] = useState<any[]>(initialAppointments)
  const [dentists, setDentists] = useState<any[]>(initialDentists)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [activeTab, setActiveTab] = useState<'calendar' | 'log'>('calendar')

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null)
  const [visitSummaryOpen, setVisitSummaryOpen] = useState(false)
  const [takePaymentOpen, setTakePaymentOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  // Load from API exclusively — always reflects real backend state
  const loadData = async () => {
    setLoading(true)
    try {
      const [appts, dents] = await Promise.all([
        api.appointments.list({ date: selectedDate }),
        api.dentists.list(),
      ])
      const seenIds = new Set<string>()
      const uniqueAppts = (appts || []).filter((a: any) => {
        const id = a.id || a.appointment_id
        if (!id) return true
        if (seenIds.has(id)) return false
        seenIds.add(id)
        return true
      })
      setAppointments(uniqueAppts)
      if (dents && dents.length > 0) setDentists(dents)
    } catch (err) {
      console.error('Failed to load reservations from backend:', err)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const changeDateBy = (days: number) => {
    const curr = new Date(selectedDate + 'T00:00:00')
    curr.setDate(curr.getDate() + days)
    setSelectedDate(curr.toISOString().split('T')[0])
  }

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!selectedAppt) return
    const apptId = selectedAppt.appointment_id || selectedAppt.id
    const updated = { ...selectedAppt, status: newStatus }
    setAppointments((prev) =>
      prev.map((a) =>
        (a.id === selectedAppt.id || a.appointment_id === selectedAppt.appointment_id)
          ? updated
          : a
      )
    )
    setSelectedAppt(updated)

    if (apptId && !String(apptId).startsWith('temp-')) {
      try {
        await api.appointments.updateStatus(apptId, newStatus)
        await loadData()
      } catch (err) {
        console.warn('Could not persist status transition to backend:', err)
      }
    }
  }

  const handlePaymentSuccess = () => {
    handleUpdateStatus('paid')
  }

  // Drag and Drop Reschedule Handler: persists to backend & optimistically reflects in UI
  const handleDragReschedule = async (
    apptId: string,
    targetDentistId: string,
    startTime: string,
    endTime: string
  ) => {
    const prevAppointments = [...appointments]
    const targetAppt = appointments.find(
      (a) => a.id === apptId || a.appointment_id === apptId
    )
    if (!targetAppt) return

    const targetDentist = dentists.find(
      (d) => d.dentist_id === targetDentistId || d.id === targetDentistId
    )

    // Optimistic UI update
    const updatedAppt = {
      ...targetAppt,
      dentist_id: targetDentistId,
      dentistId: targetDentistId,
      dentist: targetDentist?.name || targetAppt.dentist,
      dentist_name: targetDentist?.name || targetAppt.dentist_name,
      start_time: startTime,
      end_time: endTime,
      time: `${startTime} › ${endTime}`,
      status: 'scheduled',
    }

    setAppointments((prev) =>
      prev.map((a) =>
        (a.id === apptId || a.appointment_id === apptId) ? updatedAppt : a
      )
    )

    try {
      await api.appointments.reschedule(apptId, {
        new_date: selectedDate,
        new_start_time: startTime,
        new_end_time: endTime,
        new_dentist_id: targetDentistId,
        reschedule_reason: 'Rescheduled via calendar drag & drop',
      })
      await loadData()
    } catch (err: any) {
      console.error('Drag reschedule failed:', err)
      // Rollback optimistic state
      setAppointments(prevAppointments)
      alert(err.message || 'Failed to reschedule appointment. The slot may conflict or is outside working hours.')
    }
  }

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Calendar Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Calendar vs Log Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                activeTab === 'log' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Log History
            </button>
          </div>

          {/* Total Appointments Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-bold text-foreground">
            <CalendarDays className="size-4 text-primary" />
            <span>{appointments.length} total appointments</span>
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
            >
              Today
            </button>
            <button
              onClick={() => changeDateBy(-1)}
              className="rounded-xl border border-border p-1.5 hover:bg-muted transition"
              aria-label="Previous Day"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => changeDateBy(1)}
              className="rounded-xl border border-border p-1.5 hover:bg-muted transition"
              aria-label="Next Day"
            >
              <ChevronRight className="size-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer"
              title="Pick a specific date"
            />
            <span className="hidden sm:inline-block text-sm font-bold text-foreground px-1">
              ({formattedDate})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Day / Week Switcher */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'rounded-lg px-3 py-1 transition',
                viewMode === 'day' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'rounded-lg px-3 py-1 transition',
                viewMode === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Week
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => window.open(api.appointments.exportCsvUrl(selectedDate), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            <Download className="size-4" /> Export
          </button>
          <button
            onClick={() => setBookingModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Add Appointment
          </button>
        </div>
      </div>

      {/* Main View Area: Calendar vs Log */}
      {activeTab === 'calendar' ? (
        <CalendarGrid
          dentists={dentists}
          appointments={appointments}
          onSelectAppt={(appt) => setSelectedAppt(appt)}
          onRescheduleDrop={handleDragReschedule}
          loading={loading}
        />
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 font-bold text-sm">
              Reservation Log History
            </div>
            <div className="divide-y divide-border">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No appointment records for this date.
                </div>
              ) : (
                appointments.map((a, idx) => {
                  const s = normalizeStatus(a.status || a.payment_status)
                  const meta = getStatusMeta(s)
                  return (
                    <div
                      key={`log-${a.id || a.appointment_id || 'apt'}-${idx}`}
                      onClick={() => setSelectedAppt(a)}
                      className="flex items-center justify-between p-4 hover:bg-muted/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('size-3 rounded-full', meta.dotClass, 'bg-current')} />
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {a.patient || a.patient_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.treatment || a.treatment_name} · {a.dentist || a.dentist_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium">
                          {a.time || `${a.start_time} - ${a.end_time}`}
                        </span>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold border', meta.badgeClass, meta.borderClass)}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Interactive Dialogs (Dynamically Loaded) ────────────────────────── */}

      {/* Detail Slide-Over Sheet */}
      {selectedAppt && (
        <ReservationDrawer
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenVisitSummary={() => setVisitSummaryOpen(true)}
          onOpenTakePayment={() => setTakePaymentOpen(true)}
          onOpenReschedule={() => setRescheduleOpen(true)}
          onOpenCancel={() => setCancelOpen(true)}
          onBookFollowUp={() => setBookingModalOpen(true)}
        />
      )}

      {/* Visit Summary Modal */}
      {visitSummaryOpen && selectedAppt && (
        <VisitSummaryPanel
          appointment={selectedAppt}
          onClose={() => setVisitSummaryOpen(false)}
          onTakePayment={() => {
            setVisitSummaryOpen(false)
            setTakePaymentOpen(true)
          }}
          onBookFollowUp={() => {
            setVisitSummaryOpen(false)
            setBookingModalOpen(true)
          }}
        />
      )}

      {/* Take Payment Dialog */}
      {takePaymentOpen && selectedAppt && (
        <TakePaymentDialog
          appointment={selectedAppt}
          onClose={() => setTakePaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleOpen && selectedAppt && (
        <RescheduleDialog
          appointment={selectedAppt}
          onClose={() => setRescheduleOpen(false)}
          onSuccess={(updated) => {
            handleUpdateStatus('scheduled')
            setRescheduleOpen(false)
          }}
        />
      )}

      {/* Cancel Dialog */}
      {cancelOpen && selectedAppt && (
        <CancelDialog
          appointment={selectedAppt}
          onClose={() => setCancelOpen(false)}
          onSuccess={(reason) => {
            handleUpdateStatus('cancelled')
            setCancelOpen(false)
          }}
          onOfferRebook={() => {
            setCancelOpen(false)
            setRescheduleOpen(true)
          }}
        />
      )}

      {/* New Booking Modal */}
      {bookingModalOpen && (
        <BookingModal
          selectedDate={selectedDate}
          dentists={dentists}
          onClose={() => setBookingModalOpen(false)}
          onCreated={loadData}
        />
      )}
    </div>
  )
}
