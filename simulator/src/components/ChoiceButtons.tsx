import React from 'react';

export interface ChoiceOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

interface ChoiceButtonsProps {
  options: ChoiceOption[];
  onSelect: (option: ChoiceOption) => void;
  disabled?: boolean;
}

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  options,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="choice-buttons-container">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className={`choice-btn ${opt.variant || 'primary'}`}
        >
          {opt.icon && <span className="choice-icon">{opt.icon}</span>}
          <div className="choice-text">
            <span className="choice-label">{opt.label}</span>
            {opt.sublabel && <span className="choice-sublabel">{opt.sublabel}</span>}
          </div>
        </button>
      ))}
    </div>
  );
};
