import type { Appointment } from '@/types'

export const CALENDAR_START_HOUR = 9 // 09:00 AM
export const CALENDAR_END_HOUR = 24 // 12:00 AM Midnight (24:00)
export const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR // 15 Hours
export const HOUR_HEIGHT_PX = 80 // 80px per hour (total column height: 1200px)

export interface PositionedAppointment extends Appointment {
  topPx: number
  heightPx: number
  widthPercent: number
  leftPercent: number
  zIndex: number
  trackIndex: number
  totalTracks: number
}

/**
 * Converts any time string (12h AM/PM, 24h, range e.g. "09:00 - 10:00", or midnight) to decimal hours (9.0 to 24.0).
 */
export function parseTimeToHour(timeStr?: string, isEndBoundary: boolean = false): number {
  if (!timeStr) return isEndBoundary ? 10 : 9
  const clean = String(timeStr).trim().toLowerCase()

  // Handle range strings e.g. "09:00 AM › 10:00 AM" or "09:00 - 10:00"
  if (clean.includes('›') || clean.includes(' - ') || clean.includes('–')) {
    const parts = clean.split(/[›\-\–]/)
    const targetPart = isEndBoundary && parts.length > 1 ? parts[1].trim() : parts[0].trim()
    return parseTimeToHour(targetPart, false)
  }

  // Midnight boundary cases
  if (clean === "12:00 am" || clean === "00:00" || clean === "24:00" || clean.startsWith("00:00:")) return 24
  if (clean === "12:30 am") return 24.5

  // Match 12-hour AM/PM format e.g. "09:00 AM", "2:30 pm", "09:00am"
  const match12 = clean.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i)
  if (match12) {
    let h = parseInt(match12[1], 10)
    const m = parseInt(match12[2], 10) || 0
    const isPm = match12[3].toLowerCase() === 'pm'
    if (isPm && h < 12) h += 12
    if (!isPm && h === 12) h = 0
    const decimal = h + m / 60
    return Math.max(CALENDAR_START_HOUR, Math.min(CALENDAR_END_HOUR, decimal))
  }

  // Match 24-hour format HH:MM(:SS) e.g. "09:00", "14:30", "09:00:00"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
  if (match24) {
    const h = parseInt(match24[1], 10)
    const m = parseInt(match24[2], 10) || 0
    const decimal = h + m / 60
    return Math.max(CALENDAR_START_HOUR, Math.min(CALENDAR_END_HOUR, decimal))
  }

  const parts = clean.replace(/(am|pm)/g, "").trim().split(":")
  let hours = parseInt(parts[0], 10) || (isEndBoundary ? 10 : 9)
  const minutes = parseInt(parts[1], 10) || 0
  const isPM = clean.includes("pm")
  const isAM = clean.includes("am")
  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0
  const decimal = hours + minutes / 60
  return Math.max(CALENDAR_START_HOUR, Math.min(CALENDAR_END_HOUR, decimal))
}

/** Converts start and end times to top offset and height in pixels */
export function calculateTimeSpan(
  startStr?: string,
  endStrOrDuration?: string | number
): { topPx: number; heightPx: number; startDecimal: number; endDecimal: number } {
  const startDecimal = parseTimeToHour(startStr, false)
  let endDecimal: number

  if (typeof endStrOrDuration === "number") {
    endDecimal = startDecimal + endStrOrDuration
  } else if (endStrOrDuration) {
    endDecimal = parseTimeToHour(endStrOrDuration, true)
  } else if (startStr && (startStr.includes('›') || startStr.includes(' - ') || startStr.includes('–'))) {
    endDecimal = parseTimeToHour(startStr, true)
  } else {
    endDecimal = startDecimal + 1
  }

  if (endDecimal <= startDecimal) {
    endDecimal = startDecimal + 1 // Default to 1 hour minimum
  }

  const topPx = (startDecimal - CALENDAR_START_HOUR) * HOUR_HEIGHT_PX
  const heightPx = Math.max(36, (endDecimal - startDecimal) * HOUR_HEIGHT_PX)

  return { topPx, heightPx, startDecimal, endDecimal }
}

/**
 * Computes multi-track collision geometry for a list of appointments in a single dentist column.
 */
export function computeCalendarLayout(appointments: Appointment[]): PositionedAppointment[] {
  if (!appointments || appointments.length === 0) return []

  // 1. Calculate time spans and sort ascending by start time, descending by duration
  const spans = appointments.map((apt) => {
    const a = apt as any
    // Prefer explicit start_time / end_time if available (set after drag-reschedule)
    let timeSpan: ReturnType<typeof calculateTimeSpan>
    if (a.start_time && a.end_time) {
      timeSpan = calculateTimeSpan(a.start_time, a.end_time)
    } else if (a.start_time) {
      timeSpan = calculateTimeSpan(a.start_time, apt.durationHours || 1)
    } else {
      timeSpan = calculateTimeSpan(apt.time, apt.durationHours || 1)
    }
    const { topPx, heightPx, startDecimal, endDecimal } = timeSpan
    return {
      apt,
      topPx,
      heightPx,
      startDecimal,
      endDecimal,
      duration: endDecimal - startDecimal,
    }
  })

  spans.sort((a, b) => {
    if (a.startDecimal !== b.startDecimal) {
      return a.startDecimal - b.startDecimal
    }
    return b.duration - a.duration
  })

  // 2. Group into continuous conflict clusters
  const clusters: (typeof spans)[] = []
  let currentCluster: typeof spans = []
  let clusterEnd = -1

  for (const item of spans) {
    if (currentCluster.length === 0) {
      currentCluster.push(item)
      clusterEnd = item.endDecimal
    } else if (item.startDecimal < clusterEnd) {
      currentCluster.push(item)
      if (item.endDecimal > clusterEnd) {
        clusterEnd = item.endDecimal
      }
    } else {
      clusters.push(currentCluster)
      currentCluster = [item]
      clusterEnd = item.endDecimal
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  // 3. For each cluster, perform greedy track assignment
  const result: PositionedAppointment[] = []

  for (const cluster of clusters) {
    const tracks: (typeof spans)[] = []
    const assignments: { item: (typeof spans)[0]; trackIndex: number }[] = []

    for (const item of cluster) {
      let assignedTrack = -1

      for (let t = 0; t < tracks.length; t++) {
        const lastInTrack = tracks[t][tracks[t].length - 1]
        if (item.startDecimal >= lastInTrack.endDecimal) {
          tracks[t].push(item)
          assignedTrack = t
          break
        }
      }

      if (assignedTrack === -1) {
        tracks.push([item])
        assignedTrack = tracks.length - 1
      }

      assignments.push({ item, trackIndex: assignedTrack })
    }

    const totalTracks = tracks.length

    for (const { item, trackIndex } of assignments) {
      // Calculate equal-width side-by-side column geometry per Plan 03
      const widthPercent = 100 / totalTracks
      const leftPercent = trackIndex * widthPercent

      // Determine default z-index based on status
      let baseZIndex = 10
      const statusLower = (item.apt.status || "").toLowerCase()
      if (statusLower.includes("cancelled")) {
        baseZIndex = 1
      } else if (statusLower.includes("in progress")) {
        baseZIndex = 20
      }

      result.push({
        ...item.apt,
        topPx: item.topPx,
        heightPx: item.heightPx,
        widthPercent,
        leftPercent,
        trackIndex,
        totalTracks,
        zIndex: baseZIndex,
      })
    }
  }

  return result
}
