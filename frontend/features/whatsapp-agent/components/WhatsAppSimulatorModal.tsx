'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  X, RotateCcw, Send, Calendar, CheckCircle2, User,
  Clock, ArrowRight, ShieldCheck, Sparkles, AlertTriangle
} from 'lucide-react';
import { useWhatsAppBot } from '../hooks/useWhatsAppBot';
import { SlotSuggestionPicker } from './SlotSuggestionPicker';

interface WhatsAppSimulatorModalProps {
  open: boolean;
  onClose: () => void;
}

export function WhatsAppSimulatorModal({ open, onClose }: WhatsAppSimulatorModalProps) {
  const {
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
  } = useWhatsAppBot();

  const [inputVal, setInputVal] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, step, alternatives]);

  if (!open) return null;

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    setInputVal('');

    if (step === 'collect_phone') {
      handlePhoneSubmit(val);
    } else if (step === 'collect_name') {
      handleNameSubmit(val);
    } else if (step === 'collect_age') {
      handleAgeSubmit(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Floating Smartphone Mockup Frame */}
      <div className="relative z-10 w-full max-w-[400px] h-[680px] max-h-[92vh] rounded-[36px] border-4 border-slate-800 bg-[#0b141a] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Smartphone Speaker & Camera Notch */}
        <div className="h-5 w-full bg-[#0b141a] flex items-center justify-center relative shrink-0">
          <div className="h-3.5 w-24 bg-slate-900 rounded-b-xl flex items-center justify-center">
            <div className="size-2 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* WhatsApp Top App Bar */}
        <div className="bg-[#1f2c34] px-4 py-2.5 flex items-center justify-between text-white shrink-0 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative size-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              ZD
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 border-2 border-[#1f2c34]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h4 className="font-bold text-xs leading-none">Zendenta Dental</h4>
                <ShieldCheck className="size-3 text-emerald-400" />
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">Online · Clinic Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRestart}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 transition"
              title="Restart simulator chat"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 transition"
              title="Close simulator"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Chat Scrollable Area with WhatsApp Wallpaper Pattern */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0b141a] text-xs"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {/* Security Banner */}
          <div className="rounded-lg bg-[#182229] p-2 text-center text-[10px] text-[#8696a0] border border-white/5">
            🔒 Messages to this chat are end-to-end encrypted in Zendenta Dental simulation.
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                    isBot
                      ? 'rounded-tl-xs bg-[#202c33] text-[#e9edef] border border-white/5'
                      : 'rounded-tr-xs bg-[#005c4b] text-[#e9edef]'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="block text-right text-[9px] text-[#8696a0] mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Interactive Steps Card Area */}
          <div className="pt-1">
            {step === 'welcome' && (
              <div className="rounded-2xl border border-white/10 bg-[#111b21] p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#e9edef]">Quick Action:</p>
                <button
                  type="button"
                  onClick={handleStartBooking}
                  className="w-full flex items-center justify-between rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4" /> Book Appointment
                  </span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {step === 'select_dentist' && (
              <div className="rounded-2xl border border-white/10 bg-[#111b21] p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#e9edef]">Select Clinic Dentist:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {dentists.map((doc) => (
                    <button
                      key={doc.dentist_id || (doc as any).id}
                      onClick={() => handleSelectDentist(doc)}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#202c33] p-2 text-left text-xs text-[#e9edef] hover:border-emerald-500 hover:bg-[#233138] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                          {doc.name.replace(/^(Dr\.\s*)/i, '').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{doc.name}</p>
                          <p className="text-[10px] text-[#8696a0]">{doc.specialty || 'General Dentist'}</p>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'select_slot' && selectedDentist && (
              <div className="rounded-2xl border border-white/10 bg-[#111b21] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#e9edef]">Choose Slot ({selectedDate}):</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">{selectedDentist.name}</span>
                </div>

                {/* Date presets */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[0, 1, 2].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const iso = d.toISOString().split('T')[0];
                    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' });
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border transition shrink-0 ${
                          selectedDate === iso
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-[#202c33] text-[#8696a0] border-white/10'
                        }`}
                      >
                        {label} ({iso.slice(5)})
                      </button>
                    );
                  })}
                </div>

                {/* Preset time slots */}
                <div className="grid grid-cols-3 gap-1.5">
                  {['09:30', '10:00', '11:00', '11:30', '14:00', '15:30'].map((time) => (
                    <button
                      key={time}
                      onClick={() => handleSelectSlot(time, selectedDate)}
                      className="rounded-lg border border-white/10 bg-[#202c33] py-2 text-center text-xs font-bold text-[#e9edef] hover:border-emerald-500 hover:bg-emerald-900/30 transition cursor-pointer"
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-[#8696a0] text-center">
                  💡 Tip: Click 11:00 to test the unavailable condition & alternative slot matcher!
                </p>
              </div>
            )}

            {step === 'slot_alternatives' && (
              <div className="rounded-2xl border border-emerald-500/40 bg-[#111b21] p-3 space-y-2">
                <SlotSuggestionPicker
                  alternatives={alternatives}
                  onSelect={handleSelectAlternative}
                />
              </div>
            )}

            {step === 'review' && selectedDentist && (
              <div className="rounded-2xl border border-emerald-500/50 bg-[#111b21] p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Sparkles className="size-4" />
                  <span>Review Booking Details</span>
                </div>

                <div className="rounded-xl bg-[#202c33] p-2.5 text-xs space-y-1 text-[#e9edef]">
                  <p>
                    <span className="text-[#8696a0]">Patient:</span> <strong>{patient.fullName || 'Patient'}</strong>
                  </p>
                  <p>
                    <span className="text-[#8696a0]">Phone:</span> {patient.phone}
                  </p>
                  <p>
                    <span className="text-[#8696a0]">Doctor:</span> {selectedDentist.name}
                  </p>
                  <p>
                    <span className="text-[#8696a0]">Date & Time:</span> {selectedDate} at {selectedTime}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition cursor-pointer shadow-md"
                >
                  {isSubmitting ? 'Recording Booking…' : 'Confirm & Book via WhatsApp'}
                </button>
              </div>
            )}

            {step === 'confirmed' && (
              <div className="rounded-2xl border border-emerald-500 bg-[#111b21] p-4 text-center space-y-2">
                <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Booking Recorded!</h4>
                <p className="text-xs text-[#8696a0]">
                  Reference ID: <span className="font-mono text-emerald-400 font-bold">{confirmedRef}</span>
                </p>
                <p className="text-[11px] text-[#8696a0]">
                  Clinic staff will review and confirm this slot. It will appear on the calendar!
                </p>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-2 text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Start New Request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Bottom Text Input Bar */}
        {(step === 'collect_phone' || step === 'collect_name' || step === 'collect_age') && (
          <form
            onSubmit={handleSendText}
            className="bg-[#1f2c34] p-2.5 flex items-center gap-2 border-t border-white/5 shrink-0"
          >
            <input
              type={step === 'collect_phone' ? 'tel' : 'text'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                step === 'collect_phone'
                  ? 'Enter phone (e.g. +91 98765 43210)'
                  : step === 'collect_name'
                  ? 'Enter your full name'
                  : 'Enter your age or DOB'
              }
              autoFocus
              className="flex-1 rounded-xl bg-[#2a3942] px-3.5 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="size-8 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 transition cursor-pointer shrink-0"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
