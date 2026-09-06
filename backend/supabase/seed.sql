-- Zendenta Seed Data (Supabase PostgreSQL)

-- 1. Dentists
INSERT INTO dentists (dentist_id, name, specialty, phone, email, color_code, is_active)
VALUES
  ('DOC-000001', 'Drg Soap Mactavish', 'Chief Dentist & Orthodontics', '+62 812-3456-7890', 'soap.mactavish@zendenta.local', '#2563eb', TRUE),
  ('DOC-000002', 'Drg Jerald O''Hara', 'Endodontist & Oral Surgery', '+62 812-3456-7891', 'jerald.ohara@zendenta.local', '#059669', TRUE),
  ('DOC-000003', 'Drg Putri Larasati', 'Pediatric & Restorative Dentistry', '+62 812-3456-7892', 'putri.larasati@zendenta.local', '#d97706', TRUE),
  ('DEN-000001', 'Dr. Sarah Wilson', 'General Dentistry', '+1-555-0101', 'sarah.wilson@zendenta.com', '#3B82F6', TRUE),
  ('DEN-000002', 'Dr. Michael Chen', 'Orthodontics', '+1-555-0102', 'michael.chen@zendenta.com', '#10B981', TRUE)
ON CONFLICT (dentist_id) DO UPDATE SET
  name = EXCLUDED.name,
  specialty = EXCLUDED.specialty,
  color_code = EXCLUDED.color_code;

