export type StepState =
  | 'welcome'
  | 'select_action'
  | 'select_patient_type'
  | 'collect_name'
  | 'collect_age'
  | 'collect_phone'
  | 'collect_reason'
  | 'existing_patient_lookup'
  | 'existing_patient_confirm'
  | 'edit_patient_details'
  | 'cancel_appointment_confirm'
  | 'select_dentist'
  | 'select_date'
  | 'select_time_range'
  | 'slot_alternatives'
  | 'review'
  | 'confirmed'
  | 'human_handoff'
  | 'cancelled'
  | 'no_availability'
  | 'manage_existing_apt';

export type Sender = 'bot' | 'patient';

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  timestamp: string;
  stepId?: StepState;
}

export interface Dentist {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  experience: string;
  colorCode: string;
}

export interface TimeSlot {
  id: string;
  dentistId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "09:30"
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface AlternativeSlot {
  type: 'same_doc' | 'same_time_colleague' | 'alternate_daypart';
  label: string;
  slot: TimeSlot;
  dentistName: string;
  score: number;
}

export interface Treatment {
  id: string;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  estimatedCost: number;
  description: string;
}

export interface PatientDetails {
  isExisting: boolean;
  patientId?: string; // PAT-XXXXXX
  fullName: string;
  ageOrDob: string;
  phone: string;
  address?: string;
  emergencyContact?: string;
  reason?: string;
  treatmentName?: string;
}

export interface AppointmentRequest {
  patient: PatientDetails;
  dentist: Dentist;
  date: string;
  timeSlot: TimeSlot;
  referenceCode: string;   // REQ-XXXXXX (or REQ-DEMO-XXXXXX in mock mode)
  patientId?: string;      // PAT-XXXXXX — use this to look up the patient later
  createdTimestamp: string;
}

export interface UpcomingBookingItem {
  referenceCode: string; // APT-XXXXXX or REQ-XXXXXX
  type: 'appointment' | 'request';
  dentistId?: string;
  dentistName: string;
  date: string;
  time: string; // "10:00 – 10:30" or "10:00"
  startTime?: string;
  endTime?: string;
  status?: string; // 'scheduled', 'confirmed', 'pending', 'cancelled'
  reason?: string;
  notes?: string;
}

export interface ExistingPatientRecord {
  patientId: string;
  fullName: string;
  phone: string;
  ageOrDob: string;
  address?: string;
  emergencyContact?: string;
  lastVisitDate: string;
  lastVisitType: string;
  upcomingAppointments: UpcomingBookingItem[];
  upcomingAppointment?: UpcomingBookingItem;
}
