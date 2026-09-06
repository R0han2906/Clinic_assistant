import {
  PatientResponse, PatientCreate, PatientUpdate, VisitResponse, VisitCreate,
  AppointmentResponse, AppointmentCreate, AppointmentReschedule, AppointmentFilters,
  DentistResponse, SlotResponse,
  TreatmentResponse, TreatmentCreate, TreatmentUpdate,
  StaffResponse, StaffCreate, StaffUpdate,
  SaleResponse, SaleCreate, SaleSummary, SaleFilters, PaymentMethodResponse,
  PurchaseResponse, PurchaseCreate,
  InventoryResponse, InventoryCreate, InventoryUpdate, InventoryFilters,
  PatientRequestResponse,
  VendorResponse, PeripheralResponse, PeripheralCreate, PeripheralUpdate
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { detail: res.statusText };
      }
      throw new ApiError(res.status, errorData.detail?.message || errorData.detail || 'API request failed', errorData);
    }
    if (res.status === 204) {
      return null as unknown as T;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, err?.message || 'Network error connecting to backend API');
  }
}

function qs(params: Record<string, any> = {}): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  baseUrl: API_URL,

  // ── Patients ──────────────────────────────────────────────────
  patients: {
    list: () => request<PatientResponse[]>('/api/v1/patients'),
    get: (id: string) => request<PatientResponse>(`/api/v1/patients/${id}`),
    search: (query: string) => request<PatientResponse[]>(`/api/v1/patients?query=${encodeURIComponent(query)}`),
    create: (data: PatientCreate) => request<PatientResponse>('/api/v1/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, updates: PatientUpdate) => request<PatientResponse>(`/api/v1/patients/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) => request<void>(`/api/v1/patients/${id}`, { method: 'DELETE' }),
    exportCsvUrl: () => `${API_URL}/api/v1/export/patients.csv`,
    getVisits: (patientId: string) => request<VisitResponse[]>(`/api/v1/patients/${patientId}/visits`),
    createVisit: (patientId: string, data: VisitCreate) => request<VisitResponse>(`/api/v1/patients/${patientId}/visits`, { method: 'POST', body: JSON.stringify(data) })
  },

  // ── Appointments ──────────────────────────────────────────────
  appointments: {
    list: (filters: AppointmentFilters = {}) => request<AppointmentResponse[]>(`/api/v1/appointments${qs(filters)}`),
    today: () => request<AppointmentResponse[]>('/api/v1/appointments/today'),
    get: (id: string) => request<AppointmentResponse>(`/api/v1/appointments/${id}`),
    create: (data: AppointmentCreate) => request<AppointmentResponse>('/api/v1/appointments', { method: 'POST', body: JSON.stringify(data) }),
    reschedule: (id: string, data: AppointmentReschedule) => request<AppointmentResponse>(`/api/v1/appointments/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: string, reason?: string) => request<AppointmentResponse>(`/api/v1/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    complete: (id: string, notes?: string) => request<AppointmentResponse>(`/api/v1/appointments/${id}/complete`, { method: 'POST', body: JSON.stringify({ notes }) }),
    updateStatus: (id: string, status: string, notes?: string) =>
      request<AppointmentResponse>(`/api/v1/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    updatePayment: (id: string, payment_status: string, bill_number?: string) => request<AppointmentResponse>(`/api/v1/appointments/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ payment_status, bill_number }) }),
    getVisitSummary: (id: string) => request<any>(`/api/v1/appointments/${id}/visit-summary`),
    saveVisitSummary: (id: string, data: any) => request<any>(`/api/v1/appointments/${id}/visit-summary`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, updates: Record<string, any>) => request<AppointmentResponse>(`/api/v1/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    exportCsvUrl: (date?: string) => `${API_URL}/api/v1/export/appointments.csv${date ? `?date=${date}` : ''}`
  },

  // ── Dentists & Availability ────────────────────────────────────
  dentists: {
    list: (activeOnly: boolean = true) => request<DentistResponse[]>('/api/v1/dentists'),
    get: (id: string) => request<DentistResponse>(`/api/v1/dentists/${id}`),
    getSlots: (date: string, dentistId?: string, duration: number = 30) => {
      const q = qs({ date, dentist_id: dentistId, duration });
      return request<SlotResponse[]>(`/api/v1/availability/slots${q}`);
    }
  },

  // ── Treatments Catalog ─────────────────────────────────────────
  treatments: {
    list: () => request<TreatmentResponse[]>('/api/v1/treatments'),
    get: (id: string) => request<TreatmentResponse>(`/api/v1/treatments/${id}`),
    create: (data: TreatmentCreate) => request<TreatmentResponse>('/api/v1/treatments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: TreatmentUpdate) => request<TreatmentResponse>(`/api/v1/treatments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/v1/treatments/${id}`, { method: 'DELETE' })
  },

  // ── Staff ──────────────────────────────────────────────────────
  staff: {
    list: (activeOnly: boolean = false) => request<StaffResponse[]>(`/api/v1/staff${activeOnly ? '?active_only=true' : ''}`),
    get: (id: string) => request<StaffResponse>(`/api/v1/staff/${id}`),
    create: (data: StaffCreate) => request<StaffResponse>('/api/v1/staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, updates: StaffUpdate) => request<StaffResponse>(`/api/v1/staff/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) => request<void>(`/api/v1/staff/${id}`, { method: 'DELETE' })
  },

  // ── Sales & Billing ────────────────────────────────────────────
  sales: {
    list: (filters: SaleFilters = {}) => request<SaleResponse[]>(`/api/v1/sales${qs(filters)}`),
    summary: () => request<SaleSummary>('/api/v1/sales/summary'),
    get: (id: string) => request<SaleResponse>(`/api/v1/sales/${id}`),
    create: (data: SaleCreate) => request<SaleResponse>('/api/v1/sales', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<SaleResponse>(`/api/v1/sales/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    listPaymentMethods: () => request<PaymentMethodResponse[]>('/api/v1/sales/payment-methods'),
    updatePaymentMethod: (id: string, enabled?: boolean, fee?: string) => request<PaymentMethodResponse>(`/api/v1/sales/payment-methods/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled, processing_fee: fee }) }),
    exportCsvUrl: (status?: string) => `${API_URL}/api/v1/export/sales.csv${status ? `?status=${status}` : ''}`
  },

  // ── Purchases ──────────────────────────────────────────────────
  purchases: {
    list: (status?: string) => request<PurchaseResponse[]>(`/api/v1/purchases${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<PurchaseResponse>(`/api/v1/purchases/${id}`),
    create: (data: PurchaseCreate) => request<PurchaseResponse>('/api/v1/purchases', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, receivedDate?: string) => request<PurchaseResponse>(`/api/v1/purchases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, received_date: receivedDate }) }),
    listVendors: () => request<VendorResponse[]>('/api/v1/purchases/vendors'),
    createVendor: (data: { name: string; contact?: string; email?: string; phone?: string; address?: string }) =>
      request<VendorResponse>('/api/v1/purchases/vendors', { method: 'POST', body: JSON.stringify(data) }),
    exportCsvUrl: () => `${API_URL}/api/v1/export/purchases.csv`
  },

  // ── Inventory / Stocks ─────────────────────────────────────────
  inventory: {
    list: (filters: InventoryFilters = {}) => {
      const q = qs({ category: filters.category, low_stock: filters.low_stock_only });
      return request<InventoryResponse[]>(`/api/v1/inventory${q}`);
    },
    get: (id: string) => request<InventoryResponse>(`/api/v1/inventory/${id}`),
    create: (data: InventoryCreate) => request<InventoryResponse>('/api/v1/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, updates: InventoryUpdate) => request<InventoryResponse>(`/api/v1/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    updateQuantity: (id: string, quantity: number) => request<InventoryResponse>(`/api/v1/inventory/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    delete: (id: string) => request<void>(`/api/v1/inventory/${id}`, { method: 'DELETE' }),
    exportCsvUrl: () => `${API_URL}/api/v1/export/inventory.csv`
  },

  // ── Patient Requests (WhatsApp Simulator) ──────────────────────
  patientRequests: {
    list: (status?: string) => request<PatientRequestResponse[]>(`/api/v1/patient-requests${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<PatientRequestResponse>(`/api/v1/patient-requests/${id}`),
    approve: (id: string, reviewNotes?: string) => request<PatientRequestResponse>(`/api/v1/patient-requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ review_notes: reviewNotes }) }),
    reject: (id: string, reviewNotes?: string) => request<PatientRequestResponse>(`/api/v1/patient-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ review_notes: reviewNotes }) }),
    cancel: (id: string, reviewNotes?: string) => request<PatientRequestResponse>(`/api/v1/patient-requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ review_notes: reviewNotes }) })
  },

  // ── Peripherals / Equipment ────────────────────────────────────
  peripherals: {
    list: () => request<PeripheralResponse[]>('/api/v1/peripherals'),
    get: (id: string) => request<PeripheralResponse>(`/api/v1/peripherals/${id}`),
    create: (data: PeripheralCreate) => request<PeripheralResponse>('/api/v1/peripherals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, updates: PeripheralUpdate) => request<PeripheralResponse>(`/api/v1/peripherals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) => request<void>(`/api/v1/peripherals/${id}`, { method: 'DELETE' })
  },

  // ── System Health ──────────────────────────────────────────────
  system: {
    health: () => request<any>('/api/v1/system/health')
  }
};
