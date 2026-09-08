import type { Dentist, TimeSlot, ExistingPatientRecord, PatientDetails, Treatment, AlternativeSlot, UpcomingBookingItem } from './types';
import { getMockSlots } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface BackendHealthResponse {
  status: string;
  workbook_exists: boolean;
  total_patients?: number;
  total_appointments?: number;
  total_dentists?: number;
}

export const apiClient = {
  /**
   * Check if FastAPI backend server is online and healthy.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/system/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data: BackendHealthResponse = await res.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },

  /**
   * Fetch active dentists from backend database.
   */
  async getDentists(): Promise<Dentist[]> {
    const res = await fetch(`${API_BASE_URL}/dentists`);
    if (!res.ok) throw new Error('Failed to fetch dentists from backend');
    const raw: any[] = await res.json();

    const mapped: Dentist[] = raw.map((d) => ({
      id: d.dentist_id,
      name: d.name,
      specialty: d.specialty || 'Dental Specialist',
      avatar: d.color_code
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=${d.color_code.replace('#', '')}&color=fff&size=150`
        : 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
      experience: 'Verified Clinic Dentist',
      colorCode: d.color_code || '#2563eb',
    }));

    // Add option for "Any Available Dentist"
    mapped.push({
      id: 'DOC-ANY',
      name: 'Any Available Dentist',
      specialty: 'First Available Slot',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
      experience: 'Fastest Booking Option',
      colorCode: '#4f46e5',
    });

    return mapped;
  },

  /**
   * Fetch calculated available 30-min slots for a given date & dentist.
   */
  async getAvailableSlots(date: string, dentistId?: string): Promise<TimeSlot[]> {
    let url = `${API_BASE_URL}/availability/slots?date=${encodeURIComponent(date)}`;
    if (dentistId && dentistId !== 'DOC-ANY') {
      url += `&dentist_id=${encodeURIComponent(dentistId)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch available slots from backend');
    const raw: any[] = await res.json();

    return raw.map((s) => ({
      id: `SLOT-${s.dentist_id}-${s.date}-${s.start_time}`,
      dentistId: s.dentist_id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      isAvailable: s.is_available ?? true,
    }));
  },

  /**
   * Multi-Objective Smart Slot Matcher Algorithm ($S_total):
   * Computes the top 3 categorized available alternative slots:
   * 1. Same Doctor, Closest Time
   * 2. Same Time, Colleague Doctor
   * 3. Alternative Daypart (Morning/Afternoon)
   */
  async getSmartAlternativeSlots(
    date: string,
    targetTime: string,
    targetDentistId?: string,
    allDentists: Dentist[] = []
  ): Promise<AlternativeSlot[]> {
    try {
      let slots: TimeSlot[] = [];
      try {
        slots = await this.getAvailableSlots(date);
      } catch {
        slots = [];
      }

      if (!slots || slots.length === 0) {
        slots = (allDentists.length > 0 ? allDentists : [{ id: targetDentistId || 'DOC-000001', name: 'Dr. Sarah Wilson' } as any])
          .flatMap((d) => getMockSlots(d.id, date));
      }

      const available = slots.filter((s) => s.isAvailable);
      if (available.length === 0) return [];

      const parseMinutes = (tStr: string): number => {
        const [h, m] = (tStr || '09:00').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const targetMins = parseMinutes(targetTime);
      const isTargetMorning = targetMins < 720; // 12:00 PM

      const dentistNameMap = new Map<string, string>();
      allDentists.forEach((d) => dentistNameMap.set(d.id, d.name));

      const scored = available.map((s) => {
        const slotMins = parseMinutes(s.startTime);
        const deltaMins = Math.abs(slotMins - targetMins);
        const sTime = Math.max(0, 100 - deltaMins / 3);
        const isSameDoc = Boolean(targetDentistId && targetDentistId !== 'DOC-ANY' && s.dentistId === targetDentistId);
        const sDoc = isSameDoc ? 100 : 40;
        const isSameDaypart = (slotMins < 720) === isTargetMorning;
        const sDaypart = isSameDaypart ? 100 : 20;

        const totalScore = (40 * sTime + 30 * sDoc + 20 * 100 + 10 * sDaypart) / 100;
        return {
          slot: s,
          deltaMins,
          isSameDoc,
          isSameDaypart,
          totalScore,
          dentistName: dentistNameMap.get(s.dentistId) || `Doctor ${s.dentistId}`,
        };
      });

      const alternatives: AlternativeSlot[] = [];

      // Category 1: Same Doctor, Closest Time
      const sameDocPool = scored.filter((x) => x.isSameDoc && x.deltaMins > 0);
      sameDocPool.sort((a, b) => a.deltaMins - b.deltaMins);
      if (sameDocPool.length > 0) {
        const best = sameDocPool[0];
        alternatives.push({
          type: 'same_doc',
          label: `${best.slot.startTime} with ${best.dentistName} (${best.deltaMins}m from preferred)`,
          slot: best.slot,
          dentistName: best.dentistName,
          score: best.totalScore,
        });
      }

      // Category 2: Same Time, Colleague Doctor
      const colleaguePool = scored.filter(
        (x) => !x.isSameDoc && !alternatives.some((a) => a.slot.id === x.slot.id)
      );
      colleaguePool.sort((a, b) => a.deltaMins - b.deltaMins || b.totalScore - a.totalScore);
      if (colleaguePool.length > 0) {
        const best = colleaguePool[0];
        alternatives.push({
          type: 'same_time_colleague',
          label: `${best.slot.startTime} with ${best.dentistName} (Alternative Specialist)`,
          slot: best.slot,
          dentistName: best.dentistName,
          score: best.totalScore,
        });
      }

      // Category 3: Alternative Daypart
      const daypartPool = scored.filter(
        (x) => !x.isSameDaypart && !alternatives.some((a) => a.slot.id === x.slot.id)
      );
      daypartPool.sort((a, b) => b.totalScore - a.totalScore);
      if (daypartPool.length > 0) {
        const best = daypartPool[0];
        alternatives.push({
          type: 'alternate_daypart',
          label: `${best.slot.startTime} with ${best.dentistName} (${isTargetMorning ? 'Afternoon' : 'Morning'} Slot)`,
          slot: best.slot,
          dentistName: best.dentistName,
          score: best.totalScore,
        });
      }

      // Fill remaining up to 3 choices if any category was empty
      if (alternatives.length < 3) {
        const remaining = scored.filter((x) => !alternatives.some((a) => a.slot.id === x.slot.id));
        remaining.sort((a, b) => b.totalScore - a.totalScore);
        for (const rem of remaining) {
          if (alternatives.length >= 3) break;
          alternatives.push({
            type: rem.isSameDoc ? 'same_doc' : 'same_time_colleague',
            label: `${rem.slot.startTime} with ${rem.dentistName}`,
            slot: rem.slot,
            dentistName: rem.dentistName,
            score: rem.totalScore,
          });
        }
      }

      return alternatives;
    } catch {
      return [];
    }
  },

  /**
   * Search for existing patient by phone, name, PAT-XXXXXX, APT-XXXXXX, or REQ-XXXXXX.
   * Retrieves full profile and ALL active upcoming appointments & pending requests.
   */
  async searchPatient(query: string): Promise<ExistingPatientRecord | null> {
    const trimmed = query.trim();
    const cleanDigits = trimmed.replace(/\D/g, '');

    // 1. If user entered a Request ID (REQ-XXXXXX or REQ-DEMO-XXXXXX)
    if (/^REQ-/i.test(trimmed)) {
      try {
        let reqRes = await fetch(`${API_BASE_URL}/v1/patient-requests/${encodeURIComponent(trimmed.toUpperCase())}`);
        if (!reqRes.ok) {
          reqRes = await fetch(`${API_BASE_URL}/patient-requests/${encodeURIComponent(trimmed.toUpperCase())}`);
        }
        if (reqRes.ok) {
          const req = await reqRes.json();
          const reqItem: UpcomingBookingItem = {
            referenceCode: req.request_id,
            type: 'request',
            dentistId: req.dentist_id,
            dentistName: req.dentist_id,
            date: req.preferred_date,
            time: `${req.preferred_start_time} – ${req.preferred_end_time}`,
            startTime: req.preferred_start_time,
            endTime: req.preferred_end_time,
            status: req.status || 'pending',
            reason: req.reason,
            notes: req.status === 'approved' ? 'Approved by staff' : 'Pending staff review',
          };
          return {
            patientId: req.patient_id || 'PENDING',
            fullName: req.patient_name,
            phone: req.patient_phone,
            ageOrDob: req.patient_age,
            lastVisitDate: req.created_at ? req.created_at.split('T')[0] : 'N/A',
            lastVisitType: 'Requested via Simulator',
            upcomingAppointments: [reqItem],
            upcomingAppointment: reqItem,
          };
        }
      } catch {
        // fall through
      }
    }

    // 2. If user entered an appointment ID (APT-XXXXXX)
    if (/^APT-\d+$/i.test(trimmed)) {
      try {
        let aptRes = await fetch(`${API_BASE_URL}/v1/appointments/${encodeURIComponent(trimmed.toUpperCase())}`);
        if (!aptRes.ok) {
          aptRes = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(trimmed.toUpperCase())}`);
        }
        if (aptRes.ok) {
          const apt = await aptRes.json();
          const aptItem: UpcomingBookingItem = {
            referenceCode: apt.appointment_id,
            type: 'appointment',
            dentistId: apt.dentist_id,
            dentistName: apt.dentist_name || `Doctor ${apt.dentist_id}`,
            date: apt.date,
            time: `${apt.start_time} – ${apt.end_time}`,
            startTime: apt.start_time,
            endTime: apt.end_time,
            status: apt.status || 'confirmed',
            reason: apt.reason,
            notes: apt.notes,
          };
          let patData: any = null;
          if (apt.patient_id) {
            try {
              const pRes = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(apt.patient_id)}`);
              if (pRes.ok) patData = await pRes.json();
            } catch {}
          }
          return {
            patientId: apt.patient_id || 'PAT-000001',
            fullName: patData?.full_name || apt.patient_name || 'Clinic Patient',
            phone: patData?.phone || apt.patient_phone || '',
            ageOrDob: patData?.dob_or_age || '30',
            address: patData?.address,
            emergencyContact: patData?.emergency_contact,
            lastVisitDate: patData?.updated_at ? patData.updated_at.split('T')[0] : 'N/A',
            lastVisitType: 'Routine Consultation',
            upcomingAppointments: [aptItem],
            upcomingAppointment: aptItem,
          };
        }
      } catch {
        // fall through to normal search
      }
    }

    // 3. Normal search by name / phone / PAT-ID
    let rawPatients: any[] = [];
    try {
      const res = await fetch(`${API_BASE_URL}/patients?query=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        rawPatients = await res.json();
      }
    } catch {
      rawPatients = [];
    }

    // Digit suffix search fallback if no direct matches
    if ((!rawPatients || rawPatients.length === 0) && cleanDigits.length >= 7) {
      try {
        const res2 = await fetch(`${API_BASE_URL}/patients?query=${encodeURIComponent(cleanDigits)}`);
        if (res2.ok) {
          rawPatients = await res2.json();
        }
      } catch {}
    }

    // If no patient profile found by patients API, check if there are pending patient requests with this phone!
    if (!rawPatients || rawPatients.length === 0) {
      try {
        let reqRes = await fetch(`${API_BASE_URL}/v1/patient-requests?patient_phone=${encodeURIComponent(trimmed)}`);
        if (!reqRes.ok) {
          reqRes = await fetch(`${API_BASE_URL}/v1/patient-requests`);
        }
        if (reqRes.ok) {
          const reqs: any[] = await reqRes.json();
          const matchReqs = reqs.filter(
            (r: any) =>
              (r.patient_phone && (r.patient_phone === trimmed || (cleanDigits && r.patient_phone.includes(cleanDigits)))) ||
              (r.patient_name && r.patient_name.toLowerCase().includes(trimmed.toLowerCase()))
          );
          if (matchReqs.length > 0) {
            const firstReq = matchReqs[0];
            const upcomingItems: UpcomingBookingItem[] = matchReqs.map((r: any) => ({
              referenceCode: r.request_id,
              type: 'request' as const,
              dentistId: r.dentist_id,
              dentistName: r.dentist_id,
              date: r.preferred_date,
              time: `${r.preferred_start_time} – ${r.preferred_end_time}`,
              startTime: r.preferred_start_time,
              endTime: r.preferred_end_time,
              status: r.status || 'pending',
              reason: r.reason,
              notes: 'Pending staff review',
            }));
            return {
              patientId: firstReq.patient_id || 'PENDING',
              fullName: firstReq.patient_name,
              phone: firstReq.patient_phone,
              ageOrDob: firstReq.patient_age,
              lastVisitDate: firstReq.created_at ? firstReq.created_at.split('T')[0] : 'N/A',
              lastVisitType: 'Requested via Simulator',
              upcomingAppointments: upcomingItems,
              upcomingAppointment: upcomingItems[0],
            };
          }
        }
      } catch {}
      return null;
    }

    const first = rawPatients[0];
    const upcomingItems: UpcomingBookingItem[] = [];

    // Fetch active appointments for this patient
    try {
      const aptRes = await fetch(`${API_BASE_URL}/appointments?patient_id=${encodeURIComponent(first.patient_id)}`);
      if (aptRes.ok) {
        const apts: any[] = await aptRes.json();
        // Include scheduled, confirmed, registered, pending
        const activeApts = apts.filter((a: any) => {
          const s = (a.status || '').toLowerCase();
          return s === 'scheduled' || s === 'confirmed' || s === 'registered' || s === 'pending';
        });
        activeApts.forEach((a: any) => {
          upcomingItems.push({
            referenceCode: a.appointment_id,
            type: 'appointment',
            dentistId: a.dentist_id,
            dentistName: a.dentist_name || `Doctor ${a.dentist_id}`,
            date: a.date,
            time: `${a.start_time} – ${a.end_time}`,
            startTime: a.start_time,
            endTime: a.end_time,
            status: a.status,
            reason: a.reason,
            notes: a.notes,
          });
        });
      }
    } catch {}

    // In parallel, fetch pending patient requests for this patient (by phone or patient_id)
    try {
      let pReqRes = await fetch(`${API_BASE_URL}/v1/patient-requests?patient_id=${encodeURIComponent(first.patient_id)}`);
      if (!pReqRes.ok) {
        pReqRes = await fetch(`${API_BASE_URL}/v1/patient-requests`);
      }
      if (pReqRes.ok) {
        const pReqs: any[] = await pReqRes.json();
        const pendingForPatient = pReqs.filter((r: any) => {
          const matchesId = r.patient_id && r.patient_id === first.patient_id;
          const matchesPhone = r.patient_phone && (r.patient_phone === first.phone || (cleanDigits && r.patient_phone.includes(cleanDigits)));
          const isPending = (r.status || '').toLowerCase() === 'pending';
          const alreadyInApts = r.appointment_id && upcomingItems.some((a) => a.referenceCode === r.appointment_id);
          return (matchesId || matchesPhone) && isPending && !alreadyInApts;
        });

        pendingForPatient.forEach((r: any) => {
          upcomingItems.push({
            referenceCode: r.request_id,
            type: 'request',
            dentistId: r.dentist_id,
            dentistName: r.dentist_id,
            date: r.preferred_date,
            time: `${r.preferred_start_time} – ${r.preferred_end_time}`,
            startTime: r.preferred_start_time,
            endTime: r.preferred_end_time,
            status: 'pending',
            reason: r.reason,
            notes: 'Pending staff review',
          });
        });
      }
    } catch {}

    // Sort chronologically (date then start time)
    upcomingItems.sort((a, b) => {
      const cmpDate = a.date.localeCompare(b.date);
      if (cmpDate !== 0) return cmpDate;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    return {
      patientId: first.patient_id,
      fullName: first.full_name,
      phone: first.phone,
      ageOrDob: first.dob_or_age,
      address: first.address,
      emergencyContact: first.emergency_contact,
      lastVisitDate: first.updated_at ? first.updated_at.split('T')[0] : 'N/A',
      lastVisitType: 'Routine Consultation',
      upcomingAppointments: upcomingItems,
      upcomingAppointment: upcomingItems.length > 0 ? upcomingItems[0] : undefined,
    };
  },

  /**
   * Fetch treatments catalog from backend.
   */
  async getTreatments(): Promise<Treatment[]> {
    const res = await fetch(`${API_BASE_URL}/treatments`);
    if (!res.ok) throw new Error('Failed to fetch treatments from backend');
    const raw: any[] = await res.json();
    return raw.map((t) => ({
      id: t.treatment_id,
      name: t.name,
      category: t.category,
      defaultDurationMinutes: t.default_duration_minutes,
      estimatedCost: t.estimated_cost,
      description: t.description,
    }));
  },

  /**
   * Register a new patient in the FastAPI backend Excel database.
   */
  async registerPatient(details: PatientDetails): Promise<string> {
    const payload = {
      full_name: details.fullName,
      dob_or_age: details.ageOrDob,
      phone: details.phone,
      consent_status: 'acknowledged',
      force_create: false,
    };

    let res = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      // Potential duplicate warning - resubmit with force_create: true
      payload.force_create = true;
      res = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || err.detail || 'Failed to register patient in backend');
    }

    const data = await res.json();
    return data.patient_id;
  },

  /**
   * Submit a Patient Booking Request via POST /api/v1/patient-requests
   */
  async submitPatientRequest(params: {
    patientName: string;
    patientPhone: string;
    patientAge?: string;
    dentistId: string;
    preferredDate: string;
    preferredStartTime: string;
    preferredEndTime: string;
    reason?: string;
  }): Promise<{ requestId: string; status: string }> {
    const payload = {
      patient_name: params.patientName,
      patient_phone: params.patientPhone,
      patient_age: params.patientAge || '30',
      dentist_id: params.dentistId === 'DOC-ANY' ? 'DOC-000001' : params.dentistId,
      preferred_date: params.preferredDate,
      preferred_start_time: params.preferredStartTime,
      preferred_end_time: params.preferredEndTime,
      reason: params.reason || 'Dental Consultation',
      source: 'simulator',
    };

    let res = await fetch(`${API_BASE_URL}/v1/patient-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      res = await fetch(`${API_BASE_URL}/patient-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || err.detail || 'Failed to submit patient request to backend');
    }

    const data = await res.json();
    return {
      requestId: data.request_id,
      status: data.status,
    };
  },

  /**
   * Book an appointment in the backend Excel database.
   */
  async bookAppointment(params: {
    patientId: string;
    dentistId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }): Promise<{ appointmentId: string; status: string }> {
    const payload = {
      patient_id: params.patientId,
      dentist_id: params.dentistId === 'DOC-ANY' ? 'DOC-000001' : params.dentistId,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      reason: params.reason || 'Requested via Patient WhatsApp Simulator',
      notes: 'Created via Patient WhatsApp Bot Simulator',
    };

    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to book appointment in backend database');
    }

    const data = await res.json();
    return {
      appointmentId: data.appointment_id,
      status: data.status,
    };
  },

  /**
   * Reschedule an existing confirmed/scheduled appointment in the backend.
   */
  async rescheduleAppointment(
    appointmentId: string,
    params: {
      newDate: string;
      newStartTime: string;
      newEndTime: string;
      newDentistId?: string;
      reason?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const payload = {
      new_date: params.newDate,
      new_start_time: params.newStartTime,
      new_end_time: params.newEndTime,
      new_dentist_id: params.newDentistId,
      reschedule_reason: params.reason || 'Rescheduled via WhatsApp Simulator',
    };

    try {
      let res = await fetch(`${API_BASE_URL}/v1/appointments/${encodeURIComponent(appointmentId)}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to reschedule appointment in clinic database');
      }

      const data = await res.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Cancel an appointment or patient request in the backend.
   * Handles both APT-XXXXXX and REQ-XXXXXX.
   */
  async cancelAppointment(
    referenceCode: string,
    reason?: string
  ): Promise<{ success: boolean; status?: string }> {
    const trimmed = referenceCode.trim().toUpperCase();
    const cancelReason = reason || 'Cancelled via WhatsApp Simulator';

    // If it's a Patient Request (REQ-XXXXXX)
    if (trimmed.startsWith('REQ-')) {
      try {
        let res = await fetch(`${API_BASE_URL}/v1/patient-requests/${encodeURIComponent(trimmed)}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_notes: cancelReason }),
        });
        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/patient-requests/${encodeURIComponent(trimmed)}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ review_notes: cancelReason }),
          });
        }
        return { success: res.ok, status: 'cancelled' };
      } catch {
        return { success: false };
      }
    }

    // Otherwise it's an Appointment (APT-XXXXXX)
    try {
      let res = await fetch(`${API_BASE_URL}/v1/appointments/${encodeURIComponent(trimmed)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(trimmed)}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: cancelReason }),
        });
      }
      return { success: res.ok, status: 'cancelled' };
    } catch {
      return { success: false };
    }
  },

  /**
   * Update existing patient details in the backend.
   */
  async updatePatient(
    patientId: string,
    updates: {
      fullName?: string;
      phone?: string;
      ageOrDob?: string;
      address?: string;
      emergencyContact?: string;
    }
  ): Promise<{ success: boolean; data?: any }> {
    const payload: any = {};
    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.ageOrDob) payload.dob_or_age = updates.ageOrDob;
    if (updates.address) payload.address = updates.address;
    if (updates.emergencyContact) payload.emergency_contact = updates.emergencyContact;

    try {
      const res = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update patient profile');
      }
      const data = await res.json();
      return { success: true, data };
    } catch {
      return { success: false };
    }
  },
};
