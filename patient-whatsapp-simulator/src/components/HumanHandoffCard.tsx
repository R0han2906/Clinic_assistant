import React from 'react';
import { Headset, RotateCcw, MessageSquare, PhoneCall } from 'lucide-react';

interface HumanHandoffCardProps {
  onRestart: () => void;
}

export const HumanHandoffCard: React.FC<HumanHandoffCardProps> = ({ onRestart }) => {
  return (
    <div className="human-handoff-card">
      <div className="handoff-header">
        <Headset size={32} className="handoff-icon" />
        <h3 className="handoff-title">Connecting to Clinic Receptionist</h3>
      </div>

      <p className="handoff-body">
        A clinic staff member would take over this WhatsApp conversation here to assist you personally with your request.
      </p>

      <div className="handoff-info-box">
        <div className="info-item">
          <PhoneCall size={16} />
          <span>Clinic Phone: +91 (080) 2345-6789</span>
        </div>
        <div className="info-item">
          <MessageSquare size={16} />
          <span>Hours: Mon–Sat (9:00 AM – 7:00 PM)</span>
        </div>
      </div>

      <p className="handoff-note">
        <em>Note: This prototype does not send real messages. Click below to restart the simulation.</em>
      </p>

      <div className="handoff-action">
        <button onClick={onRestart} className="btn-restart-handoff">
          <RotateCcw size={16} /> Restart Bot Simulation
        </button>
      </div>
    </div>
  );
};