-- 2. Availability (Mon-Sat for all dentists)
INSERT INTO availability (availability_id, dentist_id, day_of_week, start_time, end_time, break_start, break_end, is_working_day)
VALUES
  ('AV-DOC1-0', 'DOC-000001', 0, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC1-1', 'DOC-000001', 1, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC1-2', 'DOC-000001', 2, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC1-3', 'DOC-000001', 3, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC1-4', 'DOC-000001', 4, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC1-5', 'DOC-000001', 5, '09:00', '14:00', NULL, NULL, TRUE),
  ('AV-DOC1-6', 'DOC-000001', 6, '00:00', '00:00', NULL, NULL, FALSE),
  ('AV-DOC2-0', 'DOC-000002', 0, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC2-1', 'DOC-000002', 1, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC2-2', 'DOC-000002', 2, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC2-3', 'DOC-000002', 3, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC2-4', 'DOC-000002', 4, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC2-5', 'DOC-000002', 5, '09:00', '14:00', NULL, NULL, TRUE),
  ('AV-DOC2-6', 'DOC-000002', 6, '00:00', '00:00', NULL, NULL, FALSE),
  ('AV-DOC3-0', 'DOC-000003', 0, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC3-1', 'DOC-000003', 1, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC3-2', 'DOC-000003', 2, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC3-3', 'DOC-000003', 3, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC3-4', 'DOC-000003', 4, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-DOC3-5', 'DOC-000003', 5, '09:00', '14:00', NULL, NULL, TRUE),
  ('AV-DOC3-6', 'DOC-000003', 6, '00:00', '00:00', NULL, NULL, FALSE),
  ('AV-000001', 'DEN-000001', 0, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000002', 'DEN-000001', 1, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000003', 'DEN-000001', 2, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000004', 'DEN-000001', 3, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000005', 'DEN-000001', 4, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000006', 'DEN-000001', 5, '09:00', '14:00', NULL, NULL, TRUE),
  ('AV-000007', 'DEN-000001', 6, '00:00', '00:00', NULL, NULL, FALSE),
  ('AV-000008', 'DEN-000002', 0, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000009', 'DEN-000002', 1, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000010', 'DEN-000002', 2, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000011', 'DEN-000002', 3, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000012', 'DEN-000002', 4, '09:00', '17:00', '12:00', '13:00', TRUE),
  ('AV-000013', 'DEN-000002', 5, '09:00', '14:00', NULL, NULL, TRUE),
  ('AV-000014', 'DEN-000002', 6, '00:00', '00:00', NULL, NULL, FALSE)
ON CONFLICT (availability_id) DO NOTHING;

-- 3. Treatments
INSERT INTO treatments (treatment_id, name, category, default_duration_minutes, estimated_cost, description)
VALUES
  ('TRT-000001', 'General Consultation', 'General', 30, 50.00, 'Routine examination and oral health assessment'),
  ('TRT-000002', 'Teeth Cleaning & Scaling', 'Preventive', 45, 90.00, 'Professional cleaning and calculus removal'),
  ('TRT-000003', 'Dental Filling', 'Restorative', 45, 120.00, 'Composite resin tooth filling'),
  ('TRT-000004', 'Root Canal Treatment', 'Endodontics', 60, 350.00, 'Complete root canal therapy'),
  ('TRT-000005', 'Teeth Whitening', 'Cosmetic', 60, 250.00, 'Professional in-office whitening'),
  ('TRT-000006', 'Dental Crown', 'Prosthodontics', 60, 600.00, 'Porcelain-fused-to-metal crown'),
  ('TRT-000007', 'Tooth Extraction', 'Surgery', 45, 150.00, 'Simple surgical extraction')
ON CONFLICT (treatment_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  default_duration_minutes = EXCLUDED.default_duration_minutes,
  estimated_cost = EXCLUDED.estimated_cost,
  description = EXCLUDED.description;

-- 4. Payment Methods
INSERT INTO payment_methods (method_id, name, type, enabled, processing_fee)
VALUES
  ('PM-000001', 'Cash', 'Cash', TRUE, 'None'),
  ('PM-000002', 'Credit Card', 'Card', TRUE, '2.0%'),
  ('PM-000003', 'Debit Card', 'Card', TRUE, '0.5%'),
  ('PM-000004', 'QRIS / Digital Payment', 'Digital', TRUE, 'None'),
  ('PM-000005', 'Bank Transfer', 'Bank', TRUE, 'None'),
  ('PM-000006', 'Insurance (BPJS / Private)', 'Insurance', TRUE, 'None'),
  ('PM-000007', 'GoPay / E-Wallet', 'E-Wallet', TRUE, '1.5%'),
  ('PM-000008', 'Installment Plan', 'Installment', TRUE, '3.0%')
ON CONFLICT (method_id) DO NOTHING;

-- 5. Vendors
INSERT INTO vendors (vendor_id, name, contact, email, phone, address)
VALUES
  ('VND-000001', 'DentSupply Co.', 'John Miller', 'orders@dentsupply.com', '+1-555-0201', '100 Medical Blvd, Chicago, IL'),
  ('VND-000002', 'Medix Pharma', 'Clara Adams', 'support@medixpharma.com', '+1-555-0202', '45 Health Way, Boston, MA'),
  ('VND-000003', 'BioTech Dental', 'David Lee', 'sales@biotechdental.com', '+1-555-0203', '88 Tech Park, Austin, TX')
ON CONFLICT (vendor_id) DO NOTHING;

-- 6. Inventory Items
INSERT INTO inventory (item_id, name, category, quantity, min_stock, unit, unit_price, supplier)
VALUES
  ('INV-000001', 'Dental Bibs (500pk)', 'Consumables', 45, 10, 'pk', 25.00, 'DentSupply Co.'),
  ('INV-000002', 'Latex Examination Gloves (M)', 'Consumables', 8, 15, 'box', 18.50, 'DentSupply Co.'),
  ('INV-000003', 'Lidocaine 2% w/ Epinephrine', 'Pharmaceuticals', 6, 10, 'box', 42.00, 'Medix Pharma'),
  ('INV-000004', 'Composite Resin A2 Shade', 'Materials', 20, 5, 'syringe', 65.00, 'BioTech Dental'),
  ('INV-000005', 'Dental Mirrors No. 5 (10pk)', 'Instruments', 5, 8, 'pk', 35.00, 'DentSupply Co.')
ON CONFLICT (item_id) DO NOTHING;

-- 7. Staff
INSERT INTO staff (staff_id, username, full_name, role, department, phone, email, initials, status, is_active)
VALUES
  ('STF-000001', 'admin', 'Emma Watson', 'Clinic Manager', 'Administration', '+1-555-0301', 'emma@zendenta.com', 'EW', 'Active', TRUE),
  ('STF-000002', 'receptionist1', 'Jessica Taylor', 'Head Receptionist', 'Front Desk', '+1-555-0302', 'jessica@zendenta.com', 'JT', 'Active', TRUE),
  ('STF-000003', 'nurse1', 'Alex Robinson', 'Senior Dental Assistant', 'Nursing', '+1-555-0303', 'alex@zendenta.com', 'AR', 'Active', TRUE)
ON CONFLICT (staff_id) DO NOTHING;

-- 8. Metadata
INSERT INTO metadata (key, value)
VALUES
  ('clinic_name', 'Zendenta Dental Clinic'),
  ('schema_version', '2.0.0'),
  ('storage_backend', 'supabase')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 9. Patients
INSERT INTO patients (patient_id, full_name, dob_or_age, phone, email, emergency_contact, gender, address, allergies, medical_conditions, consent_status)
VALUES
  ('PAT-000001', 'Rafli Jainudin', '28', '+62 812-1111-2222', 'rafli.jainudin@example.com', '+62 812-9999-0001', 'Male', 'Jl. Sudirman No. 42, Jakarta', 'None', 'None', 'GIVEN'),
  ('PAT-000002', 'Siti Rahma', '34', '+62 812-3333-4444', 'siti.rahma@example.com', '+62 812-9999-0002', 'Female', 'Jl. Gatot Subroto No. 12, Jakarta', 'Penicillin', 'Hypertension', 'GIVEN'),
  ('PAT-000003', 'Sekar Nandita', '26', '+62 812-4444-5555', 'sekar.nandita@example.com', '+62 812-9999-0003', 'Female', 'Jl. Thamrin No. 8, Jakarta', 'None', 'None', 'GIVEN'),
  ('PAT-000004', 'Budi Santoso', '42', '+62 812-5555-6666', 'budi.santoso@example.com', '+62 812-9999-0004', 'Male', 'Jl. Rasuna Said No. 5, Jakarta', 'None', 'Diabetes Mellitus', 'GIVEN'),
  ('PAT-000005', 'Daniswara', '32', '+62 812-6666-7777', 'daniswara@example.com', '+62 812-9999-0005', 'Male', 'Jl. Senopati No. 18, Jakarta', 'Aspirin', 'None', 'GIVEN'),
  ('PAT-000006', 'Christopher Smallwood', '31', '+62 812-7777-8888', 'christopher.smallwood@example.com', '+62 812-9999-0006', 'Male', 'Jl. Kemang Raya No. 88, Jakarta', 'Latex', 'Asthma', 'GIVEN')
ON CONFLICT (patient_id) DO NOTHING;

-- 10. Sample Appointments (Canonical Zendenta v3 states for CURRENT_DATE & 2022-05-16)
INSERT INTO appointments (
  appointment_id, patient_id, dentist_id, date, start_time, end_time,
  booking_time, treatment_name, source, payment_status, bill_number,
  clinical_notes, status, reason, notes
) VALUES
  ('APT-000001', 'PAT-000001', 'DOC-000001', CURRENT_DATE, '09:00', '10:00', NOW(), 'Teeth Cleaning & Scaling', 'MANUAL APPOINTMENT', 'PAID', 'Bill #10101', 'Scaling completed thoroughly. Plaque score 12%.', 'completed', 'Routine prophylaxis', 'Patient arrived on time'),
  ('APT-000002', 'PAT-000003', 'DOC-000001', CURRENT_DATE, '10:00', '11:00', NOW(), 'General Consultation', 'MANUAL APPOINTMENT', 'UNPAID', 'Bill #10102', 'In chair, examining upper right quadrant.', 'in-progress', 'Toothache #16', 'Started at 10:02'),
  ('APT-000003', 'PAT-000004', 'DOC-000002', CURRENT_DATE, '11:00', '12:00', NOW(), 'Dental Filling', 'WALK_IN', 'UNPAID', 'Bill #10103', 'Patient seated in waiting area, verified insurance.', 'checked-in', 'Filling cracked', 'Walk-in arrival at 10:45'),
  ('APT-000004', 'PAT-000006', 'DOC-000003', CURRENT_DATE, '14:00', '15:00', NOW(), 'Tooth Extraction', 'ONLINE', 'UNPAID', 'Bill #10104', NULL, 'scheduled', 'Wisdom tooth extraction', 'Confirmed via SMS'),
  ('APT-000005', 'PAT-000002', 'DOC-000001', CURRENT_DATE, '15:00', '16:00', NOW(), 'Teeth Whitening', 'MANUAL APPOINTMENT', 'UNPAID', 'Bill #10105', NULL, 'scheduled', 'Laser bleaching session', 'Second session'),
  ('APT-000011', 'PAT-000001', 'DOC-000001', '2022-05-16', '09:00', '10:00', '2022-05-16 08:30:00', 'General Checkup', 'MANUAL APPOINTMENT', 'PAID', 'Bill #10001', 'Checkup completed.', 'completed', 'Routine checkup', 'On time'),
  ('APT-000012', 'PAT-000003', 'DOC-000001', '2022-05-16', '10:00', '11:00', '2022-05-16 09:30:00', 'Tooth Scaling', 'MANUAL APPOINTMENT', 'PAID', 'Bill #10002', 'Plaque cleared.', 'completed', 'Scaling', 'Regular clean'),
  ('APT-000013', 'PAT-000004', 'DOC-000002', '2022-05-16', '11:00', '12:00', '2022-05-16 10:00:00', 'Bleaching', 'MANUAL APPOINTMENT', 'PAID', 'Bill #10003', 'Bleaching shade A1.', 'completed', 'Whitening', 'Cosmetic'),
  ('APT-000014', 'PAT-000006', 'DOC-000003', '2022-05-16', '14:00', '15:00', '2022-05-16 13:00:00', 'Tooth Extraction', 'ONLINE', 'UNPAID', 'Bill #10004', NULL, 'scheduled', 'Tooth extraction', 'Follow up')
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO peripherals (peripheral_id, name, category, location, condition, serial_no, last_service)
VALUES
  ('PER-000001', 'Dental Chair #1', 'Chair', 'Room 1', 'Good', 'DC-2021-001', '2024-02-15'),
  ('PER-000002', 'Dental Chair #2', 'Chair', 'Room 2', 'Good', 'DC-2021-002', '2024-02-15'),
  ('PER-000003', 'Dental X-Ray Machine', 'Imaging', 'Room 1', 'Good', 'XR-2020-007', '2024-03-20'),
  ('PER-000004', 'Digital Panoramic X-Ray', 'Imaging', 'X-Ray', 'Service', 'PX-2019-003', '2023-11-10'),
  ('PER-000005', 'Autoclave Sterilizer', 'Sterilization', 'Lab', 'Good', 'AC-2022-001', '2024-01-08'),
  ('PER-000006', 'Intraoral Camera', 'Imaging', 'Room 2', 'Good', 'IC-2023-005', '2024-04-05'),
  ('PER-000007', 'Dental Compressor', 'Equipment', 'Utility', 'Good', 'CP-2021-002', '2024-01-22'),
  ('PER-000008', 'Patient Monitor #1', 'Monitor', 'Room 1', 'Good', 'PM-2022-001', '2024-03-15'),
  ('PER-000009', 'Reception Computer', 'IT', 'Front', 'Good', 'PC-2023-001', '2024-04-20'),
  ('PER-000010', 'Billing Printer', 'IT', 'Front', 'Needs Check', 'PR-2020-004', '2023-08-01')
ON CONFLICT (peripheral_id) DO NOTHING;


