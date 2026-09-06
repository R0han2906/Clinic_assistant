import { PatientsDirectory } from '@/components/patients/PatientsDirectory'

export const dynamic = 'force-static'

export default function PatientsPage() {
  return <PatientsDirectory initialPatients={[]} />
}
