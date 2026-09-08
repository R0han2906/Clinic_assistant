'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useBookingRequests } from '../hooks/useBookingRequests';
import { BookingRequestPanel } from './BookingRequestPanel';

interface BookingRequestBadgeProps {
  onOpenSimulator?: () => void;
}

export function BookingRequestBadge({ onOpenSimulator }: BookingRequestBadgeProps) {
  const { pendingCount } = useBookingRequests();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="relative flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 transition active:scale-95 cursor-pointer dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        title="View inbound WhatsApp booking requests"
        aria-label="WhatsApp Booking Requests"
      >
        <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">WhatsApp</span>

        {pendingCount > 0 && (
          <span className="relative flex items-center justify-center">
            <span className="absolute -inset-0.5 rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-extrabold text-white">
              {pendingCount}
            </span>
          </span>
        )}
      </button>

      {/* Review Drawer Panel */}
      <BookingRequestPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenSimulator={onOpenSimulator}
      />
    </>
  );
}
