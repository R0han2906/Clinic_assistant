import React from 'react';
import { RotateCcw, ArrowLeft, Headset, Stethoscope, Database, CloudOff } from 'lucide-react';

interface ChatHeaderProps {
  onRestart: () => void;
  onBack: () => void;
  onHumanHelp: () => void;
  canGoBack: boolean;
  isBackendOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onRestart,
  onBack,
  onHumanHelp,
  canGoBack,
  isBackendOnline = false,
}) => {
  return (
    <header className="chat-header">
      <div className="header-left">
        {canGoBack && (
          <button
            onClick={onBack}
            className="icon-btn back-btn"
            title="Go back one step"
            aria-label="Go back one step"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="clinic-avatar">
          <Stethoscope size={22} className="avatar-icon" />
          <span className="online-indicator" title="Bot active"></span>
        </div>
        <div className="clinic-info">
          <div className="title-row">
            <h1 className="clinic-title">DentalFlow Clinic</h1>
            <span
              className={`backend-status-badge ${isBackendOnline ? 'online' : 'offline'}`}
              title={isBackendOnline ? 'FastAPI Excel Backend Connected' : 'Backend Offline - Using Mock Data'}
            >
              {isBackendOnline ? <Database size={11} /> : <CloudOff size={11} />}
              {isBackendOnline ? 'API Connected' : 'Mock Mode'}
            </span>
          </div>
          <p className="clinic-status">
            <span className="pulse-dot"></span> Online • WhatsApp Assistant
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onHumanHelp}
          className="header-action-btn help-btn"
          title="Talk to Clinic Staff"
        >
          <Headset size={16} />
          <span className="btn-label">Staff Help</span>
        </button>

        <button
          onClick={onRestart}
          className="header-action-btn restart-btn"
          title="Restart Conversation"
        >
          <RotateCcw size={16} />
          <span className="btn-label">Restart</span>
        </button>
      </div>
    </header>
  );
};
