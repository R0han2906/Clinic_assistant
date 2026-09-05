import React from 'react';
import type { Sender } from '../types';
import { CheckCheck, Bot } from 'lucide-react';

interface MessageBubbleProps {
  sender: Sender;
  text?: string;
  timestamp: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  sender,
  text,
  timestamp,
}) => {
  if (!text) return null;

  const isBot = sender === 'bot';

  return (
    <div className={`message-bubble-wrapper ${isBot ? 'bot-wrapper' : 'patient-wrapper'}`}>
      {isBot && (
        <div className="bot-icon-badge" title="DentalFlow Bot">
          <Bot size={14} />
        </div>
      )}
      <div className={`message-bubble ${isBot ? 'bot-bubble' : 'patient-bubble'}`}>
        <p className="message-text">{text}</p>
        <div className="message-meta">
          <span className="message-time">{timestamp}</span>
          {!isBot && <CheckCheck size={14} className="read-receipt" />}
        </div>
      </div>
    </div>
  );
};
