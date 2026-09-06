export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-progress'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'no-show'

export interface ReceptionistAction {
  id:
    | 'check-in'
    | 'reschedule'
    | 'cancel'
    | 'call'
    | 'sms'
    | 'notify'
    | 'no-show'
    | 'view'
    | 'take-payment'
    | 'view-summary'
    | 'book-followup'
    | 'print'
    | 'thank-you'
    | 'rebook'
    | 'flag'
    | 'note'
  label: string
  icon: string
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning'
  disabled?: boolean
}

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['in-progress', 'cancelled', 'no-show'],
  'in-progress': ['completed', 'cancelled'],
  completed: ['paid'],
  paid: [],
  cancelled: ['scheduled'], // via rebook
  'no-show': ['scheduled'], // via rebook
}

export const RECEPTIONIST_ACTIONS: Record<AppointmentStatus, ReceptionistAction[]> = {
  scheduled: [
    { id: 'check-in', label: 'Check In', icon: 'UserCheck', variant: 'primary' },
    { id: 'reschedule', label: 'Reschedule', icon: 'Calendar', variant: 'outline' },
    { id: 'cancel', label: 'Cancel', icon: 'X', variant: 'danger' },
    { id: 'call', label: 'Call Patient', icon: 'Phone', variant: 'outline' },
    { id: 'sms', label: 'Send Reminder', icon: 'MessageSquare', variant: 'outline' },
  ],
  'checked-in': [
    { id: 'notify', label: 'Notify Dentist', icon: 'Bell', variant: 'primary' },
    { id: 'no-show', label: 'Mark No-Show', icon: 'UserX', variant: 'outline' },
    { id: 'cancel', label: 'Cancel', icon: 'X', variant: 'danger' },
  ],
  'in-progress': [
    { id: 'view', label: 'View Only', icon: 'Eye', disabled: true, variant: 'outline' },
  ],
  completed: [
    { id: 'take-payment', label: 'Take Payment', icon: 'DollarSign', variant: 'primary' },
    { id: 'view-summary', label: 'View Visit Summary', icon: 'FileText', variant: 'outline' },
    { id: 'book-followup', label: 'Book Follow-up', icon: 'CalendarPlus', variant: 'outline' },
    { id: 'print', label: 'Print Receipt', icon: 'Printer', variant: 'outline' },
  ],
  paid: [
    { id: 'thank-you', label: 'Send Thank-You', icon: 'Heart', variant: 'outline' },
    { id: 'book-followup', label: 'Book Follow-up', icon: 'CalendarPlus', variant: 'outline' },
    { id: 'view-summary', label: 'View Summary', icon: 'FileText', variant: 'outline' },
  ],
  cancelled: [
    { id: 'rebook', label: 'Rebook', icon: 'CalendarPlus', variant: 'primary' },
    { id: 'call', label: 'Contact Patient', icon: 'Phone', variant: 'outline' },
  ],
  'no-show': [
    { id: 'call', label: 'Follow-Up Call', icon: 'Phone', variant: 'primary' },
    { id: 'rebook', label: 'Rebook', icon: 'CalendarPlus', variant: 'outline' },
    { id: 'flag', label: 'Flag Patient', icon: 'Flag', variant: 'warning' },
  ],
}

/**
 * Normalizes any backend or legacy status string into one of the 7 canonical statuses
 */
export function normalizeStatus(rawStatus?: string | null): AppointmentStatus {
  if (!rawStatus) return 'scheduled'
  const s = rawStatus.toLowerCase().trim().replace(/_/g, '-')
  if (s === 'confirmed' || s === 'registered' || s === 'pending') return 'scheduled'
  if (s === 'checked-in') return 'checked-in'
  if (s === 'in-progress') return 'in-progress'
  if (s === 'finished') return 'completed'
  if (s === 'completed') return 'completed'
  if (s === 'waiting-payment') return 'completed'
  if (s === 'paid') return 'paid'
  if (s === 'cancelled') return 'cancelled'
  if (s === 'no-show') return 'no-show'
  return 'scheduled'
}

/**
 * Returns allowed receptionist actions for a given status
 */
export function getActionsForStatus(status: AppointmentStatus | string): ReceptionistAction[] {
  const canonical = normalizeStatus(status)
  return RECEPTIONIST_ACTIONS[canonical] || []
}

/**
 * Validates whether a state transition is permitted
 */
export function canTransition(from: AppointmentStatus | string, to: AppointmentStatus | string): boolean {
  const cFrom = normalizeStatus(from)
  const cTo = normalizeStatus(to)
  return ALLOWED_TRANSITIONS[cFrom]?.includes(cTo) ?? false
}

/**
 * Visual styling metadata for status pills and badges
 */
export interface StatusMeta {
  label: string
  iconText: string
  badgeClass: string
  dotClass: string
  borderClass: string
  cardBgClass: string
}

export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  scheduled: {
    label: 'SCHEDULED',
    iconText: '⏱',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    dotClass: 'text-blue-500',
    borderClass: 'border-blue-200 dark:border-blue-800',
    cardBgClass: 'bg-blue-50/60 hover:bg-blue-50/90 dark:bg-blue-950/20',
  },
  'checked-in': {
    label: 'CHECKED-IN',
    iconText: '✓',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    dotClass: 'text-sky-500',
    borderClass: 'border-sky-200 dark:border-sky-800',
    cardBgClass: 'bg-purple-50/60 hover:bg-purple-50/90 dark:bg-purple-950/20',
  },
  'in-progress': {
    label: 'IN-PROGRESS',
    iconText: '🔵',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    dotClass: 'text-amber-500',
    borderClass: 'border-amber-200 dark:border-amber-800',
    cardBgClass: 'bg-amber-50/60 hover:bg-amber-50/90 dark:bg-amber-950/20',
  },
  completed: {
    label: 'COMPLETED',
    iconText: '✅',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    dotClass: 'text-emerald-500',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    cardBgClass: 'bg-emerald-50/60 hover:bg-emerald-50/90 dark:bg-emerald-950/20',
  },
  paid: {
    label: 'PAID',
    iconText: '💰',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    dotClass: 'text-emerald-500',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    cardBgClass: 'bg-emerald-50/60 hover:bg-emerald-50/90 dark:bg-emerald-950/20',
  },
  cancelled: {
    label: 'CANCELLED',
    iconText: '❌',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    dotClass: 'text-rose-500',
    borderClass: 'border-rose-200 dark:border-rose-800',
    cardBgClass: 'bg-rose-50/60 hover:bg-rose-50/90 dark:bg-rose-950/20',
  },
  'no-show': {
    label: 'NO-SHOW',
    iconText: '⚠️',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    dotClass: 'text-rose-500',
    borderClass: 'border-rose-200 dark:border-rose-800',
    cardBgClass: 'bg-rose-50/60 hover:bg-rose-50/90 dark:bg-rose-950/20',
  },
}

export function getStatusMeta(status: AppointmentStatus | string): StatusMeta {
  return STATUS_META[normalizeStatus(status)]
}
