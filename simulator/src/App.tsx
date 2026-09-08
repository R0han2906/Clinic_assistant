import { useState, useRef, useEffect } from 'react';
import type {
  StepState,
  Message,
  PatientDetails,
  Dentist,
  TimeSlot,
  AppointmentRequest,
  ExistingPatientRecord,
  Treatment,
  AlternativeSlot,
  UpcomingBookingItem,
} from './types';
import { mockDentists, mockExistingPatients, mockTreatments } from './mockData';
import { apiClient } from './apiClient';
import { SimulationNotice } from './components/SimulationNotice';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { ChoiceButtons, type ChoiceOption } from './components/ChoiceButtons';
import { TextInputStep } from './components/TextInputStep';
import { DentistPicker } from './components/DentistPicker';
import { SlotPicker } from './components/SlotPicker';
import { SlotAlternativesCard } from './components/SlotAlternativesCard';
import { ReviewCard } from './components/ReviewCard';
import { ConfirmationCard } from './components/ConfirmationCard';
import { HumanHandoffCard } from './components/HumanHandoffCard';
import { ManageExistingAptCard } from './components/ManageExistingAptCard';
import { UpdatePatientCard } from './components/UpdatePatientCard';
import { CancelAppointmentCard } from './components/CancelAppointmentCard';
import { Calendar, RefreshCw, Headset, XCircle, UserPlus, UserCheck } from 'lucide-react';

