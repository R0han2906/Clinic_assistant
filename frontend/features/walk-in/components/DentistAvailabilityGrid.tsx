'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
  CalendarClock,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { DentistResponse, SlotResponse, AppointmentResponse } from '@/types/api'
import { DentistWithStatus } from '../types'

interface DentistAvailabilityGridProps {
  selectedDentistId: string
  durationMinutes?: number
  onSelectDentist: (dentist: DentistWithStatus, slotTime?: string) => void
}

export function DentistAvailabilityGrid({
  selectedDentistId,
  durationMinutes = 30,
  onSelectDentist,
}: DentistAvailabilityGridProps) {
  const [dentists, setDentists] = useState<DentistResponse[]>([])
  const [slotMap, setSlotMap] = useState<Record<string, SlotResponse[]>>({})
  const [bookedMap, setBookedMap] = useState<Record<string, AppointmentResponse[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Custom time vs preset slot selection mode
  const [timeMode, setTimeMode] = useState<'preset' | 'custom'>('preset')
  const [selectedSlotOverride, setSelectedSlotOverride] = useState<string | null>(null)
  const [customTimeInput, setCustomTimeInput] = useState<string>('')
  const [expandedSchedules, setExpandedSchedules] = useState<Record<string, boolean>>({})

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      api.dentists.list(),
      api.appointments.list({ date: todayStr }).catch(() => [] as AppointmentResponse[]),
    ])
      .then(async ([dents, todayAppts]) => {
        if (!dents || dents.length === 0) {
          setIsLoading(false)
          return
        }
        setDentists(dents)

        // Group today's booked appointments by dentist ID (handling DOC- and alias variations)
        const bookedByDentist: Record<string, AppointmentResponse[]> = {}
        const cleanTodayAppts = (todayAppts || []).filter((a) => {
          const st = String(a.status || '').toLowerCase()
          return !st.includes('cancel') && !st.includes('no-show')
        })

        const extractNum = (val?: string): string | null => {
          if (!val) return null
          const m = String(val).match(/(?:den|doc|d)?-?0*(\d+)$/i)
          return m ? m[1] : null
        }

        dents.forEach((d) => {
          const docId = d.dentist_id || (d as any).id
          const docIdLower = docId.toLowerCase()
          const docNum = extractNum(docIdLower)

          bookedByDentist[docId] = cleanTodayAppts.filter((a) => {
            const aDoc = (a.dentist_id || '').toLowerCase()
            if (aDoc === docIdLower) return true
            const aNum = extractNum(aDoc)
            if (docNum && aNum && docNum === aNum) return true
            return false
          }).sort((a, b) => a.start_time.localeCompare(b.start_time))
        })
        setBookedMap(bookedByDentist)

        // Fetch free slots for each dentist today
        const slotPromises = dents.map((d) => {
          const docId = d.dentist_id || (d as any).id
          return api.dentists
            .getSlots(todayStr, docId, durationMinutes)
            .then((slots) => [docId, (slots || []).filter((s) => s.is_available !== false)] as const)
            .catch(() => [docId, [] as SlotResponse[]] as const)
        })

        const pairs = await Promise.all(slotPromises)
        const nextMap: Record<string, SlotResponse[]> = {}
        pairs.forEach(([id, slots]) => {
          nextMap[id] = slots
        })
        setSlotMap(nextMap)
      })
      .catch((err) => {
        console.warn('Could not load dentists, slots or appointments:', err)
      })
      .finally(() => setIsLoading(false))
  }, [todayStr, durationMinutes])

  // Build computed doctor statuses
  const dentistsWithStatus: DentistWithStatus[] = dentists.map((d: any) => {
    const id = d.dentist_id || d.id
    const openSlots = slotMap[id] || []
    const firstOpen = openSlots[0]

    // Determine if dentist is free now based on current hour
    const now = new Date()
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMin

    let isFreeNow = false
    if (firstOpen) {
      const [h, m] = firstOpen.start_time.split(':').map(Number)
      const slotMinutes = h * 60 + (m || 0)
      isFreeNow = Math.abs(slotMinutes - currentTimeMinutes) <= 20
    }

    const docBooked = bookedMap[id] || []
    const waitTime = isFreeNow
      ? '0 min (Ready now)'
      : openSlots.length > 0
      ? `~${Math.min(45, openSlots.length > 3 ? 15 : 30)} min`
      : 'No slots today'

    return {
      id,
      dentist_id: id,
      name: d.name,
      specialty: d.specialty || 'General Dentistry',
      color_code: d.color_code || '#2563eb',
      is_active: d.is_active !== false,
      waitTime,
      nextSlot: firstOpen ? firstOpen.start_time : 'Unavailable',
      queueCount: docBooked.length,
      isFreeNow,
      availableSlots: openSlots,
    }
  })

  // Recommend best dentist: prioritize free now, then shortest queue
  const recommendedDentistId = dentistsWithStatus.reduce((best, curr) => {
    if (!best) return curr.id
    if (curr.isFreeNow) return curr.id
    if (curr.availableSlots.length > (slotMap[best]?.length || 0)) return curr.id
    return best
  }, dentistsWithStatus[0]?.id || '')

  // Auto-select initial dentist if none selected
  useEffect(() => {
    if (!selectedDentistId && dentistsWithStatus.length > 0) {
      const target = dentistsWithStatus.find((d) => d.id === recommendedDentistId) || dentistsWithStatus[0]
      const initialSlot = target.availableSlots[0]?.start_time || (target.nextSlot !== 'Unavailable' ? target.nextSlot : '10:00')
      setSelectedSlotOverride(initialSlot)
      onSelectDentist(target, initialSlot)
    }
  }, [dentistsWithStatus.length, selectedDentistId, recommendedDentistId])

  // Active selected dentist object
  const activeDentist = dentistsWithStatus.find((d) => d.id === selectedDentistId)

  // Current active slot time: either custom input, override slot, or dentist's first free slot
  const currentEffectiveSlotTime = useMemo(() => {
    if (timeMode === 'custom' && customTimeInput) {
      return customTimeInput
    }
    if (selectedSlotOverride) {
      return selectedSlotOverride
    }
    if (activeDentist?.nextSlot && activeDentist.nextSlot !== 'Unavailable') {
      return activeDentist.nextSlot
    }
    return ''
  }, [timeMode, customTimeInput, selectedSlotOverride, activeDentist])

  // Check for pre-booked conflict with selected time
  const conflictAppointment = useMemo(() => {
    if (!activeDentist || !currentEffectiveSlotTime) return null
    const booked = bookedMap[activeDentist.id] || []
    if (booked.length === 0) return null

    // Compute end time of candidate slot
    const [startH, startM] = currentEffectiveSlotTime.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM)) return null

    const candidateStartMinutes = startH * 60 + startM
    const candidateEndMinutes = candidateStartMinutes + durationMinutes

    for (const apt of booked) {
      const [aptStartH, aptStartM] = apt.start_time.split(':').map(Number)
      const [aptEndH, aptEndM] = apt.end_time.split(':').map(Number)
      if (isNaN(aptStartH) || isNaN(aptStartM) || isNaN(aptEndH) || isNaN(aptEndM)) continue

      const aptStartMinutes = aptStartH * 60 + aptStartM
      const aptEndMinutes = aptEndH * 60 + aptEndM

      // Check overlap: not (candidateEnd <= aptStart || candidateStart >= aptEnd)
      if (candidateStartMinutes < aptEndMinutes && candidateEndMinutes > aptStartMinutes) {
        return apt
      }
    }
    return null
  }, [activeDentist, currentEffectiveSlotTime, bookedMap, durationMinutes])

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
        <Loader2 className="size-6 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Checking doctor shifts, pre-booked appointments & real-time slots...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Stethoscope className="size-3.5 text-primary" />
          On-Duty Dentists & Slot Allotment
        </label>
        <span className="text-[11px] text-muted-foreground">
          {dentistsWithStatus.length} active practitioners
        </span>
      </div>

      <div className="space-y-3">
        {dentistsWithStatus.map((d) => {
          const isSelected = selectedDentistId === d.id
          const isRecommended = d.id === recommendedDentistId
          const bookedAppointments = bookedMap[d.id] || []
          const isScheduleExpanded = expandedSchedules[d.id] ?? false

          return (
            <div
              key={d.id}
              className={`rounded-2xl border transition p-4 relative ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm flex items-center gap-1">
                  <Sparkles className="size-2.5" /> Recommended (Shortest Wait)
                </span>
              )}

              {/* Dentist Header Card */}
              <button
                type="button"
                onClick={() => {
                  const candidateSlot =
                    timeMode === 'custom' && customTimeInput
                      ? customTimeInput
                      : d.availableSlots[0]?.start_time || (d.nextSlot !== 'Unavailable' ? d.nextSlot : '10:00')
                  setSelectedSlotOverride(candidateSlot)
                  onSelectDentist(d, candidateSlot)
                }}
                className="w-full text-left flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: d.color_code }}
                    />
                    <h4 className="font-bold text-xs text-foreground">{d.name}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{d.specialty}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 ${
                        d.isFreeNow
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Clock className="size-3" />
                      Next slot: {d.nextSlot}
                    </span>

                    <span className="text-[10px] text-muted-foreground">
                      Pre-booked: <strong>{bookedAppointments.length} today</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      d.isFreeNow
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-muted text-foreground border-border'
                    }`}
                  >
                    {d.waitTime}
                  </span>
                  {isSelected && (
                    <div className="flex items-center justify-end text-primary text-[11px] font-bold gap-1 mt-1">
                      <CheckCircle2 className="size-3.5" /> Selected
                    </div>
                  )}
                </div>
              </button>

              {/* Pre-booked Schedule Accordion for Selected Dentist */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-3 animate-in fade-in duration-150">
                  {/* Prebooked Appointments Overview Strip */}
                  <div className="rounded-xl border border-border/70 bg-card p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 text-primary" />
                        Pre-booked Schedule ({bookedAppointments.length} commitments)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSchedules((prev) => ({
                            ...prev,
                            [d.id]: !prev[d.id],
                          }))
                        }
                        className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        {isScheduleExpanded ? (
                          <>
                            Hide <ChevronUp className="size-3" />
                          </>
                        ) : (
                          <>
                            View Details <ChevronDown className="size-3" />
                          </>
                        )}
                      </button>
                    </div>

                    {bookedAppointments.length > 0 ? (
                      <div className="mt-2 space-y-1.5">
                        {/* Summary preview tags */}
                        <div className="flex flex-wrap gap-1">
                          {bookedAppointments.slice(0, isScheduleExpanded ? 20 : 3).map((apt) => (
                            <span
                              key={apt.appointment_id}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-800 dark:text-amber-200"
                            >
                              <Clock className="size-2.5 text-amber-600" />
                              {apt.start_time} - {apt.end_time}
                              {isScheduleExpanded && (
                                <span className="font-sans font-normal text-muted-foreground ml-1">
                                  · {apt.patient_name || 'Patient'} ({apt.treatment_name || 'Treatment'})
                                </span>
                              )}
                            </span>
                          ))}
                          {!isScheduleExpanded && bookedAppointments.length > 3 && (
                            <span className="text-[10px] text-muted-foreground font-semibold self-center">
                              +{bookedAppointments.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> No prior bookings today. Schedule is clear!
                      </p>
                    )}
                  </div>

                  {/* Slot Selection: Preset Slots VS Custom Time Picker */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> Allot Appointment Time
                      </span>

                      {/* Mode Toggle: Preset Chips vs Custom Time */}
                      <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTimeMode('preset')
                            const slot = d.availableSlots[0]?.start_time || (d.nextSlot !== 'Unavailable' ? d.nextSlot : '10:00')
                            setSelectedSlotOverride(slot)
                            onSelectDentist(d, slot)
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                            timeMode === 'preset'
                              ? 'bg-card text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Quick Slots
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeMode('custom')
                            const timeVal = customTimeInput || d.availableSlots[0]?.start_time || '10:00'
                            setCustomTimeInput(timeVal)
                            setSelectedSlotOverride(timeVal)
                            onSelectDentist(d, timeVal)
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                            timeMode === 'custom'
                              ? 'bg-card text-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Custom Time
                        </button>
                      </div>
                    </div>

                    {/* Mode A: Preset Slot Chips */}
                    {timeMode === 'preset' && (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {d.availableSlots.slice(0, 10).map((slot) => {
                            const isCurrentSlot =
                              selectedSlotOverride === slot.start_time ||
                              (!selectedSlotOverride && slot.start_time === d.nextSlot)

                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                onClick={() => {
                                  setSelectedSlotOverride(slot.start_time)
                                  onSelectDentist(d, slot.start_time)
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                                  isCurrentSlot
                                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                    : 'bg-background hover:bg-muted text-foreground border-border'
                                }`}
                              >
                                {slot.start_time}
                              </button>
                            )
                          })}
                        </div>
                        {d.availableSlots.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            No preset slots available. Switch to <strong>Custom Time</strong> to allot a specific operatory time.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mode B: Custom Time Input for All Doctors */}
                    {timeMode === 'custom' && (
                      <div className="rounded-xl border border-border/80 bg-background p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="size-3.5 text-primary" />
                            Specify Exact Custom Start Time
                          </label>
                          <span className="text-[10px] text-muted-foreground">
                            {durationMinutes} min procedure
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={customTimeInput}
                            onChange={(e) => {
                              const val = e.target.value
                              setCustomTimeInput(val)
                              setSelectedSlotOverride(val)
                              onSelectDentist(d, val)
                            }}
                            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                            placeholder="e.g. 10:15"
                          />
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                          Enter any custom start time for Dr. {d.name}. The system automatically calculates duration ({durationMinutes} mins) and verifies pre-booked conflicts.
                        </p>
                      </div>
                    )}

                    {/* Conflict Warning or Availability Indicator */}
                    {conflictAppointment ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-150">
                        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold">
                            Time Conflict with Pre-booked Appointment
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            Dr. {d.name} already has an appointment booked from{' '}
                            <strong>{conflictAppointment.start_time} - {conflictAppointment.end_time}</strong>{' '}
                            ({conflictAppointment.patient_name || 'Patient'} · {conflictAppointment.treatment_name || 'Appointment'}).
                          </p>
                          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 pt-0.5">
                            Tip: Pick an open slot from Quick Slots or adjust the custom time to avoid overlapping operatory sessions.
                          </p>
                        </div>
                      </div>
                    ) : currentEffectiveSlotTime ? (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            Slot <strong>{currentEffectiveSlotTime}</strong> is clear and ready for allotment
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-200">
                          Clear Schedule
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
