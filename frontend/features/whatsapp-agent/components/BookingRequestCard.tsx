'use client';

import React, { useState } from 'react';
import { User, Clock, Calendar, Check, X, MessageSquare, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { BookingRequestItem } from '../types';
import { formatTimeTo24 } from '@/lib/formatters';

interface BookingRequestCardProps {
  request: BookingRequestItem;
  onApprove: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
}

export function BookingRequestCard({
  request,
  onApprove,
  onReject,
}: BookingRequestCardProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApproveClick = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const res = await onApprove(request.id);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to approve request');
      setSubmitting(false);
    }
  };

  const handleRejectClick = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const res = await onReject(request.id, rejectReason || 'Slot unavailable');
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to reject request');
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition hover:shadow-md space-y-3">
      {/* Header with Patient Name, Phone & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <User className="size-4 text-emerald-600 dark:text-emerald-400" />
              {request.patientName}
            </h4>
            {request.isExistingPatient ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold dark:bg-emerald-950 dark:text-emerald-300">
                <UserCheck className="size-3" /> Existing Patient
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-bold dark:bg-sky-950 dark:text-sky-300">
                <User className="size-3" /> New Patient
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{request.patientPhone}</p>
        </div>

        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
          WhatsApp
        </span>
      </div>

      {/* Appointment Slot Details */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="size-3.5 text-foreground/70" />
          <span className="font-semibold text-foreground">{request.preferredDate}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5 text-foreground/70" />
          <span className="font-semibold text-foreground">
            {formatTimeTo24(request.preferredStartTime)} – {formatTimeTo24(request.preferredEndTime)}
          </span>
        </div>
        <div className="col-span-2 text-muted-foreground">
          Doctor: <span className="font-bold text-foreground">{request.dentistName || request.dentistId}</span>
        </div>
      </div>

      {/* Chat Snippet / Reason */}
      {request.reason && (
        <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5 text-xs text-foreground/90 flex items-start gap-2">
          <MessageSquare className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="italic">"{request.reason}"</p>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-center gap-1.5 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Reject Reason Input (Expandable) */}
      {showRejectInput && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Reason for Rejection / Modification:
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Doctor in surgery, please select 14:00"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-rose-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {showRejectInput ? (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowRejectInput(false)}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleRejectClick}
              className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
              Confirm Reject
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={handleRejectClick}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" /> Reject
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleApproveClick}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Approving…
                </>
              ) : (
                <>
                  <Check className="size-3.5 font-bold" /> Approve & Schedule
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
