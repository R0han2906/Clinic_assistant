'use client'

import React, { useState, useEffect } from 'react'
import { Search, Download, UserPlus, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { PatientResponse, PatientCreate } from '@/types/api'
import { PatientRow } from '@/components/patients/PatientRow'

interface PatientsDirectoryProps {
  initialPatients: any[]
}

export function PatientsDirectory({ initialPatients }: PatientsDirectoryProps) {
  const [patients, setPatients] = useState<any[]>(initialPatients)
  const [loading, setLoading] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // New patient form state
  const [newPatient, setNewPatient] = useState<PatientCreate>({
    full_name: '',
    phone: '',
    email: '',
    dob_or_age: '',
    gender: 'Male',
    address: '',
    emergency_contact: '',
    allergies: '',
    medical_conditions: '',
  })

  const loadPatients = async () => {
    setLoading(true)
    try {
      const data = await api.patients.list()
      setPatients(data || [])
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  // Debounced search directly querying backend
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = search.trim().toLowerCase()
      if (q) {
        try {
          const results = await api.patients.search(search.trim())
          setPatients(results || [])
        } catch {
          // If search fails, filter loaded patients
          setPatients((prev) =>
            prev.filter((p: any) =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.fullName && p.fullName.toLowerCase().includes(q)) ||
              (p.full_name && p.full_name.toLowerCase().includes(q)) ||
              (p.phone && p.phone.toLowerCase().includes(q)) ||
              (p.patient_id && p.patient_id.toLowerCase().includes(q))
            )
          )
        }
      } else {
        loadPatients()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatient.full_name || !newPatient.phone) {
      setErrorMsg('Full Name and Phone are required.')
      return
    }
    setCreating(true)
    setErrorMsg(null)
    try {
      if (editingId) {
        await api.patients.update(editingId, newPatient)
      } else {
        await api.patients.create(newPatient)
      }
      setIsModalOpen(false)
      setEditingId(null)
      setNewPatient({
        full_name: '',
        phone: '',
        email: '',
        dob_or_age: '',
        gender: 'Male',
        address: '',
        emergency_contact: '',
        allergies: '',
        medical_conditions: '',
      })
      loadPatients()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save patient')
    } finally {
      setCreating(false)
    }
  }

  // Filter patients by gender
  const filteredPatients = patients.filter((p) => {
    if (selectedGender && p.gender?.toLowerCase() !== selectedGender.toLowerCase()) {
      return false
    }
    return true
  })

  const openCreate = () => {
    setEditingId(null)
    setNewPatient({
      full_name: '',
      phone: '',
      email: '',
      dob_or_age: '',
      gender: 'Male',
      address: '',
      emergency_contact: '',
      allergies: '',
      medical_conditions: '',
    })
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const openEdit = (patient: any) => {
    setEditingId(patient.patient_id || patient.id)
    setNewPatient({
      full_name: patient.full_name || '',
      phone: patient.phone || '',
      email: patient.email || '',
      dob_or_age: patient.dob_or_age || '',
      gender: patient.gender || 'Male',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      allergies: patient.allergies || '',
      medical_conditions: patient.medical_conditions || '',
    })
    setErrorMsg(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (patient: any) => {
    const id = patient.patient_id || patient.id
    const name = patient.full_name || 'this patient'
    if (!id || !confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await api.patients.delete(id)
      loadPatients()
    } catch (err: any) {
      alert(err.message || 'Failed to delete patient')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Patients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all patient records · {filteredPatients.length} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(api.patients.exportCsvUrl(), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] shadow-sm"
          >
            <UserPlus className="size-4" /> New Patient
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Search by name, phone, or ID…"
          />
        </label>
        <select
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none text-foreground"
        >
          <option value="">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_90px_140px_130px_100px_88px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="w-10" />
          <div>Name / ID</div>
          <div>Age</div>
          <div className="hidden md:block">Phone</div>
          <div className="hidden lg:block">Emergency</div>
          <div>Gender</div>
          <div />
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No patient records found. Click &quot;New Patient&quot; to register your first patient.
          </div>
        ) : (
          filteredPatients.map((patient, idx) => (
            <PatientRow
              key={patient.patient_id || patient.id || `pat-${idx}`}
              patient={patient}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* New Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Patient' : 'Register New Patient'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>
            {errorMsg && (
              <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleCreatePatient} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPatient.full_name}
                  onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-muted-foreground">Phone *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="+1-555-0100"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={newPatient.email || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-muted-foreground">Age / DOB</label>
                  <input
                    type="text"
                    value={newPatient.dob_or_age || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, dob_or_age: e.target.value })}
                    placeholder="e.g. 28 or 1996-05-12"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-muted-foreground">Address</label>
                <input
                  type="text"
                  value={newPatient.address || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="e.g. 123 Main St, Springfield"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-muted-foreground">Emergency Contact</label>
                  <input
                    type="text"
                    value={newPatient.emergency_contact || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, emergency_contact: e.target.value })}
                    placeholder="e.g. Jane Doe (+1-555-0101)"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground">Allergies (if any)</label>
                  <input
                    type="text"
                    value={newPatient.allergies || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Latex"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  {creating ? 'Saving...' : editingId ? 'Save Changes' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
