import type { Dentist, TimeSlot, ExistingPatientRecord, PatientDetails } from './types';

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
   * Search for existing patient by phone, name, PAT-XXXXXX, or APT-XXXXXX.
   * If an APT-XXXXXX id is passed, we first resolve the appointment to get
   * the patient_id, then fetch the patient record.
   */
  async searchPatient(query: string): Promise<ExistingPatientRecord | null> {
    const trimmed = query.trim();

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
              lastVisitDate: p.updated_at ? p.updated_at.split('T')[0] : 'N/A',
              lastVisitType: 'Routine Consultation',
              upcomingAppointment: {
                referenceCode: apt.appointment_id,
                dentistName: apt.dentist_name,
                date: apt.date,
                time: `${apt.start_time} – ${apt.end_time}`,
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
    return {
      patientId: first.patient_id,
      fullName: first.full_name,
      phone: first.phone,
      ageOrDob: first.dob_or_age,
      lastVisitDate: first.updated_at ? first.updated_at.split('T')[0] : 'N/A',
      lastVisitType: 'Routine Consultation',
    };
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
   * Cancel an appointment in the backend.
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Cancelled via WhatsApp Simulator' }),
    });

    return res.ok;
  },
};
