'use client';

import React from 'react';
import { X, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BookingRequestCard } from './BookingRequestCard';
import { useBookingRequests } from '../hooks/useBookingRequests';

interface BookingRequestPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
}

export function BookingRequestPanel({
  open,
  onClose,
  onOpenSimulator,
}: BookingRequestPanelProps) {
  const { requests, loading, refetch, handleApprove, handleReject } = useBookingRequests();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md border-l border-border bg-card shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-5 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Inbound WhatsApp Requests</h3>
                <p className="text-xs text-muted-foreground">
                  {requests.length} pending patient booking {requests.length === 1 ? 'request' : 'requests'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Refresh requests"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Body: Request List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading && requests.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <RefreshCw className="size-6 animate-spin mx-auto text-emerald-600" />
                <p>Loading WhatsApp requests from clinic records…</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Queue is Clear</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  There are no pending remote WhatsApp booking requests at this moment.
                </p>
                {onOpenSimulator && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSimulator();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
                  >
                    <span>Open Patient Simulator</span> →
                  </button>
                )}
              </div>
            ) : (
              requests.map((item) => (
                <BookingRequestCard
                  key={item.id}
                  request={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>

          {/* Footer with Simulator Trigger */}
          <div className="border-t border-border p-4 bg-muted/10 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
              Approved bookings reflect immediately on calendar
            </span>
            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSimulator();
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                Test as Patient →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
