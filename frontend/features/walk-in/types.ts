import { SlotResponse } from '@/types/api'

export type WalkInPriority = 'normal' | 'urgent' | 'emergency'

export type WalkInStatus = 'waiting' | 'assigned' | 'in-progress' | 'completed' | 'left'

export interface WalkInPatientData {
  id?: string
  name: string
  phone: string
  ageOrDob?: string
  gender?: string
  allergies?: string
  medicalConditions?: string
  isExisting: boolean
}

export interface WalkInRecord {
  id: string
  patient: WalkInPatientData
  treatment: string
  estimatedDuration: number // minutes
  priority: WalkInPriority
  arrivedAt: string
  status: WalkInStatus
  queuePosition?: number
  assignedDentistId: string
  assignedDentistName: string
  assignedSlot?: string
  assignedAppointmentId?: string
  estimatedWaitMinutes?: number
  notes?: string
}

export interface DentistWithStatus {
  id: string
  dentist_id: string
  name: string
  specialty: string
  color_code?: string
  is_active?: boolean
  waitTime: string
  nextSlot: string
  queueCount: number
  isFreeNow: boolean
  availableSlots: SlotResponse[]
}
