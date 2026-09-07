'use client'

import React, { useState } from 'react'
import {
  X,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  Clock,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Calendar,
  Sparkles,
  User,
} from 'lucide-react'
import { WaitingPatient } from '@/types'
import {
  PatientAutocomplete,
  DentistAvailabilityGrid,
  OverflowHandler,
  walkInService,
  WalkInPatientData,
  WalkInPriority,
  DentistWithStatus,
} from '@/features/walk-in'

interface WalkInSheetProps {
  onClose: () => void
  onComplete: (newWaitingPatient: WaitingPatient, createdAppointment?: any) => void
  selectedDate?: string
}

export function WalkInSheet({ onClose, onComplete, selectedDate }: WalkInSheetProps) {
  // Exact 2-Step Workflow requested:
  // Step 1: Choose between creating a new patient OR getting data from original patient
  // Step 2: Choose doctor and appointment details
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: Patient Data
  const [selectedPatient, setSelectedPatient] = useState<WalkInPatientData | null>(null)

  // Step 2: Doctor, Slot, Treatment & Priority
  const [selectedDentist, setSelectedDentist] = useState<DentistWithStatus | null>(null)
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | undefined>(undefined)
  const [selectedTreatment, setSelectedTreatment] = useState('Dental Consultation')
  const [estimatedDuration, setEstimatedDuration] = useState(30)
  const [priority, setPriority] = useState<WalkInPriority>('normal')
  const [customTreatmentNotes, setCustomTreatmentNotes] = useState('')

  // Overflow modal state
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonTreatments = [
    { name: 'Dental Consultation', duration: 30, desc: 'General exam & diagnosis' },
    { name: 'Emergency Pain Relief', duration: 30, desc: 'Acute toothache triage' },
    { name: 'Tooth Extraction', duration: 45, desc: 'Simple or surgical removal' },
    { name: 'Scaling & Cleaning', duration: 45, desc: 'Plaque debridement' },
    { name: 'Temporary Filling', duration: 30, desc: 'Caries excavation & seal' },
    { name: 'Denture / Appliance Fix', duration: 30, desc: 'Minor repair & polish' },
  ]

  const handleFinish = async () => {
    if (!selectedPatient) return

    setIsSubmitting(true)
    try {
      const targetSlotTime =
        selectedSlotTime ||
        selectedDentist?.availableSlots?.[0]?.start_time ||
        (selectedDentist?.nextSlot && selectedDentist.nextSlot !== 'Unavailable' ? selectedDentist.nextSlot : '10:00')

      const { appointment, walkIn } = await walkInService.processWalkIn({
        patient: selectedPatient,
        dentistId: selectedDentist?.id || 'DEN-000001',
        dentistName: selectedDentist?.name || 'Dr. Sarah Wilson',
        slotTime: targetSlotTime,
        date: selectedDate,
        treatment: selectedTreatment,
        durationMinutes: estimatedDuration,
        priority,
        notes: customTreatmentNotes || undefined,
      })

      const newWaitItem: WaitingPatient = {
        id: walkIn.id,
        patientId: walkIn.patient.id || 'PAT-000001',
        patientName: walkIn.patient.name,
        phone: walkIn.patient.phone,
        dentistName: walkIn.assignedDentistName,
        dentistId: walkIn.assignedDentistId,
        treatment: walkIn.treatment,
        checkedInAt: walkIn.arrivedAt,
        priority: priority === 'emergency' ? 'urgent' : priority === 'urgent' ? 'urgent' : 'normal',
        source: 'WALK_IN',
      }

      onComplete(newWaitItem, appointment)
      onClose()
    } catch (err) {
      console.error('[WalkInSheet] Error during walk-in submission:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Step {step} of 2 · {step === 1 ? 'Patient Intake' : 'Doctor & Appointment'}
            </span>
            <h2 className="text-lg font-bold text-foreground">In-Clinic Walk-In Intake</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* 2-Step Progress Bar */}
        <div className="grid grid-cols-2 border-b border-border/80">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* STEP 1: Choose New Patient OR Get Data from Original Patient */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="font-bold text-sm text-foreground">Step 1: Patient Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose whether to fetch existing patient records or create a new patient profile.
                </p>
              </div>

              <PatientAutocomplete
                selectedPatient={selectedPatient}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onClear={() => setSelectedPatient(null)}
              />

              {selectedPatient && selectedPatient.isExisting && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Ready to proceed with <strong>{selectedPatient.name}</strong> ({selectedPatient.phone}).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Choose Doctor & Appointment Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Selected Patient Banner */}
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-foreground flex items-center gap-2">
                      {selectedPatient?.name}
                      {selectedPatient?.isExisting ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded dark:bg-emerald-950 dark:text-emerald-300">
                          Existing Patient
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded dark:bg-sky-950 dark:text-sky-300">
                          New Patient
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedPatient?.phone} {selectedPatient?.ageOrDob ? `· ${selectedPatient.ageOrDob}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Section 1: Choose Doctor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      1. Choose Attending Doctor
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Review live doctor operatory status and select an open slot today.
                    </p>
                  </div>
                </div>

                <DentistAvailabilityGrid
                  selectedDentistId={selectedDentist?.id || ''}
                  durationMinutes={estimatedDuration}
                  onSelectDentist={(dentist, slotTime) => {
                    setSelectedDentist(dentist)
                    setSelectedSlotTime(slotTime)
                  }}
                />
              </div>

              {/* Section 2: Choose Appointment Details */}
              <div className="space-y-4 pt-2 border-t border-border/70">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    2. Appointment Details & Reason
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Select treatment procedure, priority level, and clinical notes.
                  </p>
                </div>

                {/* Common Procedures */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {commonTreatments.map((trt) => {
                    const isSelected = selectedTreatment === trt.name
                    return (
                      <button
                        key={trt.name}
                        type="button"
                        onClick={() => {
                          setSelectedTreatment(trt.name)
                          setEstimatedDuration(trt.duration)
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                            : 'border-border bg-card hover:bg-muted/40'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-foreground truncate">{trt.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{trt.desc}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
                          ~{trt.duration}m
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Visit Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('normal')}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        priority === 'normal'
                          ? 'bg-muted text-foreground border-primary ring-1 ring-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ShieldCheck className="size-3.5 text-blue-500" />
                      Normal
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriority('urgent')}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        priority === 'urgent'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500 ring-1 ring-amber-500 font-bold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <AlertTriangle className="size-3.5 text-amber-500" />
                      Urgent
                    </button>

                    <button
                      type="button"
                      onClick={() => setPriority('emergency')}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        priority === 'emergency'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500 ring-1 ring-rose-500 font-bold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Flame className="size-3.5 text-rose-500" />
                      Emergency
                    </button>
                  </div>
                </div>

                {/* Additional Clinical Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Chief Complaint / Clinical Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customTreatmentNotes}
                    onChange={(e) => setCustomTreatmentNotes(e.target.value)}
                    placeholder="e.g. Sharp pain on lower right molar, swelling for 2 days..."
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                {/* Slot Summary Pill */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-bold text-foreground">
                        Allotted to {selectedDentist?.name || 'Assigned Doctor'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Timing:{' '}
                        <strong className="text-primary font-mono font-bold">
                          {selectedSlotTime || selectedDentist?.availableSlots?.[0]?.start_time || '10:00'}
                        </strong>{' '}
                        ({estimatedDuration} mins) {selectedDate ? `· Date: ${selectedDate}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    Schedule Ready
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <footer className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedPatient}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition shadow-sm"
              >
                Next: Choose Doctor & Appointment <ArrowRight className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                <ArrowLeft className="size-3.5" /> Back to Patient
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                <UserCheck className="size-4" />
                {isSubmitting ? 'Allotting Slot...' : 'Confirm & Add to Calendar'}
              </button>
            </>
          )}
        </footer>
      </aside>

      {/* Overflow Handler Modal for fully booked scenarios */}
      <OverflowHandler
        isOpen={isOverflowOpen}
        onClose={() => setIsOverflowOpen(false)}
        onAddToStandby={() => {
          setIsOverflowOpen(false)
          handleFinish()
        }}
        onBookLaterToday={() => {
          setIsOverflowOpen(false)
        }}
        onBookTomorrow={() => {
          setIsOverflowOpen(false)
          onClose()
        }}
      />
    </div>
  )
}
