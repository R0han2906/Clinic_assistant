import React from 'react';
import type { ExistingPatientRecord, UpcomingBookingItem } from '../types';
import { UserCheck, Calendar, RotateCcw, XCircle, RefreshCw, AlertCircle, UserCog, MapPin, Phone, Clock, PlusCircle } from 'lucide-react';

interface ManageExistingAptCardProps {
  patientRecord: ExistingPatientRecord;
  intent?: 'change' | 'cancel' | 'manage' | 'book';
  onBookNew: () => void;
  onSelectToReschedule: (apt: UpcomingBookingItem) => void;
  onSelectToCancel: (apt: UpcomingBookingItem) => void;
  onEditDetails: () => void;
  onRestart: () => void;
}

export const ManageExistingAptCard: React.FC<ManageExistingAptCardProps> = ({
  patientRecord,
  intent = 'manage',
  onBookNew,
  onSelectToReschedule,
  onSelectToCancel,
  onEditDetails,
  onRestart,
}) => {
  const allBookings: UpcomingBookingItem[] =
    patientRecord.upcomingAppointments && patientRecord.upcomingAppointments.length > 0
      ? patientRecord.upcomingAppointments
      : patientRecord.upcomingAppointment
      ? [patientRecord.upcomingAppointment]
      : [];

  const activeBookings = allBookings.filter((a) => a.status?.toLowerCase() !== 'cancelled');
  const cancelledBookings = allBookings.filter((a) => a.status?.toLowerCase() === 'cancelled');

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

      {/* Active Bookings Section */}
      {activeBookings.length > 0 ? (
        <div className="upcoming-appointments-section">
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark, #1e293b)' }}>
              {activeBookings.length > 1
                ? `Active Upcoming Bookings (${activeBookings.length}):`
                : 'Upcoming Booking Found:'}
            </span>
            {activeBookings.length > 1 && (
              <span style={{ fontSize: 11, color: 'var(--primary, #059669)', fontWeight: 500 }}>
                {intent === 'change' ? 'Tap "Change" on desired booking' : 'Tap "Cancel" or "Change"'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeBookings.map((apt, idx) => {
              const isReq = apt.referenceCode.startsWith('REQ-');
              const isPending = (apt.status || '').toLowerCase() === 'pending';

              return (
                <div
                  key={apt.referenceCode || idx}
                  className="upcoming-apt-box"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="upcoming-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={15} />
                      <strong style={{ fontSize: 13 }}>{apt.date}</strong>
                    </div>
                    <span
                      className={`apt-status-pill ${
                        isPending ? 'pill-pending' : 'pill-confirmed'
                      }`}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: isPending ? '#fef3c7' : '#ecfdf5',
                        color: isPending ? '#b45309' : '#047857',
                        fontWeight: 600,
                      }}
                    >
                      {isPending ? 'PENDING REVIEW' : (apt.status ? apt.status.toUpperCase() : 'SCHEDULED')}
                    </span>
                  </div>

                  <div className="upcoming-details" style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155' }}>
                      <Clock size={13} style={{ color: '#64748b' }} />
                      <span><strong>Time:</strong> {apt.time}</span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', color: '#334155' }}>
                      <strong>Doctor:</strong> {apt.dentistName}
                    </p>
                    <p className="ref-tag" style={{ margin: '2px 0 0 0' }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{isReq ? 'Request ID:' : 'Appointment Ref:'}</span>{' '}
                      <code>{apt.referenceCode}</code>
                    </p>
                  </div>

                  <div className="upcoming-actions" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onSelectToReschedule(apt)}
                      className="action-btn btn-primary-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      title="Select this appointment to reschedule to another date/time"
                    >
                      <RefreshCw size={13} /> Change / Reschedule
                    </button>
                    <button
                      onClick={() => onSelectToCancel(apt)}
                      className="action-btn btn-danger-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      title="Cancel this appointment"
                    >
                      <XCircle size={13} /> Cancel Booking
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBookNew}
            className="choice-btn outline"
            style={{ width: '100%', marginTop: 10, padding: '8px 12px', fontSize: 12 }}
          >
            <PlusCircle size={14} style={{ marginRight: 4 }} /> Book Another New Appointment
          </button>
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

      {/* Cancelled Bookings history if any */}
      {cancelledBookings.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#64748b' }}>
          <span><strong>Cancelled Bookings ({cancelledBookings.length}):</strong>{' '}
            {cancelledBookings.map((c) => `${c.referenceCode} (${c.date})`).join(', ')}
          </span>
        </div>
      )}

      <button onClick={onRestart} className="btn-link-restart">
        <RotateCcw size={14} /> Start Over
      </button>
    </div>
  );
};
