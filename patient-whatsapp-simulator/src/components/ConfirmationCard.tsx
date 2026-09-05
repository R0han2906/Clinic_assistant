import React from 'react';
import type { AppointmentRequest } from '../types';
import { CheckCircle2, Copy, RotateCcw, AlertTriangle, Database, User } from 'lucide-react';

interface ConfirmationCardProps {
  request: AppointmentRequest;
  onNewRequest: () => void;
  isBackendOnline?: boolean;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  request,
  onNewRequest,
  isBackendOnline = false,
}) => {
  const [copiedApt, setCopiedApt] = React.useState(false);
  const [copiedPat, setCopiedPat] = React.useState(false);

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

  return (
    <div className="confirmation-card">
      <div className="confirmation-badge-header">
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
      </div>

      {/* Request Reference ID */}
      <div className="ref-code-box">
        <span className="ref-label">
          {isRealBackendReq && !isMock ? 'Request Reference ID (REQ):' : 'Simulated Reference Code:'}
        </span>
        <div className="ref-code-value">
          <code>{request.referenceCode}</code>
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

      <div className="confirmation-actions">
        <button onClick={onNewRequest} className="btn-new-request">
          <RotateCcw size={16} /> Test Another Request
        </button>
      </div>
    </div>
  );
};
