import React from 'react';
import type { ExistingPatientRecord } from '../types';
import { UserCheck, Calendar, RotateCcw, XCircle, Edit, AlertCircle, UserCog, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface ManageExistingAptCardProps {
  patientRecord: ExistingPatientRecord;
  onBookNew: () => void;
  onCancelExisting: () => void;
  onEditDetails: () => void;
  onRestart: () => void;
}

export const ManageExistingAptCard: React.FC<ManageExistingAptCardProps> = ({
  patientRecord,
  onBookNew,
  onCancelExisting,
  onEditDetails,
  onRestart,
}) => {
  const apt = patientRecord.upcomingAppointment;
  const isCancelled = apt?.status?.toLowerCase() === 'cancelled';

  return (
    <div className="existing-patient-card">
      <div className="patient-card-header">
        <div className="header-left-wrap">
          <UserCheck size={24} className="header-patient-icon" />
          <div>
            <h3 className="patient-name">{patientRecord.fullName}</h3>
            <span className="patient-id-badge">{patientRecord.patientId}</span>
          </div>
        </div>
        <button onClick={onEditDetails} className="btn-edit-profile" title="Update contact or profile details">
          <UserCog size={15} /> Edit Details
        </button>
      </div>

      <div className="patient-meta-list">
        <div className="meta-item">
          <span className="meta-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone:</span>
          <span className="meta-val">{patientRecord.phone}</span>
        </div>
        {patientRecord.ageOrDob && (
          <div className="meta-item">
            <span className="meta-label">Age / DOB:</span>
            <span className="meta-val">{patientRecord.ageOrDob}</span>
          </div>
        )}
        {patientRecord.address && (
          <div className="meta-item">
            <span className="meta-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Address:</span>
            <span className="meta-val">{patientRecord.address}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-label">Last Visit:</span>
          <span className="meta-val">{patientRecord.lastVisitDate} ({patientRecord.lastVisitType})</span>
        </div>
      </div>

      {apt ? (
        <div className={`upcoming-apt-box ${isCancelled ? 'cancelled-apt-box' : ''}`}>
          <div className="upcoming-header">
            <Calendar size={16} />
            <strong>{isCancelled ? 'Recent Appointment Status:' : 'Upcoming Appointment Found:'}</strong>
            <span className={`apt-status-pill ${isCancelled ? 'pill-cancelled' : 'pill-confirmed'}`}>
              {isCancelled ? 'CANCELLED' : (apt.status ? apt.status.toUpperCase() : 'ACTIVE')}
            </span>
          </div>
          <div className="upcoming-details">
            <p><strong>Dentist:</strong> {apt.dentistName}</p>
            <p><strong>Date & Time:</strong> {apt.date} at {apt.time}</p>
            <p className="ref-tag">Ref: <code>{apt.referenceCode}</code></p>
          </div>

          <div className="upcoming-actions">
            {!isCancelled ? (
              <>
                <button onClick={onCancelExisting} className="action-btn btn-danger-sm">
                  <XCircle size={14} /> Cancel Appointment
                </button>
                <button onClick={onBookNew} className="action-btn btn-primary-sm">
                  <Edit size={14} /> Book / Reschedule
                </button>
              </>
            ) : (
              <button onClick={onBookNew} className="action-btn btn-primary-sm full-width">
                <Calendar size={14} /> Book a New Appointment
              </button>
            )}
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
