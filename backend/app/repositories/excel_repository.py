import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from app.core.config import settings
from app.core.locking import get_workbook_lock
from app.core.exceptions import (
    WorkbookWriteError, SlotConflictError
)
from app.models.patient import PatientResponse, PatientCreate
from app.models.visit import VisitResponse, VisitCreate
from app.models.dentist import DentistResponse, DentistCreate
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.models.appointment import AppointmentResponse, AppointmentCreate, AppointmentStatus
from app.models.audit import AuditLogEntry
from app.repositories.base import BaseClinicRepository
from app.repositories.excel_schema import (
    ALL_SHEETS, SHEET_COLUMNS,
    SHEET_PATIENTS, SHEET_VISITS, SHEET_DENTISTS, SHEET_AVAILABILITY,
    SHEET_LEAVES, SHEET_APPOINTMENTS, SHEET_STAFF, SHEET_AUDIT, SHEET_METADATA,
    DEFAULT_DENTISTS, DEFAULT_AVAILABILITY, DEFAULT_METADATA
)


class ExcelClinicRepository(BaseClinicRepository):
    """
    OpenPyXL-based repository implementation for clinic pilot storage.
    Enforces atomic file writes, automatic backups, and thread/process locking.

    Architecture: Every public method acquires the workbook lock ONCE, reads
    all sheet data into memory, performs all operations on the in-memory dict
    via private _unlocked helpers, then writes back — releasing the lock once.
    This eliminates all re-entrant lock deadlock scenarios.
    """

    def __init__(self, workbook_path: Optional[Path] = None, backup_dir: Optional[Path] = None):
        self.workbook_path = Path(workbook_path or settings.WORKBOOK_PATH).resolve()
        self.backup_dir = Path(backup_dir or settings.BACKUP_DIR).resolve()
        self.lock_path = self.workbook_path.parent / f"{self.workbook_path.name}.lock"
        self.initialize_storage()

    # =========================================================================
    # INITIALIZATION & HEALTH
    # =========================================================================

    def initialize_storage(self) -> None:
        """Creates and formats the Excel workbook if it does not already exist."""
        self.workbook_path.parent.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        with get_workbook_lock(self.lock_path):
            if not self.workbook_path.exists():
                self._create_fresh_workbook()

    def check_health(self) -> Dict[str, Any]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            backups = list(self.backup_dir.glob("*.xlsx"))
            return {
                "status": "healthy",
                "workbook_exists": self.workbook_path.exists(),
                "workbook_path": str(self.workbook_path),
                "total_patients": len(all_data.get(SHEET_PATIENTS, [])),
                "total_appointments": len(all_data.get(SHEET_APPOINTMENTS, [])),
                "total_dentists": len(all_data.get(SHEET_DENTISTS, [])),
                "total_backups": len(backups),
                "last_checked": datetime.now().isoformat()
            }

    # =========================================================================
    # WORKBOOK I/O INTERNALS
    # =========================================================================

    def _create_fresh_workbook(self) -> None:
        """Called only when workbook does not exist, already under lock."""
        wb = openpyxl.Workbook()
        default_sheet = wb.active
        if default_sheet:
            wb.remove(default_sheet)

        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1A365D", end_color="1A365D", fill_type="solid")

        for sheet_name in ALL_SHEETS:
            ws = wb.create_sheet(title=sheet_name)
            columns = SHEET_COLUMNS.get(sheet_name, [])
            ws.append(columns)
            for col_num, _ in enumerate(columns, 1):
                cell = ws.cell(row=1, column=col_num)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")

        # Seed initial dentists
        ws_dentists = wb[SHEET_DENTISTS]
        for d in DEFAULT_DENTISTS:
            ws_dentists.append([
                d["dentist_id"], d["name"], d["specialty"], d["phone"],
                d["email"], d["color_code"], "TRUE" if d["is_active"] else "FALSE",
                d["created_at"]
            ])

        # Seed initial availability
        ws_avail = wb[SHEET_AVAILABILITY]
        for a in DEFAULT_AVAILABILITY:
            ws_avail.append([
                a["availability_id"], a["dentist_id"], a["day_of_week"],
                a["start_time"], a["end_time"], a["break_start"], a["break_end"],
                "TRUE" if a["is_working_day"] else "FALSE"
            ])

        # Seed initial metadata
        ws_meta = wb[SHEET_METADATA]
        for m in DEFAULT_METADATA:
            ws_meta.append([m["key"], m["value"], m["updated_at"]])

        self._auto_fit_columns(wb)
        self._save_workbook_atomic(wb)

    def _auto_fit_columns(self, wb: openpyxl.Workbook) -> None:
        for ws in wb.worksheets:
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    val_str = str(cell.value or "")
                    if len(val_str) > max_len:
                        max_len = len(val_str)
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    def _save_workbook_atomic(self, wb: openpyxl.Workbook) -> None:
        """
        Saves the workbook to a temp file, creates a timestamped backup if the
        original exists, then atomically replaces the original.
        Always called from within an existing lock — no lock acquired here.
        """
        temp_path = self.workbook_path.with_name(
            f"{self.workbook_path.stem}.tmp{self.workbook_path.suffix}"
        )
        try:
            wb.save(temp_path)
            wb.close()

            if self.workbook_path.exists():
                self.backup_dir.mkdir(parents=True, exist_ok=True)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                backup_file = self.backup_dir / f"clinic_data_{timestamp}.xlsx"
                shutil.copy2(self.workbook_path, backup_file)

            # Atomic replace — Windows-compatible
            os.replace(str(temp_path), str(self.workbook_path))
        except Exception as e:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            raise WorkbookWriteError(f"Failed to atomically save workbook: {str(e)}")

    def _read_all_sheets(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Reads all rows from all sheets into a dict of lists.
        Must be called inside an existing lock.
        """
        wb = openpyxl.load_workbook(self.workbook_path, data_only=True)
        try:
            data: Dict[str, List[Dict[str, Any]]] = {}
            for sheet_name in ALL_SHEETS:
                if sheet_name not in wb.sheetnames:
                    data[sheet_name] = []
                    continue
                ws = wb[sheet_name]
                rows = list(ws.iter_rows(values_only=True))
                if not rows:
                    data[sheet_name] = []
                    continue
                headers = [
                    str(h).strip() if h is not None else f"col_{i}"
                    for i, h in enumerate(rows[0])
                ]
                sheet_rows = []
                for row in rows[1:]:
                    if all(c is None for c in row):
                        continue
                    row_dict: Dict[str, str] = {}
                    for i, header in enumerate(headers):
                        val = row[i] if i < len(row) else None
                        row_dict[header] = "" if val is None else str(val).strip()
                    sheet_rows.append(row_dict)
                data[sheet_name] = sheet_rows
            return data
        finally:
            wb.close()

    def _write_all_sheets(self, all_data: Dict[str, List[Dict[str, Any]]]) -> None:
        """
        Re-generates and atomically saves the workbook from the given data dict.
        Must be called inside an existing lock.
        """
        wb = openpyxl.Workbook()
        default_sheet = wb.active
        if default_sheet:
            wb.remove(default_sheet)

        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1A365D", end_color="1A365D", fill_type="solid")

        for sheet_name in ALL_SHEETS:
            ws = wb.create_sheet(title=sheet_name)
            columns = SHEET_COLUMNS.get(sheet_name, [])
            ws.append(columns)
            for col_num in range(1, len(columns) + 1):
                cell = ws.cell(row=1, column=col_num)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")

            for row_dict in all_data.get(sheet_name, []):
                row_vals = [row_dict.get(col, "") for col in columns]
                ws.append(row_vals)

        self._auto_fit_columns(wb)
        self._save_workbook_atomic(wb)

    # =========================================================================
    # SEQUENCE ID HELPER
    # =========================================================================

    def _next_sequence(self, rows: List[Dict[str, Any]], id_field: str) -> int:
        """
        Returns max sequence number + 1 by parsing existing ID values.
        Collision-safe even after deletions — never uses len(rows).
        """
        nums = []
        for r in rows:
            raw = r.get(id_field, "")
            parts = raw.split("-")
            if parts and parts[-1].isdigit():
                nums.append(int(parts[-1]))
        return max(nums, default=0) + 1

    # =========================================================================
    # PATIENTS — PUBLIC (lock) + PRIVATE (no lock)
    # =========================================================================

    def list_patients(self) -> List[PatientResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._list_patients_unlocked(all_data)

    def _list_patients_unlocked(self, all_data: Dict) -> List[PatientResponse]:
        """Builds PatientResponse list from already-loaded sheet data. No lock."""
        results = []
        for r in all_data.get(SHEET_PATIENTS, []):
            results.append(PatientResponse(
                patient_id=r.get("patient_id", ""),
                full_name=r.get("full_name", ""),
                dob_or_age=r.get("dob_or_age", ""),
                phone=r.get("phone", ""),
                email=r.get("email") or None,
                emergency_contact=r.get("emergency_contact") or None,
                consent_status=r.get("consent_status", "acknowledged"),
                created_at=r.get("created_at", ""),
                updated_at=r.get("updated_at", "")
            ))
        return results

    def get_patient(self, patient_id: str) -> Optional[PatientResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._get_patient_unlocked(all_data, patient_id)

    def _get_patient_unlocked(
        self, all_data: Dict, patient_id: str
    ) -> Optional[PatientResponse]:
        """Finds a patient by ID from already-loaded data. No lock."""
        for p in self._list_patients_unlocked(all_data):
            if p.patient_id.lower() == patient_id.lower():
                return p
        return None

    def find_patients(self, query: str) -> List[PatientResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            patients = self._list_patients_unlocked(all_data)
        query_clean = query.strip().lower()
        if not query_clean:
            return patients
        return [
            p for p in patients
            if query_clean in p.patient_id.lower()
            or query_clean in p.full_name.lower()
            or query_clean in p.phone.replace(" ", "").replace("-", "")
            or (p.email and query_clean in p.email.lower())
        ]

    def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            patients_rows = all_data.get(SHEET_PATIENTS, [])

            seq = self._next_sequence(patients_rows, "patient_id")
            patient_id = f"PAT-{seq:06d}"
            now_iso = datetime.now().isoformat()

            new_row = {
                "patient_id": patient_id,
                "full_name": patient_data.full_name,
                "dob_or_age": patient_data.dob_or_age,
                "phone": patient_data.phone,
                "email": patient_data.email or "",
                "emergency_contact": patient_data.emergency_contact or "",
                "consent_status": patient_data.consent_status,
                "created_at": now_iso,
                "updated_at": now_iso
            }
            patients_rows.append(new_row)
            all_data[SHEET_PATIENTS] = patients_rows

            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_reception",
                "entity_type": "PATIENT",
                "entity_id": patient_id,
                "action": "CREATE",
                "details": f"Registered patient {patient_data.full_name} ({patient_data.phone})"
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

        return PatientResponse(
            patient_id=patient_id,
            full_name=patient_data.full_name,
            dob_or_age=patient_data.dob_or_age,
            phone=patient_data.phone,
            email=patient_data.email,
            emergency_contact=patient_data.emergency_contact,
            consent_status=patient_data.consent_status,
            created_at=now_iso,
            updated_at=now_iso
        )

    def update_patient(self, patient_id: str, updates: Dict[str, Any]) -> Optional[PatientResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            patients_rows = all_data.get(SHEET_PATIENTS, [])
            target = None
            for r in patients_rows:
                if r.get("patient_id", "").lower() == patient_id.lower():
                    target = r
                    break
            if not target:
                return None

            now_iso = datetime.now().isoformat()
            for k, v in updates.items():
                if k in SHEET_COLUMNS[SHEET_PATIENTS] and k not in ["patient_id", "created_at"]:
                    target[k] = "" if v is None else str(v)
            target["updated_at"] = now_iso

            self._write_all_sheets(all_data)

        return PatientResponse(
            patient_id=target["patient_id"],
            full_name=target["full_name"],
            dob_or_age=target["dob_or_age"],
            phone=target["phone"],
            email=target.get("email") or None,
            emergency_contact=target.get("emergency_contact") or None,
            consent_status=target.get("consent_status", "acknowledged"),
            created_at=target["created_at"],
            updated_at=target["updated_at"]
        )

    # =========================================================================
    # VISITS
    # =========================================================================

    def list_visits_for_patient(self, patient_id: str) -> List[VisitResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            visits_rows = all_data.get(SHEET_VISITS, [])
            dentists_map = {
                d.get("dentist_id"): d.get("name")
                for d in all_data.get(SHEET_DENTISTS, [])
            }

        results = []
        for r in visits_rows:
            if r.get("patient_id", "").lower() == patient_id.lower():
                results.append(VisitResponse(
                    visit_id=r.get("visit_id", ""),
                    patient_id=r.get("patient_id", ""),
                    visit_date=r.get("visit_date", ""),
                    dentist_id=r.get("dentist_id", ""),
                    dentist_name=dentists_map.get(r.get("dentist_id", "")),
                    visit_type=r.get("visit_type", ""),
                    summary=r.get("summary", ""),
                    follow_up_recommendation=r.get("follow_up_recommendation") or None,
                    created_at=r.get("created_at", "")
                ))
        return sorted(results, key=lambda v: v.visit_date, reverse=True)

    def create_visit(self, visit_data: VisitCreate) -> VisitResponse:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            visits_rows = all_data.get(SHEET_VISITS, [])
            dentists_map = {
                d.get("dentist_id"): d.get("name")
                for d in all_data.get(SHEET_DENTISTS, [])
            }

            seq = self._next_sequence(visits_rows, "visit_id")
            visit_id = f"VIS-{seq:06d}"
            now_iso = datetime.now().isoformat()

            new_row = {
                "visit_id": visit_id,
                "patient_id": visit_data.patient_id,
                "visit_date": visit_data.visit_date,
                "dentist_id": visit_data.dentist_id,
                "visit_type": visit_data.visit_type,
                "summary": visit_data.summary,
                "follow_up_recommendation": visit_data.follow_up_recommendation or "",
                "created_at": now_iso
            }
            visits_rows.append(new_row)
            all_data[SHEET_VISITS] = visits_rows

            self._write_all_sheets(all_data)

        return VisitResponse(
            visit_id=visit_id,
            patient_id=visit_data.patient_id,
            visit_date=visit_data.visit_date,
            dentist_id=visit_data.dentist_id,
            dentist_name=dentists_map.get(visit_data.dentist_id),
            visit_type=visit_data.visit_type,
            summary=visit_data.summary,
            follow_up_recommendation=visit_data.follow_up_recommendation,
            created_at=now_iso
        )

    # =========================================================================
    # DENTISTS — PUBLIC (lock) + PRIVATE (no lock)
    # =========================================================================

    def list_dentists(self, active_only: bool = True) -> List[DentistResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._list_dentists_unlocked(all_data, active_only)

    def _list_dentists_unlocked(
        self, all_data: Dict, active_only: bool = True
    ) -> List[DentistResponse]:
        """Builds DentistResponse list from already-loaded data. No lock."""
        results = []
        for r in all_data.get(SHEET_DENTISTS, []):
            is_active = str(r.get("is_active", "TRUE")).upper() in ["TRUE", "1", "YES"]
            if active_only and not is_active:
                continue
            results.append(DentistResponse(
                dentist_id=r.get("dentist_id", ""),
                name=r.get("name", ""),
                specialty=r.get("specialty", ""),
                phone=r.get("phone") or None,
                email=r.get("email") or None,
                color_code=r.get("color_code", "#2B6CB0"),
                is_active=is_active,
                created_at=r.get("created_at", "")
            ))
        return results

    def get_dentist(self, dentist_id: str) -> Optional[DentistResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._get_dentist_unlocked(all_data, dentist_id)

    def _get_dentist_unlocked(
        self, all_data: Dict, dentist_id: str
    ) -> Optional[DentistResponse]:
        """Finds a dentist by ID from already-loaded data. No lock."""
        for d in self._list_dentists_unlocked(all_data, active_only=False):
            if d.dentist_id.lower() == dentist_id.lower():
                return d
        return None

    def create_dentist(self, dentist_data: DentistCreate) -> DentistResponse:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            dentists_rows = all_data.get(SHEET_DENTISTS, [])

            seq = self._next_sequence(dentists_rows, "dentist_id")
            dentist_id = f"DOC-{seq:06d}"
            now_iso = datetime.now().isoformat()

            new_row = {
                "dentist_id": dentist_id,
                "name": dentist_data.name,
                "specialty": dentist_data.specialty,
                "phone": dentist_data.phone or "",
                "email": dentist_data.email or "",
                "color_code": dentist_data.color_code,
                "is_active": "TRUE" if dentist_data.is_active else "FALSE",
                "created_at": now_iso
            }
            dentists_rows.append(new_row)
            all_data[SHEET_DENTISTS] = dentists_rows

            self._write_all_sheets(all_data)

        return DentistResponse(
            dentist_id=dentist_id,
            name=dentist_data.name,
            specialty=dentist_data.specialty,
            phone=dentist_data.phone,
            email=dentist_data.email,
            color_code=dentist_data.color_code,
            is_active=dentist_data.is_active,
            created_at=now_iso
        )

    # =========================================================================
    # AVAILABILITY / SCHEDULES
    # =========================================================================

    def list_schedules_for_dentist(self, dentist_id: str) -> List[WorkingScheduleItem]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._list_schedules_unlocked(all_data, dentist_id)

    def _list_schedules_unlocked(
        self, all_data: Dict, dentist_id: str
    ) -> List[WorkingScheduleItem]:
        """Reads schedules for a dentist from already-loaded data. No lock."""
        results = []
        for r in all_data.get(SHEET_AVAILABILITY, []):
            if r.get("dentist_id", "").lower() == dentist_id.lower():
                is_working = str(r.get("is_working_day", "TRUE")).upper() in ["TRUE", "1", "YES"]
                results.append(WorkingScheduleItem(
                    availability_id=r.get("availability_id"),
                    dentist_id=r.get("dentist_id", ""),
                    day_of_week=int(r.get("day_of_week", 0)),
                    start_time=r.get("start_time", "09:00"),
                    end_time=r.get("end_time", "17:00"),
                    break_start=r.get("break_start") or None,
                    break_end=r.get("break_end") or None,
                    is_working_day=is_working
                ))
        return results

    def update_schedule_for_day(
        self,
        dentist_id: str,
        day_of_week: int,
        updates: ScheduleUpdate
    ) -> Optional[WorkingScheduleItem]:
        """
        Updates a dentist's working schedule for a specific day of the week.
        Creates a new row if one does not yet exist for that day.
        """
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            avail_rows = all_data.get(SHEET_AVAILABILITY, [])

            target = None
            for r in avail_rows:
                if (
                    r.get("dentist_id", "").lower() == dentist_id.lower()
                    and str(r.get("day_of_week", "")) == str(day_of_week)
                ):
                    target = r
                    break

            now_iso = datetime.now().isoformat()

            if target:
                # Update existing row
                target["start_time"] = updates.start_time
                target["end_time"] = updates.end_time
                target["break_start"] = updates.break_start or ""
                target["break_end"] = updates.break_end or ""
                target["is_working_day"] = "TRUE" if updates.is_working_day else "FALSE"
            else:
                # Create new schedule row for this day
                seq = self._next_sequence(avail_rows, "availability_id")
                target = {
                    "availability_id": f"AVL-{seq:06d}",
                    "dentist_id": dentist_id,
                    "day_of_week": str(day_of_week),
                    "start_time": updates.start_time,
                    "end_time": updates.end_time,
                    "break_start": updates.break_start or "",
                    "break_end": updates.break_end or "",
                    "is_working_day": "TRUE" if updates.is_working_day else "FALSE"
                }
                avail_rows.append(target)

            all_data[SHEET_AVAILABILITY] = avail_rows

            audit_rows = all_data.get(SHEET_AUDIT, [])
            day_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_admin",
                "entity_type": "SCHEDULE",
                "entity_id": dentist_id,
                "action": "UPDATE",
                "details": (
                    f"Updated schedule for {dentist_id} on {day_names[day_of_week]}: "
                    f"{updates.start_time}-{updates.end_time}, "
                    f"working={updates.is_working_day}"
                )
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

        return WorkingScheduleItem(
            availability_id=target.get("availability_id"),
            dentist_id=dentist_id,
            day_of_week=day_of_week,
            start_time=updates.start_time,
            end_time=updates.end_time,
            break_start=updates.break_start or None,
            break_end=updates.break_end or None,
            is_working_day=updates.is_working_day
        )

    def list_leaves_for_dentist(self, dentist_id: str) -> List[LeaveItem]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._list_leaves_unlocked(all_data, dentist_id)

    def _list_leaves_unlocked(self, all_data: Dict, dentist_id: str) -> List[LeaveItem]:
        """Reads leaves for a dentist from already-loaded data. No lock."""
        results = []
        for r in all_data.get(SHEET_LEAVES, []):
            if r.get("dentist_id", "").lower() == dentist_id.lower():
                results.append(LeaveItem(
                    leave_id=r.get("leave_id"),
                    dentist_id=r.get("dentist_id", ""),
                    start_date=r.get("start_date", ""),
                    end_date=r.get("end_date", ""),
                    reason=r.get("reason") or None,
                    created_at=r.get("created_at") or None
                ))
        return sorted(results, key=lambda l: l.start_date)

    def create_leave_for_dentist(self, dentist_id: str, leave_data: LeaveCreate) -> LeaveItem:
        """Blocks a dentist for a date range. Persisted in the Leaves sheet."""
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            leaves_rows = all_data.get(SHEET_LEAVES, [])

            seq = self._next_sequence(leaves_rows, "leave_id")
            leave_id = f"LVE-{seq:06d}"
            now_iso = datetime.now().isoformat()

            new_row = {
                "leave_id": leave_id,
                "dentist_id": dentist_id,
                "start_date": leave_data.start_date,
                "end_date": leave_data.end_date,
                "reason": leave_data.reason or "",
                "created_at": now_iso
            }
            leaves_rows.append(new_row)
            all_data[SHEET_LEAVES] = leaves_rows

            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_admin",
                "entity_type": "LEAVE",
                "entity_id": dentist_id,
                "action": "CREATE",
                "details": (
                    f"Leave for {dentist_id} from {leave_data.start_date} "
                    f"to {leave_data.end_date}. Reason: {leave_data.reason or 'N/A'}"
                )
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

        return LeaveItem(
            leave_id=leave_id,
            dentist_id=dentist_id,
            start_date=leave_data.start_date,
            end_date=leave_data.end_date,
            reason=leave_data.reason,
            created_at=now_iso
        )

    # =========================================================================
    # APPOINTMENTS — PUBLIC (lock) + PRIVATE (no lock)
    # =========================================================================

    def list_appointments(
        self,
        date: Optional[str] = None,
        dentist_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._list_appointments_unlocked(all_data, date, dentist_id, patient_id, status)

    def _list_appointments_unlocked(
        self,
        all_data: Dict,
        date: Optional[str] = None,
        dentist_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        """Builds AppointmentResponse list from already-loaded data. No lock."""
        apt_rows = all_data.get(SHEET_APPOINTMENTS, [])
        patients_map = {p.get("patient_id"): p for p in all_data.get(SHEET_PATIENTS, [])}
        dentists_map = {d.get("dentist_id"): d.get("name") for d in all_data.get(SHEET_DENTISTS, [])}

        results = []
        for r in apt_rows:
            if date and r.get("date") != date:
                continue
            if dentist_id and r.get("dentist_id", "").lower() != dentist_id.lower():
                continue
            if patient_id and r.get("patient_id", "").lower() != patient_id.lower():
                continue
            if status and r.get("status", "").lower() != status.value.lower():
                continue

            p_info = patients_map.get(r.get("patient_id", ""), {})
            results.append(AppointmentResponse(
                appointment_id=r.get("appointment_id", ""),
                patient_id=r.get("patient_id", ""),
                patient_name=p_info.get("full_name"),
                patient_phone=p_info.get("phone"),
                dentist_id=r.get("dentist_id", ""),
                dentist_name=dentists_map.get(r.get("dentist_id", "")),
                date=r.get("date", ""),
                start_time=r.get("start_time", ""),
                end_time=r.get("end_time", ""),
                status=AppointmentStatus(r.get("status", "confirmed").lower()),
                reason=r.get("reason") or None,
                notes=r.get("notes") or None,
                created_at=r.get("created_at", ""),
                updated_at=r.get("updated_at", "")
            ))
        return sorted(results, key=lambda a: (a.date, a.start_time))

    def get_appointment(self, appointment_id: str) -> Optional[AppointmentResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            return self._get_appointment_unlocked(all_data, appointment_id)

    def _get_appointment_unlocked(
        self, all_data: Dict, appointment_id: str
    ) -> Optional[AppointmentResponse]:
        """Finds a single appointment by ID from already-loaded data. No lock."""
        for apt in self._list_appointments_unlocked(all_data):
            if apt.appointment_id.lower() == appointment_id.lower():
                return apt
        return None

    def create_appointment(self, appointment_data: AppointmentCreate) -> AppointmentResponse:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            apt_rows = all_data.get(SHEET_APPOINTMENTS, [])
            patients_map = {p.get("patient_id"): p for p in all_data.get(SHEET_PATIENTS, [])}
            dentists_map = {d.get("dentist_id"): d.get("name") for d in all_data.get(SHEET_DENTISTS, [])}

            # Conflict double-check under lock using in-memory data (no extra lock)
            for r in apt_rows:
                if (
                    r.get("dentist_id", "").lower() == appointment_data.dentist_id.lower()
                    and r.get("date") == appointment_data.date
                    and r.get("status", "").lower() in ["confirmed", "pending"]
                ):
                    existing_start = r.get("start_time", "")
                    existing_end = r.get("end_time", "")
                    if not (
                        appointment_data.end_time <= existing_start
                        or appointment_data.start_time >= existing_end
                    ):
                        raise SlotConflictError(
                            f"Dentist is already booked on {appointment_data.date} "
                            f"from {existing_start} to {existing_end}."
                        )

            seq = self._next_sequence(apt_rows, "appointment_id")
            apt_id = f"APT-{seq:06d}"
            now_iso = datetime.now().isoformat()

            new_row = {
                "appointment_id": apt_id,
                "patient_id": appointment_data.patient_id,
                "dentist_id": appointment_data.dentist_id,
                "date": appointment_data.date,
                "start_time": appointment_data.start_time,
                "end_time": appointment_data.end_time,
                "status": "confirmed",
                "reason": appointment_data.reason or "",
                "notes": appointment_data.notes or "",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            apt_rows.append(new_row)
            all_data[SHEET_APPOINTMENTS] = apt_rows

            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_reception",
                "entity_type": "APPOINTMENT",
                "entity_id": apt_id,
                "action": "CREATE",
                "details": (
                    f"Booked for patient {appointment_data.patient_id} "
                    f"with dentist {appointment_data.dentist_id} "
                    f"on {appointment_data.date} "
                    f"({appointment_data.start_time}-{appointment_data.end_time})"
                )
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

        p_info = patients_map.get(appointment_data.patient_id, {})
        return AppointmentResponse(
            appointment_id=apt_id,
            patient_id=appointment_data.patient_id,
            patient_name=p_info.get("full_name"),
            patient_phone=p_info.get("phone"),
            dentist_id=appointment_data.dentist_id,
            dentist_name=dentists_map.get(appointment_data.dentist_id),
            date=appointment_data.date,
            start_time=appointment_data.start_time,
            end_time=appointment_data.end_time,
            status=AppointmentStatus.CONFIRMED,
            reason=appointment_data.reason,
            notes=appointment_data.notes,
            created_at=now_iso,
            updated_at=now_iso
        )

    def update_appointment_status(
        self,
        appointment_id: str,
        new_status: AppointmentStatus,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            apt_rows = all_data.get(SHEET_APPOINTMENTS, [])
            target = None
            for r in apt_rows:
                if r.get("appointment_id", "").lower() == appointment_id.lower():
                    target = r
                    break
            if not target:
                return None

            now_iso = datetime.now().isoformat()
            target["status"] = new_status.value
            target["updated_at"] = now_iso
            if notes:
                existing_notes = target.get("notes", "")
                target["notes"] = f"{existing_notes} | {notes}".strip(" | ")

            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_reception",
                "entity_type": "APPOINTMENT",
                "entity_id": appointment_id,
                "action": f"STATUS_{new_status.value.upper()}",
                "details": f"Status updated to {new_status.value}"
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

            # Build response inline from in-memory data — avoids re-acquiring the lock
            return self._get_appointment_unlocked(all_data, appointment_id)

    def reschedule_appointment(
        self,
        appointment_id: str,
        new_date: str,
        new_start_time: str,
        new_end_time: str,
        new_dentist_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            apt_rows = all_data.get(SHEET_APPOINTMENTS, [])
            target = None
            for r in apt_rows:
                if r.get("appointment_id", "").lower() == appointment_id.lower():
                    target = r
                    break
            if not target:
                return None

            effective_dentist_id = new_dentist_id or target.get("dentist_id")

            # Conflict check for the new slot — using in-memory data, no extra lock
            for r in apt_rows:
                if r.get("appointment_id", "").lower() == appointment_id.lower():
                    continue  # skip self
                if (
                    r.get("dentist_id", "").lower() == effective_dentist_id.lower()
                    and r.get("date") == new_date
                    and r.get("status", "").lower() in ["confirmed", "pending"]
                ):
                    existing_start = r.get("start_time", "")
                    existing_end = r.get("end_time", "")
                    if not (new_end_time <= existing_start or new_start_time >= existing_end):
                        raise SlotConflictError(
                            f"Cannot reschedule: Dentist is already booked on {new_date} "
                            f"from {existing_start} to {existing_end}."
                        )

            now_iso = datetime.now().isoformat()
            old_info = (
                f"Old: {target['date']} "
                f"{target['start_time']}-{target['end_time']} "
                f"({target['dentist_id']})"
            )

            target["date"] = new_date
            target["start_time"] = new_start_time
            target["end_time"] = new_end_time
            target["dentist_id"] = effective_dentist_id
            target["status"] = AppointmentStatus.RESCHEDULED.value
            target["updated_at"] = now_iso

            reschedule_note = f"Rescheduled from {old_info} on {now_iso}"
            if notes:
                reschedule_note += f" - Reason: {notes}"
            existing_apt_notes = target.get("notes", "")
            target["notes"] = f"{existing_apt_notes} | {reschedule_note}".strip(" | ")

            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": now_iso,
                "staff_id": "staff_reception",
                "entity_type": "APPOINTMENT",
                "entity_id": appointment_id,
                "action": "RESCHEDULE",
                "details": (
                    f"{old_info} -> New: {new_date} "
                    f"{new_start_time}-{new_end_time} ({effective_dentist_id})"
                )
            })
            all_data[SHEET_AUDIT] = audit_rows

            self._write_all_sheets(all_data)

            # Build response inline from in-memory data — avoids re-acquiring the lock
            return self._get_appointment_unlocked(all_data, appointment_id)

    # =========================================================================
    # AUDIT LOG
    # =========================================================================

    def log_audit_event(self, entry: AuditLogEntry) -> None:
        with get_workbook_lock(self.lock_path):
            all_data = self._read_all_sheets()
            audit_rows = all_data.get(SHEET_AUDIT, [])
            audit_rows.append({
                "log_id": f"LOG-{self._next_sequence(audit_rows, 'log_id'):06d}",
                "timestamp": entry.timestamp or datetime.now().isoformat(),
                "staff_id": entry.staff_id,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "action": entry.action,
                "details": entry.details
            })
            all_data[SHEET_AUDIT] = audit_rows
            self._write_all_sheets(all_data)
