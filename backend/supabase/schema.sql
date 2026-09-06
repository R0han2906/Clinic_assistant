-- Zendenta Dental Clinic Schema (Supabase PostgreSQL)
-- 17 Tables

-- 1. patients
CREATE TABLE IF NOT EXISTS patients (
  patient_id          TEXT PRIMARY KEY,
  full_name           TEXT NOT NULL,
  dob_or_age          TEXT,
  phone               TEXT,
  email               TEXT,
  emergency_contact   TEXT,
  gender              TEXT,
  address             TEXT,
  allergies           TEXT,
  medical_conditions  TEXT,
  consent_status      TEXT DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. dentists
CREATE TABLE IF NOT EXISTS dentists (
  dentist_id  TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  specialty   TEXT,
  phone       TEXT,
  email       TEXT,
  color_code  TEXT DEFAULT '#2B6CB0',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. visits
CREATE TABLE IF NOT EXISTS visits (
  visit_id                TEXT PRIMARY KEY,
  patient_id              TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
  appointment_id          TEXT REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  visit_date              DATE,
  dentist_id              TEXT,
  visit_type              TEXT,
  summary                 TEXT,
  follow_up_recommendation TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 4. availability
CREATE TABLE IF NOT EXISTS availability (
  availability_id TEXT PRIMARY KEY,
  dentist_id      TEXT REFERENCES dentists(dentist_id) ON DELETE CASCADE,
  day_of_week     INTEGER,   -- 0=Mon, 6=Sun
  start_time      TEXT,
  end_time        TEXT,
  break_start     TEXT,
  break_end       TEXT,
  is_working_day  BOOLEAN DEFAULT TRUE
);

-- 5. leaves
CREATE TABLE IF NOT EXISTS leaves (
  leave_id    TEXT PRIMARY KEY,
  dentist_id  TEXT REFERENCES dentists(dentist_id) ON DELETE CASCADE,
  start_date  DATE,
  end_date    DATE,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. appointments
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id  TEXT PRIMARY KEY,
  patient_id      TEXT REFERENCES patients(patient_id) ON DELETE SET NULL,
  dentist_id      TEXT REFERENCES dentists(dentist_id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  start_time      TEXT,
  end_time        TEXT,
  booking_time    TIMESTAMPTZ DEFAULT NOW(),
  treatment_name  TEXT,
  source          TEXT DEFAULT 'staff',
  payment_status  TEXT DEFAULT 'unpaid',
  bill_number     TEXT,
  clinical_notes  TEXT,
  status          TEXT DEFAULT 'scheduled',
  reason          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. treatments
CREATE TABLE IF NOT EXISTS treatments (
  treatment_id              TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  category                  TEXT,
  default_duration_minutes  INTEGER DEFAULT 30,
  estimated_cost            NUMERIC(10,2),
  description               TEXT
);

-- 8. medical_checkups
CREATE TABLE IF NOT EXISTS medical_checkups (
  checkup_id          TEXT PRIMARY KEY,
  patient_id          TEXT REFERENCES patients(patient_id) ON DELETE CASCADE,
  appointment_id      TEXT REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  dentist_id          TEXT REFERENCES dentists(dentist_id) ON DELETE SET NULL,
  blood_pressure      TEXT,
  medical_conditions  TEXT,
  allergies           TEXT,
  oral_hygiene_habits TEXT,
  teeth_findings_json TEXT,
  canker_sores        BOOLEAN DEFAULT FALSE,
  canker_sores_notes  TEXT,
  anomalous_teeth     TEXT,
  anomalous_teeth_notes TEXT,
  other_oral_notes    TEXT,
  consent_status      TEXT DEFAULT 'pending',
  refusal_reason      TEXT,
  status              TEXT DEFAULT 'draft',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 9. patient_requests
CREATE TABLE IF NOT EXISTS patient_requests (
  request_id            TEXT PRIMARY KEY,
  patient_name          TEXT NOT NULL,
  patient_phone         TEXT,
  patient_age           TEXT,
  patient_id            TEXT REFERENCES patients(patient_id) ON DELETE SET NULL,
  dentist_id            TEXT REFERENCES dentists(dentist_id) ON DELETE SET NULL,
  preferred_date        DATE,
  preferred_start_time  TEXT,
  preferred_end_time    TEXT,
  booking_time          TIMESTAMPTZ DEFAULT NOW(),
  reason                TEXT,
  source                TEXT DEFAULT 'simulator',
  status                TEXT DEFAULT 'pending',
  review_notes          TEXT,
  appointment_id        TEXT REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 10. staff
CREATE TABLE IF NOT EXISTS staff (
  staff_id    TEXT PRIMARY KEY,
  username    TEXT UNIQUE,
  full_name   TEXT,
  role        TEXT,
  department  TEXT,
  phone       TEXT,
  email       TEXT,
  initials    TEXT,
  status      TEXT DEFAULT 'Active',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  log_id      TEXT PRIMARY KEY,
  timestamp   TIMESTAMPTZ DEFAULT NOW(),
  staff_id    TEXT,
  entity_type TEXT,
  entity_id   TEXT,
  action      TEXT,
  details     TEXT
);

-- 12. metadata
CREATE TABLE IF NOT EXISTS metadata (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. sales
CREATE TABLE IF NOT EXISTS sales (
  sale_id         TEXT PRIMARY KEY,
  appointment_id  TEXT REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  patient_id      TEXT REFERENCES patients(patient_id) ON DELETE SET NULL,
  patient_name    TEXT,
  treatment_name  TEXT,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status          TEXT DEFAULT 'Pending',
  payment_method  TEXT,
  bill_number     TEXT,
  sale_date       DATE DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 14. vendors
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id   TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  contact     TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 15. purchases
CREATE TABLE IF NOT EXISTS purchases (
  purchase_id   TEXT PRIMARY KEY,
  vendor_id     TEXT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
  vendor_name   TEXT,
  items         TEXT,
  amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status        TEXT DEFAULT 'Ordered',
  order_date    DATE DEFAULT CURRENT_DATE,
  received_date DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 16. inventory
CREATE TABLE IF NOT EXISTS inventory (
  item_id     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  quantity    INTEGER DEFAULT 0,
  min_stock   INTEGER DEFAULT 0,
  unit        TEXT DEFAULT 'pcs',
  unit_price  NUMERIC(10,2) DEFAULT 0.00,
  supplier    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 17. payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  method_id       TEXT PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  type            TEXT,
  enabled         BOOLEAN DEFAULT TRUE,
  processing_fee  TEXT DEFAULT 'None',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_patient_requests_status ON patient_requests(status);

-- 18. peripherals (clinic equipment)
CREATE TABLE IF NOT EXISTS peripherals (
  peripheral_id TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT,
  location      TEXT,
  condition     TEXT DEFAULT 'Good',
  serial_no     TEXT,
  last_service  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
