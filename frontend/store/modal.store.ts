'use client'

import { create } from 'zustand'

interface ModalState {
  isOpen: boolean
  step: 0 | 1 | 2 | 3
  appointmentId: string | null
  open: (appointmentId?: string) => void
  close: () => void
  setStep: (step: 0 | 1 | 2 | 3) => void
  nextStep: () => void
  prevStep: () => void
}

export const useModalStore = create<ModalState>()((set) => ({
  isOpen: false,
  step: 0,
  appointmentId: null,
  open: (appointmentId) =>
    set({ isOpen: true, step: 0, appointmentId: appointmentId ?? null }),
  close: () => set({ isOpen: false, appointmentId: null }),
  setStep: (step) => set({ step }),
  nextStep: () =>
    set((s) => ({ step: Math.min(3, s.step + 1) as 0 | 1 | 2 | 3 })),
  prevStep: () =>
    set((s) => ({ step: Math.max(0, s.step - 1) as 0 | 1 | 2 | 3 })),
}))
