from datetime import datetime, timedelta
from typing import List, Optional
from app.repositories.base import BaseClinicRepository
from app.repositories.excel_repository import ExcelClinicRepository
from app.models.availability import AvailableSlot
from app.models.appointment import AppointmentStatus


class AvailabilityService:
    def __init__(self, repository: BaseClinicRepository):
        self.repository = repository

    def calculate_available_slots(
        self,
        target_date_str: Optional[str] = None,
        dentist_id: Optional[str] = None,
        slot_duration_minutes: int = 30,
        *,
        date_str: Optional[str] = None
    ) -> List[AvailableSlot]:
        """
        Calculates all available appointment slots for a given date.
        Formula: (Working hours) - (Break time) - (Existing confirmed/pending appointments).

        Does a single workbook read if the repository is ExcelClinicRepository,
        otherwise falls back to separate public method calls.
        """
        target_date_str = target_date_str or date_str or ""
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return []

        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday

        # --- Single-read path (avoids multiple lock acquisitions) ---
        if isinstance(self.repository, ExcelClinicRepository):
            from app.core.locking import get_workbook_lock
            with get_workbook_lock(self.repository.lock_path):
                all_data = self.repository._read_all_sheets()

            if dentist_id:
                dentist = self.repository._get_dentist_unlocked(all_data, dentist_id)
                dentists = [dentist] if (dentist and dentist.is_active) else []
            else:
                dentists = self.repository._list_dentists_unlocked(all_data, active_only=True)

            def get_schedules(did):
                return self.repository._list_schedules_unlocked(all_data, did)

            def get_existing_apts(did):
                return self.repository._list_appointments_unlocked(
                    all_data, date=target_date_str, dentist_id=did
                )

            def is_on_leave(did):
                leaves = self.repository._list_leaves_unlocked(all_data, did)
                return any(
                    l.start_date <= target_date_str <= l.end_date
                    for l in leaves
                )
        else:
            # Generic fallback for any other repository implementation
            if dentist_id:
                dentist = self.repository.get_dentist(dentist_id)
                dentists = [dentist] if (dentist and dentist.is_active) else []
            else:
                dentists = self.repository.list_dentists(active_only=True)

            def get_schedules(did):
                return self.repository.list_schedules_for_dentist(did)

            def get_existing_apts(did):
                return self.repository.list_appointments(date=target_date_str, dentist_id=did)

            def is_on_leave(did):
                leaves = self.repository.list_leaves_for_dentist(did)
                return any(
                    l.start_date <= target_date_str <= l.end_date
                    for l in leaves
                )

        # --- Slot calculation logic ---
        available_slots: List[AvailableSlot] = []
        slot_delta = timedelta(minutes=slot_duration_minutes)

        for d in dentists:
            # Skip dentist entirely if they are on approved leave for this date
            if is_on_leave(d.dentist_id):
                continue

            schedules = get_schedules(d.dentist_id)
            day_schedule = next(
                (s for s in schedules if s.day_of_week == day_of_week and s.is_working_day),
                None
            )

            if not day_schedule:
                continue

            try:
                start_dt = datetime.combine(
                    target_date,
                    datetime.strptime(day_schedule.start_time, "%H:%M").time()
                )
                end_dt = datetime.combine(
                    target_date,
                    datetime.strptime(day_schedule.end_time, "%H:%M").time()
                )
            except ValueError:
                continue

            # Parse break times
            break_start_dt = None
            break_end_dt = None
            if day_schedule.break_start and day_schedule.break_end:
                try:
                    break_start_dt = datetime.combine(
                        target_date,
                        datetime.strptime(day_schedule.break_start, "%H:%M").time()
                    )
                    break_end_dt = datetime.combine(
                        target_date,
                        datetime.strptime(day_schedule.break_end, "%H:%M").time()
                    )
                except ValueError:
                    pass

            # Build busy ranges from existing confirmed/pending appointments
            existing_apts = get_existing_apts(d.dentist_id)
            busy_ranges = []
            for apt in existing_apts:
                if apt.status in [
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.PENDING,
                    AppointmentStatus.RESCHEDULED
                ]:
                    try:
                        apt_start = datetime.combine(
                            target_date,
                            datetime.strptime(apt.start_time, "%H:%M").time()
                        )
                        apt_end = datetime.combine(
                            target_date,
                            datetime.strptime(apt.end_time, "%H:%M").time()
                        )
                        busy_ranges.append((apt_start, apt_end))
                    except ValueError:
                        pass

            # Walk the working day in slot increments
            current_slot_start = start_dt
            while current_slot_start + slot_delta <= end_dt:
                current_slot_end = current_slot_start + slot_delta

                overlaps_break = False
                if break_start_dt and break_end_dt:
                    if not (current_slot_end <= break_start_dt or current_slot_start >= break_end_dt):
                        overlaps_break = True

                overlaps_appointment = any(
                    not (current_slot_end <= b_start or current_slot_start >= b_end)
                    for b_start, b_end in busy_ranges
                )

                if not overlaps_break and not overlaps_appointment:
                    available_slots.append(AvailableSlot(
                        dentist_id=d.dentist_id,
                        dentist_name=d.name,
                        date=target_date_str,
                        start_time=current_slot_start.strftime("%H:%M"),
                        end_time=current_slot_end.strftime("%H:%M"),
                        duration_minutes=slot_duration_minutes,
                        is_available=True
                    ))

                current_slot_start += slot_delta

        return sorted(available_slots, key=lambda s: (s.date, s.start_time, s.dentist_name))
