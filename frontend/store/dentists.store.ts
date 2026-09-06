import { create } from 'zustand';
import { DentistResponse } from '@/types/api';
import { api } from '@/lib/api-client';

interface DentistsState {
  dentists: DentistResponse[];
  loading: boolean;
  error: string | null;

  fetchDentists: () => Promise<void>;
}

export const useDentistsStore = create<DentistsState>((set) => ({
  dentists: [],
  loading: false,
  error: null,

  fetchDentists: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.dentists.list();
      set({ dentists: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load dentists', loading: false });
    }
  }
}));
