import React from 'react';
import type { AlternativeSlot } from '../types';
import { UserCheck, Clock, Sun, ArrowRight } from 'lucide-react';

interface SlotAlternativesCardProps {
  alternatives: AlternativeSlot[];
  onSelectAlternative: (alt: AlternativeSlot) => void;
  onPickOtherDate: () => void;
}

export const SlotAlternativesCard: React.FC<SlotAlternativesCardProps> = ({
  alternatives,
  onSelectAlternative,
  onPickOtherDate,
}) => {
  return (
    <div className="slot-picker-card" style={{ border: '1.5px solid #10b981', background: '#f0fdf4' }}>
      <div className="slot-picker-header" style={{ borderBottomColor: '#bbf7d0' }}>
        <Clock size={18} className="header-icon" style={{ color: '#059669' }} />
        <div>
          <h3 className="picker-title" style={{ color: '#065f46' }}>Top 3 Recommended Alternative Slots</h3>
          <p className="picker-subtitle" style={{ color: '#047857' }}>
            Choose one of the closest available slots calculated for you:
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
        {alternatives.map((alt, idx) => {
          const isSameDoc = alt.type === 'same_doc';
          const isColleague = alt.type === 'same_time_colleague';

          return (
            <button
              key={`alt-${alt.slot.id}-${idx}`}
              onClick={() => onSelectAlternative(alt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #a7f3d0',
                background: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#a7f3d0';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSameDoc ? '#ecfdf5' : isColleague ? '#eff6ff' : '#fef3c7',
                    color: isSameDoc ? '#059669' : isColleague ? '#2563eb' : '#d97706',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {isSameDoc ? <UserCheck size={18} /> : isColleague ? <Clock size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
                      {alt.slot.startTime} – {alt.slot.endTime}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isSameDoc ? '#d1fae5' : isColleague ? '#dbeafe' : '#fef3c7',
                        color: isSameDoc ? '#065f46' : isColleague ? '#1e40af' : '#92400e',
                      }}
                    >
                      {isSameDoc ? 'Same Doctor' : isColleague ? 'Colleague Specialist' : 'Alternative Daypart'}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#4b5563' }}>
                    With <strong>{alt.dentistName}</strong> on {alt.slot.date}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#059669' }} />
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onPickOtherDate}
          style={{
            background: 'none',
            border: 'none',
            color: '#059669',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          ← Back to calendar slots
        </button>
      </div>
    </div>
  );
};
