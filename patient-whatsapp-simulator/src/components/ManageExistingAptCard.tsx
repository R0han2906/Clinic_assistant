import React from 'react';
import type { ExistingPatientRecord } from '../types';
import { UserCheck, Calendar, RotateCcw, XCircle, Edit, AlertCircle } from 'lucide-react';

interface ManageExistingAptCardProps {
  patientRecord: ExistingPatientRecord;
  onBookNew: () => void;
  onCancelExisting: () => void;
  onRestart: () => void;
}

export const ManageExistingAptCard: React.FC<ManageExistingAptCardProps> = ({
  patientRecord,
  onBookNew,
  onCancelExisting,
  onRestart,
}) => {
  return (
    <div className="existing-patient-card">
      <div className="patient-card-header">
        <UserCheck size={24} className="header-patient-icon" />
        <div>
          <h3 className="patient-name">{patientRecord.fullName}</h3>
          <span className="patient-id-badge">{patientRecord.patientId}</span>
        </div>
      </div>

      <div className="patient-meta-list">
        <div className="meta-item">
          <span className="meta-label">Phone:</span>
          <span className="meta-val">{patientRecord.phone}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Last Visit:</span>
          <span className="meta-val">{patientRecord.lastVisitDate} ({patientRecord.lastVisitType})</span>
        </div>
      </div>

      {patientRecord.upcomingAppointment ? (
        <div className="upcoming-apt-box">
          <div className="upcoming-header">
            <Calendar size={16} />
            <strong>Upcoming Appointment Found:</strong>
          </div>
          <div className="upcoming-details">
            <p><strong>Dentist:</strong> {patientRecord.upcomingAppointment.dentistName}</p>
            <p><strong>Date & Time:</strong> {patientRecord.upcomingAppointment.date} at {patientRecord.upcomingAppointment.time}</p>
            <p className="ref-tag">Ref: <code>{patientRecord.upcomingAppointment.referenceCode}</code></p>
          </div>

          <div className="upcoming-actions">
            <button onClick={onCancelExisting} className="action-btn btn-danger-sm">
              <XCircle size={14} /> Request Cancellation
            </button>
            <button onClick={onBookNew} className="action-btn btn-primary-sm">
              <Edit size={14} /> Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="no-upcoming-box">
          <AlertCircle size={16} />
          <span>No active upcoming appointments found on record.</span>
          <button onClick={onBookNew} className="action-btn btn-primary-sm mt-2">
            Book New Appointment
          </button>
        </div>
      )}

      <button onClick={onRestart} className="btn-link-restart">
        <RotateCcw size={14} /> Start Over
      </button>
    </div>
  );
};
