import React from 'react';
import { Info } from 'lucide-react';

export const SimulationNotice: React.FC = () => {
  return (
    <div className="simulation-notice-banner">
      <div className="simulation-notice-content">
        <Info className="notice-icon" size={16} />
        <span>
          <strong>Patient WhatsApp Bot Prototype:</strong> Simulated interface for testing patient appointment workflows. No real messages are dispatched.
        </span>
      </div>
    </div>
  );
};
