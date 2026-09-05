import React, { useState, useEffect } from 'react';
import { mockAvailableDates, getMockSlots } from '../mockData';
import type { TimeSlot, Dentist } from '../types';
import { apiClient } from '../apiClient';
import { Calendar, Clock, Lock, Check, Loader2 } from 'lucide-react';

interface SlotPickerProps {
  selectedDentist: Dentist;
  onSelectSlot: (slot: TimeSlot, dateLabel: string) => void;
  onSwitchDentist?: () => void;
  isBackendOnline?: boolean;
  disabled?: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedDentist,
  onSelectSlot,
  onSwitchDentist,
  isBackendOnline = false,
  disabled = false,
}) => {
  const [selectedDate, setSelectedDate] = useState(mockAvailableDates[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      if (isBackendOnline) {
        setLoading(true);
        try {
          const apiSlots = await apiClient.getAvailableSlots(selectedDate.date, selectedDentist.id);
          if (isMounted) {
            setSlots(apiSlots);
          }
        } catch {
          if (isMounted) {
            setSlots(getMockSlots(selectedDentist.id, selectedDate.date));
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setSlots(getMockSlots(selectedDentist.id, selectedDate.date));
      }
    }

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDentist, isBackendOnline]);

  const availableCount = slots.filter((s) => s.isAvailable).length;

  return (
    <div className="slot-picker-card">
      <div className="slot-picker-header">
        <Calendar size={18} className="header-icon" />
        <div>
          <h3 className="picker-title">Select Appointment Date & Time</h3>
          <p className="picker-subtitle">
            Attending: <strong>{selectedDentist.name}</strong>
          </p>
        </div>
      </div>

      {/* Date Navigation Tabs */}
      <div className="date-tabs-bar">
        {mockAvailableDates.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d)}
            disabled={disabled || loading}
            className={`date-tab-btn ${selectedDate.date === d.date ? 'active' : ''}`}
          >
            <span className="date-tab-label">{d.label}</span>
          </button>
        ))}
      </div>

      {/* Availability Summary */}
      <div className={`slot-count-badge ${availableCount === 0 && !loading ? 'no-avail-badge' : ''}`}>
        <Clock size={14} />
        <span>
          {loading
            ? 'Calculating live availability from backend...'
            : availableCount > 0
            ? `${availableCount} open slots available on ${selectedDate.label}`
            : `No open slots for ${selectedDentist.name} on ${selectedDate.label}`}
        </span>
      </div>

      {/* Time Slots Grid or No Availability Banner */}
      {loading ? (
        <div className="slots-loading-state">
          <Loader2 size={24} className="spin-icon" />
          <span>Computing slots from Excel database...</span>
        </div>
      ) : availableCount === 0 ? (
        <div className="no-availability-banner">
          <p className="no-avail-text">
            All time slots are booked or unavailable for {selectedDentist.name} on {selectedDate.label}.
          </p>
          <div className="no-avail-actions">
            {mockAvailableDates.findIndex((d) => d.date === selectedDate.date) < mockAvailableDates.length - 1 && (
              <button
                type="button"
                className="choice-btn primary flex-1"
                onClick={() => {
                  const idx = mockAvailableDates.findIndex((d) => d.date === selectedDate.date);
                  if (idx < mockAvailableDates.length - 1) {
                    setSelectedDate(mockAvailableDates[idx + 1]);
                  }
                }}
              >
                Try Next Available Date
              </button>
            )}
            {onSwitchDentist && (
              <button type="button" className="choice-btn secondary flex-1" onClick={onSwitchDentist}>
                Switch to Any Available Dentist
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => {
            const isAvail = slot.isAvailable;
            return (
              <button
                key={slot.id}
                onClick={() => isAvail && onSelectSlot(slot, selectedDate.label)}
                disabled={disabled || !isAvail}
                className={`slot-time-btn ${isAvail ? 'available' : 'unavailable'}`}
                title={
                  isAvail
                    ? `Book ${slot.startTime} - ${slot.endTime}`
                    : slot.unavailableReason || 'Slot unavailable'
                }
              >
                <div className="slot-btn-content">
                  <span className="slot-time">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <span className="slot-status-tag">
                    {isAvail ? (
                      <>
                        <Check size={12} /> Available
                      </>
                    ) : (
                      <>
                        <Lock size={12} /> {slot.unavailableReason || 'Booked'}
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
