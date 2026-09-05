import React from 'react';
import type { Dentist, PatientDetails, TimeSlot } from '../types';
import { User, Calendar, Clock, Stethoscope, CheckCircle, Edit3, XCircle, FileText } from 'lucide-react';

interface ReviewCardProps {
  patient: PatientDetails;
  dentist: Dentist;
  dateLabel: string;
  slot: TimeSlot;
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
  onConfirm,
  onChangeDetails,
  onCancel,
  disabled = false,
}) => {
  return (
    <div className="review-summary-card">
      <div className="review-card-header">
        <CheckCircle className="header-check-icon" size={20} />
        <div>
          <h3 className="review-title">Review Appointment Request</h3>
          <p className="review-subtitle">Please verify your details before submitting</p>
        </div>
      </div>

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
          <CheckCircle size={16} /> Confirm Request
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
