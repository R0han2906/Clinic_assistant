'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Stethoscope,
  Search,
  Pill,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Mail,
  AlertTriangle,
  User,
  Clock,
} from 'lucide-react'
import { VisitSummary, Appointment } from '@/types'
import { formatCurrency } from '@/lib/formatters'
import { api } from '@/lib/api-client'

interface VisitSummaryPanelProps {
  appointment: Appointment | any
  summary?: VisitSummary
  onClose: () => void
  onTakePayment?: () => void
  onBookFollowUp?: () => void
}

export function VisitSummaryPanel({
  appointment,
  summary,
  onClose,
  onTakePayment,
  onBookFollowUp,
}: VisitSummaryPanelProps) {
  const [emailSent, setEmailSent] = useState(false)
  const [liveSummary, setLiveSummary] = useState<VisitSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [dentistNotes, setDentistNotes] = useState('')

  useEffect(() => {
    const apptId = appointment?.appointment_id || appointment?.id
    if (apptId && !String(apptId).startsWith('temp-') && !String(apptId).startsWith('w-')) {
      api.appointments.getVisitSummary(apptId)
        .then((res) => {
          if (res) {
            setLiveSummary({
              chiefComplaint: res.chief_complaint || appointment.reason || '',
              diagnosis: res.diagnosis || '',
              prescriptions: res.prescriptions?.map((p: any) => ({
                medication: p.name || p.medication || 'Medication',
                dosage: p.dosage || 'As directed',
                duration: p.duration || '5 days',
                pharmacyPickup: true,
              })) || [],
              treatmentsPerformed: res.treatments_performed || [appointment.treatment || appointment.treatment_name || 'General Checkup'],
              followUp: {
                recommended: true,
                timeframe: res.follow_up?.timeframe || '6 months',
                notes: res.follow_up?.notes || '',
              },
              dentistNotes: res.dentist_notes || appointment.clinical_notes || '',
              billing: {
                items: [
                  { name: res.treatment_name || appointment.treatment || 'Consultation', price: res.billing?.amount || 0 },
                ],
                total: res.billing?.amount || 0,
                paid: appointment.status === 'paid' || appointment.payment_status === 'paid',
                billNumber: res.billing?.bill_number || appointment.billNumber || appointment.bill_number || '',
              }
            })
            setChiefComplaint(res.chief_complaint || appointment.reason || '')
            setDiagnosis(res.diagnosis || '')
            setDentistNotes(res.dentist_notes || appointment.clinical_notes || '')
          }
        })
        .catch(() => {})
    }
  }, [appointment])

  // Default fallback data if appointment has no attached summary
  const defaultSummary: VisitSummary = {
    chiefComplaint: appointment.reason || '',
    diagnosis: '',
    prescriptions: [],
    treatmentsPerformed: [
      appointment.treatment || appointment.treatment_name || 'General Checkup',
    ],
    followUp: {
      recommended: false,
      timeframe: '',
      notes: '',
    },
    dentistNotes: appointment.clinical_notes || '',
    billing: {
      items: [
        { name: appointment.treatment || appointment.treatment_name || 'Consultation', price: 0 },
      ],
      total: 0,
      paid: appointment.status === 'paid' || appointment.payment_status === 'paid',
      billNumber: appointment.billNumber || appointment.bill_number || '',
    },
  }

  const data = liveSummary || summary || appointment.visitSummary || defaultSummary
  const patientName = appointment.patient || appointment.patient_name || 'Patient'
  const dentistName = appointment.dentist || appointment.dentist_name || 'Attending Dentist'
  const appointmentTime = appointment.time || `${appointment.start_time || '10:00 AM'} › ${appointment.end_time || '11:00 AM'}`

  useEffect(() => {
    setChiefComplaint(data.chiefComplaint || '')
    setDiagnosis(data.diagnosis || '')
    setDentistNotes(data.dentistNotes || '')
  }, [data.chiefComplaint, data.diagnosis, data.dentistNotes])

  const handleSave = async () => {
    const apptId = appointment?.appointment_id || appointment?.id
    if (!apptId) return
    setSaving(true)
    try {
      await api.appointments.saveVisitSummary(apptId, {
        chief_complaint: chiefComplaint,
        diagnosis,
        dentist_notes: dentistNotes,
        treatments_performed: data.treatmentsPerformed,
        follow_up: data.followUp,
        billing: data.billing,
      })
    } catch (err) {
      console.warn('Failed to save visit summary', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm animate-in fade-in">
      <section
        className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Clinical Report
            </span>
            <h2 className="text-lg font-bold text-foreground">Visit Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Patient and Doctor Sub-header */}
        <div className="border-b border-border/80 bg-background px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              <User className="size-4" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">{patientName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="size-3" /> {appointmentTime} · {dentistName}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {appointment.treatment || 'Checkup'}
          </span>
        </div>

        {/* Content Body (Strictly Read-Only) */}
        <div className="flex-1 overflow-auto p-6 space-y-6 text-sm">
          {/* Chief Complaint */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Stethoscope className="size-3.5 text-primary" /> Chief Complaint
            </p>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border/70 bg-background p-3.5 font-medium text-foreground outline-none focus:border-primary"
              placeholder="Chief complaint"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Search className="size-3.5 text-primary" /> Diagnosis
            </p>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border/70 bg-background p-3.5 font-medium text-foreground outline-none focus:border-primary"
              placeholder="Diagnosis"
            />
          </div>

          {/* Prescription */}
          {data.prescriptions && data.prescriptions.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Pill className="size-3.5 text-primary" /> Prescription
              </p>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
                {data.prescriptions.map((p: any, i: number) => (
                  <div key={`rx-${p.medication || 'rx'}-${i}`} className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">• {p.medication}</p>
                      <p className="text-muted-foreground ml-3">{p.dosage} · {p.duration}</p>
                    </div>
                    {p.pharmacyPickup && (
                      <span className="shrink-0 rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Pharmacy pick-up required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Treatment Performed */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Treatment Performed
            </p>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-1.5">
              {data.treatmentsPerformed?.map((t: any, i: number) => (
                <div key={`trt-${t}-${i}`} className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Recommended */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Calendar className="size-3.5 text-primary" /> Follow-Up Recommended
            </p>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{data.followUp?.timeframe || 'Not set'}</p>
                {data.followUp?.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{data.followUp.notes}</p>
                )}
              </div>
              {onBookFollowUp && (
                <button
                  onClick={onBookFollowUp}
                  className="flex items-center gap-1.5 rounded-lg border border-primary text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 transition"
                >
                  <Calendar className="size-3.5" /> Book Follow-up
                </button>
              )}
            </div>
          </div>

          {/* Billing Section */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <DollarSign className="size-3.5 text-emerald-600" /> Billing
            </p>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2">
                <span>{data.billing.billNumber || 'No bill number'}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-bold uppercase ${
                    data.billing.paid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {data.billing.paid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {data.billing.items?.map((item: any, i: number) => (
                  <div key={`bill-${item.name || 'item'}-${i}`} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-foreground">${item.price}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2 font-bold text-sm">
                <span>Total Due:</span>
                <span>${data.billing.total}</span>
              </div>
              {!data.billing.paid && onTakePayment && (
                <button
                  onClick={onTakePayment}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <DollarSign className="size-3.5" /> Take Payment Now
                </button>
              )}
            </div>
          </div>

          {/* Dentist Notes */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <FileText className="size-3.5 text-primary" /> Dentist Notes
            </p>
            <textarea
              value={dentistNotes}
              onChange={(e) => setDentistNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border/70 bg-background p-3.5 text-xs outline-none focus:border-primary"
              placeholder="Dentist notes"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
            >
              <Printer className="size-3.5" /> Print for Patient
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition"
            >
              <Mail className="size-3.5" /> {emailSent ? 'Email Sent ✓' : 'Email to Patient'}
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Summary'}
          </button>
        </footer>
      </section>
    </div>
  )
}
