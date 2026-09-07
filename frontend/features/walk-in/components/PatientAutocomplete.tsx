'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  UserCheck,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { PatientResponse } from '@/types/api'
import { WalkInPatientData } from '../types'

interface PatientAutocompleteProps {
  selectedPatient: WalkInPatientData | null
  onSelectPatient: (patient: WalkInPatientData) => void
  onClear: () => void
}

export function PatientAutocomplete({
  selectedPatient,
  onSelectPatient,
  onClear,
}: PatientAutocompleteProps) {
  const [mode, setMode] = useState<'search' | 'new'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // New patient form fields
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAge, setNewAge] = useState('')
  const [newGender, setNewGender] = useState('Male')
  const [newAllergies, setNewAllergies] = useState('')

  // Load patient directory on mount
  useEffect(() => {
    setIsLoading(true)
    api.patients
      .list()
      .then((list) => {
        setPatients(list || [])
      })
      .catch((err) => {
        console.warn('Could not load patients list:', err)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter existing patients by name, phone, or PAT-ID
  const filteredPatients = patients
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return false // Only show dropdown when typing or focused with query
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.patient_id || '').toLowerCase().includes(q)
      )
    })
    .slice(0, 5)

  const handleSelectExisting = (p: PatientResponse) => {
    const patientData: WalkInPatientData = {
      id: p.patient_id,
      name: p.full_name,
      phone: p.phone,
      ageOrDob: p.dob_or_age || '',
      gender: p.gender || 'Male',
      allergies: p.allergies || undefined,
      medicalConditions: p.medical_conditions || undefined,
      isExisting: true,
    }
    onSelectPatient(patientData)
    setIsDropdownOpen(false)
    setSearchQuery('')
  }

  const handleApplyNewPatient = () => {
    if (!newName.trim() || !newPhone.trim()) return
    const patientData: WalkInPatientData = {
      name: newName.trim(),
      phone: newPhone.trim(),
      ageOrDob: newAge.trim() || '30',
      gender: newGender,
      allergies: newAllergies.trim() || undefined,
      isExisting: false,
    }
    onSelectPatient(patientData)
  }

  // Sync new patient form data with parent state without unmounting inputs
  useEffect(() => {
    if (mode === 'new') {
      if (newName.trim().length >= 2 && newPhone.trim().length >= 6) {
        onSelectPatient({
          name: newName.trim(),
          phone: newPhone.trim(),
          ageOrDob: newAge.trim() || '30',
          gender: newGender,
          allergies: newAllergies.trim() || undefined,
          isExisting: false,
        })
      } else if (selectedPatient && !selectedPatient.isExisting) {
        onClear()
      }
    }
  }, [mode, newName, newPhone, newAge, newGender, newAllergies])

  return (
    <div className="space-y-4">
      {/* 2-Option Selector: Original / Existing Patient vs Create a New Patient */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="size-3.5 text-primary" />
          Select Intake Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setMode('search')
              onClear()
            }}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
              mode === 'search'
                ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${mode === 'search' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Search className="size-4" />
              </div>
              <span className="font-bold text-xs text-foreground">Get Data from Original Patient</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Search existing records by name, phone, or ID to fetch demographics & clinical alerts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('new')
              onClear()
            }}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
              mode === 'new'
                ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${mode === 'new' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <UserPlus className="size-4" />
              </div>
              <span className="font-bold text-xs text-foreground">Create a New Patient</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Direct registration form for first-time walk-in patient arrivals.
            </p>
          </button>
        </div>
      </div>

      {/* MODE 1: Search Existing Patient */}
      {mode === 'search' && (
        <>
          {/* Selected Patient Banner if already chosen from existing list */}
          {selectedPatient && selectedPatient.isExisting ? (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 relative animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {selectedPatient.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'PT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-foreground">{selectedPatient.name}</h4>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                        <UserCheck className="size-3" /> Existing Record
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{selectedPatient.phone}</span>
                      {selectedPatient.id && <span>· ID: {selectedPatient.id}</span>}
                      {selectedPatient.ageOrDob && <span>· {selectedPatient.ageOrDob}</span>}
                      {selectedPatient.gender && <span>· {selectedPatient.gender}</span>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClear}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted/50 transition flex items-center gap-1 text-xs font-semibold"
                  title="Change patient"
                >
                  <X className="size-4" /> Change
                </button>
              </div>

              {/* Allergies / Medical Conditions highlight */}
              {selectedPatient.allergies && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                  <span>
                    <strong>Allergy Alert:</strong> {selectedPatient.allergies}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search by patient name, phone (+91...), or PAT-000001..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  autoFocus
                />
                {isLoading && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
                {searchQuery && !isLoading && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {isDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  <div className="p-2 border-b border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="size-3 text-primary" /> Suggestions for &quot;{searchQuery}&quot;
                    </span>
                    <span>{filteredPatients.length} found</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((p) => (
                        <button
                          key={p.patient_id}
                          type="button"
                          onClick={() => handleSelectExisting(p)}
                          className="w-full flex items-start justify-between p-3 text-left transition hover:bg-muted/50 group"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs text-foreground group-hover:text-primary transition">
                                {p.full_name}
                              </p>
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {p.patient_id}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <Phone className="size-3 inline text-muted-foreground/70" />
                              <span>{p.phone}</span>
                              {p.dob_or_age && <span>· {p.dob_or_age}</span>}
                              {p.gender && <span>· {p.gender}</span>}
                            </p>
                            {p.allergies && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="size-3 shrink-0" />
                                <span>{p.allergies}</span>
                              </p>
                            )}
                          </div>

                          <span className="text-primary text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                            Select <CheckCircle2 className="size-3.5" />
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">No existing patient found matching &quot;{searchQuery}&quot;</p>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('new')
                            setNewName(searchQuery)
                            setIsDropdownOpen(false)
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <UserPlus className="size-3.5" /> Register &quot;{searchQuery}&quot; as New Patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt when input is empty */}
              {!searchQuery && (
                <p className="text-[11px] text-muted-foreground px-1">
                  💡 Type a patient name or phone number. If they have visited before, their details will be suggested automatically.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* MODE 2: New Patient Registration Form (Kept persistently mounted while typing) */}
      {mode === 'new' && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserPlus className="size-3.5 text-primary" />
              New Patient Intake Form
            </span>
            <span className="text-[11px] text-muted-foreground">* Required fields</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Vikram Malhotra"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Age or DOB
              </label>
              <input
                type="text"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                placeholder="e.g. 28 yrs or 1996-05-12"
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Gender
              </label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:border-primary transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Known Allergies (Optional)
            </label>
            <input
              type="text"
              value={newAllergies}
              onChange={(e) => setNewAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa, Aspirin"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Inline Validation Status Badge */}
          {newName.trim().length >= 2 && newPhone.trim().length >= 6 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Ready to proceed with <strong>{newName}</strong> ({newPhone})
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-200">
                Valid Profile
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Please enter at least Name and Phone number to proceed to doctor allotment.
            </p>
          )}

          <button
            type="button"
            disabled={!newName.trim() || !newPhone.trim()}
            onClick={handleApplyNewPatient}
            className="w-full rounded-xl bg-primary/10 border border-primary/30 text-primary py-2.5 text-xs font-bold hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <UserCheck className="size-3.5" />
            {selectedPatient ? 'Patient Details Verified' : 'Confirm Patient Details'}
          </button>
        </div>
      )}
    </div>
  )
}
