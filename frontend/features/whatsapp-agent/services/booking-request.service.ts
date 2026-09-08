import { api } from '@/lib/api-client';
import { eventBus } from '@/lib/event-bus';
import { BookingRequestItem } from '../types';

export const bookingRequestService = {
  /**
   * Submit a new remote WhatsApp patient request
   */
  async submitRequest(data: {
    patientName: string;
    patientPhone: string;
    patientAge?: string;
    patientId?: string;
    dentistId: string;
    preferredDate: string;
    preferredStartTime: string;
    preferredEndTime: string;
    reason?: string;
  }): Promise<BookingRequestItem> {
    const raw = await api.patientRequests.create({
      patient_name: data.patientName,
      patient_phone: data.patientPhone,
      patient_age: data.patientAge,
      patient_id: data.patientId,
      dentist_id: data.dentistId,
      preferred_date: data.preferredDate,
      preferred_start_time: data.preferredStartTime,
      preferred_end_time: data.preferredEndTime,
      reason: data.reason || 'WhatsApp Remote Booking',
      source: 'whatsapp',
    });

    const item = this.mapToItem(raw);
    eventBus.emit('whatsapp:booking-request', { request: item });
    return item;
  },

  /**
   * List all pending patient requests for receptionist review
   */
  async listRequests(status = 'pending'): Promise<BookingRequestItem[]> {
    try {
      const rawList = await api.patientRequests.list(status);
      return (rawList || []).map((r) => this.mapToItem(r));
    } catch {
      // Graceful degradation during server reload or transient offline status
      return [];
    }
  },

  /**
   * Staff approves a pending request -> creates confirmed appointment with source='WHATSAPP'
   */
  async approveRequest(requestId: string, reviewNotes?: string): Promise<{ request: BookingRequestItem; appointment?: any }> {
    const res: any = await api.patientRequests.approve(requestId, reviewNotes);
    const item = this.mapToItem(res.patient_request || res);

    const appointment = res.appointment;
    if (appointment) {
      eventBus.emit('appointment:created', { appointment, source: 'whatsapp' });
    }

    return { request: item, appointment };
  },

  /**
   * Staff rejects a pending request with review notes
   */
  async rejectRequest(requestId: string, reviewNotes?: string): Promise<BookingRequestItem> {
    const raw = await api.patientRequests.reject(requestId, reviewNotes);
    return this.mapToItem(raw);
  },

  /**
   * Map raw backend response to BookingRequestItem
   */
  mapToItem(raw: any): BookingRequestItem {
    return {
      id: raw.request_id || raw.id,
      requestId: raw.request_id || raw.id,
      patientName: raw.patient_name || 'Patient',
      patientPhone: raw.patient_phone || '',
      patientAge: raw.patient_age,
      patientId: raw.patient_id,
      isExistingPatient: Boolean(raw.patient_id && !String(raw.patient_id).includes('PENDING')),
      dentistId: raw.dentist_id,
      dentistName: raw.dentist_name,
      preferredDate: raw.preferred_date,
      preferredStartTime: raw.preferred_start_time,
      preferredEndTime: raw.preferred_end_time,
      reason: raw.reason,
      source: raw.source || 'whatsapp',
      status: (raw.status || 'pending').toLowerCase(),
      reviewNotes: raw.review_notes,
      appointmentId: raw.appointment_id,
      createdAt: raw.created_at || new Date().toISOString(),
      chatSnippet: raw.reason ? `Reason: "${raw.reason}"` : undefined,
    };
  },
};
