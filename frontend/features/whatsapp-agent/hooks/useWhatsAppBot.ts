import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { DentistResponse } from '@/types/api';
import { whatsappBotService } from '../services/whatsapp-bot.service';
import { BotStep, WhatsAppMessage, PatientProfile, SlotAlternative } from '../types';

function getNowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function useWhatsAppBot() {
  const [dentists, setDentists] = useState<DentistResponse[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: 'Hello! 👋 Welcome to Zendenta Dental Clinic WhatsApp Booking Assistant.\n\nAre you looking to book a new appointment or check an existing one?',
      timestamp: getNowTime(),
      step: 'welcome',
    },
  ]);

  const [step, setStep] = useState<BotStep>('welcome');
  const [patient, setPatient] = useState<PatientProfile>({
    fullName: '',
    phone: '',
    dobOrAge: '',
    isExisting: false,
  });

  const [selectedDentist, setSelectedDentist] = useState<DentistResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [alternatives, setAlternatives] = useState<SlotAlternative[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  // Load dentists on mount
  useEffect(() => {
    async function loadDentists() {
      try {
        const list = await api.dentists.list();
        if (list && list.length > 0) {
          setDentists(list);
          setSelectedDentist(list[0]);
          return;
        }
      } catch (err) {
        console.warn('[useWhatsAppBot] Failed to load dentists, using fallbacks:', err);
      }
      const fallbacks: any[] = [
        { id: 'DEN-000001', dentist_id: 'DEN-000001', name: 'Dr. Sarah Wilson', specialty: 'General Dentistry' },
        { id: 'DEN-000002', dentist_id: 'DEN-000002', name: 'Dr. Michael Chen', specialty: 'Orthodontics' },
        { id: 'DEN-000003', dentist_id: 'DEN-000003', name: 'ROHAN', specialty: 'General Dentistry' },
      ];
      setDentists(fallbacks as any);
      setSelectedDentist(fallbacks[0]);
    }
    loadDentists();
  }, []);

  const addMessage = useCallback((sender: 'bot' | 'patient', text: string, newStep?: BotStep) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender,
        text,
        timestamp: getNowTime(),
        step: newStep,
      },
    ]);
  }, []);

  const handleStartBooking = useCallback(() => {
    addMessage('patient', 'I want to book an appointment');
    setStep('collect_phone');
    addMessage(
      'bot',
      'Great! Please enter your mobile phone number so we can look up your record:',
      'collect_phone'
    );
  }, [addMessage]);

  const handlePhoneSubmit = useCallback(
    async (phoneInput: string) => {
      addMessage('patient', phoneInput, 'collect_phone');
      setIsSubmitting(true);

      const match = await whatsappBotService.searchPatient(phoneInput);
      setIsSubmitting(false);

      if (match) {
        setPatient(match);
        setStep('select_dentist');
        addMessage(
          'bot',
          `Welcome back, ${match.fullName}! We recognized your phone number and loaded your Zendenta profile (${match.patientId || 'PAT-000001'}).`,
          'existing_patient_greet'
        );
        addMessage(
          'bot',
          'Which doctor would you like to schedule your appointment with?',
          'select_dentist'
        );
      } else {
        setPatient((prev) => ({ ...prev, phone: phoneInput, isExisting: false }));
        setStep('collect_name');
        addMessage(
          'bot',
          'Thank you! As this is your first time with us, please enter your Full Name:',
          'collect_name'
        );
      }
    },
    [addMessage]
  );

  const handleNameSubmit = useCallback(
    (name: string) => {
      addMessage('patient', name, 'collect_name');
      setPatient((prev) => ({ ...prev, fullName: name }));
      setStep('collect_age');
      addMessage('bot', `Nice to meet you, ${name}! Please enter your Age or Date of Birth:`, 'collect_age');
    },
    [addMessage]
  );

  const handleAgeSubmit = useCallback(
    (age: string) => {
      addMessage('patient', age, 'collect_age');
      setPatient((prev) => ({ ...prev, dobOrAge: age }));
      setStep('select_dentist');
      addMessage('bot', 'Got it! Which dentist would you prefer for your visit?', 'select_dentist');
    },
    [addMessage]
  );

  const handleSelectDentist = useCallback(
    (dentist: DentistResponse) => {
      setSelectedDentist(dentist);
      addMessage('patient', `Dr. ${dentist.name}`, 'select_dentist');
      setStep('select_slot');
      addMessage(
        'bot',
        `Excellent choice. Selected Dr. ${dentist.name}. Please select your preferred date and time slot:`,
        'select_slot'
      );
    },
    [addMessage]
  );

  const handleSelectSlot = useCallback(
    async (time: string, dateStr: string) => {
      setSelectedTime(time);
      setSelectedDate(dateStr);
      addMessage('patient', `Preferred time: ${time} on ${dateStr}`, 'select_slot');
      setIsSubmitting(true);

      const targetDocId = selectedDentist?.dentist_id || (selectedDentist as any)?.id || 'DEN-000001';
      const check = await whatsappBotService.validateSlotAvailability({
        date: dateStr,
        startTime: time,
        dentistId: targetDocId,
        dentists,
      });

      setIsSubmitting(false);

      if (!check.isAvailable) {
        // Condition: Slot is filled or doctor unavailable
        setAlternatives(check.alternatives);
        setStep('slot_alternatives');
        addMessage(
          'bot',
          `⚠️ Sorry, Dr. ${selectedDentist?.name} is already booked at ${time} on ${dateStr} (or outside working hours).`,
          'slot_alternatives'
        );
        addMessage(
          'bot',
          'Here are the top 3 closest available alternative slots calculated for you. Please tap an option below:',
          'slot_alternatives'
        );
      } else {
        // Condition: Slot is available
        setStep('review');
        addMessage(
          'bot',
          `Great news! ${time} on ${dateStr} is available with Dr. ${selectedDentist?.name}.\n\nPlease review your details and confirm below:`,
          'review'
        );
      }
    },
    [addMessage, selectedDentist, dentists]
  );

  const handleSelectAlternative = useCallback(
    (alt: SlotAlternative) => {
      const matchDoc =
        dentists.find((d) => (d.dentist_id || (d as any).id) === alt.dentistId) ||
        selectedDentist;
      if (matchDoc) setSelectedDentist(matchDoc);
      setSelectedTime(alt.startTime);
      setSelectedDate(alt.date);

      addMessage(
        'patient',
        `Selected alternative: ${alt.startTime} with ${alt.dentistName}`,
        'slot_alternatives'
      );
      setStep('review');
      addMessage(
        'bot',
        `Reserved ${alt.startTime} on ${alt.date} with ${alt.dentistName}.\n\nPlease review your appointment details and confirm:`,
        'review'
      );
    },
    [addMessage, dentists, selectedDentist]
  );

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedDentist || !selectedTime) return;
    setIsSubmitting(true);
    addMessage('patient', 'Confirm Appointment Request', 'review');

    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endMins = (h || 0) * 60 + (m || 0) + 30;
      const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
      const endM = String(endMins % 60).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const res = await whatsappBotService.confirmBooking({
        patient,
        dentistId: selectedDentist.dentist_id || (selectedDentist as any).id,
        date: selectedDate,
        startTime: selectedTime,
        endTime,
      });

      setConfirmedRef(res.requestId);
      setStep('confirmed');
      addMessage(
        'bot',
        `🎉 Your appointment request has been recorded!\nReference Code: ${res.requestId}\n\nOur front-desk team will confirm your slot shortly. You will receive WhatsApp updates here.`,
        'confirmed'
      );
    } catch (err: any) {
      addMessage(
        'bot',
        `Could not complete request: ${err?.message || 'Server error'}. Connecting you to staff.`,
        'handoff'
      );
      setStep('handoff');
    } finally {
      setIsSubmitting(false);
    }
  }, [addMessage, patient, selectedDentist, selectedTime, selectedDate]);

  const handleRestart = useCallback(() => {
    setStep('welcome');
    setPatient({ fullName: '', phone: '', dobOrAge: '', isExisting: false });
    setSelectedTime('');
    setAlternatives([]);
    setConfirmedRef(null);
    setMessages([
      {
        id: `restart-${Date.now()}`,
        sender: 'bot',
        text: 'Simulation restarted. Welcome to Zendenta Dental Clinic WhatsApp Assistant! 👋\nHow can we help you today?',
        timestamp: getNowTime(),
        step: 'welcome',
      },
    ]);
  }, []);

  return {
    messages,
    step,
    patient,
    dentists,
    selectedDentist,
    selectedDate,
    setSelectedDate,
    selectedTime,
    alternatives,
    isSubmitting,
    confirmedRef,
    handleStartBooking,
    handlePhoneSubmit,
    handleNameSubmit,
    handleAgeSubmit,
    handleSelectDentist,
    handleSelectSlot,
    handleSelectAlternative,
    handleConfirmBooking,
    handleRestart,
  };
}
