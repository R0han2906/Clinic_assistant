import { create } from 'zustand';
import { AppointmentResponse, AppointmentCreate, AppointmentReschedule } from '@/types/api';
import { api } from '@/lib/api-client';

interface AppointmentsState {
  appointments: AppointmentResponse[];
  selectedDate: string;
  loading: boolean;
  error: string | null;

  setSelectedDate: (date: string) => void;
  fetchForDate: (date?: string) => Promise<void>;
  createAppointment: (data: AppointmentCreate) => Promise<AppointmentResponse>;
  rescheduleAppointment: (id: string, data: AppointmentReschedule) => Promise<AppointmentResponse>;
  cancelAppointment: (id: string, reason?: string) => Promise<AppointmentResponse>;
  updatePayment: (id: string, payment_status: string, bill_number?: string) => Promise<AppointmentResponse>;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  selectedDate: new Date().toISOString().split('T')[0],
  loading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().fetchForDate(date);
  },

  fetchForDate: async (date?: string) => {
    const targetDate = date || get().selectedDate;
    set({ loading: true, error: null });
    try {
      const data = await api.appointments.list({ date: targetDate });
      set({ appointments: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load appointments', loading: false });
    }
  },

  createAppointment: async (data: AppointmentCreate) => {
    set({ loading: true, error: null });
    try {
      const created = await api.appointments.create(data);
      set((state) => ({
        appointments: [...state.appointments, created],
        loading: false
      }));
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create appointment', loading: false });
      throw err;
    }
  },

  rescheduleAppointment: async (id: string, data: AppointmentReschedule) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.appointments.reschedule(id, data);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.appointment_id === id ? updated : a)),
        loading: false
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to reschedule appointment', loading: false });
      throw err;
    }
  },

  cancelAppointment: async (id: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      const cancelled = await api.appointments.cancel(id, reason);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.appointment_id === id ? cancelled : a)),
        loading: false
      }));
      return cancelled;
    } catch (err: any) {
      set({ error: err.message || 'Failed to cancel appointment', loading: false });
      throw err;
    }
  },

  updatePayment: async (id: string, payment_status: string, bill_number?: string) => {
    try {
      const updated = await api.appointments.updatePayment(id, payment_status, bill_number);
      set((state) => ({
        appointments: state.appointments.map((a) => (a.appointment_id === id ? updated : a))
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update payment' });
      throw err;
    }
  }
}));
