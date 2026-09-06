// ── Zendenta Clinic API TypeScript Types ─────────────────────────────────────

// Patients
export interface PatientResponse {
  patient_id: string;
  full_name: string;
  dob_or_age?: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
  gender?: string;
  address?: string;
  allergies?: string;
  medical_conditions?: string;
  consent_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreate {
  full_name: string;
  phone: string;
  email?: string;
  dob_or_age?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  allergies?: string;
  medical_conditions?: string;
  force_create?: boolean;
}

export interface PatientUpdate {
  full_name?: string;
  dob_or_age?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  gender?: string;
  address?: string;
  allergies?: string;
  medical_conditions?: string;
  consent_status?: string;
}

// Visits
export interface VisitResponse {
  visit_id: string;
  patient_id: string;
  visit_date: string;
  dentist_id: string;
  visit_type?: string;
  summary?: string;
  diagnosis?: string;
  follow_up_recommendation?: string;
  created_at?: string;
}

export interface VisitCreate {
  patient_id: string;
  dentist_id: string;
  visit_date: string;
  visit_type: string;
  summary: string;
  follow_up_recommendation?: string;
}

// Dentists
export interface DentistResponse {
  dentist_id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  color_code: string;
  is_active: boolean;
}

// Appointments
export type CanonicalAppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-progress'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'no-show';

export interface AppointmentResponse {
  appointment_id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  dentist_id: string;
  dentist_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  treatment_name: string;
  status: CanonicalAppointmentStatus | string;
  payment_status?: string;
  bill_number?: string;
  source?: string;
  clinical_notes?: string;
  reason?: string;
  notes?: string;
  booking_time?: string;
  visit_summary?: ClinicalVisitSummary;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentCreate {
  patient_id: string;
  dentist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  treatment_name: string;
  reason?: string;
  notes?: string;
  source?: string;
  status?: string;
  payment_status?: string;
  bill_number?: string;
  clinical_notes?: string;
}

export interface AppointmentStatusUpdate {
  status: string;
  notes?: string;
}

export interface ClinicalVisitSummary {
  appointment_id: string;
  patient_id?: string;
  patient_name?: string;
  dentist_id?: string;
  dentist_name?: string;
  date?: string;
  treatment_name?: string;
  chief_complaint?: string;
  diagnosis?: string;
  prescriptions?: Array<{
    name: string;
    dosage: string;
    duration: string;
    notes?: string;
  }>;
  treatments_performed?: string[];
  follow_up?: {
    timeframe?: string;
    notes?: string;
  };
  dentist_notes?: string;
  billing?: {
    bill_number?: string;
    amount?: number;
    status?: string;
    [key: string]: any;
  };
}

export interface AppointmentReschedule {
  new_date: string;
  new_start_time: string;
  new_end_time: string;
  new_dentist_id?: string;
  reason?: string;
  reschedule_reason?: string;
}

export interface AppointmentFilters {
  date?: string;
  dentist_id?: string;
  patient_id?: string;
  status?: string;
}

// Availability Slots
export interface SlotResponse {
  start_time: string;
  end_time: string;
  is_available: boolean;
  dentist_id?: string;
  dentist_name?: string;
  date?: string;
  duration_minutes?: number;
}

export interface VendorResponse {
  vendor_id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PeripheralResponse {
  peripheral_id: string;
  name: string;
  category: string;
  location: string;
  condition: string;
  serial_no?: string;
  last_service?: string;
  created_at?: string;
}

export interface PeripheralCreate {
  name: string;
  category: string;
  location: string;
  condition?: string;
  serial_no?: string;
  last_service?: string;
}

export interface PeripheralUpdate {
  name?: string;
  category?: string;
  location?: string;
  condition?: string;
  serial_no?: string;
  last_service?: string;
}

// Treatments
export interface TreatmentResponse {
  treatment_id: string;
  name: string;
  category: string;
  default_duration_minutes: number;
  estimated_cost: number;
  description?: string;
}

export interface TreatmentCreate {
  name: string;
  category: string;
  default_duration_minutes: number;
  estimated_cost: number;
  description?: string;
}

export interface TreatmentUpdate {
  name?: string;
  category?: string;
  default_duration_minutes?: number;
  estimated_cost?: number;
  description?: string;
}

// Staff
export interface StaffResponse {
  staff_id: string;
  username?: string;
  full_name: string;
  role: string;
  department: string;
  phone?: string;
  email?: string;
  initials?: string;
  status: 'Active' | 'Off' | 'On Leave';
  is_active: boolean;
  created_at?: string;
}

export interface StaffCreate {
  full_name: string;
  role: string;
  department: string;
  phone?: string;
  email?: string;
  username?: string;
  status?: string;
}

export interface StaffUpdate {
  full_name?: string;
  role?: string;
  department?: string;
  phone?: string;
  email?: string;
  status?: string;
  is_active?: boolean;
}

// Sales
export interface SaleResponse {
  sale_id: string;
  appointment_id?: string;
  patient_id?: string;
  patient_name: string;
  treatment_name: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  payment_method: string;
  bill_number?: string;
  sale_date: string;
  notes?: string;
  created_at?: string;
}

export interface SaleCreate {
  patient_name: string;
  treatment_name: string;
  amount: number;
  payment_method: string;
  appointment_id?: string;
  patient_id?: string;
  status?: string;
  bill_number?: string;
  sale_date?: string;
  notes?: string;
}

export interface SaleFilters {
  date?: string;
  patient_id?: string;
  status?: string;
}

export interface SaleSummary {
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  count_paid: number;
  count_pending: number;
  count_overdue: number;
}

// Payment Methods
export interface PaymentMethodResponse {
  method_id: string;
  name: string;
  type?: string;
  enabled: boolean;
  processing_fee: string;
  created_at?: string;
}

// Purchases
export interface PurchaseResponse {
  purchase_id: string;
  vendor_id?: string;
  vendor_name: string;
  items: string;
  amount: number;
  status: 'Ordered' | 'Pending' | 'Received';
  order_date: string;
  received_date?: string;
  notes?: string;
  created_at?: string;
}

export interface PurchaseCreate {
  vendor_name: string;
  items: string;
  amount: number;
  vendor_id?: string;
  status?: string;
  order_date?: string;
  notes?: string;
}

// Inventory (Stocks)
export interface InventoryResponse {
  item_id: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  unit_price: number;
  supplier?: string;
  created_at?: string;
}

export interface InventoryCreate {
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  unit_price: number;
  supplier?: string;
}

export interface InventoryUpdate {
  name?: string;
  category?: string;
  quantity?: number;
  min_stock?: number;
  unit?: string;
  unit_price?: number;
  supplier?: string;
}

export interface InventoryFilters {
  category?: string;
  low_stock_only?: boolean;
}


// Patient Requests (Simulator / WhatsApp)
export interface PatientRequestResponse {
  request_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: string;
  patient_id?: string;
  dentist_id?: string;
  preferred_date?: string;
  preferred_start_time?: string;
  preferred_end_time?: string;
  reason?: string;
  source: string;
  status: string;
  review_notes?: string;
  appointment_id?: string;
  booking_time?: string;
  created_at?: string;
}
