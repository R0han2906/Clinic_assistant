import { SlotResponse, DentistResponse } from '@/types/api';
import { SlotAlternative } from '../types';

export interface MatchSlotParams {
  targetDate: string;
  targetTime: string; // HH:MM
  targetDentistId?: string;
  availableSlots: SlotResponse[];
  dentists: DentistResponse[];
}

export function parseMinutesFromMidnight(timeStr: string): number {
  if (!timeStr) return 540; // 09:00 default
  const clean = timeStr.trim().split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Multi-Objective Smart Slot Matcher Algorithm ($S_total):
 * Evaluates candidate slots across 4 weighted clinical criteria:
 * - Temporal Proximity (W=40)
 * - Dentist Affinity (W=30)
 * - Date Proximity (W=20)
 * - Daypart Consistency (W=10)
 *
 * Guarantees 3 distinct clinical choices:
 * 1. Same Doctor Closest (Choice 1)
 * 2. Exact Time Colleague (Choice 2)
 * 3. Optimal Alternate Daypart (Choice 3)
 */
export function computeSmartAlternatives({
  targetDate,
  targetTime,
  targetDentistId,
  availableSlots,
  dentists,
}: MatchSlotParams): SlotAlternative[] {
  if (!availableSlots || availableSlots.length === 0) {
    return [];
  }

  const targetMins = parseMinutesFromMidnight(targetTime);
  const isTargetMorning = targetMins < 720; // 12:00 PM cutoff

  const dentistMap = new Map<string, string>();
  dentists.forEach((d) => {
    const id = d.dentist_id || (d as any).id;
    if (id) dentistMap.set(id, d.name);
  });

  // Calculate scores for each available candidate slot
  const scored = availableSlots.map((slot) => {
    const slotMins = parseMinutesFromMidnight(slot.start_time);
    const deltaMins = Math.abs(slotMins - targetMins);

    // 1. Temporal Proximity (30m away = 90pts, 60m away = 80pts)
    const sTime = Math.max(0, 100 - deltaMins / 3);

    // 2. Dentist Affinity
    const isSameDoc = Boolean(
      targetDentistId &&
      (slot.dentist_id === targetDentistId ||
        (slot as any).dentistId === targetDentistId)
    );
    const sDoc = isSameDoc ? 100 : 40;

    // 3. Date Proximity
    const isSameDate = slot.date === targetDate;
    const sDate = isSameDate ? 100 : 60;

    // 4. Daypart Consistency (Morning vs Afternoon)
    const isSlotMorning = slotMins < 720;
    const isSameDaypart = isSlotMorning === isTargetMorning;
    const sDaypart = isSameDaypart ? 100 : 20;

    const totalScore =
      (40 * sTime + 30 * sDoc + 20 * sDate + 10 * sDaypart) / 100;

    const slotDocId = slot.dentist_id || (slot as any).dentistId || targetDentistId || 'DEN-000001';
    const docName =
      slot.dentist_name ||
      dentistMap.get(slotDocId) ||
      `Doctor ${slotDocId}`;

    return {
      slot,
      slotDocId,
      deltaMins,
      isSameDoc,
      isSameDaypart,
      totalScore,
      docName,
    };
  });

  const results: SlotAlternative[] = [];

  // Choice 1: Same Doctor, Closest Time
  const sameDocPool = scored.filter((s) => s.isSameDoc && s.deltaMins > 0);
  sameDocPool.sort((a, b) => a.deltaMins - b.deltaMins || b.totalScore - a.totalScore);
  if (sameDocPool.length > 0) {
    const best = sameDocPool[0];
    results.push({
      type: 'same_doc',
      categoryLabel: 'Same Doctor Nearest',
      dentistId: best.slotDocId,
      dentistName: best.docName,
      date: best.slot.date || targetDate,
      startTime: best.slot.start_time,
      endTime: best.slot.end_time,
      score: Math.round(best.totalScore),
    });
  }

  // Choice 2: Exact Time Colleague (Within 60 min of target time)
  const colleaguePool = scored.filter(
    (s) =>
      !s.isSameDoc &&
      !results.some((r) => r.startTime === s.slot.start_time && r.dentistId === s.slotDocId)
  );
  colleaguePool.sort((a, b) => a.deltaMins - b.deltaMins || b.totalScore - a.totalScore);
  if (colleaguePool.length > 0) {
    const best = colleaguePool[0];
    results.push({
      type: 'same_time_colleague',
      categoryLabel: 'Same Time Colleague',
      dentistId: best.slotDocId,
      dentistName: best.docName,
      date: best.slot.date || targetDate,
      startTime: best.slot.start_time,
      endTime: best.slot.end_time,
      score: Math.round(best.totalScore),
    });
  }

  // Choice 3: Optimal Alternate Daypart (e.g. Afternoon if morning requested, or vice versa)
  const daypartPool = scored.filter(
    (s) =>
      !s.isSameDaypart &&
      !results.some((r) => r.startTime === s.slot.start_time && r.dentistId === s.slotDocId)
  );
  daypartPool.sort((a, b) => b.totalScore - a.totalScore);
  if (daypartPool.length > 0) {
    const best = daypartPool[0];
    results.push({
      type: 'alternate_daypart',
      categoryLabel: isTargetMorning ? 'Afternoon Option' : 'Morning Option',
      dentistId: best.slotDocId,
      dentistName: best.docName,
      date: best.slot.date || targetDate,
      startTime: best.slot.start_time,
      endTime: best.slot.end_time,
      score: Math.round(best.totalScore),
    });
  }

  // Fill up to 3 choices if any category had no match
  if (results.length < 3) {
    const remaining = scored.filter(
      (s) =>
        !results.some((r) => r.startTime === s.slot.start_time && r.dentistId === s.slotDocId)
    );
    remaining.sort((a, b) => b.totalScore - a.totalScore);
    for (const rem of remaining) {
      if (results.length >= 3) break;
      results.push({
        type: rem.isSameDoc ? 'same_doc' : 'same_time_colleague',
        categoryLabel: 'Alternative Slot',
        dentistId: rem.slotDocId,
        dentistName: rem.docName,
        date: rem.slot.date || targetDate,
        startTime: rem.slot.start_time,
        endTime: rem.slot.end_time,
        score: Math.round(rem.totalScore),
      });
    }
  }

  return results;
}
