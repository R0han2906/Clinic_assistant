import React from 'react';
import type { Dentist } from '../types';
import { CheckCircle2, UserCheck } from 'lucide-react';

interface DentistPickerProps {
  dentists: Dentist[];
  onSelect: (dentist: Dentist) => void;
  disabled?: boolean;
}

export const DentistPicker: React.FC<DentistPickerProps> = ({
  dentists,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="dentist-picker-container">
      <p className="picker-instruction">Select your preferred dentist:</p>
      <div className="dentist-grid">
        {dentists.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            disabled={disabled}
            className="dentist-card-btn"
          >
            <div className="dentist-avatar-wrap">
              <img src={d.avatar} alt={d.name} className="dentist-img" />
              {d.id === 'DOC-ANY' ? (
                <span className="any-dentist-badge">
                  <UserCheck size={14} />
                </span>
              ) : null}
            </div>

            <div className="dentist-card-info">
              <h3 className="dentist-name">{d.name}</h3>
              <p className="dentist-specialty">{d.specialty}</p>
              <span className="dentist-exp-tag">{d.experience}</span>
            </div>

            <div className="dentist-select-indicator">
              <CheckCircle2 size={20} className="check-icon" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