export function App() {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [dentists, setDentists] = useState<Dentist[]>(mockDentists);
  const [treatments, setTreatments] = useState<Treatment[]>(mockTreatments);

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
  const [slotAlternatives, setSlotAlternatives] = useState<AlternativeSlot[]>([]);
  const [confirmedRequest, setConfirmedRequest] = useState<AppointmentRequest | null>(null);
  const [matchedExistingRecord, setMatchedExistingRecord] = useState<ExistingPatientRecord | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<UpcomingBookingItem | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<UpcomingBookingItem | null>(null);
  const [userIntent, setUserIntent] = useState<'book' | 'change' | 'cancel' | 'manage'>('book');
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
            const [apiDentists, apiTreatments] = await Promise.all([
              apiClient.getDentists(),
              apiClient.getTreatments().catch(() => mockTreatments),
            ]);
            setDentists(apiDentists);
            setTreatments(apiTreatments);
          } catch {
            setDentists(mockDentists);
            setTreatments(mockTreatments);
          }
        } else {
          setDentists(mockDentists);
          setTreatments(mockTreatments);
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
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
    setSlotAlternatives([]);
    setConfirmedRequest(null);
    setMatchedExistingRecord(null);
    setReschedulingAppointment(null);
    setCancellingAppointment(null);
    setUserIntent('book');

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
      setUserIntent('book');
      setReschedulingAppointment(null);
      pushStep('select_patient_type');
      addBotMessage(
        'Are you a new patient or have you visited DentalFlow Clinic before?',
        'select_patient_type'
      );
    } else if (option.id === 'action_change' || option.id === 'action_cancel') {
      const intent = option.id === 'action_change' ? 'change' : 'cancel';
      setUserIntent(intent);
      pushStep('existing_patient_lookup');
      addBotMessage(
        'Please enter your registered phone number, Patient ID, or Request Reference (e.g. +91 9988776655, PAT-000001, or REQ-000001) to look up your booking:',
        'existing_patient_lookup'
      );
    } else if (option.id === 'action_staff') {
      setUserIntent('manage');
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
      const phoneVal = value.trim();
      setPatientDetails((prev) => ({ ...prev, phone: phoneVal }));

      // Firsthand lookup: check if this phone matches an existing clinic patient
      let match: ExistingPatientRecord | null = null;
      if (isBackendOnline) {
        match = await apiClient.searchPatient(phoneVal);
      }
      if (!match) {
        const clean = phoneVal.replace(/\D/g, '');
        match = mockExistingPatients.find((p) => p.phone.replace(/\D/g, '').includes(clean)) || null;
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
        addBotMessage(
          `Welcome back, ${match.fullName}! We recognized your phone number and loaded your clinic profile (${match.patientId}).`,
          'collect_reason'
        );
      }

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

        const activeCount = (match.upcomingAppointments || []).filter(
          (a) => a.status?.toLowerCase() !== 'cancelled'
        ).length;

        if (userIntent === 'change') {
          if (activeCount > 1) {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found ${activeCount} active upcoming bookings on file. Please select which appointment you would like to reschedule from the list below:`,
              'manage_existing_apt'
            );
          } else if (activeCount === 1) {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found your booking. Tap "Change / Reschedule" below to select your new date & time:`,
              'manage_existing_apt'
            );
          } else {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found your record (${match.patientId}), but you have no active upcoming appointments to change. You can book a new appointment anytime:`,
              'manage_existing_apt'
            );
          }
        } else if (userIntent === 'cancel') {
          if (activeCount > 1) {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found ${activeCount} active upcoming bookings on file. Please select which appointment you would like to cancel from the list below:`,
              'manage_existing_apt'
            );
          } else if (activeCount === 1) {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found your booking. Tap "Cancel Booking" below to proceed:`,
              'manage_existing_apt'
            );
          } else {
            addBotMessage(
              `Welcome back, ${match.fullName}! We found your record (${match.patientId}), but you have no active upcoming appointments to cancel.`,
              'manage_existing_apt'
            );
          }
        } else {
          addBotMessage(`Welcome back, ${match.fullName}! We found your clinic record (${match.patientId}).`, 'manage_existing_apt');
        }
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

  // Slot selection with condition check & smart alternatives
  const handleSlotSelect = async (slot: TimeSlot, dateLabel: string) => {
    if (!slot.isAvailable) {
      addPatientMessage(`Requested ${dateLabel} at ${slot.startTime} – ${slot.endTime}`, 'select_time_range');
      setIsSubmitting(true);
      const alts = await apiClient.getSmartAlternativeSlots(
        slot.date,
        slot.startTime,
        selectedDentist?.id,
        dentists
      );
      setSlotAlternatives(alts);
      setIsSubmitting(false);
      pushStep('slot_alternatives');
      addBotMessage(
        `⚠️ We checked clinic records: ${selectedDentist?.name || 'The requested doctor'} is not available at ${slot.startTime} on ${dateLabel} (${slot.unavailableReason || 'slot is already booked or outside operating hours'}).`,
        'slot_alternatives'
      );
      addBotMessage(
        `Here are the top 3 closest available alternative slots calculated for you. Please select an option:`,
        'slot_alternatives'
      );
      return;
    }

    setSelectedSlot(slot);
    setSelectedDateLabel(dateLabel);
    addPatientMessage(`Selected ${dateLabel} at ${slot.startTime} – ${slot.endTime}`, 'select_time_range');
    pushStep('review');
    addBotMessage('Please review your requested appointment details below before final submission:', 'review');
  };

  const handleAlternativeSelect = (alt: AlternativeSlot) => {
    const doc = dentists.find((d) => d.id === alt.slot.dentistId) || selectedDentist;
    if (doc) setSelectedDentist(doc);
    setSelectedSlot(alt.slot);
    setSelectedDateLabel(alt.slot.date);
    addPatientMessage(`Selected alternative: ${alt.slot.startTime} with ${alt.dentistName}`, 'slot_alternatives');
    pushStep('review');
    addBotMessage(
      `Great choice! We have reserved ${alt.slot.startTime} on ${alt.slot.date} with ${alt.dentistName}. Please review your details below:`,
      'review'
    );
  };

  // Confirmation with live FastAPI backend call + mock fallback
  const handleConfirmBooking = async () => {
    if (!selectedDentist || !selectedSlot) return;

    setIsSubmitting(true);

    // Flow 1: Rescheduling an existing appointment or request
    if (reschedulingAppointment) {
      const isApt = reschedulingAppointment.referenceCode.startsWith('APT-');
      let finalRef = reschedulingAppointment.referenceCode;

      if (isBackendOnline) {
        if (isApt) {
          const res = await apiClient.rescheduleAppointment(reschedulingAppointment.referenceCode, {
            newDate: selectedSlot.date,
            newStartTime: selectedSlot.startTime,
            newEndTime: selectedSlot.endTime,
            newDentistId: selectedDentist.id,
            reason: patientDetails.reason || 'Rescheduled via WhatsApp Simulator',
          });
          if (!res.success) {
            console.warn('Backend reschedule error:', res.error);
          }
        } else {
          // It's a pending REQ-XXXXXX: cancel the old request & submit an updated request
          await apiClient.cancelAppointment(reschedulingAppointment.referenceCode, 'Patient modified booking request');
          try {
            const reqResult = await apiClient.submitPatientRequest({
              patientName: patientDetails.fullName,
              patientPhone: patientDetails.phone,
              patientAge: patientDetails.ageOrDob,
              dentistId: selectedDentist.id,
              preferredDate: selectedSlot.date,
              preferredStartTime: selectedSlot.startTime,
              preferredEndTime: selectedSlot.endTime,
              reason: `Rescheduled from ${reschedulingAppointment.referenceCode}: ${patientDetails.reason || 'Dental Consultation'}`,
            });
            finalRef = reqResult.requestId;
          } catch (err) {
            console.warn('Backend request submission error:', err);
          }
        }
      }

      const request: AppointmentRequest = {
        patient: patientDetails,
        dentist: selectedDentist,
        date: selectedDateLabel,
        timeSlot: selectedSlot,
        referenceCode: finalRef,
        patientId: patientDetails.patientId,
        createdTimestamp: getCurrentTime(),
      };

      setConfirmedRequest(request);
      setIsSubmitting(false);
      addPatientMessage('Confirm Reschedule', 'review');
      pushStep('confirmed');
      addBotMessage(
        `🎉 Your appointment has been successfully rescheduled!\nReference: ${finalRef}\nNew Slot: ${selectedDateLabel} at ${selectedSlot.startTime} – ${selectedSlot.endTime} with ${selectedDentist.name}.`,
        'confirmed'
      );
      setReschedulingAppointment(null);
      return;
    }

    // Flow 2: Regular new booking request
    let refCode = `REQ-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    let resolvedPatientId: string | undefined = patientDetails.patientId;

    if (isBackendOnline) {
      try {
        // Step A: Register or get patient ID in FastAPI Excel DB if new
        if (!resolvedPatientId) {
          try {
            resolvedPatientId = await apiClient.registerPatient(patientDetails);
          } catch {
            // Patient registration fallback
          }
        }

        // Step B: Submit Patient Request via POST /api/v1/patient-requests
        const reqResult = await apiClient.submitPatientRequest({
          patientName: patientDetails.fullName,
          patientPhone: patientDetails.phone,
          patientAge: patientDetails.ageOrDob,
          dentistId: selectedDentist.id,
          preferredDate: selectedSlot.date,
          preferredStartTime: selectedSlot.startTime,
          preferredEndTime: selectedSlot.endTime,
          reason: patientDetails.reason,
        });

        refCode = reqResult.requestId;
      } catch (err: any) {
        console.warn('Backend request submission fallback to demo mode:', err);
      }
    }

    const request: AppointmentRequest = {
      patient: patientDetails,
      dentist: selectedDentist,
      date: selectedDateLabel,
      timeSlot: selectedSlot,
      referenceCode: refCode,
      patientId: resolvedPatientId,   // PAT-XXXXXX stored here if registered
      createdTimestamp: getCurrentTime(),
    };

    setConfirmedRequest(request);
    setIsSubmitting(false);
    addPatientMessage('Confirm Appointment Request', 'review');
    pushStep('confirmed');
    addBotMessage(`Your appointment request has been recorded! Reference: ${refCode} (Pending Staff Confirmation)`, 'confirmed');
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
                treatments={treatments}
              />
            )}

            {currentStep === 'manage_existing_apt' && matchedExistingRecord && (
              <ManageExistingAptCard
                patientRecord={matchedExistingRecord}
                intent={userIntent}
                onBookNew={() => {
                  setReschedulingAppointment(null);
                  pushStep('select_dentist');
                  addBotMessage('Select your preferred dentist for your new appointment:', 'select_dentist');
                }}
                onSelectToReschedule={(apt) => {
                  setReschedulingAppointment(apt);
                  const doc = dentists.find(
                    (d) => d.id === apt.dentistId || d.name.toLowerCase() === apt.dentistName.toLowerCase()
                  );
                  if (doc) setSelectedDentist(doc);
                  addPatientMessage(
                    `I want to reschedule booking ${apt.referenceCode} (${apt.dentistName}, ${apt.date} at ${apt.time})`,
                    'manage_existing_apt'
                  );
                  pushStep('select_dentist');
                  addBotMessage(
                    `Understood! You are rescheduling booking ${apt.referenceCode}. Would you like to keep ${apt.dentistName} or choose a different doctor?`,
                    'select_dentist'
                  );
                }}
                onSelectToCancel={(apt) => {
                  setCancellingAppointment(apt);
                  addPatientMessage(
                    `I want to cancel booking ${apt.referenceCode} (${apt.dentistName}, ${apt.date} at ${apt.time})`,
                    'manage_existing_apt'
                  );
                  pushStep('cancel_appointment_confirm');
                  addBotMessage(
                    `Please select a cancellation reason for your booking (${apt.referenceCode}) below:`,
                    'cancel_appointment_confirm'
                  );
                }}
                onEditDetails={() => {
                  pushStep('edit_patient_details');
                  addBotMessage('You can update your contact and profile details below:', 'edit_patient_details');
                }}
                onRestart={handleRestart}
              />
            )}

            {currentStep === 'edit_patient_details' && matchedExistingRecord && (
              <UpdatePatientCard
                patientRecord={matchedExistingRecord}
                onSave={async (updates) => {
                  setIsSubmitting(true);
                  if (isBackendOnline && matchedExistingRecord.patientId && !matchedExistingRecord.patientId.includes('PENDING')) {
                    await apiClient.updatePatient(matchedExistingRecord.patientId, updates);
                  }
                  setMatchedExistingRecord((prev) => prev ? {
                    ...prev,
                    fullName: updates.fullName,
                    phone: updates.phone,
                    ageOrDob: updates.ageOrDob,
                    address: updates.address,
                    emergencyContact: updates.emergencyContact,
                  } : null);
                  setPatientDetails((prev) => ({
                    ...prev,
                    fullName: updates.fullName,
                    phone: updates.phone,
                    ageOrDob: updates.ageOrDob,
                    address: updates.address,
                    emergencyContact: updates.emergencyContact,
                  }));
                  setIsSubmitting(false);
                  addPatientMessage(`Updated my contact information to: ${updates.phone}`);
                  addBotMessage(
                    `Your profile details have been successfully updated in DentalFlow clinic records!`,
                    'manage_existing_apt'
                  );
                  pushStep('manage_existing_apt');
                }}
                onCancel={() => {
                  pushStep('manage_existing_apt');
                  addBotMessage('Returned to appointment management.', 'manage_existing_apt');
                }}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 'cancel_appointment_confirm' && matchedExistingRecord && (
              <CancelAppointmentCard
                patientRecord={matchedExistingRecord}
                appointmentToCancel={cancellingAppointment || undefined}
                onConfirmCancel={async (reason) => {
                  setIsSubmitting(true);
                  const targetApt = cancellingAppointment || matchedExistingRecord.upcomingAppointment;
                  const refCode = targetApt?.referenceCode;
                  if (isBackendOnline && refCode) {
                    await apiClient.cancelAppointment(refCode, reason);
                  }
                  // Update record status to cancelled in state
                  setMatchedExistingRecord((prev) => {
                    if (!prev) return prev;
                    const updatedList: UpcomingBookingItem[] = (prev.upcomingAppointments || []).map((a) =>
                      a.referenceCode === refCode ? { ...a, status: 'cancelled' } : a
                    );
                    const updatedUpcoming: UpcomingBookingItem | undefined =
                      prev.upcomingAppointment && prev.upcomingAppointment.referenceCode === refCode
                        ? { ...prev.upcomingAppointment, status: 'cancelled' }
                        : prev.upcomingAppointment;
                    return {
                      ...prev,
                      upcomingAppointments: updatedList,
                      upcomingAppointment: updatedUpcoming,
                    };
                  });
                  setIsSubmitting(false);
                  addPatientMessage(`Cancel appointment. Reason: ${reason}`);
                  addBotMessage(
                    `Your appointment (${refCode || 'booking'}) has been successfully cancelled. The dental time slot has been released. You can book another appointment anytime!`,
                    'manage_existing_apt'
                  );
                  setCancellingAppointment(null);
                  pushStep('manage_existing_apt');
                }}
                onKeepAppointment={() => {
                  setCancellingAppointment(null);
                  pushStep('manage_existing_apt');
                  addBotMessage('Your appointment remains confirmed.', 'manage_existing_apt');
                }}
                isSubmitting={isSubmitting}
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
                onSwitchDentist={() => {
                  const anyDoc = dentists.find((d) => d.id === 'DOC-ANY') || dentists[0];
                  handleDentistSelect(anyDoc);
                }}
                isBackendOnline={isBackendOnline}
              />
            )}

            {currentStep === 'slot_alternatives' && (
              <SlotAlternativesCard
                alternatives={slotAlternatives}
                onSelectAlternative={handleAlternativeSelect}
                onPickOtherDate={() => {
                  pushStep('select_time_range');
                  addBotMessage('Returned to slot picker. Please select another slot or date:', 'select_time_range');
                }}
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
                  reschedulingAppointment={reschedulingAppointment}
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
                onCancelRequest={async (refCode) => {
                  if (isBackendOnline) {
                    await apiClient.cancelAppointment(refCode, 'Cancelled by patient from confirmation card');
                  }
                  addPatientMessage(`Cancel booking request ${refCode}`, 'confirmed');
                  addBotMessage(
                    `Your booking request (${refCode}) has been successfully cancelled. The dental slot is not reserved.`,
                    'confirmed'
                  );
                }}
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
