"""
Supabase PostgreSQL Clinic Repository Implementation
Connects to Supabase PostgreSQL database using psycopg2 connection pooling.
Provides full persistence for all 17 clinic entities with atomic operations.
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
from decimal import Decimal
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

from app.core.config import settings
from app.core.exceptions import (
    ResourceNotFoundError,
    SlotConflictError,
    DuplicatePatientWarning
)
from app.repositories.base import BaseClinicRepository
from app.models.patient import PatientResponse, PatientCreate
from app.models.visit import VisitResponse, VisitCreate
from app.models.dentist import DentistResponse, DentistCreate
from app.models.availability import WorkingScheduleItem, LeaveItem, LeaveCreate, ScheduleUpdate
from app.models.appointment import AppointmentResponse, AppointmentCreate, AppointmentStatus
from app.models.audit import AuditLogEntry
from app.models.treatment import Treatment, TreatmentCreate, TreatmentUpdate
from app.models.staff import StaffMember, StaffCreate, StaffUpdate
from app.models.sales import SaleResponse, SaleCreate, SaleSummary, PaymentMethodResponse
from app.models.purchase import PurchaseResponse, PurchaseCreate, VendorResponse, VendorCreate
from app.models.inventory import InventoryResponse, InventoryCreate, InventoryUpdate
from app.models.peripheral import PeripheralResponse, PeripheralCreate, PeripheralUpdate
from app.models.medical_checkup import MedicalCheckupResponse, ToothFinding
from app.models.patient_request import PatientRequestResponse

logger = logging.getLogger("clinic_repository.supabase")


class CleanDictCursor:
    """Wrapper around RealDictCursor that normalizes timestamps, dates, times, decimals, and UUIDs to primitives."""
    def __init__(self, raw_cursor):
        self._raw_cursor = raw_cursor

    def __getattr__(self, name):
        return getattr(self._raw_cursor, name)

    @classmethod
    def _clean(cls, val):
        if val is None:
            return None
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        if hasattr(val, "strftime") and type(val).__name__ == "time":
            return val.strftime("%H:%M")
        if hasattr(val, "as_tuple") and type(val).__name__ == "Decimal":
            return float(val)
        if hasattr(val, "hex") and type(val).__name__ == "UUID":
            return str(val)
        if isinstance(val, dict):
            return {k: cls._clean(v) for k, v in val.items()}
        if isinstance(val, list):
            return [cls._clean(item) for item in val]
        return val

    @classmethod
    def _clean_row(cls, row):
        if row is None:
            return None
        if isinstance(row, dict):
            return {k: cls._clean(v) for k, v in row.items()}
        return row

    def fetchone(self):
        row = self._raw_cursor.fetchone()
        return self._clean_row(row)

    def fetchall(self):
        rows = self._raw_cursor.fetchall()
        return [self._clean_row(r) for r in rows]

    def fetchmany(self, size=None):
        rows = self._raw_cursor.fetchmany(size) if size is not None else self._raw_cursor.fetchmany()
        return [self._clean_row(r) for r in rows]


class SupabaseClinicRepository(BaseClinicRepository):
    """
    Concrete repository implementation backed by Supabase PostgreSQL.
    """

    def __init__(
        self,
        db_url: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        dbname: Optional[str] = None
    ):
        self.db_url = db_url or settings.DATABASE_URL
        self.host = host or settings.SUPABASE_DB_HOST
        self.port = port or settings.SUPABASE_DB_PORT
        self.user = user or settings.SUPABASE_DB_USER
        self.password = password or settings.SUPABASE_DB_PASSWORD
        self.dbname = dbname or settings.SUPABASE_DB_NAME
        self._pool: Optional[ThreadedConnectionPool] = None
        self._init_pool()

    def _init_pool(self) -> None:
        try:
            self._pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                dbname=self.dbname,
                connect_timeout=10
            )
            logger.info("Supabase PostgreSQL connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase connection pool: {e}")
            self._pool = None

    @contextmanager
    def get_cursor(self, commit: bool = False):
        """Context manager for acquiring a database cursor from the connection pool."""
        conn = None
        if self._pool is None:
            self._init_pool()

        if self._pool:
            conn = self._pool.getconn()
        else:
            # Fallback direct connection
            conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                dbname=self.dbname,
                connect_timeout=10
            )

        raw_cursor = None
        try:
            raw_cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor = CleanDictCursor(raw_cursor)
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if raw_cursor:
                try:
                    raw_cursor.close()
                except Exception:
                    pass
            if conn and self._pool:
                self._pool.putconn(conn)
            elif conn:
                conn.close()

    def _next_id(self, cursor, table: str, id_col: str, prefix: str) -> str:
        cursor.execute(
            f"SELECT {id_col} FROM {table} WHERE {id_col} LIKE %s ORDER BY {id_col} DESC LIMIT 1;",
            (f"{prefix}-%",)
        )
        row = cursor.fetchone()
        if row and row[id_col]:
            try:
                last_num = int(row[id_col].split('-')[1])
                return f"{prefix}-{last_num + 1:06d}"
            except (IndexError, ValueError):
                pass
        return f"{prefix}-000001"

    # ── Initialization & Health ───────────────────────────────────────────────

    def initialize_storage(self) -> None:
        """Verifies connection and ensures public schema tables exist."""
        try:
            from pathlib import Path
            with self.get_cursor(commit=True) as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = 'patients'
                    );
                """)
                exists = cursor.fetchone()["exists"]
                if not exists:
                    logger.info("Supabase tables not found. Automatically applying schema.sql and seed.sql...")
                    sql_dir = Path(__file__).resolve().parent.parent.parent / "supabase"
                    schema_file = sql_dir / "schema.sql"
                    seed_file = sql_dir / "seed.sql"
                    if schema_file.exists():
                        with open(schema_file, "r", encoding="utf-8") as f:
                            cursor.execute(f.read())
                    if seed_file.exists():
                        with open(seed_file, "r", encoding="utf-8") as f:
                            cursor.execute(f.read())
                    logger.info("Supabase schema and seed applied successfully.")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS peripherals (
                      peripheral_id TEXT PRIMARY KEY,
                      name TEXT NOT NULL,
                      category TEXT,
                      location TEXT,
                      condition TEXT DEFAULT 'Good',
                      serial_no TEXT,
                      last_service TEXT,
                      created_at TIMESTAMPTZ DEFAULT NOW(),
                      updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)
        except Exception as e:
            logger.warning(f"initialize_storage notice: {e}")


    def check_health(self) -> Dict[str, Any]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT count(*) as count FROM patients;")
            pat_count = cursor.fetchone()["count"]
            cursor.execute("SELECT count(*) as count FROM appointments;")
            apt_count = cursor.fetchone()["count"]
            cursor.execute("SELECT count(*) as count FROM sales;")
            sales_count = cursor.fetchone()["count"]

            return {
                "status": "healthy",
                "backend": "supabase_postgresql",
                "database": self.dbname,
                "host": self.host,
                "counts": {
                    "patients": pat_count,
                    "appointments": apt_count,
                    "sales": sales_count
                },
                "timestamp": datetime.now().isoformat()
            }

    # ── Patients ─────────────────────────────────────────────────────────────

    def list_patients(self) -> List[PatientResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM patients ORDER BY created_at DESC;")
            rows = cursor.fetchall()
            return [PatientResponse(**dict(r)) for r in rows]

    def get_patient(self, patient_id: str) -> Optional[PatientResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM patients WHERE patient_id = %s;", (patient_id,))
            row = cursor.fetchone()
            return PatientResponse(**dict(row)) if row else None

    def find_patients(self, query: str) -> List[PatientResponse]:
        pattern = f"%{query}%"
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM patients 
                WHERE full_name ILIKE %s 
                   OR phone ILIKE %s 
                   OR patient_id ILIKE %s
                ORDER BY full_name ASC;
                """,
                (pattern, pattern, pattern)
            )
            rows = cursor.fetchall()
            return [PatientResponse(**dict(r)) for r in rows]

    def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        with self.get_cursor(commit=True) as cursor:
            # Check duplicates by phone
            cursor.execute(
                "SELECT * FROM patients WHERE phone = %s AND phone != '';",
                (patient_data.phone,)
            )
            existing = cursor.fetchall()
            if existing and not getattr(patient_data, "force_create", False):
                matches = [PatientResponse(**dict(e)) for e in existing]
                raise DuplicatePatientWarning(
                    f"Patient with phone {patient_data.phone} already exists.",
                    existing_matches=matches
                )

            new_id = self._next_id(cursor, "patients", "patient_id", "PAT")
            now_iso = datetime.now()

            cursor.execute(
                """
                INSERT INTO patients (
                    patient_id, full_name, dob_or_age, phone, email, emergency_contact,
                    gender, address, allergies, medical_conditions, consent_status,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    patient_data.full_name,
                    patient_data.dob_or_age,
                    patient_data.phone,
                    patient_data.email,
                    patient_data.emergency_contact,
                    patient_data.gender,
                    patient_data.address,
                    patient_data.allergies,
                    patient_data.medical_conditions,
                    patient_data.consent_status or "pending",
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return PatientResponse(**dict(row))

    def update_patient(self, patient_id: str, updates: Dict[str, Any]) -> Optional[PatientResponse]:
        allowed_cols = {
            "full_name", "dob_or_age", "phone", "email", "emergency_contact",
            "gender", "address", "allergies", "medical_conditions", "consent_status"
        }
        filtered = {k: v for k, v in updates.items() if k in allowed_cols}
        if not filtered:
            return self.get_patient(patient_id)

        set_clauses = [f"{col} = %s" for col in filtered.keys()]
        values = list(filtered.values())
        values.extend([datetime.now(), patient_id])

        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE patients 
                SET {', '.join(set_clauses)}, updated_at = %s 
                WHERE patient_id = %s 
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return PatientResponse(**dict(row)) if row else None

    def delete_patient(self, patient_id: str) -> bool:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM patients WHERE patient_id = %s;", (patient_id,))
            return cursor.rowcount > 0

    # ── Visits ───────────────────────────────────────────────────────────────

    def list_visits_for_patient(self, patient_id: str) -> List[VisitResponse]:
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM visits WHERE patient_id = %s ORDER BY visit_date DESC;",
                (patient_id,)
            )
            rows = cursor.fetchall()
            return [VisitResponse(**dict(r)) for r in rows]

    def create_visit(self, visit_data: VisitCreate) -> VisitResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "visits", "visit_id", "VST")
            try:
                cursor.execute(
                    """
                    INSERT INTO visits (
                        visit_id, patient_id, visit_date, dentist_id, visit_type,
                        summary, follow_up_recommendation, appointment_id, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        new_id,
                        visit_data.patient_id,
                        visit_data.visit_date,
                        visit_data.dentist_id,
                        visit_data.visit_type,
                        visit_data.summary,
                        visit_data.follow_up_recommendation,
                        visit_data.appointment_id,
                        datetime.now()
                    )
                )
            except Exception:
                cursor.connection.rollback()
                cursor.execute(
                    """
                    INSERT INTO visits (
                        visit_id, patient_id, visit_date, dentist_id, visit_type,
                        summary, follow_up_recommendation, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        new_id,
                        visit_data.patient_id,
                        visit_data.visit_date,
                        visit_data.dentist_id,
                        visit_data.visit_type,
                        visit_data.summary,
                        visit_data.follow_up_recommendation,
                        datetime.now()
                    )
                )
            row = cursor.fetchone()
            return VisitResponse(**dict(row))

    def get_visit_by_appointment(self, appointment_id: str) -> Optional[VisitResponse]:
        with self.get_cursor() as cursor:
            try:
                cursor.execute(
                    "SELECT * FROM visits WHERE appointment_id = %s ORDER BY created_at DESC LIMIT 1;",
                    (appointment_id,)
                )
                row = cursor.fetchone()
                if row:
                    return VisitResponse(**dict(row))
            except Exception:
                cursor.connection.rollback()

            cursor.execute(
                "SELECT patient_id, date, dentist_id FROM appointments WHERE appointment_id = %s;",
                (appointment_id,)
            )
            apt_row = cursor.fetchone()
            if apt_row:
                cursor.execute(
                    "SELECT * FROM visits WHERE patient_id = %s AND visit_date = %s ORDER BY created_at DESC LIMIT 1;",
                    (apt_row["patient_id"], apt_row["date"])
                )
                row = cursor.fetchone()
                return VisitResponse(**dict(row)) if row else None
            return None

    # ── Dentists ─────────────────────────────────────────────────────────────

    def list_dentists(self, active_only: bool = True) -> List[DentistResponse]:
        with self.get_cursor() as cursor:
            if active_only:
                cursor.execute("SELECT * FROM dentists WHERE is_active = TRUE ORDER BY name ASC;")
            else:
                cursor.execute("SELECT * FROM dentists ORDER BY name ASC;")
            rows = cursor.fetchall()
            return [DentistResponse(**dict(r)) for r in rows]

    def get_dentist(self, dentist_id: str) -> Optional[DentistResponse]:
        alias_map = {
            "d1": "DOC-000001",
            "d2": "DOC-000002",
            "d3": "DOC-000003",
        }
        target_id = alias_map.get(dentist_id.lower(), dentist_id)
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM dentists WHERE dentist_id ILIKE %s OR dentist_id ILIKE %s;",
                (dentist_id, target_id)
            )
            row = cursor.fetchone()
            return DentistResponse(**dict(row)) if row else None

    def create_dentist(self, dentist_data: DentistCreate) -> DentistResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "dentists", "dentist_id", "DEN")
            cursor.execute(
                """
                INSERT INTO dentists (
                    dentist_id, name, specialty, phone, email, color_code, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    dentist_data.name,
                    dentist_data.specialty,
                    dentist_data.phone,
                    dentist_data.email,
                    dentist_data.color_code or "#2B6CB0",
                    dentist_data.is_active,
                    datetime.now()
                )
            )
            row = cursor.fetchone()
            return DentistResponse(**dict(row))

    # ── Schedules & Availability ──────────────────────────────────────────────

    def list_schedules_for_dentist(self, dentist_id: str) -> List[WorkingScheduleItem]:
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM availability WHERE dentist_id = %s ORDER BY day_of_week ASC;",
                (dentist_id,)
            )
            rows = cursor.fetchall()
            return [WorkingScheduleItem(**dict(r)) for r in rows]

    def update_schedule_for_day(
        self,
        dentist_id: str,
        day_of_week: int,
        updates: ScheduleUpdate
    ) -> Optional[WorkingScheduleItem]:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE availability 
                SET start_time = COALESCE(%s, start_time),
                    end_time = COALESCE(%s, end_time),
                    break_start = COALESCE(%s, break_start),
                    break_end = COALESCE(%s, break_end),
                    is_working_day = COALESCE(%s, is_working_day)
                WHERE dentist_id = %s AND day_of_week = %s
                RETURNING *;
                """,
                (
                    updates.start_time,
                    updates.end_time,
                    updates.break_start,
                    updates.break_end,
                    updates.is_working_day,
                    dentist_id,
                    day_of_week
                )
            )
            row = cursor.fetchone()
            return WorkingScheduleItem(**dict(row)) if row else None

    def list_leaves_for_dentist(self, dentist_id: str) -> List[LeaveItem]:
        with self.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM leaves WHERE dentist_id = %s ORDER BY start_date ASC;",
                (dentist_id,)
            )
            rows = cursor.fetchall()
            return [LeaveItem(**dict(r)) for r in rows]

    def create_leave_for_dentist(self, dentist_id: str, leave_data: LeaveCreate) -> LeaveItem:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "leaves", "leave_id", "LEV")
            cursor.execute(
                """
                INSERT INTO leaves (leave_id, dentist_id, start_date, end_date, reason, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (new_id, dentist_id, leave_data.start_date, leave_data.end_date, leave_data.reason, datetime.now())
            )
            row = cursor.fetchone()
            return LeaveItem(**dict(row))

    # ── Appointments ─────────────────────────────────────────────────────────

    # Base SELECT for appointments with patient and dentist name resolution
    _APPOINTMENT_SELECT = """
        SELECT
            a.*,
            p.full_name  AS patient_name,
            p.phone      AS patient_phone,
            d.name       AS dentist_name
        FROM appointments a
        LEFT JOIN patients  p ON p.patient_id  = a.patient_id
        LEFT JOIN dentists  d ON d.dentist_id  = a.dentist_id
    """

    def list_appointments(
        self,
        date: Optional[str] = None,
        dentist_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[AppointmentStatus] = None
    ) -> List[AppointmentResponse]:
        query = self._APPOINTMENT_SELECT + " WHERE 1=1"
        params = []
        if date:
            query += " AND a.date = %s"
            params.append(date)
        if dentist_id:
            query += " AND a.dentist_id = %s"
            params.append(dentist_id)
        if patient_id:
            query += " AND a.patient_id = %s"
            params.append(patient_id)
        if status:
            val = status.value if hasattr(status, "value") else str(status)
            query += " AND a.status = %s"
            params.append(val)

        query += " ORDER BY a.date ASC, a.start_time ASC;"
        with self.get_cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [AppointmentResponse(**dict(r)) for r in rows]

    def get_appointment(self, appointment_id: str) -> Optional[AppointmentResponse]:
        with self.get_cursor() as cursor:
            cursor.execute(
                self._APPOINTMENT_SELECT + " WHERE a.appointment_id = %s;",
                (appointment_id,)
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row)) if row else None

    def create_appointment(self, appointment_data: AppointmentCreate) -> AppointmentResponse:
        with self.get_cursor(commit=True) as cursor:
            # Slot conflict check
            cursor.execute(
                """
                SELECT appointment_id FROM appointments
                WHERE dentist_id = %s
                  AND date = %s
                  AND status IN ('scheduled', 'confirmed', 'checked-in', 'in-progress')
                  AND (
                    (start_time < %s AND end_time > %s) OR
                    (start_time < %s AND end_time > %s) OR
                    (start_time >= %s AND end_time <= %s)
                  );
                """,
                (
                    appointment_data.dentist_id,
                    appointment_data.date,
                    appointment_data.end_time,
                    appointment_data.start_time,
                    appointment_data.start_time,
                    appointment_data.start_time,
                    appointment_data.start_time,
                    appointment_data.end_time
                )
            )
            conflict = cursor.fetchone()
            if conflict:
                raise SlotConflictError(
                    f"Dentist already has a booking at {appointment_data.start_time}-{appointment_data.end_time} on {appointment_data.date}."
                )

            new_id = self._next_id(cursor, "appointments", "appointment_id", "APT")
            now_iso = datetime.now()
            stat_val = appointment_data.status or "scheduled"
            if hasattr(stat_val, "value"):
                stat_val = stat_val.value

            cursor.execute(
                """
                INSERT INTO appointments (
                    appointment_id, patient_id, dentist_id, date, start_time, end_time,
                    booking_time, treatment_name, source, payment_status, bill_number,
                    clinical_notes, status, reason, notes, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    appointment_data.patient_id,
                    appointment_data.dentist_id,
                    appointment_data.date,
                    appointment_data.start_time,
                    appointment_data.end_time,
                    now_iso,
                    appointment_data.treatment_name or "Consultation",
                    appointment_data.source or "MANUAL APPOINTMENT",
                    appointment_data.payment_status or "UNPAID",
                    appointment_data.bill_number,
                    appointment_data.clinical_notes,
                    str(stat_val),
                    appointment_data.reason,
                    appointment_data.notes,
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row))

    def update_appointment(self, appointment_id: str, updates: Dict[str, Any]) -> Optional[AppointmentResponse]:
        allowed_cols = {
            "date", "start_time", "end_time", "dentist_id", "patient_id",
            "treatment_name", "status", "payment_status", "bill_number",
            "clinical_notes", "notes", "reason"
        }
        filtered = {k: v for k, v in updates.items() if k in allowed_cols}
        if not filtered:
            return self.get_appointment(appointment_id)

        set_clauses = [f"{col} = %s" for col in filtered.keys()]
        values = list(filtered.values())
        values.extend([datetime.now(), appointment_id])

        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE appointments
                SET {', '.join(set_clauses)}, updated_at = %s
                WHERE appointment_id = %s
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row)) if row else None

    def update_appointment_status(
        self,
        appointment_id: str,
        new_status: AppointmentStatus,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        status_val = new_status.value if hasattr(new_status, "value") else str(new_status)
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE appointments
                SET status = %s,
                    notes = COALESCE(%s, notes),
                    updated_at = %s
                WHERE appointment_id = %s
                RETURNING *;
                """,
                (status_val, notes, datetime.now(), appointment_id)
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row)) if row else None

    def reschedule_appointment(
        self,
        appointment_id: str,
        new_date: str,
        new_start_time: str,
        new_end_time: str,
        new_dentist_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        current = self.get_appointment(appointment_id)
        if not current:
            raise ResourceNotFoundError("Appointment", appointment_id)

        dentist_id = new_dentist_id or current.dentist_id

        with self.get_cursor(commit=True) as cursor:
            # Slot conflict check excluding current appointment
            cursor.execute(
                """
                SELECT appointment_id FROM appointments
                WHERE dentist_id = %s
                  AND date = %s
                  AND appointment_id != %s
                  AND status IN ('scheduled', 'confirmed')
                  AND (
                    (start_time < %s AND end_time > %s) OR
                    (start_time < %s AND end_time > %s) OR
                    (start_time >= %s AND end_time <= %s)
                  );
                """,
                (
                    dentist_id,
                    new_date,
                    appointment_id,
                    new_end_time,
                    new_start_time,
                    new_start_time,
                    new_start_time,
                    new_start_time,
                    new_end_time
                )
            )
            conflict = cursor.fetchone()
            if conflict:
                raise SlotConflictError(
                    f"Dentist already has an appointment at {new_start_time}-{new_end_time} on {new_date}."
                )

            cursor.execute(
                """
                UPDATE appointments
                SET date = %s,
                    start_time = %s,
                    end_time = %s,
                    dentist_id = %s,
                    status = 'scheduled',
                    notes = COALESCE(%s, notes),
                    updated_at = %s
                WHERE appointment_id = %s
                RETURNING *;
                """,
                (new_date, new_start_time, new_end_time, dentist_id, notes, datetime.now(), appointment_id)
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row)) if row else None

    # ── Treatments Catalog ───────────────────────────────────────────────────

    def list_treatments(self) -> List[Treatment]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM treatments ORDER BY name ASC;")
            rows = cursor.fetchall()
            return [Treatment(**dict(r)) for r in rows]

    def get_treatment(self, treatment_id: str) -> Optional[Treatment]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM treatments WHERE treatment_id = %s;", (treatment_id,))
            row = cursor.fetchone()
            return Treatment(**dict(row)) if row else None

    def create_treatment(self, treatment_data: TreatmentCreate) -> Treatment:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "treatments", "treatment_id", "TRT")
            cursor.execute(
                """
                INSERT INTO treatments (
                    treatment_id, name, category, default_duration_minutes,
                    estimated_cost, description
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    treatment_data.name,
                    treatment_data.category or "General",
                    treatment_data.default_duration_minutes or 30,
                    treatment_data.estimated_cost,
                    treatment_data.description
                )
            )
            row = cursor.fetchone()
            return Treatment(**dict(row))

    def update_treatment(self, treatment_id: str, updates: TreatmentUpdate) -> Optional[Treatment]:
        updates_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not updates_dict:
            return self.get_treatment(treatment_id)

        set_clauses = [f"{col} = %s" for col in updates_dict.keys()]
        values = list(updates_dict.values())
        values.append(treatment_id)

        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE treatments
                SET {', '.join(set_clauses)}
                WHERE treatment_id = %s
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return Treatment(**dict(row)) if row else None

    def delete_treatment(self, treatment_id: str) -> bool:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM treatments WHERE treatment_id = %s;", (treatment_id,))
            return cursor.rowcount > 0

    # ── Payment & Reminders ──────────────────────────────────────────────────

    def update_payment_status(
        self, appointment_id: str, payment_status: str, bill_number: Optional[str] = None
    ) -> Optional[AppointmentResponse]:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE appointments
                SET payment_status = %s,
                    bill_number = COALESCE(%s, bill_number),
                    updated_at = %s
                WHERE appointment_id = %s
                RETURNING *;
                """,
                (payment_status, bill_number, datetime.now(), appointment_id)
            )
            row = cursor.fetchone()
            return AppointmentResponse(**dict(row)) if row else None

    def send_payment_reminder(self, appointment_id: str) -> Optional[Any]:
        apt = self.get_appointment(appointment_id)
        if not apt:
            return None
        return {
            "appointment_id": appointment_id,
            "patient_id": apt.patient_id,
            "status": "reminder_sent",
            "sent_at": datetime.now().isoformat()
        }

    # ── Medical Checkups & Odontogram ────────────────────────────────────────

    def save_medical_checkup(self, checkup_data: Any) -> Any:
        with self.get_cursor(commit=True) as cursor:
            checkup_dict = checkup_data.model_dump() if hasattr(checkup_data, "model_dump") else dict(checkup_data)
            checkup_id = checkup_dict.get("checkup_id") or self._next_id(cursor, "medical_checkups", "checkup_id", "MC")
            findings_json = json.dumps(checkup_dict.get("teeth_findings", [])) if "teeth_findings" in checkup_dict else checkup_dict.get("teeth_findings_json", "[]")

            cursor.execute(
                """
                INSERT INTO medical_checkups (
                    checkup_id, patient_id, appointment_id, dentist_id, blood_pressure,
                    medical_conditions, allergies, oral_hygiene_habits, teeth_findings_json,
                    canker_sores, canker_sores_notes, anomalous_teeth, anomalous_teeth_notes,
                    other_oral_notes, consent_status, refusal_reason, status,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (checkup_id) DO UPDATE SET
                    blood_pressure = EXCLUDED.blood_pressure,
                    medical_conditions = EXCLUDED.medical_conditions,
                    allergies = EXCLUDED.allergies,
                    oral_hygiene_habits = EXCLUDED.oral_hygiene_habits,
                    teeth_findings_json = EXCLUDED.teeth_findings_json,
                    canker_sores = EXCLUDED.canker_sores,
                    canker_sores_notes = EXCLUDED.canker_sores_notes,
                    anomalous_teeth = EXCLUDED.anomalous_teeth,
                    anomalous_teeth_notes = EXCLUDED.anomalous_teeth_notes,
                    other_oral_notes = EXCLUDED.other_oral_notes,
                    consent_status = EXCLUDED.consent_status,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING *;
                """,
                (
                    checkup_id,
                    checkup_dict.get("patient_id"),
                    checkup_dict.get("appointment_id"),
                    checkup_dict.get("dentist_id"),
                    checkup_dict.get("blood_pressure"),
                    checkup_dict.get("medical_conditions"),
                    checkup_dict.get("allergies"),
                    checkup_dict.get("oral_hygiene_habits"),
                    findings_json,
                    checkup_dict.get("canker_sores", False),
                    checkup_dict.get("canker_sores_notes"),
                    checkup_dict.get("anomalous_teeth"),
                    checkup_dict.get("anomalous_teeth_notes"),
                    checkup_dict.get("other_oral_notes"),
                    checkup_dict.get("consent_status", "pending"),
                    checkup_dict.get("refusal_reason"),
                    checkup_dict.get("status", "draft"),
                    datetime.now(),
                    datetime.now()
                )
            )
            row = cursor.fetchone()
            d = dict(row)
            if "teeth_findings_json" in d and d["teeth_findings_json"]:
                d["teeth_findings"] = json.loads(d["teeth_findings_json"])
            return MedicalCheckupResponse(**d)

    def get_medical_checkup(self, checkup_id: str) -> Optional[Any]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM medical_checkups WHERE checkup_id = %s;", (checkup_id,))
            row = cursor.fetchone()
            if not row:
                return None
            d = dict(row)
            if "teeth_findings_json" in d and d["teeth_findings_json"]:
                d["teeth_findings"] = json.loads(d["teeth_findings_json"])
            return MedicalCheckupResponse(**d)

    def get_checkup_by_appointment(self, appointment_id: str) -> Optional[Any]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM medical_checkups WHERE appointment_id = %s;", (appointment_id,))
            row = cursor.fetchone()
            if not row:
                return None
            d = dict(row)
            if "teeth_findings_json" in d and d["teeth_findings_json"]:
                d["teeth_findings"] = json.loads(d["teeth_findings_json"])
            return MedicalCheckupResponse(**d)

    def list_checkups_for_patient(self, patient_id: str) -> List[Any]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM medical_checkups WHERE patient_id = %s ORDER BY created_at DESC;", (patient_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if "teeth_findings_json" in d and d["teeth_findings_json"]:
                    d["teeth_findings"] = json.loads(d["teeth_findings_json"])
                results.append(MedicalCheckupResponse(**d))
            return results

    # ── Patient Requests (WhatsApp Simulator) ────────────────────────────────

    def create_patient_request(self, request_data: Any) -> Any:
        with self.get_cursor(commit=True) as cursor:
            req_dict = request_data.model_dump() if hasattr(request_data, "model_dump") else dict(request_data)
            new_id = self._next_id(cursor, "patient_requests", "request_id", "REQ")
            now_iso = datetime.now()

            cursor.execute(
                """
                INSERT INTO patient_requests (
                    request_id, patient_name, patient_phone, patient_age, patient_id,
                    dentist_id, preferred_date, preferred_start_time, preferred_end_time,
                    booking_time, reason, source, status, review_notes, appointment_id,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    req_dict.get("patient_name"),
                    req_dict.get("patient_phone"),
                    req_dict.get("patient_age"),
                    req_dict.get("patient_id"),
                    req_dict.get("dentist_id"),
                    req_dict.get("preferred_date"),
                    req_dict.get("preferred_start_time"),
                    req_dict.get("preferred_end_time"),
                    now_iso,
                    req_dict.get("reason"),
                    req_dict.get("source", "simulator"),
                    req_dict.get("status", "pending"),
                    req_dict.get("review_notes"),
                    req_dict.get("appointment_id"),
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return PatientRequestResponse(**dict(row))

    def get_patient_request(self, request_id: str) -> Optional[Any]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM patient_requests WHERE request_id = %s;", (request_id,))
            row = cursor.fetchone()
            return PatientRequestResponse(**dict(row)) if row else None

    def list_patient_requests(self, status: Optional[str] = None) -> List[Any]:
        with self.get_cursor() as cursor:
            if status:
                cursor.execute(
                    "SELECT * FROM patient_requests WHERE status = %s ORDER BY created_at DESC;",
                    (status,)
                )
            else:
                cursor.execute("SELECT * FROM patient_requests ORDER BY created_at DESC;")
            rows = cursor.fetchall()
            return [PatientRequestResponse(**dict(r)) for r in rows]

    def update_patient_request_status(
        self, request_id: str, status: str, review_notes: Optional[str] = None, appointment_id: Optional[str] = None
    ) -> Optional[Any]:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE patient_requests
                SET status = %s,
                    review_notes = COALESCE(%s, review_notes),
                    appointment_id = COALESCE(%s, appointment_id),
                    updated_at = %s
                WHERE request_id = %s
                RETURNING *;
                """,
                (status, review_notes, appointment_id, datetime.now(), request_id)
            )
            row = cursor.fetchone()
            return PatientRequestResponse(**dict(row)) if row else None

    # ── Staff Members ────────────────────────────────────────────────────────

    def list_staff(self, active_only: bool = False) -> List[StaffMember]:
        with self.get_cursor() as cursor:
            if active_only:
                cursor.execute("SELECT * FROM staff WHERE is_active = TRUE ORDER BY full_name ASC;")
            else:
                cursor.execute("SELECT * FROM staff ORDER BY full_name ASC;")
            rows = cursor.fetchall()
            return [StaffMember(**dict(r)) for r in rows]

    def get_staff(self, staff_id: str) -> Optional[StaffMember]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM staff WHERE staff_id = %s;", (staff_id,))
            row = cursor.fetchone()
            return StaffMember(**dict(row)) if row else None

    def create_staff(self, staff_data: StaffCreate) -> StaffMember:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "staff", "staff_id", "STF")
            initials = staff_data.initials
            if not initials and staff_data.full_name:
                parts = staff_data.full_name.split()
                initials = "".join([p[0].upper() for p in parts[:2]])

            cursor.execute(
                """
                INSERT INTO staff (
                    staff_id, username, full_name, role, department, phone, email,
                    initials, status, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    staff_data.username or new_id.lower(),
                    staff_data.full_name,
                    staff_data.role or "Staff",
                    staff_data.department or "General",
                    staff_data.phone,
                    staff_data.email,
                    initials,
                    staff_data.status or "Active",
                    True,
                    datetime.now()
                )
            )
            row = cursor.fetchone()
            return StaffMember(**dict(row))

    def update_staff(self, staff_id: str, updates: StaffUpdate) -> Optional[StaffMember]:
        updates_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not updates_dict:
            return self.get_staff(staff_id)

        set_clauses = [f"{col} = %s" for col in updates_dict.keys()]
        values = list(updates_dict.values())
        values.append(staff_id)

        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE staff
                SET {', '.join(set_clauses)}
                WHERE staff_id = %s
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return StaffMember(**dict(row)) if row else None

    def delete_staff(self, staff_id: str) -> bool:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute("UPDATE staff SET is_active = FALSE, status = 'Off' WHERE staff_id = %s;", (staff_id,))
            return cursor.rowcount > 0

    # ── Sales ────────────────────────────────────────────────────────────────

    def list_sales(
        self,
        date: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[SaleResponse]:
        query = "SELECT * FROM sales WHERE 1=1"
        params = []
        if date:
            query += " AND sale_date = %s"
            params.append(date)
        if patient_id:
            query += " AND patient_id = %s"
            params.append(patient_id)
        if status:
            query += " AND status = %s"
            params.append(status)

        query += " ORDER BY sale_date DESC, created_at DESC;"
        with self.get_cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [SaleResponse(**dict(r)) for r in rows]

    def get_sale(self, sale_id: str) -> Optional[SaleResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM sales WHERE sale_id = %s;", (sale_id,))
            row = cursor.fetchone()
            return SaleResponse(**dict(row)) if row else None

    def create_sale(self, sale_data: SaleCreate) -> SaleResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "sales", "sale_id", "SAL")
            now_iso = datetime.now()
            sale_date = sale_data.sale_date or datetime.now().date().isoformat()
            bill_num = sale_data.bill_number or f"INV-{now_iso.strftime('%Y%m%d')}-{new_id.split('-')[1]}"

            cursor.execute(
                """
                INSERT INTO sales (
                    sale_id, appointment_id, patient_id, patient_name, treatment_name,
                    amount, status, payment_method, bill_number, sale_date, notes,
                    created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    sale_data.appointment_id,
                    sale_data.patient_id,
                    sale_data.patient_name,
                    sale_data.treatment_name,
                    sale_data.amount,
                    sale_data.status or "Pending",
                    sale_data.payment_method or "Cash",
                    bill_num,
                    sale_date,
                    sale_data.notes,
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return SaleResponse(**dict(row))

    def update_sale_status(self, sale_id: str, status: str) -> Optional[SaleResponse]:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE sales
                SET status = %s, updated_at = %s
                WHERE sale_id = %s
                RETURNING *;
                """,
                (status, datetime.now(), sale_id)
            )
            row = cursor.fetchone()
            return SaleResponse(**dict(row)) if row else None

    def get_sales_summary(self) -> SaleSummary:
        with self.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as total_paid,
                    COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending,
                    COALESCE(SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END), 0) as total_overdue,
                    COUNT(CASE WHEN status = 'Paid' THEN 1 END) as count_paid,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as count_pending,
                    COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as count_overdue
                FROM sales;
                """
            )
            row = cursor.fetchone()
            return SaleSummary(
                total_paid=float(row["total_paid"]),
                total_pending=float(row["total_pending"]),
                total_overdue=float(row["total_overdue"]),
                count_paid=int(row["count_paid"]),
                count_pending=int(row["count_pending"]),
                count_overdue=int(row["count_overdue"])
            )

    # ── Purchases ────────────────────────────────────────────────────────────

    def list_purchases(self, status: Optional[str] = None) -> List[PurchaseResponse]:
        query = "SELECT * FROM purchases"
        params = []
        if status:
            query += " WHERE status = %s"
            params.append(status)
        query += " ORDER BY order_date DESC, created_at DESC;"

        with self.get_cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [PurchaseResponse(**dict(r)) for r in rows]

    def get_purchase(self, purchase_id: str) -> Optional[PurchaseResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM purchases WHERE purchase_id = %s;", (purchase_id,))
            row = cursor.fetchone()
            return PurchaseResponse(**dict(row)) if row else None

    def create_purchase(self, purchase_data: PurchaseCreate) -> PurchaseResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "purchases", "purchase_id", "PO")
            now_iso = datetime.now()
            order_date = purchase_data.order_date or datetime.now().date().isoformat()

            cursor.execute(
                """
                INSERT INTO purchases (
                    purchase_id, vendor_id, vendor_name, items, amount, status,
                    order_date, notes, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    purchase_data.vendor_id,
                    purchase_data.vendor_name,
                    purchase_data.items,
                    purchase_data.amount,
                    purchase_data.status or "Ordered",
                    order_date,
                    purchase_data.notes,
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return PurchaseResponse(**dict(row))

    def update_purchase_status(
        self, purchase_id: str, status: str, received_date: Optional[str] = None
    ) -> Optional[PurchaseResponse]:
        recv_date = received_date or (datetime.now().date().isoformat() if status == "Received" else None)
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE purchases
                SET status = %s,
                    received_date = COALESCE(%s, received_date),
                    updated_at = %s
                WHERE purchase_id = %s
                RETURNING *;
                """,
                (status, recv_date, datetime.now(), purchase_id)
            )
            row = cursor.fetchone()
            return PurchaseResponse(**dict(row)) if row else None

    # ── Inventory (Stocks) ───────────────────────────────────────────────────

    def list_inventory(
        self, category: Optional[str] = None, low_stock_only: bool = False
    ) -> List[InventoryResponse]:
        query = "SELECT * FROM inventory WHERE 1=1"
        params = []
        if category:
            query += " AND category = %s"
            params.append(category)
        if low_stock_only:
            query += " AND quantity <= min_stock"
        query += " ORDER BY name ASC;"

        with self.get_cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [InventoryResponse(**dict(r)) for r in rows]

    def get_inventory_item(self, item_id: str) -> Optional[InventoryResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM inventory WHERE item_id = %s;", (item_id,))
            row = cursor.fetchone()
            return InventoryResponse(**dict(row)) if row else None

    def create_inventory_item(self, item_data: InventoryCreate) -> InventoryResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "inventory", "item_id", "INV")
            now_iso = datetime.now()

            cursor.execute(
                """
                INSERT INTO inventory (
                    item_id, name, category, quantity, min_stock, unit, unit_price,
                    supplier, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    item_data.name,
                    item_data.category or "Consumables",
                    item_data.quantity or 0,
                    item_data.min_stock or 0,
                    item_data.unit or "pcs",
                    item_data.unit_price or 0.0,
                    item_data.supplier,
                    now_iso,
                    now_iso
                )
            )
            row = cursor.fetchone()
            return InventoryResponse(**dict(row))

    def update_inventory_item(
        self, item_id: str, updates: InventoryUpdate
    ) -> Optional[InventoryResponse]:
        updates_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not updates_dict:
            return self.get_inventory_item(item_id)

        set_clauses = [f"{col} = %s" for col in updates_dict.keys()]
        values = list(updates_dict.values())
        values.extend([datetime.now(), item_id])

        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE inventory
                SET {', '.join(set_clauses)}, updated_at = %s
                WHERE item_id = %s
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return InventoryResponse(**dict(row)) if row else None

    def delete_inventory_item(self, item_id: str) -> bool:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM inventory WHERE item_id = %s;", (item_id,))
            return cursor.rowcount > 0

    # ── Payment Methods ──────────────────────────────────────────────────────

    def list_payment_methods(self) -> List[PaymentMethodResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM payment_methods ORDER BY method_id ASC;")
            rows = cursor.fetchall()
            return [PaymentMethodResponse(**dict(r)) for r in rows]

    def update_payment_method(
        self, method_id: str, enabled: Optional[bool] = None, processing_fee: Optional[str] = None
    ) -> Optional[PaymentMethodResponse]:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE payment_methods
                SET enabled = COALESCE(%s, enabled),
                    processing_fee = COALESCE(%s, processing_fee)
                WHERE method_id = %s
                RETURNING *;
                """,
                (enabled, processing_fee, method_id)
            )
            row = cursor.fetchone()
            return PaymentMethodResponse(**dict(row)) if row else None

    # ── Vendors ──────────────────────────────────────────────────────────────

    def list_vendors(self) -> List[VendorResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM vendors ORDER BY name ASC;")
            rows = cursor.fetchall()
            return [VendorResponse(**dict(r)) for r in rows]

    def create_vendor(self, vendor_data: VendorCreate) -> VendorResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "vendors", "vendor_id", "VND")
            cursor.execute(
                """
                INSERT INTO vendors (vendor_id, name, contact, email, phone, address, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    vendor_data.name,
                    vendor_data.contact,
                    vendor_data.email,
                    vendor_data.phone,
                    vendor_data.address,
                    datetime.now()
                )
            )
            row = cursor.fetchone()
            return VendorResponse(**dict(row))

    # ── Peripherals ──────────────────────────────────────────────────────────

    def list_peripherals(self) -> List[PeripheralResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM peripherals ORDER BY name ASC;")
            rows = cursor.fetchall()
            return [PeripheralResponse(**dict(r)) for r in rows]

    def get_peripheral(self, peripheral_id: str) -> Optional[PeripheralResponse]:
        with self.get_cursor() as cursor:
            cursor.execute("SELECT * FROM peripherals WHERE peripheral_id = %s;", (peripheral_id,))
            row = cursor.fetchone()
            return PeripheralResponse(**dict(row)) if row else None

    def create_peripheral(self, item_data: PeripheralCreate) -> PeripheralResponse:
        with self.get_cursor(commit=True) as cursor:
            new_id = self._next_id(cursor, "peripherals", "peripheral_id", "PER")
            now_iso = datetime.now()
            cursor.execute(
                """
                INSERT INTO peripherals (
                    peripheral_id, name, category, location, condition, serial_no, last_service, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (
                    new_id,
                    item_data.name,
                    item_data.category or "Equipment",
                    item_data.location or "",
                    item_data.condition or "Good",
                    item_data.serial_no,
                    item_data.last_service,
                    now_iso,
                    now_iso,
                )
            )
            row = cursor.fetchone()
            return PeripheralResponse(**dict(row))

    def update_peripheral(
        self, peripheral_id: str, updates: PeripheralUpdate
    ) -> Optional[PeripheralResponse]:
        updates_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not updates_dict:
            return self.get_peripheral(peripheral_id)
        set_clauses = [f"{col} = %s" for col in updates_dict.keys()]
        values = list(updates_dict.values())
        values.extend([datetime.now(), peripheral_id])
        with self.get_cursor(commit=True) as cursor:
            cursor.execute(
                f"""
                UPDATE peripherals
                SET {', '.join(set_clauses)}, updated_at = %s
                WHERE peripheral_id = %s
                RETURNING *;
                """,
                values
            )
            row = cursor.fetchone()
            return PeripheralResponse(**dict(row)) if row else None

    def delete_peripheral(self, peripheral_id: str) -> bool:
        with self.get_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM peripherals WHERE peripheral_id = %s;", (peripheral_id,))
            return cursor.rowcount > 0

    # ── Audit Logging ────────────────────────────────────────────────────────

    def log_audit_event(self, entry: AuditLogEntry) -> None:
        try:
            with self.get_cursor(commit=True) as cursor:
                new_id = self._next_id(cursor, "audit_log", "log_id", "LOG")
                cursor.execute(
                    """
                    INSERT INTO audit_log (log_id, timestamp, staff_id, entity_type, entity_id, action, details)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        new_id,
                        entry.timestamp or datetime.now(),
                        entry.staff_id,
                        entry.entity_type,
                        entry.entity_id,
                        entry.action,
                        entry.details
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to log audit event to Supabase: {e}")
