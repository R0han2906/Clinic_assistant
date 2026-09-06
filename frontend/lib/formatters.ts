// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Percentages ──────────────────────────────────────────────────────────────

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`
}

// ─── Time ─────────────────────────────────────────────────────────────────────

/** 14 → "2:00 PM",  9 → "9:00 AM",  14.5 → "2:30 PM" */
export function formatHour(hour: number): string {
  const wholePart = Math.floor(hour)
  const minutePart = (hour % 1) * 60
  const period = wholePart >= 12 ? 'PM' : 'AM'
  const displayHour = wholePart > 12 ? wholePart - 12 : wholePart === 0 ? 12 : wholePart
  const displayMin = minutePart === 0 ? '00' : String(minutePart).padStart(2, '0')
  return `${displayHour}:${displayMin} ${period}`
}

/** "14:30" → "2:30 PM" */
export function formatTimeString(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/** "2024-05-16" → "Thu, 16 May 2024" */
export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "2024-05-16" → "16 May 2024" */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Relative Time ────────────────────────────────────────────────────────────

export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Duration ─────────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Age from DOB ─────────────────────────────────────────────────────────────

export function calcAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ─── Initials ─────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
