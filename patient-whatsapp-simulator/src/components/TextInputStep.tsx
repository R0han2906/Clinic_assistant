import React, { useState, useRef, useCallback } from 'react';
import { User, Calendar, Phone, FileText, ArrowRight, AlertCircle, Mic, MicOff, Loader2 } from 'lucide-react';
import type { StepState } from '../types';

interface TextInputStepProps {
  currentStep: StepState;
  onSubmitValue: (val: string, step: StepState) => void;
  initialValue?: string;
  disabled?: boolean;
}

// Minimal typing for Web Speech API (not in all TS lib versions)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'unsupported';

export const TextInputStep: React.FC<TextInputStepProps> = ({
  currentStep,
  onSubmitValue,
  initialValue = '',
  disabled = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    return SpeechRec ? 'idle' : 'unsupported';
  });
  const recognitionRef = useRef<any>(null);

  const getStepConfig = () => {
    switch (currentStep) {
      case 'collect_name':
        return {
          title: 'Full Name',
          placeholder: 'e.g. Rahul Sharma',
          icon: <User size={18} />,
          type: 'text',
          validate: (val: string) => {
            if (!val.trim()) return 'Please enter your full name.';
            if (val.trim().length < 2) return 'Name must be at least 2 characters.';
            return null;
          },
        };
      case 'collect_age':
        return {
          title: 'Age or Date of Birth',
          placeholder: 'e.g. 32 or 1994-03-15',
          icon: <Calendar size={18} />,
          type: 'text',
          validate: (val: string) => {
            if (!val.trim()) return 'Please enter your age or date of birth.';
            return null;
          },
        };
      case 'collect_phone':
        return {
          title: 'Phone Number',
          placeholder: 'e.g. +91 9988776655',
          icon: <Phone size={18} />,
          type: 'tel',
          validate: (val: string) => {
            if (!val.trim()) return 'Phone number is required.';
            const cleanPhone = val.replace(/\D/g, '');
            if (cleanPhone.length < 7) return 'Please enter a valid phone number (at least 7 digits).';
            return null;
          },
        };
      case 'collect_reason':
        return {
          title: 'Reason for Visit (Optional)',
          placeholder: 'e.g. Routine checkup, Tooth pain, Cleaning...',
          icon: <FileText size={18} />,
          type: 'text',
          isOptional: true,
          validate: () => null,
        };
      case 'existing_patient_lookup':
        return {
          title: 'Phone, Patient ID or Appointment ID',
          placeholder: 'e.g. +91 9988776655  or  PAT-000001  or  APT-000007',
          icon: <Phone size={18} />,
          type: 'text',
          validate: (val: string) => {
            if (!val.trim()) return 'Please enter your phone, PAT-ID, or APT-ID.';
            return null;
          },
        };
      default:
        return {
          title: 'Enter details',
          placeholder: 'Type here...',
          icon: <User size={18} />,
          type: 'text',
          validate: () => null,
        };
    }
  };

  const config = getStepConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stop any ongoing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const validationError = config.validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmitValue(value, currentStep);
    setValue('');
    setVoiceState('idle');
  };

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceState('unsupported');
      return;
    }

    // Stop existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRec();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setVoiceState('listening');

    recognition.onresult = (event: any) => {
      setVoiceState('processing');
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      setError(null);
      setVoiceState('idle');
    };

    recognition.onerror = () => {
      setVoiceState('idle');
    };

    recognition.onend = () => {
      if (voiceState === 'listening') setVoiceState('idle');
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [voiceState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setVoiceState('idle');
  }, []);

  const handleMicClick = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const getMicTitle = () => {
    if (voiceState === 'unsupported') return 'Voice input not supported in this browser';
    if (voiceState === 'listening') return 'Click to stop recording';
    if (voiceState === 'processing') return 'Processing voice…';
    return 'Click to speak your answer';
  };

  return (
    <form onSubmit={handleSubmit} className="text-input-form-card">
      <label className="input-form-label">
        <span className="label-icon">{config.icon}</span>
        <span className="label-text">{config.title}</span>
        {config.isOptional && <span className="optional-badge">Optional</span>}
      </label>

      {/* Voice listening indicator */}
      {voiceState === 'listening' && (
        <div className="voice-listening-bar">
          <span className="voice-pulse-dot" />
          <span className="voice-pulse-dot delay-1" />
          <span className="voice-pulse-dot delay-2" />
          <span className="voice-listening-label">Listening… speak now</span>
        </div>
      )}
      {voiceState === 'processing' && (
        <div className="voice-processing-bar">
          <Loader2 size={14} className="spin-icon" />
          <span>Processing voice input…</span>
        </div>
      )}

      <div className="input-with-button">
        <input
          type={config.type}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={config.placeholder}
          disabled={disabled || voiceState === 'listening'}
          autoFocus
          className={`chat-form-input ${error ? 'has-error' : ''}`}
        />

        {/* Mic button */}
        {voiceState !== 'unsupported' && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled || voiceState === 'processing'}
            className={`mic-btn ${voiceState === 'listening' ? 'mic-active' : ''}`}
            title={getMicTitle()}
            aria-label={getMicTitle()}
          >
            {voiceState === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={disabled || voiceState === 'listening' || (!value.trim() && !config.isOptional)}
          className="send-form-btn"
          title="Submit answer"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {error && (
        <div className="input-error-msg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
};
