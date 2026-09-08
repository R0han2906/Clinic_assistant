import React, { useState } from 'react';
import type { AppointmentRequest } from '../types';
import { CheckCircle2, Copy, RotateCcw, AlertTriangle, Database, User, XCircle } from 'lucide-react';

interface ConfirmationCardProps {
  request: AppointmentRequest;
  onNewRequest: () => void;
  onCancelRequest?: (refCode: string) => Promise<void>;
  isBackendOnline?: boolean;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  request,
  onNewRequest,
  onCancelRequest,
  isBackendOnline = false,
}) => {
  const [copiedApt, setCopiedApt] = useState(false);
  const [copiedPat, setCopiedPat] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const isRealBackendReq = request.referenceCode.startsWith('REQ-') || request.referenceCode.startsWith('APT-');
  const isMock = request.referenceCode.includes('DEMO');

  const handleCopyApt = () => {
    navigator.clipboard.writeText(request.referenceCode);
    setCopiedApt(true);
    setTimeout(() => setCopiedApt(false), 2000);
  };

  const handleCopyPat = () => {
    if (request.patientId) {
      navigator.clipboard.writeText(request.patientId);
      setCopiedPat(true);
      setTimeout(() => setCopiedPat(false), 2000);
    }
  };

  const handleConfirmCancel = async () => {
    if (!onCancelRequest) return;
    setIsCancelling(true);
    try {
      await onCancelRequest(request.referenceCode);
      setIsCancelled(true);
      setShowCancelPrompt(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={`confirmation-card ${isCancelled ? 'card-cancelled' : ''}`}>
      <div className="confirmation-badge-header">
        {isCancelled ? (
          <>
            <XCircle size={36} className="text-red-500" style={{ color: '#ef4444' }} />
            <h2 className="confirmation-title" style={{ color: '#ef4444' }}>
              Booking Request Cancelled
            </h2>
            <p className="confirmation-subtitle">
              Your appointment request <code>{request.referenceCode}</code> has been cancelled.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 size={36} className="success-icon" />
            <h2 className="confirmation-title">
              {isRealBackendReq && !isMock
                ? 'Patient Request Recorded in Clinic System!'
                : 'Demo Request Recorded (Simulated)!'}
            </h2>
            <p className="confirmation-subtitle">
              {isRealBackendReq && !isMock
                ? 'Your booking request is logged for front-desk staff review.'
                : 'Your simulated booking request has been generated.'}
            </p>
          </>
        )}
      </div>

      {/* Request Reference ID */}
      <div className="ref-code-box">
        <span className="ref-label">
          {isRealBackendReq && !isMock ? 'Request Reference ID (REQ):' : 'Simulated Reference Code:'}
        </span>
        <div className="ref-code-value">
          <code style={isCancelled ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{request.referenceCode}</code>
          <button onClick={handleCopyApt} className="copy-code-btn" title="Copy reference ID">
            <Copy size={14} />
            {copiedApt ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Patient ID — highlighted so user knows to use this for lookup */}
      {request.patientId && (
        <div className="ref-code-box patient-id-box">
          <span className="ref-label">
            <User size={13} style={{ display: 'inline', marginRight: 4 }} />
            Your Patient ID (PAT):
          </span>
          <div className="ref-code-value">
            <code className="patient-id-code">{request.patientId}</code>
            <button onClick={handleCopyPat} className="copy-code-btn" title="Copy Patient ID">
              <Copy size={14} />
              {copiedPat ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="pat-hint">
            Use your <strong>Request ID (REQ)</strong>, <strong>Patient ID (PAT)</strong>, or <strong>phone number</strong> to look up your status in the simulator.
          </p>
        </div>
      )}

      <div className="confirmation-summary-box">
        <div className="summary-row">
          <span className="row-label">Patient:</span>
          <span className="row-val">{request.patient.fullName} ({request.patient.phone})</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Preferred Dentist:</span>
          <span className="row-val">{request.dentist.name}</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Preferred Date:</span>
          <span className="row-val">{request.date}</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Requested Slot:</span>
          <span className="row-val">{request.timeSlot.startTime} – {request.timeSlot.endTime}</span>
        </div>
        {request.patient.reason && (
          <div className="summary-row">
            <span className="row-label">Visit Reason:</span>
            <span className="row-val">{request.patient.reason}</span>
          </div>
        )}
      </div>

      {/* Simulation Boundary Disclaimer */}
      {!isCancelled && (
        <div className="disclaimer-callout">
          {isBackendOnline ? <Database size={16} className="disclaimer-icon" /> : <AlertTriangle size={16} className="disclaimer-icon" />}
          <p className="disclaimer-text">
            {isBackendOnline ? (
              <>
                <strong>Live DB Sync:</strong> Request <code>{request.referenceCode}</code> has been submitted to the clinic backend (<code>clinic_data.xlsx</code>). Reception staff will see it on their web dashboard for review.
              </>
            ) : (
              <>
                <strong>Simulation Boundary Note:</strong> In the full system, clinic staff review incoming patient WhatsApp requests on their staff website dashboard and confirm availability.
              </>
            )}
          </p>
        </div>
      )}

      {/* Cancel Prompt Confirm Box */}
      {showCancelPrompt && !isCancelled && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 8,
          padding: 12,
          marginTop: 12,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 500, color: '#b91c1c' }}>
            Are you sure you want to cancel this booking request?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => setShowCancelPrompt(false)}
              className="choice-btn secondary"
              style={{ padding: '6px 14px', fontSize: 12 }}
              disabled={isCancelling}
            >
              Keep Request
            </button>
            <button
              onClick={handleConfirmCancel}
              className="choice-btn primary"
              style={{
                background: '#dc2626',
                borderColor: '#dc2626',
                color: '#fff',
                padding: '6px 14px',
                fontSize: 12
              }}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
            </button>
          </div>
        </div>
      )}

      <div className="confirmation-actions" style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={onNewRequest} className="btn-new-request" style={{ flex: 1 }}>
          <RotateCcw size={16} /> {isCancelled ? 'Book Another Appointment' : 'Test Another Request'}
        </button>

        {!isCancelled && onCancelRequest && !showCancelPrompt && (
          <button
            onClick={() => setShowCancelPrompt(true)}
            className="choice-btn secondary"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              borderColor: '#fca5a5',
              color: '#dc2626',
              background: '#fff'
            }}
          >
            <XCircle size={15} style={{ marginRight: 4, verticalAlign: -2 }} /> Cancel Request
          </button>
        )}
      </div>
    </div>
  );
};
