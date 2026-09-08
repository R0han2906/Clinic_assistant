import { api } from '@/lib/api-client';
import { DentistResponse, SlotResponse } from '@/types/api';
import { lookupPatientByPhone } from './patient-lookup.service';
import { computeSmartAlternatives } from './slot-matcher.service';
import { bookingRequestService } from './booking-request.service';
import { PatientProfile, SlotAlternative } from '../types';

export const whatsappBotService = {
  /**
   * Look up patient by phone or name
   */
  async searchPatient(query: string): Promise<PatientProfile | null> {
    return lookupPatientByPhone(query);
  },

  /**
   * Fetch live available slots for a dentist & date
   */
  async getAvailableSlots(date: string, dentistId?: string): Promise<SlotResponse[]> {
    try {
      return await api.dentists.getSlots(date, dentistId);
    } catch (err) {
      console.warn('[whatsapp-bot.service] Failed to fetch slots:', err);
      return [];
    }
  },

  /**
   * Validate if requested slot is available; if not, calculate top 3 alternatives
   */
  async validateSlotAvailability(params: {
    date: string;
    startTime: string;
    dentistId: string;
    dentists: DentistResponse[];
  }): Promise<{ isAvailable: boolean; alternatives: SlotAlternative[] }> {
    const { date, startTime, dentistId, dentists } = params;

    // Fetch all open slots for that day
    const allDaySlots = await this.getAvailableSlots(date);

    // Check if the requested slot is open with requested dentist
    const isAvailable = allDaySlots.some(
      (s) =>
        s.dentist_id === dentistId &&
        s.start_time === startTime &&
        (s.is_available ?? true)
    );

    if (isAvailable) {
      return { isAvailable: true, alternatives: [] };
    }

    // If not available, compute top 3 smart alternatives
    const alternatives = computeSmartAlternatives({
      targetDate: date,
      targetTime: startTime,
      targetDentistId: dentistId,
      availableSlots: allDaySlots,
      dentists,
    });

    return { isAvailable: false, alternatives };
  },

  /**
   * Submit booking from WhatsApp bot
   */
  async confirmBooking(params: {
    patient: PatientProfile;
    dentistId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }) {
    return bookingRequestService.submitRequest({
      patientName: params.patient.fullName,
      patientPhone: params.patient.phone,
      patientAge: params.patient.dobOrAge,
      patientId: params.patient.patientId,
      dentistId: params.dentistId,
      preferredDate: params.date,
      preferredStartTime: params.startTime,
      preferredEndTime: params.endTime,
      reason: params.reason || 'Requested via WhatsApp Bot',
    });
  },
};
