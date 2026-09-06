'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  UserCheck,
  Search,
  UserPlus,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { WaitingPatient } from '@/types'
import { DentistResponse, PatientResponse, SlotResponse } from '@/types/api'

interface WalkInSheetProps {
  onClose: () => void
  onComplete: (newWaitingPatient: WaitingPatient) => void
}

export function WalkInSheet({ onClose, onComplete }: WalkInSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Patient
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientsList, setPatientsList] = useState<PatientResponse[]>([])
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string
    name: string
    phone: string
  } | null>(null)
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Male',
  })

  // Step 2: Dentist
  const [dentists, setDentists] = useState<DentistResponse[]>([])
  const [slotMap, setSlotMap] = useState<Record<string, SlotResponse[]>>({})
  const [selectedDentist, setSelectedDentist] = useState<{
    id: string
    name: string
    specialty: string
    waitTime: string
    nextSlot: string
  }>({
    id: 'DOC-000001',
    name: 'Drg. Soap Mactavish',
    specialty: 'General Dentistry',
    waitTime: '15 min',
    nextSlot: '11:30 AM',
  })

  // Step 3: Treatment
  const [selectedTreatment, setSelectedTreatment] = useState('Dental Consultation')

  useEffect(() => {
    Promise.all([
      api.dentists.list(),
      api.patients.list(),
    ]).then(([dents, pats]) => {
      if (dents && dents.length > 0) {
        setDentists(dents)
        setSelectedDentist({
          id: dents[0].dentist_id || (dents[0] as any).id,
          name: dents[0].name,
          specialty: dents[0].specialty,
          waitTime: '—',
          nextSlot: 'Checking…',
        })
        const todayStr = new Date().toISOString().split('T')[0]
        Promise.all(
          dents.map((d) =>
            api.dentists
              .getSlots(todayStr, d.dentist_id, 30)
              .then((slots) => [d.dentist_id, (slots || []).filter((s) => s.is_available !== false)] as const)
              .catch(() => [d.dentist_id, []] as const)
          )
        ).then((pairs) => {
          const next: Record<string, SlotResponse[]> = {}
          pairs.forEach(([id, slots]) => {
            next[id] = slots
          })
          setSlotMap(next)
          const first = dents[0].dentist_id
          const open = next[first]?.[0]
          if (open) {
            setSelectedDentist((prev) => ({
              ...prev,
              nextSlot: `${open.start_time}`,
              waitTime: 'Next open slot',
            }))
          }
        })
      }
      if (pats && pats.length > 0) {
        setPatientsList(pats)
      }
    }).catch(() => {})
  }, [])

  const commonTreatments = [
    'Dental Consultation',
    'Emergency Pain Relief',
    'Scaling & Cleaning',
    'Tooth Extraction',
    'Temporary Filling',
    'Denture Adjustment',
  ]

  const dentistsWithStatus = (dentists.length > 0 ? dentists : []).map((d: any) => {
    const id = d.dentist_id || d.id
    const openSlots = slotMap[id] || []
    const next = openSlots[0]
    return {
      id,
      name: d.name,
      specialty: d.specialty,
      waitTime: next ? `${openSlots.length} open` : 'No slots',
      nextSlot: next ? next.start_time : 'Unavailable',
      queueCount: Math.max(0, 16 - openSlots.length),
    }
  })

  const filteredExisting = patientsList
    .filter(
      (p) =>
        (p.full_name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.phone || '').includes(patientSearch)
    )
    .slice(0, 4)
    .map((p) => ({
      id: p.patient_id,
      name: p.full_name,
      phone: p.phone,
    }))

  const handleFinish = async () => {
    const finalPatientName = isNewPatient
      ? newPatientData.name || 'Walk-In Patient'
      : selectedPatient?.name || 'Walk-In Patient'

    const finalPhone = isNewPatient
      ? newPatientData.phone
      : selectedPatient?.phone

    let patientId = selectedPatient?.id || 'PAT-000001'

    // If new patient, persist via API
    if (isNewPatient && newPatientData.name) {
      try {
        const createdP = await api.patients.create({
          full_name: newPatientData.name,
          phone: newPatientData.phone || '+62 812-0000-0000',
          dob_or_age: newPatientData.dob || '30',
          gender: newPatientData.gender,
        })
        if (createdP?.patient_id) {
          patientId = createdP.patient_id
        }
      } catch (err) {
        console.warn('Could not persist new patient to backend:', err)
      }
    }

    // Persist walk-in appointment directly with checked-in status and WALK_IN source
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const startH = now.getHours().toString().padStart(2, '0')
    const startM = now.getMinutes().toString().padStart(2, '0')
    const endH = (now.getHours() + 1).toString().padStart(2, '0')
    const startTimeStr = `${startH}:${startM}`
    const endTimeStr = `${endH}:${startM}`

    try {
      await api.appointments.create({
        patient_id: patientId,
        dentist_id: selectedDentist.id,
        date: todayStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        treatment_name: selectedTreatment,
        source: 'WALK_IN',
        status: 'checked-in',
        reason: selectedTreatment.includes('Emergency') ? 'Emergency Walk-In' : 'Walk-In Intake',
        payment_status: 'UNPAID',
      })
    } catch (err) {
      console.warn('Could not persist walk-in appointment to backend:', err)
    }

    const newWaitItem: WaitingPatient = {
      id: `w-${Date.now()}`,
      patientId,
      patientName: finalPatientName,
      phone: finalPhone,
      dentistName: selectedDentist.name,
      dentistId: selectedDentist.id,
      treatment: selectedTreatment,
      checkedInAt: new Date().toISOString(),
      priority: selectedTreatment.includes('Emergency') ? 'urgent' : 'normal',
    }

    onComplete(newWaitItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Step {step} of 4 · Receptionist Intake
            </span>
            <h2 className="text-lg font-bold text-foreground">Walk-In Patient Check-In</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition">
            <X className="size-5" />
          </button>
        </header>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 border-b border-border/80">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-auto p-6">
          {/* STEP 1: Find or Create Patient */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Step 1: Patient Identification</h3>
                <button
                  type="button"
                  onClick={() => setIsNewPatient(!isNewPatient)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  {isNewPatient ? (
                    <>
                      <Search className="size-3.5" /> Search Existing
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" /> Register New
                    </>
                  )}
                </button>
              </div>

              {!isNewPatient ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Search patient name or phone..."
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredExisting.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPatient({ id: p.id, name: p.name, phone: p.phone })}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                          selectedPatient?.id === p.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card hover:bg-muted'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-xs text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.phone} · {p.id}</p>
                        </div>
                        {selectedPatient?.id === p.id && (
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                      placeholder="+62 812-..."
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        DOB / Age
                      </label>
                      <input
                        type="text"
                        value={newPatientData.dob}
                        onChange={(e) => setNewPatientData({ ...newPatientData, dob: e.target.value })}
                        placeholder="e.g. 28 yrs"
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Gender
                      </label>
                      <select
                        value={newPatientData.gender}
                        onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Assign Dentist */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Step 2: Assign Attending Dentist</h3>
              <p className="text-xs text-muted-foreground">Select an on-duty dentist based on queue and wait times.</p>

              <div className="space-y-2.5">
                {dentistsWithStatus.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setSelectedDentist({
                        id: d.id,
                        name: d.name,
                        specialty: d.specialty,
                        waitTime: d.waitTime,
                        nextSlot: d.nextSlot,
                      })
                    }
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                      selectedDentist.id === d.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.specialty}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 font-medium flex items-center gap-1">
                          <Clock className="size-3" /> Next free: {d.nextSlot}
                        </span>
                        <span className="text-muted-foreground">Queue: {d.queueCount} ahead</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        ~{d.waitTime} wait
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Select Treatment */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Step 3: Reason / Treatment</h3>
              <p className="text-xs text-muted-foreground">Select primary service needed for this walk-in visit.</p>

              <div className="grid grid-cols-1 gap-2.5">
                {commonTreatments.map((trt) => (
                  <button
                    key={trt}
                    type="button"
                    onClick={() => setSelectedTreatment(trt)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition ${
                      selectedTreatment === trt
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Stethoscope className="size-4 shrink-0 text-muted-foreground" />
                      <span>{trt}</span>
                    </div>
                    {selectedTreatment === trt && <CheckCircle2 className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Confirm & Queue */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="font-bold text-foreground">Step 4: Confirm Walk-In Intake</h3>
              <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-2.5">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-bold text-foreground">
                    {isNewPatient ? newPatientData.name : selectedPatient?.name || 'Walk-In Patient'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2.5">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground">
                    {isNewPatient ? newPatientData.phone : selectedPatient?.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2.5">
                  <span className="text-muted-foreground">Assigned Dentist:</span>
                  <span className="font-bold text-foreground">{selectedDentist.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2.5">
                  <span className="text-muted-foreground">Est. Wait Time:</span>
                  <span className="font-bold text-emerald-600">~{selectedDentist.waitTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treatment:</span>
                  <span className="font-bold text-primary">{selectedTreatment}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Patient will be added to the live Waiting Room queue with an active timer.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <footer className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
            disabled={step === 1}
            className="flex items-center gap-1 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-30 transition"
          >
            <ArrowLeft className="size-3.5" /> Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as any))}
              disabled={step === 1 && !isNewPatient && !selectedPatient && !patientSearch}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition"
            >
              Continue <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              <UserCheck className="size-4" /> Add to Queue
            </button>
          )}
        </footer>
      </aside>
    </div>
  )
}
