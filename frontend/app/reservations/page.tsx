import { CalendarBoard } from '@/components/reservations/CalendarBoard'

export const dynamic = 'force-static'

export default function ReservationsPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-82px)] overflow-hidden">
      <CalendarBoard
        initialAppointments={[]}
        initialDentists={[]}
      />
    </div>
  )
}
