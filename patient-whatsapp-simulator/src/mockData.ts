import type { Dentist, ExistingPatientRecord, TimeSlot, Treatment } from './types';

export const mockTreatments: Treatment[] = [
  {
    id: 'TRT-000001',
    name: 'Teeth Checkup',
    category: 'General',
    defaultDurationMinutes: 30,
    estimatedCost: 50.0,
    description: 'Comprehensive routine oral and dental examination',
  },
  {
    id: 'TRT-000002',
    name: 'Dental Braces',
    category: 'Orthodontics',
    defaultDurationMinutes: 60,
    estimatedCost: 2500.0,
    description: 'Orthodontic alignment consultation and fitting',
  },
  {
    id: 'TRT-000003',
    name: 'Scaling & Polishing',
    category: 'Preventive',
    defaultDurationMinutes: 30,
    estimatedCost: 120.0,
    description: 'Professional plaque removal and tooth polishing',
  },
  {
    id: 'TRT-000004',
    name: 'Teeth Whitening',
    category: 'Cosmetic',
    defaultDurationMinutes: 45,
    estimatedCost: 350.0,
    description: 'In-office tooth shade brightening treatment',
  },
];

export const mockDentists: Dentist[] = [
  {
    id: 'DOC-000001',
    name: 'Dr. Ananya Rao',
    specialty: 'Chief Dentist & Orthodontics',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    experience: '12+ Yrs Experience',
    colorCode: '#2563eb'
  },
  {
    id: 'DOC-000002',
    name: 'Dr. Rahul Mehta',
    specialty: 'Restorative & Endodontics',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    experience: '9+ Yrs Experience',
    colorCode: '#0d9488'
  },
  {
    id: 'DOC-ANY',
    name: 'Any Available Dentist',
    specialty: 'First Available Slot',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    experience: 'Fastest Booking Option',
    colorCode: '#4f46e5'
  }
];

export const mockExistingPatients: ExistingPatientRecord[] = [
  {
    patientId: 'PAT-000001',
    fullName: 'Rahul Sharma',
    phone: '+91 9988776655',
    ageOrDob: '32',
    lastVisitDate: '2026-08-15',
    lastVisitType: 'Routine Scaling & Cleaning',
    upcomingAppointment: {
      referenceCode: 'DEMO-884920',
      dentistName: 'Dr. Ananya Rao',
      date: '2026-09-08',
      time: '10:00 - 10:30'
    }
  },
  {
    patientId: 'PAT-000002',
    fullName: 'Priya Patel',
    phone: '+91 9876543210',
    ageOrDob: '28',
    lastVisitDate: '2026-07-10',
    lastVisitType: 'Root Canal Follow-up'
  }
];

// Generate realistic mock dates for demo
export const mockAvailableDates = [
  { date: '2026-09-07', label: 'Mon, Sep 7', isToday: false },
  { date: '2026-09-08', label: 'Tue, Sep 8', isToday: false },
  { date: '2026-09-09', label: 'Wed, Sep 9', isToday: false },
  { date: '2026-09-10', label: 'Thu, Sep 10', isToday: false },
  { date: '2026-09-11', label: 'Fri, Sep 11', isToday: false }
];

export function getMockSlots(dentistId: string, date: string): TimeSlot[] {
  const baseTimes = [
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' },
    { start: '11:00', end: '11:30' },
    { start: '11:30', end: '12:00' },
    { start: '13:00', end: '14:00', isLunch: true },
    { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' },
    { start: '15:30', end: '16:00' },
    { start: '16:00', end: '16:30' },
    { start: '16:30', end: '17:00' }
  ];

  return baseTimes
    .filter((t) => !t.isLunch)
    .map((t, idx) => {
      const slotId = `SLOT-${dentistId}-${date}-${t.start}`;
      
      // Deterministically set 2 slots as booked/unavailable for demonstration
      let isAvailable = true;
      let unavailableReason: string | undefined = undefined;

      if (idx === 1 && (dentistId === 'DOC-000001' || dentistId === 'DOC-ANY')) {
        isAvailable = false;
        unavailableReason = 'Booked by staff';
      } else if (idx === 4 && date === '2026-09-08') {
        isAvailable = false;
        unavailableReason = 'Reserved slot';
      } else if (idx === 7 && dentistId === 'DOC-000002') {
        isAvailable = false;
        unavailableReason = 'Dentist in procedure';
      }

      return {
        id: slotId,
        dentistId,
        date,
        startTime: t.start,
        endTime: t.end,
        isAvailable,
        unavailableReason
      };
    });
}
