// ─── Appointment ──────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'Finished'
  | 'Registered'
  | 'Waiting payment'
  | 'In Progress'
  | 'Cancelled'

export type AppointmentColor = 'rose' | 'sage' | 'sky' | 'amber' | 'purple'

export type Gender = 'Male' | 'Female'

export interface Appointment {
  id: string
  patient: string
  patientId: string
  time: string
  startHour: number
  durationHours: number
  treatment: string
  status: AppointmentStatus
  color: AppointmentColor
  dentist: string
  dentistId: string
  notes?: string
}

// ─── Dentist ──────────────────────────────────────────────────────────────────

export type DentistStatus = 'available' | 'in-session' | 'off'

export interface Dentist {
  id: string
  name: string
  specialty: string
  avatar: string
  initials: string
  statusToday: DentistStatus
  appointmentsToday: number
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export type PatientStatus = 'Active' | 'Inactive' | 'New'

export interface Patient {
  id: string
  name: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: Gender
  address: string
  avatarUrl?: string
  lastVisit: string
  nextAppointment?: string
  status: PatientStatus
  conditions?: string[]
}

// ─── Treatment ────────────────────────────────────────────────────────────────

export interface Treatment {
  id: string
  name: string
  category: string
  durationMinutes: number
  price: number
  description: string
  color: string
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export type StaffStatus = 'Active' | 'Off' | 'On Leave'

export interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  phone: string
  email: string
  avatarUrl?: string
  initials: string
  status: StaffStatus
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'check-in'
  | 'payment'
  | 'sms'
  | 'new-patient'
  | 'appointment'
  | 'reschedule'

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: string
}

// ─── Alert ────────────────────────────────────────────────────────────────────

export type AlertType = 'follow-up' | 'insurance' | 'stock' | 'payment'
export type AlertPriority = 'high' | 'medium' | 'low'

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  priority: AlertPriority
  actionLabel: string
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KpiData {
  label: string
  value: string | number
  trend: string
  trendUp: boolean
  progressPct?: number
  subLabel?: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  icon: string
  label: string
  href: string
  badge?: number
}

export interface NavSection {
  section: string | null
  items: NavItem[]
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  minStock: number
  unit: string
  unitPrice: number
  supplier: string
}

// ─── Payment Method ───────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string
  name: string
  type: string
  enabled: boolean
  processingFee?: string
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export type SaleStatus = 'Paid' | 'Pending' | 'Overdue'

export interface SaleRecord {
  id: string
  date: string
  patient: string
  treatment: string
  amount: number
  status: SaleStatus
  method: string
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export type PurchaseStatus = 'Received' | 'Pending' | 'Ordered'

export interface PurchaseOrder {
  id: string
  vendor: string
  date: string
  items: string
  amount: number
  status: PurchaseStatus
}
