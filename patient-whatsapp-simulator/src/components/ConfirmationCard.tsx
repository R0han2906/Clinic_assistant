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

  const isRealBackendApt = request.referenceCode.startsWith('APT-');

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
          {isRealBackendApt ? 'Appointment Saved to Clinic DB!' : 'Demo Appointment Recorded!'}
        </h2>
        <p className="confirmation-subtitle">
          {isRealBackendApt
            ? 'Your booking is live in the clinic Excel database.'
            : 'Your simulated booking request has been logged.'}
        </p>
      </div>

      {/* Appointment ID */}
      <div className="ref-code-box">
        <span className="ref-label">
          {isRealBackendApt ? 'Appointment ID (APT):' : 'Simulated Reference Code:'}
        </span>
        <div className="ref-code-value">
          <code>{request.referenceCode}</code>
          <button onClick={handleCopyApt} className="copy-code-btn" title="Copy appointment ID">
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
            Your Patient ID (PAT) — use this to look up your record:
          </span>
          <div className="ref-code-value">
            <code className="patient-id-code">{request.patientId}</code>
            <button onClick={handleCopyPat} className="copy-code-btn" title="Copy Patient ID">
              <Copy size={14} />
              {copiedPat ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="pat-hint">
            Use your <strong>Patient ID</strong>, <strong>phone number</strong>, or your <strong>APT ID</strong> to look up your record next time you visit.
          </p>
        </div>
      )}

      <div className="confirmation-summary-box">
        <div className="summary-row">
          <span className="row-label">Patient:</span>
          <span className="row-val">{request.patient.fullName} ({request.patient.phone})</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Dentist:</span>
          <span className="row-val">{request.dentist.name}</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Date:</span>
          <span className="row-val">{request.date}</span>
        </div>
        <div className="summary-row">
          <span className="row-label">Time Window:</span>
          <span className="row-val">{request.timeSlot.startTime} – {request.timeSlot.endTime}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-callout">
        {isBackendOnline ? <Database size={16} className="disclaimer-icon" /> : <AlertTriangle size={16} className="disclaimer-icon" />}
        <p className="disclaimer-text">
          {isBackendOnline ? (
            <>
              <strong>Live DB Sync:</strong> This appointment (<code>{request.referenceCode}</code>) is saved in <code>clinic_data.xlsx</code>. Staff will see it immediately on the dashboard.
            </>
          ) : (
            <>
              <strong>Prototype Note:</strong> In production, this would sync to the Clinic Staff Website and front-desk staff would confirm the appointment.
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
