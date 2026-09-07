import { api } from '@/lib/api-client'
import { eventBus } from '@/lib/event-bus'
import { WalkInRecord, WalkInPatientData, WalkInPriority } from '../types'

interface ProcessWalkInParams {
  patient: WalkInPatientData
  dentistId: string
  dentistName: string
  slotTime?: string
  date?: string
  treatment: string
  durationMinutes: number
  priority: WalkInPriority
  notes?: string
}

export const walkInService = {
  /**
   * Orchestrates Walk-In intake:
   * 1. Creates new patient if not existing.
   * 2. Calculates appointment slot coordinates within visible operatory hours.
   * 3. Creates appointment with source: WALK_IN and status: checked-in.
   * 4. Emits typed event bus events for real-time calendar & queue updates.
   */
  async processWalkIn(params: ProcessWalkInParams): Promise<{
    appointment: any
    walkIn: WalkInRecord
  }> {
    const {
      patient,
      dentistId,
      dentistName,
      slotTime,
      date,
      treatment,
      durationMinutes,
      priority,
      notes,
    } = params

    let resolvedPatientId = patient.id

    // 1. If brand new patient, register firsthand in the backend database
    if (!patient.isExisting || !resolvedPatientId) {
      try {
        const createdPatient = await api.patients.create({
          full_name: patient.name,
          phone: patient.phone,
          dob_or_age: patient.ageOrDob || '30',
          gender: patient.gender || 'Male',
          allergies: patient.allergies,
          medical_conditions: patient.medicalConditions,
          force_create: true,
        })
        if (createdPatient?.patient_id) {
          resolvedPatientId = createdPatient.patient_id
        }
      } catch (err: any) {
        console.warn('[WalkInService] Error registering new patient in backend:', err)
        // If the backend returned a duplicate patient or existing record, try to resolve ID
        if (err?.data?.detail?.existing_matches?.[0]?.patient_id) {
          resolvedPatientId = err.data.detail.existing_matches[0].patient_id
        } else {
          resolvedPatientId = resolvedPatientId || `PAT-${Date.now().toString().slice(-6)}`
        }
      }
    }

    // 2. Compute date and time ranges within calendar operatory bounds
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`
    const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayStr

    let startTimeStr = '10:00'
    let endTimeStr = '10:30'

    const cleanSlot = (slotTime || '').trim()
    const timeMatch = cleanSlot.match(/^(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10)
      const m = parseInt(timeMatch[2], 10)
      startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const totalEndMinutes = h * 60 + m + durationMinutes
      const endH = Math.floor(totalEndMinutes / 60)
      const endM = totalEndMinutes % 60
      endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    } else {
      // Fallback within valid operating hours (09:00 - 17:00) so it's always placed onto the calendar grid
      const curH = now.getHours()
      const safeH = curH >= 9 && curH < 18 ? curH : 10
      const safeM = curH >= 9 && curH < 18 ? Math.floor(now.getMinutes() / 15) * 15 : 0
      startTimeStr = `${String(safeH).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`
      const totalEndMinutes = safeH * 60 + safeM + durationMinutes
      const endH = Math.floor(totalEndMinutes / 60)
      const endM = totalEndMinutes % 60
      endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    }

    // 3. Preserve selected dentist ID (defaulting to DEN-000001 if not provided)
    const effectiveDentistId = (dentistId || '').trim() || 'DEN-000001'

    // 4. Create appointment in backend
    let createdAppt: any = null
    try {
      createdAppt = await api.appointments.create({
        patient_id: resolvedPatientId!,
        dentist_id: effectiveDentistId,
        date: targetDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        treatment_name: treatment,
        source: 'WALK_IN',
        status: 'checked-in',
        reason: priority === 'emergency' ? `[EMERGENCY] ${treatment}` : `Walk-In: ${treatment}`,
        payment_status: 'UNPAID',
        clinical_notes: notes || undefined,
      })
    } catch (err) {
      console.warn('[WalkInService] Could not persist appointment to backend:', err)
      createdAppt = {
        appointment_id: `APT-${Date.now().toString().slice(-6)}`,
        id: `APT-${Date.now().toString().slice(-6)}`,
        patient_id: resolvedPatientId,
        dentist_id: effectiveDentistId,
        dentist_name: dentistName,
        date: targetDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: 'checked-in',
        source: 'WALK_IN',
        treatment_name: treatment,
      }
    }

    const [stH, stM] = startTimeStr.split(':').map(Number)
    const enrichedAppt = {
      ...createdAppt,
      id: createdAppt?.appointment_id || createdAppt?.id || `APT-${Date.now().toString().slice(-6)}`,
      appointment_id: createdAppt?.appointment_id || createdAppt?.id || `APT-${Date.now().toString().slice(-6)}`,
      patient_name: createdAppt?.patient_name || patient.name,
      patient: createdAppt?.patient_name || createdAppt?.patient || patient.name,
      patient_id: resolvedPatientId,
      patientId: resolvedPatientId,
      patient_phone: patient.phone,
      patientPhone: patient.phone,
      dentist_name: createdAppt?.dentist_name || dentistName,
      dentist: createdAppt?.dentist_name || createdAppt?.dentist || dentistName,
      dentist_id: createdAppt?.dentist_id || effectiveDentistId,
      dentistId: createdAppt?.dentist_id || effectiveDentistId,
      treatment_name: createdAppt?.treatment_name || treatment,
      treatment: createdAppt?.treatment || treatment,
      date: targetDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
      time: `${startTimeStr} › ${endTimeStr}`,
      startHour: stH + stM / 60,
      durationHours: durationMinutes / 60,
      status: 'checked-in',
      source: 'WALK_IN',
      color: 'sky',
    }

    // 4. Create internal WalkInRecord
    const walkInRecord: WalkInRecord = {
      id: `w-${Date.now()}`,
      patient: {
        ...patient,
        id: resolvedPatientId,
      },
      treatment,
      estimatedDuration: durationMinutes,
      priority,
      arrivedAt: now.toISOString(),
      status: 'waiting',
      assignedDentistId: dentistId,
      assignedDentistName: dentistName,
      assignedSlot: `${startTimeStr} - ${endTimeStr}`,
      assignedAppointmentId: enrichedAppt.appointment_id || enrichedAppt.id,
      notes,
    }

    // 5. Emit events across the typed event bus
    eventBus.emit('walkin:added', { walkIn: walkInRecord })
    eventBus.emit('appointment:created', {
      appointment: enrichedAppt,
      source: 'walk-in',
    })

    // Also dispatch browser DOM CustomEvent for any direct listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appointment-created', { detail: enrichedAppt }))
    }

    return {
      appointment: enrichedAppt,
      walkIn: walkInRecord,
    }
  },
}
