import React, { useState } from 'react';
import { AlertTriangle, XCircle, ArrowLeft, CheckCircle2, Clock, Calendar, User } from 'lucide-react';
import type { ExistingPatientRecord } from '../types';

interface CancelAppointmentCardProps {
  patientRecord: ExistingPatientRecord;
  onConfirmCancel: (reason: string) => Promise<void>;
  onKeepAppointment: () => void;
  isSubmitting?: boolean;
}

const COMMON_REASONS = [
  'Personal conflict / Need to reschedule',
  'Health improved / Symptoms resolved',
  'Emergency or family obligation',
  'Booked incorrect date/time',
  'Consulted another clinic',
  'Other reason',
];

export const CancelAppointmentCard: React.FC<CancelAppointmentCardProps> = ({
  patientRecord,
  onConfirmCancel,
  onKeepAppointment,
  isSubmitting = false,
}) => {
  const apt = patientRecord.upcomingAppointment;
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other reason' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    await onConfirmCancel(finalReason);
  };

  if (!apt) {
    return (
      <div className="cancel-card empty">
        <p>No active appointment found to cancel.</p>
        <button onClick={onKeepAppointment} className="btn-secondary">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="cancel-appointment-card">
      <div className="cancel-header">
        <div className="alert-icon-wrap">
          <AlertTriangle size={24} className="warning-icon" />
        </div>
        <div>
          <h3 className="cancel-title">Confirm Appointment Cancellation</h3>
          <p className="cancel-subtitle">Are you sure you want to cancel this booking?</p>
        </div>
      </div>

      {/* Appointment Summary Box */}
      <div className="apt-to-cancel-box">
        <div className="apt-ref-row">
          <span className="ref-tag">Ref: <code>{apt.referenceCode}</code></span>
          <span className="status-badge-pending">Active Booking</span>
        </div>
        <div className="apt-info-grid">
          <div className="info-item">
            <User size={14} className="info-icon" />
            <span><strong>Dentist:</strong> {apt.dentistName}</span>
          </div>
          <div className="info-item">
            <Calendar size={14} className="info-icon" />
            <span><strong>Date:</strong> {apt.date}</span>
          </div>
          <div className="info-item">
            <Clock size={14} className="info-icon" />
            <span><strong>Time:</strong> {apt.time}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="cancel-form">
        <div className="form-group">
          <label className="form-label">Reason for cancellation (optional):</label>
          <select
            className="form-select"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isSubmitting}
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other reason' && (
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify reason..."
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="warning-callout">
          <span>⚠️ Cancelling will immediately release this 30-minute dental slot for other clinic patients.</span>
        </div>

        <div className="cancel-actions">
          <button
            type="button"
            onClick={onKeepAppointment}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            <CheckCircle2 size={16} /> Keep Appointment
          </button>
          <button
            type="submit"
            className="btn-danger"
            disabled={isSubmitting}
          >
            <XCircle size={16} /> {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};
