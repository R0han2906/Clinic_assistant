'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Users, DollarSign,
  Plus, Clock,
  Bell, UserCheck, Stethoscope, ChevronRight, Check, X
} from 'lucide-react'
import { api } from '@/lib/api-client'
import {
  DentistResponse,
  SaleSummary,
  PatientRequestResponse
} from '@/types/api'
import dynamic from 'next/dynamic'
import { WaitingPatient } from '@/types'
import {
  normalizeStatus,
  getStatusMeta
} from '@/lib/appointment-lifecycle'
import { PatientAvatar } from '@/components/patients/PatientAvatar'
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions'

const WalkInSheet = dynamic(
  () =>
    import('@/components/appointments/WalkInSheet').then(
      (m) => m.WalkInSheet
    ),
  { ssr: false }
)

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [dentists, setDentists] = useState<DentistResponse[]>([])
  const [salesSummary, setSalesSummary] = useState<SaleSummary | null>(null)
  const [requests, setRequests] = useState<PatientRequestResponse[]>([])
  const [waitingList, setWaitingList] = useState<WaitingPatient[]>([])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const loadDashboardData = async () => {
    try {
      const [appts, dents, summary, reqs] = await Promise.all([
        api.appointments.list({ date: todayStr }),
        api.dentists.list(),
        api.sales.summary(),
        api.patientRequests.list()
      ])

      const seenIds = new Set<string>()
      const uniqueAppts = (appts || []).filter((a: any) => {
        const id = a.id || a.appointment_id
        if (!id) return true
        if (seenIds.has(id)) return false
        seenIds.add(id)
        return true
      })

      setAppointments(uniqueAppts)

      if (dents && dents.length > 0) {
        setDentists(dents)
      }

      if (summary) {
        setSalesSummary(summary)
      }

      if (reqs) {
        setRequests(reqs)
      }

      // Populate waiting list from checked-in appointments
      const checkedIn = uniqueAppts
        .filter(
          (a: any) =>
            normalizeStatus(a.status) === 'checked-in'
        )
        .map((a: any, idx: number) => ({
          id:
            a.appointment_id ||
            a.id ||
            `wait-${idx}`,

          patientId:
            a.patient_id ||
            a.patientId ||
            `PAT-00000${idx + 1}`,

          patientName:
            a.patient_name ||
            a.patient ||
            'Patient',

          avatar:
            a.patient_avatar ||
            `https://i.pravatar.cc/150?img=${(idx + 1) * 7}`,

          checkedInAt:
            new Date(
              Date.now() -
                (idx + 1) * 12 * 60000
            ).toISOString(),

          // FIX:
          // These names must match the WaitingPatient
          // properties used below in the JSX.
          dentistName:
            a.dentist_name ||
            a.dentist ||
            'Assigned Dentist',

          treatment:
            a.treatment_name ||
            a.treatment ||
            'Checkup',

          status: 'waiting' as const,
        }))

      setWaitingList(checkedIn)
    } catch (err) {
      console.error(
        'Failed to load dashboard data from backend:',
        err
      )

      setAppointments([])
      setWaitingList([])
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [todayStr])

  // Up Next Card:
  // strictly filters checked-in and scheduled appointments
  const activeOrUpcoming = appointments.filter((a) => {
    const s = normalizeStatus(a.status)

    return (
      s === 'checked-in' ||
      s === 'scheduled'
    )
  })

  const nextAppt = activeOrUpcoming[0]

  const completedCount = appointments.filter((a) => {
    const status = normalizeStatus(a.status)

    return (
      status === 'completed' ||
      status === 'paid'
    )
  }).length

  const scheduledCount = appointments.filter(
    (a) =>
      normalizeStatus(a.status) === 'scheduled'
  ).length

  const handleCheckIn = async (apptId: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apptId ||
        a.appointment_id === apptId
          ? {
              ...a,
              status: 'checked-in'
            }
          : a
      )
    )

    showToast(
      '✓ Patient checked in and added to queue'
    )

    try {
      await api.appointments.updateStatus(
        apptId,
        'checked-in'
      )

      await loadDashboardData()
    } catch (err) {
      console.warn(
        'Could not persist check-in to backend:',
        err
      )
    }
  }

  const handleCallInWaiting = (
    waitId: string,
    patientName: string
  ) => {
    setWaitingList((prev) =>
      prev.filter((w) => w.id !== waitId)
    )

    showToast(
      `✓ ${patientName} called into treatment room`
    )
  }

  const handleReviewRequest = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      if (action === 'approve') {
        await api.patientRequests.approve(requestId)
        showToast('✓ Request approved and appointment created')
      } else {
        await api.patientRequests.reject(requestId)
        showToast('Request rejected')
      }
      await loadDashboardData()
    } catch (err: any) {
      showToast(err?.message || 'Could not update request')
    }
  }

  const pendingRequests = requests.filter((r) =>
    String(r.status || '').toLowerCase() === 'pending'
  )

  const getWaitTimeMinutes = (
    isoString: string
  ) => {
    const diffMs =
      Date.now() -
      new Date(isoString).getTime()

    return Math.max(
      1,
      Math.floor(diffMs / 60000)
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 rounded-xl bg-foreground text-background px-5 py-3 text-xs font-bold shadow-xl animate-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Clinic Overview 👋
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, <strong>Darrell Steward</strong>{' '}
            (Receptionist). You have{' '}
            <strong className="text-foreground">
              {appointments.length} appointments
            </strong>{' '}
            scheduled for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWalkInOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="size-4" />
            Walk-In Intake
          </button>

          <Link
            href="/reservations"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] shadow-sm"
          >
            <CalendarDays className="size-4" />
            Calendar View
          </Link>

          <Link
            href="/patients"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-muted active:scale-[0.98] transition"
          >
            <Users className="size-4" />
            Patients Directory
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Appointments */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Appointments Today
            </p>

            <CalendarDays className="size-5 text-primary" />
          </div>

          <p className="mt-3 text-3xl font-black">
            {appointments.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {completedCount} completed ·{' '}
            {scheduledCount} remaining
          </p>
        </div>

        {/* Waiting Room */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Waiting Room
            </p>

            <Clock className="size-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-black">
            {waitingList.length}
          </p>

          <p className="mt-1 text-xs text-amber-700 font-medium">
            Active in receptionist queue
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Revenue Collected
            </p>

            <DollarSign className="size-5 text-emerald-600" />
          </div>

          <p className="mt-3 text-3xl font-black">
            $
            {salesSummary?.total_paid !==
            undefined
              ? Number(
                  salesSummary.total_paid
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              : '0.00'}
          </p>

          <p className="mt-1 text-xs text-emerald-600 font-medium">
            $
            {salesSummary?.total_pending !==
            undefined
              ? Number(
                  salesSummary.total_pending
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              : '0.00'}{' '}
            pending payment
          </p>
        </div>

        {/* Practitioners */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Practitioners Active
            </p>

            <Stethoscope className="size-5 text-sky-600" />
          </div>

          <p className="mt-3 text-3xl font-black">
            {dentists.length || 3}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            All rooms staffed
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <DashboardQuickActions
        onAddWaitingPatient={(newPatient) => {
          setWaitingList((prev) => [
            newPatient,
            ...prev
          ])

          showToast(
            `✓ ${newPatient.patientName} added to waiting room queue`
          )
        }}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Up Next */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Reception Priority
                </span>

                <h3 className="text-lg font-bold text-foreground">
                  Up Next Patient
                </h3>
              </div>

              {nextAppt && (
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                  {nextAppt.time ||
                    `${nextAppt.start_time} - ${nextAppt.end_time}`}
                </span>
              )}
            </div>

            {nextAppt ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <PatientAvatar
                    name={
                      nextAppt.patient ||
                      nextAppt.patient_name
                    }
                    size="lg"
                  />

                  <div>
                    <h4 className="text-lg font-bold text-foreground">
                      {nextAppt.patient ||
                        nextAppt.patient_name}
                    </h4>

                    <p className="text-xs text-muted-foreground">
                      {nextAppt.treatment ||
                        nextAppt.treatment_name}{' '}
                      · With{' '}
                      {nextAppt.dentist ||
                        nextAppt.dentist_name}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="rounded-full bg-sky-50 text-sky-700 px-2.5 py-0.5 text-[11px] font-semibold border border-sky-200">
                        ●{' '}
                        {normalizeStatus(
                          nextAppt.status
                        ).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {normalizeStatus(
                    nextAppt.status
                  ) === 'checked-in' ? (
                    <>
                      <button
                        onClick={() =>
                          showToast(
                            `🔔 Attending dentist notified for ${
                              nextAppt.patient ||
                              nextAppt.patient_name
                            }`
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition shadow-sm"
                      >
                        <Bell className="size-4" />
                        Notify Dentist
                      </button>

                      <Link
                        href="/reservations"
                        className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted transition"
                      >
                        View Details
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          handleCheckIn(
                            nextAppt.id ||
                              nextAppt.appointment_id
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition shadow-sm"
                      >
                        <UserCheck className="size-4" />
                        Check In Patient
                      </button>

                      <Link
                        href="/reservations"
                        className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted transition"
                      >
                        Reschedule
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No upcoming appointments pending check-in.
              </div>
            )}
          </div>

          {/* Waiting Room */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Waiting Room Queue
                </h3>

                <p className="text-xs text-muted-foreground">
                  Patients currently waiting in the clinic lobby
                </p>
              </div>

              <span className="text-xs font-bold text-muted-foreground">
                {waitingList.length} in lobby
              </span>
            </div>

            {waitingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Lobby is currently clear. Use
                &quot;Walk-In Intake&quot; above to register
                new arrivals.
              </div>
            ) : (
              <div className="space-y-3">
                {waitingList.map((wait, idx) => {
                  const minutes =
                    getWaitTimeMinutes(
                      wait.checkedInAt
                    )

                  const isAmber =
                    minutes >= 10 &&
                    minutes < 20

                  const isRed =
                    minutes >= 20

                  return (
                    <div
                      key={`wait-${wait.id}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-background transition hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <PatientAvatar
                          name={wait.patientName}
                          size="md"
                        />

                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {wait.patientName}
                          </p>

                          <p className="text-[11px] text-muted-foreground">
                            {wait.treatment} ·{' '}
                            {wait.dentistName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 border ${
                            isRed
                              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : isAmber
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          <Clock className="size-3" />
                          {minutes} min wait
                        </span>

                        <button
                          onClick={() =>
                            handleCallInWaiting(
                              wait.id,
                              wait.patientName
                            )
                          }
                          className="rounded-xl border border-primary text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary/10 transition active:scale-[0.98]"
                        >
                          Call In
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Patient Requests</h3>
                <p className="text-xs text-muted-foreground">Pending booking requests awaiting approval</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {pendingRequests.length} pending
              </span>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No pending patient requests.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 6).map((req, idx) => (
                  <div
                    key={`req-${req.request_id || 'req'}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3.5"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{req.patient_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {req.preferred_date || 'No date'} · {req.preferred_start_time || '—'}
                        {req.reason ? ` · ${req.reason}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewRequest(req.request_id, 'approve')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                      >
                        <Check className="size-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewRequest(req.request_id, 'reject')}
                        className="flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                      >
                        <X className="size-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="text-base font-bold text-foreground">
              Today&apos;s Schedule
            </h3>

            <Link
              href="/reservations"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              All
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 max-h-[600px] overflow-auto pr-1">
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No appointments scheduled for today.
              </div>
            ) : (
              appointments
                .slice(0, 8)
                .map((appt, idx) => {
                  const status =
                    normalizeStatus(
                      appt.status
                    )

                  const statusMeta =
                    getStatusMeta(status)

                  const patientName =
                    appt.patient ||
                    appt.patient_name ||
                    'Patient'

                  return (
                    <div
                      key={`sched-${
                        appt.id ||
                        appt.appointment_id ||
                        'apt'
                      }-${idx}`}
                      className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-1 text-xs transition hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {patientName}
                        </span>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusMeta.badgeClass} ${statusMeta.borderClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-[11px]">
                        {appt.treatment ||
                          appt.treatment_name}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/50">
                        <span>
                          {appt.time ||
                            `${appt.start_time} - ${appt.end_time}`}
                        </span>

                        <span className="font-medium">
                          {appt.dentist ||
                            appt.dentist_name}
                        </span>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>

      {/* Walk-In Intake Sheet */}
      {walkInOpen && (
        <WalkInSheet
          onClose={() => setWalkInOpen(false)}
          onComplete={(newPatient) => {
            setWaitingList((prev) => [
              newPatient,
              ...prev
            ])

            showToast(
              `✓ Walk-in patient ${newPatient.patientName} added to waiting queue`
            )
          }}
        />
      )}
    </div>
  )
}
