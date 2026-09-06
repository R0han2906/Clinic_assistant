import { create } from 'zustand';
import { PatientResponse, PatientCreate, PatientUpdate } from '@/types/api';
import { api } from '@/lib/api-client';

interface PatientsState {
  patients: PatientResponse[];
  loading: boolean;
  error: string | null;
  searchQuery: string;

  fetchPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  createPatient: (data: PatientCreate) => Promise<PatientResponse>;
  updatePatient: (id: string, updates: PatientUpdate) => Promise<PatientResponse>;
  deletePatient: (id: string) => Promise<void>;
}

export const usePatientsStore = create<PatientsState>((set) => ({
  patients: [],
  loading: false,
  error: null,
  searchQuery: '',

  fetchPatients: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.patients.list();
      set({ patients: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load patients', loading: false });
    }
  },

  searchPatients: async (query: string) => {
    set({ searchQuery: query, loading: true, error: null });
    try {
      const data = query.trim() ? await api.patients.search(query) : await api.patients.list();
      set({ patients: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Search failed', loading: false });
    }
  },

  createPatient: async (data: PatientCreate) => {
    set({ loading: true, error: null });
    try {
      const created = await api.patients.create(data);
      set((state) => ({
        patients: [created, ...state.patients],
        loading: false
      }));
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create patient', loading: false });
      throw err;
    }
  },

  updatePatient: async (id: string, updates: PatientUpdate) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.patients.update(id, updates);
      set((state) => ({
        patients: state.patients.map((p) => (p.patient_id === id ? updated : p)),
        loading: false
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update patient', loading: false });
      throw err;
    }
  },

  deletePatient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.patients.delete(id);
      set((state) => ({
        patients: state.patients.filter((p) => p.patient_id !== id),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete patient', loading: false });
      throw err;
    }
  }
}));
