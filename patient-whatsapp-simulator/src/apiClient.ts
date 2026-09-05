import type { Dentist, TimeSlot, ExistingPatientRecord, PatientDetails, Treatment } from './types';

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
   * Search for existing patient by phone, name, PAT-XXXXXX, APT-XXXXXX, or REQ-XXXXXX.
   */
  async searchPatient(query: string): Promise<ExistingPatientRecord | null> {
    const trimmed = query.trim();

    // If user entered a Request ID (REQ-XXXXXX)
    if (/^REQ-\d+$/i.test(trimmed)) {
      try {
        let reqRes = await fetch(`${API_BASE_URL}/v1/patient-requests/${encodeURIComponent(trimmed.toUpperCase())}`);
        if (!reqRes.ok) {
          reqRes = await fetch(`${API_BASE_URL}/patient-requests/${encodeURIComponent(trimmed.toUpperCase())}`);
        }
        if (reqRes.ok) {
          const req = await reqRes.json();
          return {
            patientId: req.patient_id || 'PENDING',
            fullName: req.patient_name,
            phone: req.patient_phone,
            ageOrDob: req.patient_age,
            lastVisitDate: req.created_at ? req.created_at.split('T')[0] : 'N/A',
            lastVisitType: 'Requested via Simulator',
            upcomingAppointment: {
              referenceCode: req.request_id,
              dentistName: req.dentist_id,
              date: req.preferred_date,
              time: `${req.preferred_start_time} – ${req.preferred_end_time}`,
              status: req.status || 'pending',
            },
          };
        }
      } catch {
        // fall through
      }
    }

    // If user entered an appointment ID, resolve through the appointment
    if (/^APT-\d+$/i.test(trimmed)) {
      try {
        const aptRes = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(trimmed.toUpperCase())}`);
        if (aptRes.ok) {
          const apt = await aptRes.json();
          const patRes = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(apt.patient_id)}`);
          if (patRes.ok) {
            const p = await patRes.json();
            return {
              patientId: p.patient_id,
              fullName: p.full_name,
              phone: p.phone,
              ageOrDob: p.dob_or_age,
              address: p.address,
              emergencyContact: p.emergency_contact,
              lastVisitDate: p.updated_at ? p.updated_at.split('T')[0] : 'N/A',
              lastVisitType: 'Routine Consultation',
              upcomingAppointment: {
                referenceCode: apt.appointment_id,
                dentistName: apt.dentist_name,
                date: apt.date,
                time: `${apt.start_time} – ${apt.end_time}`,
                status: apt.status || 'confirmed',
              },
            };
          }
        }
      } catch {
        // fall through to normal search
      }
    }

    // Normal search by name / phone / PAT-ID
    const res = await fetch(`${API_BASE_URL}/patients?query=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return null;
    const raw: any[] = await res.json();
    if (!raw || raw.length === 0) return null;

    const first = raw[0];
    let upcomingApt = undefined;

    // Check for active appointments for this patient
    try {
      const aptRes = await fetch(`${API_BASE_URL}/appointments?patient_id=${encodeURIComponent(first.patient_id)}`);
      if (aptRes.ok) {
        const apts: any[] = await aptRes.json();
        const activeApt = apts.find((a) => a.status === 'confirmed' || a.status === 'registered' || a.status === 'pending');
        if (activeApt) {
          upcomingApt = {
            referenceCode: activeApt.appointment_id,
            dentistName: activeApt.dentist_name,
            date: activeApt.date,
            time: `${activeApt.start_time} – ${activeApt.end_time}`,
            status: activeApt.status,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      patientId: first.patient_id,
      fullName: first.full_name,
      phone: first.phone,
      ageOrDob: first.dob_or_age,
      address: first.address,
      emergencyContact: first.emergency_contact,
      lastVisitDate: first.updated_at ? first.updated_at.split('T')[0] : 'N/A',
      lastVisitType: 'Routine Consultation',
      upcomingAppointment: upcomingApt,
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

    // Otherwise it's a confirmed Appointment (APT-XXXXXX)
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(trimmed)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
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
