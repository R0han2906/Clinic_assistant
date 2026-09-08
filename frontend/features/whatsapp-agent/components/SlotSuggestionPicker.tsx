'use client';

import React from 'react';
import { UserCheck, Clock, Sun, ArrowRight } from 'lucide-react';
import { SlotAlternative } from '../types';

interface SlotSuggestionPickerProps {
  alternatives: SlotAlternative[];
  onSelect: (alt: SlotAlternative) => void;
  disabled?: boolean;
}

export function SlotSuggestionPicker({
  alternatives,
  onSelect,
  disabled = false,
}: SlotSuggestionPickerProps) {
  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        No alternative slots available for this date.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        ⚡ Top 3 Smart Recommendations
      </p>

      <div className="flex flex-col gap-2">
        {alternatives.map((alt, idx) => {
          const isSameDoc = alt.type === 'same_doc';
          const isColleague = alt.type === 'same_time_colleague';

          return (
            <button
              key={`chip-${alt.dentistId}-${alt.startTime}-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(alt)}
              className="group flex items-center justify-between rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-2.5 text-left transition hover:border-emerald-500 hover:bg-emerald-100/80 active:scale-[0.99] disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                    isSameDoc
                      ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                      : isColleague
                      ? 'bg-sky-200/80 text-sky-900 dark:bg-sky-900 dark:text-sky-200'
                      : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                  }`}
                >
                  {isSameDoc ? (
                    <UserCheck className="size-3.5" />
                  ) : isColleague ? (
                    <Clock className="size-3.5" />
                  ) : (
                    <Sun className="size-3.5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground">
                      {alt.startTime} – {alt.endTime}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold ${
                        isSameDoc
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isColleague
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {alt.categoryLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    With <span className="font-semibold text-foreground">{alt.dentistName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform dark:text-emerald-400">
                <span>Select</span>
                <ArrowRight className="size-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
