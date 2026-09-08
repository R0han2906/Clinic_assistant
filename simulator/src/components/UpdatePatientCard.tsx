import React, { useState } from 'react';
import { UserCheck, Save, X, Phone, User, Calendar, MapPin, ShieldAlert } from 'lucide-react';
import type { ExistingPatientRecord } from '../types';

interface UpdatePatientCardProps {
  patientRecord: ExistingPatientRecord;
  onSave: (updates: {
    fullName: string;
    phone: string;
    ageOrDob: string;
    address: string;
    emergencyContact: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const UpdatePatientCard: React.FC<UpdatePatientCardProps> = ({
  patientRecord,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const [fullName, setFullName] = useState(patientRecord.fullName || '');
  const [phone, setPhone] = useState(patientRecord.phone || '');
  const [ageOrDob, setAgeOrDob] = useState(patientRecord.ageOrDob || '');
  const [address, setAddress] = useState(patientRecord.address || '');
  const [emergencyContact, setEmergencyContact] = useState(patientRecord.emergencyContact || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Please provide a valid contact phone number.');
      return;
    }
    setError(null);

    await onSave({
      fullName: fullName.trim(),
      phone: phone.trim(),
      ageOrDob: ageOrDob.trim(),
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
    });
  };

  return (
    <div className="update-patient-card">
      <div className="update-card-header">
        <UserCheck size={22} className="header-icon" />
        <div>
          <h3 className="card-title">Update Your Patient Details</h3>
          <span className="patient-id-badge">{patientRecord.patientId}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="update-form">
        {error && <div className="form-error-alert">{error}</div>}

        <div className="form-group">
          <label className="form-label">
            <User size={14} /> Full Name
          </label>
          <input
            type="text"
            className="form-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">
              <Phone size={14} /> Phone Number
            </label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9988776655"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} /> Age or DOB
            </label>
            <input
              type="text"
              className="form-input"
              value={ageOrDob}
              onChange={(e) => setAgeOrDob(e.target.value)}
              placeholder="e.g. 32 or 1994-05-12"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <MapPin size={14} /> Residential Address
          </label>
          <input
            type="text"
            className="form-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Flat 3A, Green Park"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <ShieldAlert size={14} /> Emergency Contact
          </label>
          <input
            type="text"
            className="form-input"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="e.g. Priya Sharma (+91 9911223344)"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
