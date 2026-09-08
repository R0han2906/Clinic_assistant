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

// ─── Time (24-Hour Strict Format) ─────────────────────────────────────────────

/** 14 → "14:00",  9 → "09:00",  14.5 → "14:30",  24 → "00:00" */
export function formatHour(hour: number): string {
  const norm = hour % 24
  const wholePart = Math.floor(norm)
  const minutePart = Math.round((norm % 1) * 60)
  const displayHour = String(wholePart).padStart(2, '0')
  const displayMin = String(minutePart).padStart(2, '0')
  return `${displayHour}:${displayMin}`
}

/** "2:30 PM" → "14:30",  "09:00 AM" → "09:00",  "14:30" → "14:30",  "12:00 AM" → "00:00" */
export function formatTimeTo24(timeStr?: string): string {
  if (!timeStr) return ''
  const clean = timeStr.trim()

  // Match 12-hour AM/PM format e.g. "09:00 AM", "2:30 pm", "9:00am", "12:00 PM"
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10)
    const minutes = ampmMatch[2]
    const period = ampmMatch[3]?.toUpperCase()
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  // Match 24-hour HH:mm
  const simpleMatch = clean.match(/^(\d{1,2}):(\d{2})/)
  if (simpleMatch) {
    return `${String(parseInt(simpleMatch[1], 10)).padStart(2, '0')}:${simpleMatch[2]}`
  }

  return clean
}

/**
 * Parses and formats composite time ranges into strict 24-hour format:
 * "09:00 AM › 10:00 AM" → "09:00 › 10:00"
 * "02:30 PM › 03:30 PM" → "14:30 › 15:30"
 * "10:00 - 11:30" → "10:00 › 11:30"
 */
export function formatTimeRange24(rangeStr?: string): string {
  if (!rangeStr) return ''
  const trimmed = rangeStr.trim()

  if (trimmed.includes('›')) {
    return trimmed
      .split('›')
      .map((part) => formatTimeTo24(part))
      .join(' › ')
  }
  if (trimmed.includes('–')) {
    return trimmed
      .split('–')
      .map((part) => formatTimeTo24(part))
      .join(' › ')
  }
  if (trimmed.includes(' - ')) {
    return trimmed
      .split(' - ')
      .map((part) => formatTimeTo24(part))
      .join(' › ')
  }

  return formatTimeTo24(trimmed)
}

/** "14:30" → "14:30",  "2:30 PM" → "14:30" */
export function formatTimeString(time: string): string {
  return formatTimeRange24(time)
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
