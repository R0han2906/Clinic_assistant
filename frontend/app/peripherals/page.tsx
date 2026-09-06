export const dynamic = 'force-static'

const peripherals = [
  { id: 'per1',  name: 'Dental Chair #1',          category: 'Chair',        location: 'Room 1', condition: 'Good',      serialNo: 'DC-2021-001', lastService: '2024-02-15' },
  { id: 'per2',  name: 'Dental Chair #2',          category: 'Chair',        location: 'Room 2', condition: 'Good',      serialNo: 'DC-2021-002', lastService: '2024-02-15' },
  { id: 'per3',  name: 'Dental X-Ray Machine',     category: 'Imaging',      location: 'Room 1', condition: 'Good',      serialNo: 'XR-2020-007', lastService: '2024-03-20' },
  { id: 'per4',  name: 'Digital Panoramic X-Ray',  category: 'Imaging',      location: 'X-Ray',  condition: 'Service',   serialNo: 'PX-2019-003', lastService: '2023-11-10' },
  { id: 'per5',  name: 'Autoclave Sterilizer',     category: 'Sterilization',location: 'Lab',    condition: 'Good',      serialNo: 'AC-2022-001', lastService: '2024-01-08' },
  { id: 'per6',  name: 'Intraoral Camera',         category: 'Imaging',      location: 'Room 2', condition: 'Good',      serialNo: 'IC-2023-005', lastService: '2024-04-05' },
  { id: 'per7',  name: 'Dental Compressor',        category: 'Equipment',    location: 'Utility',condition: 'Good',      serialNo: 'CP-2021-002', lastService: '2024-01-22' },
  { id: 'per8',  name: 'Patient Monitor #1',       category: 'Monitor',      location: 'Room 1', condition: 'Good',      serialNo: 'PM-2022-001', lastService: '2024-03-15' },
  { id: 'per9',  name: 'Reception Computer',       category: 'IT',           location: 'Front',  condition: 'Good',      serialNo: 'PC-2023-001', lastService: '2024-04-20' },
  { id: 'per10', name: 'Billing Printer',          category: 'IT',           location: 'Front',  condition: 'Needs Check',serialNo: 'PR-2020-004', lastService: '2023-08-01' },
]

const CONDITION_CLASSES: Record<string, string> = {
  Good:          'bg-emerald-50 text-emerald-700',
  Service:       'bg-amber-50 text-amber-700',
  'Needs Check': 'bg-red-50 text-red-700',
}

export default function PeripheralsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Peripherals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Physical assets and equipment · {peripherals.length} items
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          + Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {peripherals.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium">{p.category}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CONDITION_CLASSES[p.condition] ?? 'bg-muted text-muted-foreground'}`}>
                {p.condition}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{p.name}</h3>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>📍 {p.location}</p>
              <p>S/N: {p.serialNo}</p>
              <p>Last service: {p.lastService}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
