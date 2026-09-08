import React from 'react';
import type { Dentist, PatientDetails, TimeSlot, UpcomingBookingItem } from '../types';
import { User, Calendar, Clock, Stethoscope, CheckCircle, Edit3, XCircle, FileText, RefreshCw } from 'lucide-react';

interface ReviewCardProps {
  patient: PatientDetails;
  dentist: Dentist;
  dateLabel: string;
  slot: TimeSlot;
  reschedulingAppointment?: UpcomingBookingItem | null;
  onConfirm: () => void;
  onChangeDetails: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  patient,
  dentist,
  dateLabel,
  slot,
  reschedulingAppointment,
  onConfirm,
  onChangeDetails,
  onCancel,
  disabled = false,
}) => {
  const isReschedule = Boolean(reschedulingAppointment);

  return (
    <div className="review-summary-card">
      <div className="review-card-header">
        {isReschedule ? (
          <RefreshCw className="header-check-icon" size={20} />
        ) : (
          <CheckCircle className="header-check-icon" size={20} />
        )}
        <div>
          <h3 className="review-title">
            {isReschedule ? 'Review Rescheduled Appointment' : 'Review Appointment Request'}
          </h3>
          <p className="review-subtitle">
            {isReschedule
              ? 'Please verify your new rescheduled slot before confirming'
              : 'Please verify your details before submitting'}
          </p>
        </div>
      </div>

      {isReschedule && reschedulingAppointment && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 8,
          padding: 10,
          marginBottom: 12,
          fontSize: 12,
          color: '#1e40af'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
            🔄 Rescheduling Appointment: <code>{reschedulingAppointment.referenceCode}</code>
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 11 }}>
            <span><strong>Previous:</strong> {reschedulingAppointment.date} at {reschedulingAppointment.time}</span>
            <span><strong>Doctor:</strong> {reschedulingAppointment.dentistName}</span>
          </div>
        </div>
      )}

      <div className="review-details-grid">
        <div className="review-item">
          <User size={16} className="item-icon" />
          <div className="item-content">
            <span className="item-label">Patient Name</span>
            <span className="item-value">{patient.fullName}</span>
            <span className="item-subtext">Phone: {patient.phone} • Age/DOB: {patient.ageOrDob}</span>
          </div>
        </div>

        <div className="review-item">
          <Stethoscope size={16} className="item-icon" />
          <div className="item-content">
            <span className="item-label">Selected Dentist</span>
            <span className="item-value">{dentist.name}</span>
            <span className="item-subtext">{dentist.specialty}</span>
          </div>
        </div>

        <div className="review-item">
          <Calendar size={16} className="item-icon" />
          <div className="item-content">
            <span className="item-label">Appointment Date</span>
            <span className="item-value">{dateLabel}</span>
          </div>
        </div>

        <div className="review-item">
          <Clock size={16} className="item-icon" />
          <div className="item-content">
            <span className="item-label">Time Window</span>
            <span className="item-value">{slot.startTime} – {slot.endTime}</span>
          </div>
        </div>

        {patient.reason && (
          <div className="review-item full-width">
            <FileText size={16} className="item-icon" />
            <div className="item-content">
              <span className="item-label">Visit Reason</span>
              <span className="item-value">{patient.reason}</span>
            </div>
          </div>
        )}
      </div>

      <div className="review-actions-bar">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="review-btn btn-confirm"
        >
          {isReschedule ? (
            <>
              <RefreshCw size={16} /> Confirm Reschedule
            </>
          ) : (
            <>
              <CheckCircle size={16} /> Confirm Request
            </>
          )}
        </button>

        <button
          onClick={onChangeDetails}
          disabled={disabled}
          className="review-btn btn-edit"
        >
          <Edit3 size={16} /> Change Details
        </button>

        <button
          onClick={onCancel}
          disabled={disabled}
          className="review-btn btn-cancel"
        >
          <XCircle size={16} /> Cancel
        </button>
      </div>
    </div>
  );
};
