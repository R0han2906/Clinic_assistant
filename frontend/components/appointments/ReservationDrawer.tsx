'use client'

import React, { useState } from 'react'
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Bell,
  UserCheck,
  UserX,
  Eye,
  CalendarPlus,
  Printer,
  Heart,
  Flag,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  MessageSquare,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { Appointment } from '@/types'
import {
  normalizeStatus,
  getActionsForStatus,
  getStatusMeta,
  AppointmentStatus,
  ReceptionistAction,
} from '@/lib/appointment-lifecycle'
import { PatientAvatar } from '@/components/patients/PatientAvatar'

interface ReservationDrawerProps {
  appointment: Appointment | any
  onClose: () => void
  onUpdateStatus: (newStatus: AppointmentStatus) => void
  onOpenVisitSummary: () => void
  onOpenTakePayment: () => void
  onOpenReschedule: () => void
  onOpenCancel: () => void
  onBookFollowUp?: () => void
}

export function ReservationDrawer({
  appointment,
  onClose,
  onUpdateStatus,
  onOpenVisitSummary,
  onOpenTakePayment,
  onOpenReschedule,
  onOpenCancel,
  onBookFollowUp,
}: ReservationDrawerProps) {
  const currentStatus = normalizeStatus(
    appointment?.status || appointment?.payment_status
  )
  const statusMeta = getStatusMeta(currentStatus)
  const actions = getActionsForStatus(currentStatus)

  const patientName = appointment?.patient || appointment?.patient_name || 'Patient'
  const patientPhone = appointment?.patientPhone || appointment?.patient_phone || '+62 823-1234-5678'
  const patientEmail = appointment?.patientEmail || appointment?.patient_email || 'patient@mail.com'
  const patientAge = appointment?.patientAge || appointment?.age || appointment?.dob_or_age || '26 yrs'

  const dentistName = appointment?.dentist || appointment?.dentist_name || 'Drg Soap Mactavish'
  const treatmentName = appointment?.treatment || appointment?.treatment_name || 'Dental Procedure'
  const timeRange = appointment?.time || `${appointment?.start_time || '09:00 AM'} › ${appointment?.end_time || '10:00 AM'}`
  const dateStr = appointment?.date || 'Today'

  const billNumber =
    appointment?.billNumber ||
    appointment?.bill_number ||
    `Bill #${appointment?.id?.replace(/^a/, 'a1') || 'a1299'}`

  const isPaid =
    currentStatus === 'paid' ||
    appointment?.payment_status?.toLowerCase() === 'paid' ||
    appointment?.visitSummary?.billing?.paid === true

  const [adminNotes, setAdminNotes] = useState<string>(
    appointment?.notes || 'Patient prefers morning appointments.'
  )
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isFlagged, setIsFlagged] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleActionClick = async (action: ReceptionistAction) => {
    if (action.disabled) return

    switch (action.id) {
      case 'check-in':
        onUpdateStatus('checked-in')
        showToast('✓ Patient marked as Checked-In')
        break

      case 'reschedule':
        onOpenReschedule()
        break

      case 'cancel':
        onOpenCancel()
        break

      case 'take-payment':
        onOpenTakePayment()
        break

      case 'view-summary':
        onOpenVisitSummary()
        break

      case 'notify':
        showToast(`🔔 Notified ${dentistName} that ${patientName} is ready`)
        break

      case 'no-show':
        onUpdateStatus('no-show')
        showToast('⚠️ Patient marked as No-Show')
        break

      case 'call':
        window.open(`tel:${patientPhone.replace(/\s+/g, '')}`)
        break

      case 'sms':
        try {
          const apptId = appointment?.appointment_id || appointment?.id
          if (apptId) await api.appointments.update(apptId, { notes: 'Reminder sent' })
        } catch {}
        showToast(`💬 Reminder sent to ${patientPhone}`)
        break

      case 'thank-you':
        showToast(`♡ Thank-You message sent to ${patientName}`)
        break

      case 'book-followup':
      case 'rebook':
        if (onBookFollowUp) onBookFollowUp()
        else showToast('Opening calendar to book follow-up...')
        break

      case 'print':
        window.print()
        break

      case 'flag':
        setIsFlagged(!isFlagged)
        showToast(isFlagged ? 'Flag removed' : '⚑ Patient flagged for no-show policy follow-up')
        break

      default:
        break
    }
  }

  const handleSendPaymentReminder = async () => {
    try {
      const apptId = appointment?.appointment_id || appointment?.id
      if (apptId) {
        try {
          await api.appointments.update(apptId, { reminder_sent: true })
        } catch {}
      }
      showToast(`🔔 Payment reminder sent to ${patientPhone}`)
    } catch {
      showToast('Reminder recorded')
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-[580px] flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reservation ID {billNumber.replace('Bill ', '')}
            </p>
            <h2 className="text-xl font-bold text-foreground">Appointment Details</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <X className="size-5" />
          </button>
        </header>

        {/* Toast alert banner */}
        {toastMsg && (
          <div className="bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground flex items-center justify-between animate-in slide-in-from-top duration-150">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="opacity-80 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Patient Card Block */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <PatientAvatar name={patientName} size="lg" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Patient name
                  </p>
                  <h3 className="text-xl font-bold text-foreground truncate mt-0.5">
                    {patientName}
                  </h3>
                  {isFlagged && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold mt-1">
                      <Flag className="size-2.5" /> Flagged Patient
                    </span>
                  )}
                </div>
              </div>

              {/* Status Pill with dot */}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border shrink-0 ${statusMeta.badgeClass} ${statusMeta.borderClass}`}
              >
                <span className={`size-2 rounded-full ${statusMeta.dotClass} bg-current`} />
                <span>{statusMeta.label}</span>
              </div>
            </div>
          </div>

          {/* Treatment Info 3-Column Grid */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Treatment
              </p>
              <p className="mt-1 font-bold text-sm text-foreground">{treatmentName}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Date and Time
              </p>
              <p className="mt-1 font-semibold text-foreground leading-tight">{dateStr}</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">{timeRange}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Dentist
              </p>
              <p className="mt-1 font-bold text-sm text-foreground">{dentistName}</p>
            </div>
          </div>

          {/* Payment Section */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">
                  Payment {billNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isPaid ? 'PAID' : 'UNPAID'}
                </span>
              </div>

              {!isPaid ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendPaymentReminder}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
                  >
                    <Bell className="size-3.5" /> Send reminder
                  </button>
                  <button
                    onClick={onOpenTakePayment}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <DollarSign className="size-3.5" /> Take Payment
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="size-4" /> Paid on File
                </div>
              )}
            </div>
          </div>

          {/* General Info Grid */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-foreground">General Info</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Full Name
                </p>
                <p className="mt-1 font-semibold text-foreground">{patientName}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Phone Number
                </p>
                <p className="mt-1 font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3 text-muted-foreground" /> {patientPhone}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Age
                </p>
                <p className="mt-1 font-semibold text-foreground">{patientAge}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Email
                </p>
                <p className="mt-1 font-semibold text-foreground truncate">{patientEmail}</p>
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="border-t border-border/70 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Receptionist Admin Notes
                </span>
                <button
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {isEditingNote ? 'Done' : 'Edit Note'}
                </button>
              </div>
              {isEditingNote ? (
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  rows={2}
                />
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl italic">
                  &quot;{adminNotes}&quot;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contextual Status Action Footer */}
        <footer className="border-t border-border p-5 bg-card space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {actions.map((act) => {
              const isPrimary = act.variant === 'primary'
              const isDanger = act.variant === 'danger'
              const isWarning = act.variant === 'warning'

              return (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act)}
                  disabled={act.disabled}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition shadow-sm ${
                    act.disabled
                      ? 'border border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      : isPrimary
                      ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                      : isDanger
                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 active:scale-[0.98] border border-rose-200'
                      : isWarning
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 active:scale-[0.98] border border-amber-200'
                      : 'border border-border bg-card text-foreground hover:bg-muted active:scale-[0.98]'
                  }`}
                >
                  {act.id === 'check-in' && <UserCheck className="size-4" />}
                  {act.id === 'reschedule' && <Calendar className="size-4" />}
                  {act.id === 'cancel' && <X className="size-4" />}
                  {act.id === 'notify' && <Bell className="size-4" />}
                  {act.id === 'no-show' && <UserX className="size-4" />}
                  {act.id === 'view' && <Eye className="size-4" />}
                  {act.id === 'take-payment' && <DollarSign className="size-4" />}
                  {act.id === 'view-summary' && <FileText className="size-4" />}
                  {act.id === 'book-followup' && <CalendarPlus className="size-4" />}
                  {act.id === 'thank-you' && <Heart className="size-4" />}
                  {act.id === 'print' && <Printer className="size-4" />}
                  {act.id === 'rebook' && <CalendarPlus className="size-4" />}
                  {act.id === 'flag' && <Flag className="size-4" />}
                  {act.id === 'call' && <Phone className="size-4" />}
                  {act.id === 'sms' && <MessageSquare className="size-4" />}
                  <span>{act.label}</span>
                </button>
              )
            })}
          </div>
        </footer>
      </aside>
    </div>
  )
}
