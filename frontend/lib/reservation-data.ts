export type Appointment = {
  id: string
  patient: string
  time: string
  treatment: string
  status: 'Finished' | 'Registered' | 'Waiting payment'
  color: 'rose' | 'sage' | 'sky' | 'amber'
  dentist: string
}

export const navGroups = [
  { label: 'Clinic', items: ['Dashboard', 'Reservations', 'Patients', 'Treatments', 'Staff List'] },
  { label: 'Finance', items: ['Accounts', 'Sales', 'Purchases', 'Payment Method'] },
  { label: 'Physical asset', items: ['Stocks', 'Peripherals'] },
  { label: 'Other', items: ['Report', 'Customer Support'] },
]

export const appointments: Appointment[] = [
  { id: 'a1', patient: 'Rafli Jainudin', time: '09:00 AM › 10:00 AM', treatment: 'General Checkup', status: 'Finished', color: 'rose', dentist: 'Drg Soap Mactavish' },
  { id: 'a2', patient: 'Sekar Nandita', time: '10:00 AM › 11:00 AM', treatment: 'Scaling', status: 'Finished', color: 'sage', dentist: 'Drg Soap Mactavish' },
  { id: 'a3', patient: 'Angkasa Pura', time: '11:00 AM › 12:00 PM', treatment: 'Bleaching', status: 'Finished', color: 'sage', dentist: "Drg Jerald O'Hara" },
  { id: 'a4', patient: 'Lembayung Senja', time: '12:00 PM › 01:00 PM', treatment: 'Extraction', status: 'Finished', color: 'sky', dentist: 'Drg Soap Mactavish' },
  { id: 'a5', patient: 'Daniswara', time: '02:30 PM › 03:30 PM', treatment: 'General Checkup', status: 'Registered', color: 'sky', dentist: 'Drg Soap Mactavish' },
  { id: 'a6', patient: 'Christopher Smallwood', time: '02:00 PM › 03:00 PM', treatment: 'Tooth Scaling', status: 'Registered', color: 'sky', dentist: 'Drg Putri Larasati' },
]

export const teeth = [12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

export const medicalSteps = ['Medical data', 'Treatment Plan', 'Oral Check', 'Plan Agreement']

export const patient = {
  name: 'Christopher Smallwood',
  fullName: 'Christopher C. Smallwood',
  email: 'ChristopherW12@mail.com',
  phone: '+1 (409)-832-3913',
  age: 'Sidoarjo, January 21 2002',
  gender: 'Male',
  address: '4337 Lynn Ogden Lane, Beaumont, TX 77701',
}
