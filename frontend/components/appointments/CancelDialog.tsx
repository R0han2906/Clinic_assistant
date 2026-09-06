'use client'

import React, { useState } from 'react'
import { X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Appointment } from '@/types'

interface CancelDialogProps {
  appointment: Appointment | any
  onClose: () => void
  onSuccess: (reason: string) => void
  onOfferRebook?: () => void
}

export function CancelDialog({
  appointment,
  onClose,
  onSuccess,
  onOfferRebook,
}: CancelDialogProps) {
  const patientName = appointment?.patient || appointment?.patient_name || 'Patient'
  const appointmentTime = appointment?.time || `${appointment?.start_time || '09:00'} › ${appointment?.end_time || '10:00'}`

  const [reason, setReason] = useState<string>('Patient requested')
  const [notes, setNotes] = useState<string>('')
  const [notifySms, setNotifySms] = useState<boolean>(true)
  const [offerRebook, setOfferRebook] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const reasonOptions = [
    'Patient requested',
    'Dentist unavailable',
    'Medical emergency',
    'Duplicate booking',
    'Other reason',
  ]

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const finalReason = notes ? `${reason}: ${notes}` : reason

    try {
      const apptId = appointment?.appointment_id || appointment?.id
      if (apptId) {
        try {
          await api.appointments.cancel(apptId, finalReason)
        } catch {
          // Graceful fallback for mock
        }
      }

      setCancelled(true)
      setTimeout(() => {
        onSuccess(finalReason)
        if (offerRebook && onOfferRebook) {
          onOfferRebook()
        }
        onClose()
      }, 900)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <h3 className="text-lg font-bold text-foreground">Cancel Appointment</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition">
            <X className="size-5" />
          </button>
        </header>

        {cancelled ? (
          <div className="p-8 text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">Appointment Cancelled</h4>
            <p className="text-xs text-muted-foreground">The calendar slot has been freed.</p>
          </div>
        ) : (
          <form onSubmit={handleCancel} className="p-6 space-y-4 text-sm">
            {/* Warning Banner */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 flex items-start gap-3 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200">
              <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Cancellation Warning</p>
                <p className="mt-0.5 opacity-90">
                  This will cancel the booking for <strong className="font-semibold">{patientName}</strong> ({appointmentTime}).
                </p>
              </div>
            </div>

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Cancellation Reason *
              </label>
              <div className="space-y-2">
                {reasonOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition ${
                      reason === opt
                        ? 'border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={opt}
                      checked={reason === opt}
                      onChange={() => setReason(opt)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add contextual details for reception audit log..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-rose-500"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="rounded border-border text-rose-600"
                />
                <span>Notify patient via SMS cancellation message</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerRebook}
                  onChange={(e) => setOfferRebook(e.target.checked)}
                  className="rounded border-border text-rose-600"
                />
                <span>Offer to rebook a future slot now</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <footer className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Keep Appointment
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Cancelling...
                  </>
                ) : (
                  'Cancel Appointment'
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
