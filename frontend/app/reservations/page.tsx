'use client'

import { useState } from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Filter,
  Check, HeartPulse, Info, FileCheck2, FileText,
  ArrowRight, Pencil, Bell, X, MoreHorizontal, Clock3,
} from 'lucide-react'
import { appointments as allAppointments, patients } from '@/lib/mock-data'
import { APPOINTMENT_COLOR_CLASSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'

// ─── Teeth Data ───────────────────────────────────────────────────────────────

const teeth = [12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const medicalSteps = ['Medical data', 'Treatment Plan', 'Oral Check', 'Plan Agreement']

const patient = patients.find((p) => p.id === 'p6') ?? patients[0]

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-4 gap-2 border-b border-border px-5 py-6 md:px-10">
      {medicalSteps.map((label, i) => (
        <div key={label} className="relative text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full border-2 border-primary bg-card text-primary">
            {i < step ? <Check className="size-5" /> : i === step ? <HeartPulse className="size-5" /> : i + 1}
          </div>
          <p className="mt-2 text-[10px] uppercase text-muted-foreground">Step {i + 1}</p>
          <p className="text-xs font-semibold md:text-sm">{label}</p>
          {i < 3 && (
            <div
              className={`absolute left-[calc(50%+25px)] right-[calc(-50%+25px)] top-5 h-0.5 ${
                i < step ? 'bg-emerald-500' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tooth Chart ──────────────────────────────────────────────────────────────

function ToothChart({ selected, onSelect }: { selected: number | null; onSelect: (t: number) => void }) {
  return (
    <div className="mx-auto grid max-w-[350px] grid-cols-7 gap-2 rounded-full p-6">
      {teeth.map((tooth, i) => (
        <button
          key={tooth}
          onClick={() => onSelect(tooth)}
          className={cn(
            'flex aspect-square items-center justify-center rounded-full border text-[10px] transition hover:border-primary hover:bg-primary/10',
            selected === tooth ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-card text-muted-foreground',
            (i === 3 || i === 18) && 'ring-2 ring-rose-300'
          )}
          aria-label={`Tooth ${tooth}`}
        >
          {tooth}
        </button>
      ))}
    </div>
  )
}

// ─── Medical Wizard ───────────────────────────────────────────────────────────

function MedicalWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<number | null>(18)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')

  const next = () => setStep((s) => Math.min(3, s + 1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3 backdrop-blur-sm">
      <section
        className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[28px] bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 id="wizard-title" className="text-xl font-bold">Medical Checkup</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="Close">
            <X />
          </button>
        </header>
        <Stepper step={step} />
        <div className="flex-1 overflow-auto px-6 py-6 md:px-10">
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm">
            <Info className="size-4 text-primary" />
            Patient &amp; medical data are based on previous check, you can update it according to latest data.
          </div>

          {step === 0 && (
            <div className="py-10">
              <h3 className="text-center text-2xl font-bold">Medical data</h3>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Blood pressure
                  <input className="mt-2 w-full rounded-lg border border-border p-3" defaultValue="130 / 80" />
                </label>
                <label className="text-sm font-medium">
                  Particular sickness
                  <input className="mt-2 w-full rounded-lg border border-border p-3" placeholder="Enter conditions" />
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="py-8">
              <h3 className="text-center text-2xl font-bold">Medical service</h3>
              <p className="mt-2 text-center text-muted-foreground">Select a problem tooth</p>
              <ToothChart selected={selected} onSelect={setSelected} />
              {selected && (
                <div className="mx-auto max-w-md rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <strong>Tooth {selected}</strong>
                    <span className="text-xs text-primary">Selected</span>
                  </div>
                  <select className="mt-3 w-full rounded-lg border border-border p-3">
                    <option>Caries</option>
                    <option>Tooth filling</option>
                    <option>Scaling</option>
                  </select>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-3 min-h-20 w-full rounded-lg border border-border p-3"
                    placeholder="Notes"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="py-8">
              <h3 className="text-center text-2xl font-bold">Oral check</h3>
              <div className="mt-8 rounded-xl border border-border p-4">
                {['Heart Disease', 'Covid-19', 'Haemophilia', 'Hepatitis', 'Gastritis', 'Other Disease'].map((x, i) => (
                  <label key={x} className="flex items-center gap-3 border-b border-dashed border-border py-4 text-sm last:border-0">
                    <input type="checkbox" defaultChecked={i === 0 || i === 3} className="size-5 accent-primary" />
                    {x}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 text-center">
              <FileCheck2 className="mx-auto size-14 text-primary" />
              <h3 className="mt-4 text-2xl font-bold">Documents agreements</h3>
              <p className="mt-2 text-muted-foreground">Review and finish this medical checkup.</p>
              <button
                onClick={() => setSaved(true)}
                className="mt-8 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {saved ? 'Saved successfully' : 'Save checkup'}
              </button>
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-3 font-medium hover:bg-muted">Cancel</button>
          <div className="flex gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-lg border border-border px-5 py-3 font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={next}
              disabled={step === 3}
              className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground disabled:opacity-40 transition hover:opacity-90"
            >
              Next <ArrowRight className="ml-2 inline size-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

// ─── Reservation Drawer ───────────────────────────────────────────────────────

function ReservationDrawer({
  appointment,
  onClose,
  onMedical,
}: {
  appointment: Appointment
  onClose: () => void
  onMedical: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm" onClick={onClose}>
      <section
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              Reservation ID <strong className="text-foreground">#RSVA0011</strong>
            </p>
            <h2 id="reservation-title" className="text-xl font-bold">Manual appointment</h2>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border p-2 hover:bg-muted" aria-label="Edit reservation">
              <Pencil className="size-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Close">
              <X />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-border">
            <div className="flex items-center gap-4 border-b border-border p-5">
              <div className="flex size-14 items-center justify-center rounded-full bg-fuchsia-500 text-xl font-bold text-primary-foreground">
                CS
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Patient name</p>
                <h3 className="text-2xl font-bold">{patient.name}</h3>
              </div>
              <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                ● {appointment.status}
              </span>
            </div>
            <div className="p-5 text-sm text-muted-foreground">
              <FileText className="mr-3 inline size-5" />
              The lower and upper lips have canker sores
              <button className="float-right font-semibold text-primary">Edit</button>
            </div>
          </div>

          <div className="grid gap-6 border-b border-border py-8 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Treatment</p>
              <p className="mt-2 font-semibold">{appointment.treatment}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Date and time</p>
              <p className="mt-2 font-semibold">
                Wed, 24 Jun
                <br />
                10:00–11:00 AM
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Dentist</p>
              <p className="mt-2 font-semibold">{appointment.dentist}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border py-7">
            <p>
              Payment <strong>Bill #10102</strong>{' '}
              <span className="ml-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">UNPAID</span>
            </p>
            <button className="rounded-lg border border-border px-4 py-2 hover:bg-muted">
              <Bell className="mr-2 inline size-4" />
              Send reminder
            </button>
          </div>

          <div className="py-8">
            <h3 className="text-lg font-bold">General info</h3>
            <div className="mt-5 grid gap-6 text-sm md:grid-cols-2">
              {(
                [
                  ['Full name', patient.fullName],
                  ['Phone number', patient.phone],
                  ['Age', patient.dateOfBirth],
                  ['Email', patient.email],
                  ['Gender', patient.gender],
                  ['Address', patient.address],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-border p-6 sm:grid-cols-2">
          <button
            onClick={onMedical}
            className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <HeartPulse className="mr-2 inline size-5" />
            Edit Medical Checkup
          </button>
          <button className="rounded-lg border border-dashed border-primary px-4 py-3 font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98]">
            <FileText className="mr-2 inline size-5" />
            Add Medical Record
          </button>
        </footer>
      </section>
    </div>
  )
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ onAppointment }: { onAppointment: (a: Appointment) => void }) {
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm']
  const dentistNames = ['Drg Soap Mactavish', "Drg Jerald O'Hara", 'Drg Putri Larasati']

  return (
    <div className="min-w-[900px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="flex items-center gap-4">
          <CalendarDays className="size-7 text-muted-foreground" />
          <span className="text-2xl font-bold">16</span>
          <span className="text-sm text-muted-foreground">total appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5">
            Today
          </button>
          <button className="rounded-full p-2 hover:bg-muted">
            <ChevronLeft />
          </button>
          <button className="rounded-full p-2 hover:bg-muted">
            <ChevronRight />
          </button>
          <strong className="ml-2 hidden text-lg sm:block">Fri, 16 May 2022</strong>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button className="rounded-md border border-border px-3 py-2 text-sm">Day</button>
          <button className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            Week
          </button>
          <button className="rounded-md border border-border px-3 py-2 text-sm">
            <Filter className="mr-2 inline size-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Dentist column headers */}
      <div className="grid grid-cols-[72px_repeat(3,minmax(230px,1fr))] border-b border-border">
        <div className="border-r border-border p-4 text-sm font-semibold">
          GMT
          <br />
          <span className="font-normal text-muted-foreground">+07:00</span>
        </div>
        {dentistNames.map((name) => (
          <div key={name} className="border-r border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {name.split(' ').slice(-1)[0]?.slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">
                  Today&apos;s appointment:{' '}
                  <span className="text-foreground">4 patient(s)</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-[72px_repeat(3,minmax(230px,1fr))]">
        {/* Time column */}
        <div className="border-r border-border">
          {hours.map((h) => (
            <div key={h} className="h-[96px] border-b border-border px-4 pt-4 text-sm">
              {h}
            </div>
          ))}
        </div>

        {/* Dentist columns */}
        {dentistNames.map((dentist, col) => (
          <div key={dentist} className="relative border-r border-border">
            {hours.map((h) => (
              <div key={h} className="h-[96px] border-b border-border" />
            ))}
            {allAppointments
              .filter(
                (a) =>
                  a.dentist === dentist ||
                  (col === 0 && ['a1', 'a2', 'a4', 'a5'].includes(a.id))
              )
              .map((a, i) => {
                const colors = APPOINTMENT_COLOR_CLASSES[a.color] ?? APPOINTMENT_COLOR_CLASSES.sky
                return (
                  <button
                    key={a.id}
                    onClick={() => onAppointment(a)}
                    className={cn(
                      'absolute left-2 right-2 rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
                      colors.bg,
                      colors.border
                    )}
                    style={{ top: `${i * 96 + 8}px`, minHeight: '78px' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{a.patient}</span>
                      <span className="text-[11px] text-emerald-700">● {a.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.time}</p>
                    <span className="mt-2 inline-block rounded-full border border-border bg-card px-2 py-1 text-[11px]">
                      {a.treatment}
                    </span>
                  </button>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [drawer, setDrawer] = useState<Appointment | null>(null)
  const [wizard, setWizard] = useState(false)
  const [activeTab, setActiveTab] = useState<'calendar' | 'log'>('calendar')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex h-14 shrink-0 items-end gap-8 border-b border-border bg-card px-8">
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            'h-full border-b-2 px-1 text-sm font-semibold transition',
            activeTab === 'calendar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={cn(
            'h-full border-b-2 px-1 text-sm font-semibold transition',
            activeTab === 'log'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Log History
        </button>
      </div>

      {/* Calendar */}
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === 'calendar' ? (
          <CalendarView onAppointment={setDrawer} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
            <Clock3 className="size-12 opacity-30" />
            <p className="font-medium">Log History</p>
            <p className="text-sm">Past appointment records will appear here.</p>
          </div>
        )}
      </div>

      {/* Reservation Drawer */}
      {drawer && (
        <ReservationDrawer
          appointment={drawer}
          onClose={() => setDrawer(null)}
          onMedical={() => {
            setDrawer(null)
            setWizard(true)
          }}
        />
      )}

      {/* Medical Wizard */}
      {wizard && <MedicalWizard onClose={() => setWizard(false)} />}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[60] rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  )
}
