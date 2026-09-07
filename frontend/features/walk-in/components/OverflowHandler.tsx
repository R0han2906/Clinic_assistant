'use client'

import React from 'react'
import { AlertCircle, Calendar, Clock, UserCheck, X } from 'lucide-react'

interface OverflowHandlerProps {
  isOpen: boolean
  onClose: () => void
  onBookLaterToday: () => void
  onBookTomorrow: () => void
  onAddToStandby: () => void
}

export function OverflowHandler({
  isOpen,
  onClose,
  onBookLaterToday,
  onBookTomorrow,
  onAddToStandby,
}: OverflowHandlerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Clinic Operatories Fully Booked</h3>
              <p className="text-xs text-muted-foreground">No immediate slots free for the next 2+ hours</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-foreground/80 leading-relaxed">
          All attending dentists are currently in operatory appointments or have full queues. What would you like to suggest to the walk-in patient?
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onAddToStandby}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-left text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>Add to Standby Queue (Priority if Cancellation)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onBookLaterToday}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-left text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-emerald-600" />
              <span>Book Guaranteed Evening Slot Later Today</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onBookTomorrow}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-left text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-blue-600" />
              <span>Schedule Advance Booking for Tomorrow</span>
            </div>
          </button>
        </div>

        <div className="pt-2 border-t border-border/60 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted transition"
          >
            Close / Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
