import { api } from '@/lib/api-client';
import { PatientProfile } from '../types';

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

/**
 * Firsthand Patient Recognition by Phone Number / Query.
 * Matches by exact phone, digit suffix, or name.
 */
export async function lookupPatientByPhone(query: string): Promise<PatientProfile | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    // 1. Direct search by full query
    let patients = await api.patients.search(trimmed);

    // 2. If no direct result and contains digits, search by extracted digits
    const digits = normalizePhoneNumber(trimmed);
    if ((!patients || patients.length === 0) && digits.length >= 7) {
      patients = await api.patients.search(digits);
    }

    // 3. Fallback: fetch list and check suffix match
    if (!patients || patients.length === 0) {
      if (digits.length >= 7) {
        const all = await api.patients.list();
        patients = all.filter((p) => {
          const pDigits = normalizePhoneNumber(p.phone || '');
          return pDigits.endsWith(digits) || digits.endsWith(pDigits);
        });
      }
    }

    if (!patients || patients.length === 0) {
      return null;
    }

    const match = patients[0];
    return {
      patientId: match.patient_id,
      fullName: match.full_name,
      phone: match.phone,
      dobOrAge: match.dob_or_age || 'Unknown',
      gender: match.gender,
      isExisting: true,
      allergies: match.allergies,
      lastVisit: match.created_at?.split('T')[0],
    };
  } catch (err) {
    console.warn('[patient-lookup] Failed to query backend:', err);
    return null;
  }
}
