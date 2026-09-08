export type BotStep =
  | 'welcome'
  | 'select_action'
  | 'collect_phone'
  | 'existing_patient_greet'
  | 'collect_name'
  | 'collect_age'
  | 'collect_treatment'
  | 'select_dentist'
  | 'select_date'
  | 'select_slot'
  | 'slot_alternatives'
  | 'review'
  | 'confirmed'
  | 'handoff';

export interface WhatsAppMessage {
  id: string;
  sender: 'bot' | 'patient';
  text: string;
  timestamp: string;
  step?: BotStep;
}

export interface PatientProfile {
  patientId?: string;
  fullName: string;
  phone: string;
  dobOrAge: string;
  gender?: string;
  isExisting: boolean;
  allergies?: string;
  lastVisit?: string;
}

export interface SlotAlternative {
  type: 'same_doc' | 'same_time_colleague' | 'alternate_daypart';
  categoryLabel: string;
  dentistId: string;
  dentistName: string;
  date: string;
  startTime: string;
  endTime: string;
  score: number;
}

export interface BookingRequestItem {
  id: string;
  requestId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: string;
  patientId?: string;
  isExistingPatient: boolean;
  dentistId: string;
  dentistName?: string;
  preferredDate: string;
  preferredStartTime: string;
  preferredEndTime: string;
  reason?: string;
  source: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewNotes?: string;
  appointmentId?: string;
  createdAt: string;
  chatSnippet?: string;
}
