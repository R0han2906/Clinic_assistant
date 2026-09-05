import { useState, useRef, useEffect } from 'react';
import type {
  StepState,
  Message,
  PatientDetails,
  Dentist,
  TimeSlot,
  AppointmentRequest,
  ExistingPatientRecord,
} from './types';
import { mockDentists, mockExistingPatients } from './mockData';
import { apiClient } from './apiClient';
import { SimulationNotice } from './components/SimulationNotice';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { ChoiceButtons, type ChoiceOption } from './components/ChoiceButtons';
import { TextInputStep } from './components/TextInputStep';
import { DentistPicker } from './components/DentistPicker';
import { SlotPicker } from './components/SlotPicker';
import { ReviewCard } from './components/ReviewCard';
import { ConfirmationCard } from './components/ConfirmationCard';
import { HumanHandoffCard } from './components/HumanHandoffCard';
import { ManageExistingAptCard } from './components/ManageExistingAptCard';
import { Calendar, RefreshCw, Headset, XCircle, UserPlus, UserCheck } from 'lucide-react';

export function App() {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [dentists, setDentists] = useState<Dentist[]>(mockDentists);

  const [stepHistory, setStepHistory] = useState<StepState[]>(['welcome']);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome-1',
      sender: 'bot',
      text: 'Hello! 👋 Welcome to DentalFlow Clinic Assistant.\nI can help you request a dental appointment or connect with our staff.',
      timestamp: getCurrentTime(),
      stepId: 'welcome',
    },
    {
      id: 'm-welcome-2',
      sender: 'bot',
      text: 'What would you like to do today?',
      timestamp: getCurrentTime(),
      stepId: 'welcome',
    },
  ]);

  // Form State
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    isExisting: false,
    fullName: '',
    ageOrDob: '',
    phone: '',
    reason: '',
  });

  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
  const [confirmedRequest, setConfirmedRequest] = useState<AppointmentRequest | null>(null);
  const [matchedExistingRecord, setMatchedExistingRecord] = useState<ExistingPatientRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentStep = stepHistory[stepHistory.length - 1];

  // Check FastAPI backend health on mount & periodic polling
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      const online = await apiClient.checkHealth();
      if (isMounted) {
        setIsBackendOnline(online);
        if (online) {
          try {
            const apiDentists = await apiClient.getDentists();
            setDentists(apiDentists);
          } catch {
            setDentists(mockDentists);
          }
        } else {
          setDentists(mockDentists);
        }
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentStep]);

  function getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const addBotMessage = (text: string, stepId?: StepState) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'bot',
        text,
        timestamp: getCurrentTime(),
        stepId,
      },
    ]);
  };

  const addPatientMessage = (text: string, stepId?: StepState) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'patient',
        text,
        timestamp: getCurrentTime(),
        stepId,
      },
    ]);
  };

  const pushStep = (nextStep: StepState) => {
    setStepHistory((prev) => [...prev, nextStep]);
  };

  const handleBack = () => {
    if (stepHistory.length <= 1) return;
    const newHistory = stepHistory.slice(0, stepHistory.length - 1);
    const previousStep = newHistory[newHistory.length - 1];
    setStepHistory(newHistory);

    // Remove recent step messages
    setMessages((prev) => prev.filter((m) => m.stepId !== currentStep));
    addBotMessage(`Returned to previous step.`, previousStep);
  };

  const handleRestart = () => {
    setStepHistory(['welcome']);
    setPatientDetails({
      isExisting: false,
      fullName: '',
      ageOrDob: '',
      phone: '',
      reason: '',
    });
    setSelectedDentist(null);
    setSelectedSlot(null);
    setSelectedDateLabel('');
    setConfirmedRequest(null);
    setMatchedExistingRecord(null);

    setMessages([
      {
        id: `m-restart-${Date.now()}`,
        sender: 'bot',
        text: 'Simulation restarted. Welcome to DentalFlow Clinic Assistant! 👋\nWhat would you like to do today?',
        timestamp: getCurrentTime(),
        stepId: 'welcome',
      },
    ]);
  };

  const handleHumanHelp = () => {
    addPatientMessage('I need to speak with clinic staff.');
    pushStep('human_handoff');
    addBotMessage('Connecting you to front-desk staff...', 'human_handoff');
  };

  // Welcome choices handler
  const handleWelcomeChoice = (option: ChoiceOption) => {
    addPatientMessage(option.label, 'welcome');

    if (option.id === 'action_book') {
      pushStep('select_patient_type');
      addBotMessage(
        'Are you a new patient or have you visited DentalFlow Clinic before?',
        'select_patient_type'
      );
    } else if (option.id === 'action_change' || option.id === 'action_cancel') {
      pushStep('existing_patient_lookup');
      addBotMessage(
        'Please enter your registered phone number or Patient ID (e.g. +91 9988776655 or PAT-000001) to look up your booking:',
        'existing_patient_lookup'
      );
    } else if (option.id === 'action_staff') {
      pushStep('human_handoff');
      addBotMessage('Connecting you to clinic staff...', 'human_handoff');
    }
  };

  // Patient type selection
  const handlePatientTypeChoice = (option: ChoiceOption) => {
    addPatientMessage(option.label, 'select_patient_type');

    if (option.id === 'type_new') {
      setPatientDetails((prev) => ({ ...prev, isExisting: false }));
      pushStep('collect_name');
      addBotMessage('Welcome! Let us set up your details.\nPlease enter your Full Name:', 'collect_name');
    } else {
      setPatientDetails((prev) => ({ ...prev, isExisting: true }));
      pushStep('existing_patient_lookup');
      addBotMessage(
        'Please enter your registered phone number or Patient ID to find your record:',
        'existing_patient_lookup'
      );
    }
  };

  // Form input submission handler
  const handleTextInputSubmit = async (value: string, step: StepState) => {
    addPatientMessage(value, step);

    if (step === 'collect_name') {
      setPatientDetails((prev) => ({ ...prev, fullName: value }));
      pushStep('collect_age');
      addBotMessage(`Nice to meet you, ${value}! Please enter your Age or Date of Birth:`, 'collect_age');
    } else if (step === 'collect_age') {
      setPatientDetails((prev) => ({ ...prev, ageOrDob: value }));
      pushStep('collect_phone');
      addBotMessage('Thank you. Now please enter your Phone Number (so we can send appointment updates):', 'collect_phone');
    } else if (step === 'collect_phone') {
      setPatientDetails((prev) => ({ ...prev, phone: value }));
      pushStep('collect_reason');
      addBotMessage(
        'Got it! What is the primary reason for your visit? (e.g. Regular checkup, Tooth pain, Cleaning, or press submit to skip):',
        'collect_reason'
      );
    } else if (step === 'collect_reason') {
      setPatientDetails((prev) => ({ ...prev, reason: value }));
      pushStep('select_dentist');
      addBotMessage('Great. Which dentist would you prefer for your appointment?', 'select_dentist');
    } else if (step === 'existing_patient_lookup') {
      const query = value.trim();
      let match: ExistingPatientRecord | null = null;

      if (isBackendOnline) {
        match = await apiClient.searchPatient(query);
      }

      if (!match) {
        const lowerQ = query.toLowerCase();
        match = mockExistingPatients.find(
          (p) =>
            p.phone.toLowerCase().includes(lowerQ) ||
            p.patientId.toLowerCase() === lowerQ ||
            p.fullName.toLowerCase().includes(lowerQ)
        ) || null;
      }

      if (match) {
        setMatchedExistingRecord(match);
        setPatientDetails({
          isExisting: true,
          patientId: match.patientId,
          fullName: match.fullName,
          ageOrDob: match.ageOrDob,
          phone: match.phone,
        });
        pushStep('manage_existing_apt');
        addBotMessage(`Welcome back, ${match.fullName}! We found your clinic record (${match.patientId}).`, 'manage_existing_apt');
      } else {
        addBotMessage(
          `We couldn't find an existing patient matching "${value}". Would you like to register as a new patient or try searching again?`,
          'existing_patient_lookup'
        );
      }
    }
  };

  // Dentist selection
  const handleDentistSelect = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    addPatientMessage(`Selected Dentist: ${dentist.name}`, 'select_dentist');
    pushStep('select_time_range');
    addBotMessage(`Here are the available appointment slots for ${dentist.name}:`, 'select_time_range');
  };

  // Slot selection
  const handleSlotSelect = (slot: TimeSlot, dateLabel: string) => {
    setSelectedSlot(slot);
    setSelectedDateLabel(dateLabel);
    addPatientMessage(`Selected ${dateLabel} at ${slot.startTime} – ${slot.endTime}`, 'select_time_range');
    pushStep('review');
    addBotMessage('Please review your requested appointment details below before final submission:', 'review');
  };

  // Confirmation with live FastAPI backend call + mock fallback
  const handleConfirmBooking = async () => {
    if (!selectedDentist || !selectedSlot) return;

    setIsSubmitting(true);
    let refCode = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    let resolvedPatientId: string | undefined = patientDetails.patientId;

    if (isBackendOnline) {
      try {
        // Step A: Register or get patient ID in FastAPI Excel DB
        if (!resolvedPatientId) {
          resolvedPatientId = await apiClient.registerPatient(patientDetails);
        }

        // Step B: Book appointment in FastAPI Excel DB
        const bk = await apiClient.bookAppointment({
          patientId: resolvedPatientId,
          dentistId: selectedDentist.id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          reason: patientDetails.reason,
        });

        refCode = bk.appointmentId;
      } catch (err: any) {
        console.warn('Backend booking fallback to demo mode:', err);
      }
    }

    const request: AppointmentRequest = {
      patient: patientDetails,
      dentist: selectedDentist,
      date: selectedDateLabel,
      timeSlot: selectedSlot,
      referenceCode: refCode,
      patientId: resolvedPatientId,   // PAT-XXXXXX stored here
      createdTimestamp: getCurrentTime(),
    };

    setConfirmedRequest(request);
    setIsSubmitting(false);
    addPatientMessage('Confirm Appointment Request', 'review');
    pushStep('confirmed');
    addBotMessage(`Your appointment request has been recorded! Reference: ${refCode}`, 'confirmed');
  };

  const handleCancelFlow = () => {
    addPatientMessage('Cancel Request', 'review');
    pushStep('cancelled');
    addBotMessage('Your appointment request simulation has been cancelled.', 'cancelled');
  };

  return (
    <div className="app-viewport-container">
      <SimulationNotice />

      <div className="chat-device-frame">
        <ChatHeader
          onRestart={handleRestart}
          onBack={handleBack}
          onHumanHelp={handleHumanHelp}
          canGoBack={stepHistory.length > 1 && currentStep !== 'confirmed'}
          isBackendOnline={isBackendOnline}
        />

        {/* Scrollable Conversation Area */}
        <div className="conversation-scroll-area" ref={chatContainerRef}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Render Active Step Interactive Card */}
          <div className="interactive-step-wrapper">
            {currentStep === 'welcome' && (
              <ChoiceButtons
                options={[
                  {
                    id: 'action_book',
                    label: 'Book an appointment',
                    sublabel: 'Schedule a visit with our dentists',
                    icon: <Calendar size={18} />,
                    variant: 'primary',
                  },
                  {
                    id: 'action_change',
                    label: 'Change an appointment',
                    sublabel: 'Reschedule an existing booking',
                    icon: <RefreshCw size={18} />,
                    variant: 'secondary',
                  },
                  {
                    id: 'action_cancel',
                    label: 'Cancel an appointment',
                    sublabel: 'Cancel an upcoming booking',
                    icon: <XCircle size={18} />,
                    variant: 'secondary',
                  },
                  {
                    id: 'action_staff',
                    label: 'Talk to clinic staff',
                    sublabel: 'Speak with reception desk',
                    icon: <Headset size={18} />,
                    variant: 'outline',
                  },
                ]}
                onSelect={handleWelcomeChoice}
              />
            )}

            {currentStep === 'select_patient_type' && (
              <ChoiceButtons
                options={[
                  {
                    id: 'type_new',
                    label: 'New Patient',
                    sublabel: 'First time visiting DentalFlow Clinic',
                    icon: <UserPlus size={18} />,
                    variant: 'primary',
                  },
                  {
                    id: 'type_existing',
                    label: 'Existing Patient',
                    sublabel: 'I have visited this clinic before',
                    icon: <UserCheck size={18} />,
                    variant: 'secondary',
                  },
                ]}
                onSelect={handlePatientTypeChoice}
              />
            )}

            {(currentStep === 'collect_name' ||
              currentStep === 'collect_age' ||
              currentStep === 'collect_phone' ||
              currentStep === 'collect_reason' ||
              currentStep === 'existing_patient_lookup') && (
              <TextInputStep
                currentStep={currentStep}
                onSubmitValue={handleTextInputSubmit}
              />
            )}

            {currentStep === 'manage_existing_apt' && matchedExistingRecord && (
              <ManageExistingAptCard
                patientRecord={matchedExistingRecord}
                onBookNew={() => {
                  pushStep('select_dentist');
                  addBotMessage('Select your preferred dentist for your new appointment:', 'select_dentist');
                }}
                onCancelExisting={async () => {
                  addPatientMessage('Cancel upcoming appointment');
                  if (isBackendOnline && matchedExistingRecord.upcomingAppointment?.referenceCode) {
                    await apiClient.cancelAppointment(
                      matchedExistingRecord.upcomingAppointment.referenceCode,
                      'Patient requested cancellation'
                    );
                  }
                  addBotMessage(
                    `Cancellation request logged for ${matchedExistingRecord.upcomingAppointment?.referenceCode || 'appointment'}. Reception staff will process this.`,
                    'manage_existing_apt'
                  );
                }}
                onRestart={handleRestart}
              />
            )}

            {currentStep === 'select_dentist' && (
              <DentistPicker
                dentists={dentists}
                onSelect={handleDentistSelect}
              />
            )}

            {currentStep === 'select_time_range' && selectedDentist && (
              <SlotPicker
                selectedDentist={selectedDentist}
                onSelectSlot={handleSlotSelect}
                isBackendOnline={isBackendOnline}
              />
            )}

            {currentStep === 'review' &&
              selectedDentist &&
              selectedSlot && (
                <ReviewCard
                  patient={patientDetails}
                  dentist={selectedDentist}
                  dateLabel={selectedDateLabel}
                  slot={selectedSlot}
                  onConfirm={handleConfirmBooking}
                  disabled={isSubmitting}
                  onChangeDetails={() => {
                    pushStep('select_dentist');
                    addBotMessage('You can re-select your dentist or date details below:', 'select_dentist');
                  }}
                  onCancel={handleCancelFlow}
                />
              )}

            {currentStep === 'confirmed' && confirmedRequest && (
              <ConfirmationCard
                request={confirmedRequest}
                onNewRequest={handleRestart}
                isBackendOnline={isBackendOnline}
              />
            )}

            {currentStep === 'human_handoff' && (
              <HumanHandoffCard onRestart={handleRestart} />
            )}

            {currentStep === 'cancelled' && (
              <div className="cancelled-card">
                <p>❌ Request cancelled in simulation.</p>
                <button onClick={handleRestart} className="choice-btn primary mt-3">
                  Start New Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
