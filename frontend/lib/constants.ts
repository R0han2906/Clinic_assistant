import type { NavSection } from '@/types'

// ─── Navigation Config ────────────────────────────────────────────────────────

export const navConfig: NavSection[] = [
  {
    section: 'CLINIC',
    items: [
      { icon: 'LayoutDashboard', label: 'Dashboard',    href: '/dashboard' },
      { icon: 'CalendarCheck',   label: 'Reservations', href: '/reservations', badge: 16 },
      { icon: 'Users',           label: 'Patients',     href: '/patients' },
      { icon: 'Stethoscope',     label: 'Treatments',   href: '/treatments' },
      { icon: 'UserCog',         label: 'Staff List',   href: '/staff' },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { icon: 'Wallet',       label: 'Accounts',        href: '/accounts' },
      { icon: 'TrendingUp',   label: 'Sales',           href: '/sales' },
      { icon: 'ShoppingCart', label: 'Purchases',       href: '/purchases' },
      { icon: 'CreditCard',   label: 'Payment Method',  href: '/payment-methods' },
    ],
  },
  {
    section: 'PHYSICAL ASSET',
    items: [
      { icon: 'Package', label: 'Stocks',      href: '/stocks' },
      { icon: 'Monitor', label: 'Peripherals', href: '/peripherals' },
    ],
  },
  {
    section: null,
    items: [
      { icon: 'BarChart3',  label: 'Report',           href: '/reports' },
      { icon: 'Headphones', label: 'Customer Support', href: '/support' },
    ],
  },
]

// ─── Appointment Colors ───────────────────────────────────────────────────────

export const APPOINTMENT_COLOR_CLASSES: Record<
  string,
  { bg: string; border: string; dot: string }
> = {
  rose:   { bg: 'bg-rose-50',    border: 'border-rose-200',    dot: 'text-rose-500' },
  sage:   { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'text-emerald-500' },
  sky:    { bg: 'bg-sky-50',     border: 'border-sky-200',     dot: 'text-sky-500' },
  amber:  { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'text-amber-500' },
  purple: { bg: 'bg-purple-50',  border: 'border-purple-200',  dot: 'text-purple-500' },
}

// ─── Status Colors ────────────────────────────────────────────────────────────

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  'Finished':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Registered':      'bg-blue-50 text-blue-700 border-blue-200',
  'Waiting payment': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress':     'bg-purple-50 text-purple-700 border-purple-200',
  'Cancelled':       'bg-red-50 text-red-700 border-red-200',
}

// ─── Patient Status Colors ────────────────────────────────────────────────────

export const PATIENT_STATUS_CLASSES: Record<string, string> = {
  Active:   'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-neutral-100 text-neutral-500',
  New:      'bg-blue-50 text-blue-700',
}

// ─── Staff Status Colors ──────────────────────────────────────────────────────

export const STAFF_STATUS_CLASSES: Record<string, string> = {
  Active:    'bg-emerald-50 text-emerald-700',
  Off:       'bg-neutral-100 text-neutral-500',
  'On Leave': 'bg-amber-50 text-amber-700',
}

// ─── Sale Status Colors ───────────────────────────────────────────────────────

export const SALE_STATUS_CLASSES: Record<string, string> = {
  Paid:    'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-red-50 text-red-700',
}

// ─── Purchase Status Colors ───────────────────────────────────────────────────

export const PURCHASE_STATUS_CLASSES: Record<string, string> = {
  Received: 'bg-emerald-50 text-emerald-700',
  Pending:  'bg-amber-50 text-amber-700',
  Ordered:  'bg-blue-50 text-blue-700',
}

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['N'],       description: 'New appointment (Reservations)' },
  { keys: ['T'],       description: 'Jump to today (Reservations)' },
  { keys: ['←', '→'], description: 'Previous / Next day (Reservations)' },
  { keys: ['Esc'],     description: 'Close modal or sheet' },
  { keys: ['/'],       description: 'Focus search bar' },
]
