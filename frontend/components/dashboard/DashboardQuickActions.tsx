'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  UserPlus,
  CalendarPlus,
  DollarSign,
  BarChart3,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { WaitingPatient } from '@/types'

const WalkInSheet = dynamic(
  () => import('@/components/appointments/WalkInSheet').then((m) => m.WalkInSheet),
  { ssr: false }
)

interface DashboardQuickActionsProps {
  onAddWaitingPatient: (patient: WaitingPatient) => void
  onOpenTakePayment?: () => void
}

export function DashboardQuickActions({
  onAddWaitingPatient,
  onOpenTakePayment,
}: DashboardQuickActionsProps) {
  const [walkInOpen, setWalkInOpen] = useState(false)

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Walk-In Intake */}
          <button
            onClick={() => setWalkInOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center transition hover:bg-primary/10 hover:border-primary active:scale-[0.98] group"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <UserPlus className="size-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Walk-In Intake</span>
            <span className="text-[10px] text-muted-foreground">Add to Queue</span>
          </button>

          {/* Book Appointment */}
          <Link
            href="/reservations"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:bg-muted active:scale-[0.98] group"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-sm group-hover:scale-105 transition-transform">
              <CalendarPlus className="size-5" />
            </div>
            <span className="text-xs font-bold text-foreground">New Appointment</span>
            <span className="text-[10px] text-muted-foreground">Open Calendar</span>
          </Link>

          {/* Take Payment */}
          <button
            onClick={() => {
              if (onOpenTakePayment) onOpenTakePayment()
              else window.location.href = '/sales'
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:bg-muted active:scale-[0.98] group"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm group-hover:scale-105 transition-transform">
              <DollarSign className="size-5" />
            </div>
            <span className="text-xs font-bold text-foreground">Take Payment</span>
            <span className="text-[10px] text-muted-foreground">Settle Bills</span>
          </button>

          {/* View Reports */}
          <Link
            href="/reports"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:bg-muted active:scale-[0.98] group"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-sm group-hover:scale-105 transition-transform">
              <BarChart3 className="size-5" />
            </div>
            <span className="text-xs font-bold text-foreground">View Reports</span>
            <span className="text-[10px] text-muted-foreground">Clinic Metrics</span>
          </Link>
        </div>
      </div>

      {walkInOpen && (
        <WalkInSheet
          onClose={() => setWalkInOpen(false)}
          onComplete={(newPatient) => {
            onAddWaitingPatient(newPatient)
          }}
        />
      )}
    </>
  )
}
