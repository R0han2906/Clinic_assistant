'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { PatientAvatar } from './PatientAvatar'
import { PatientResponse } from '@/types/api'

interface PatientRowProps {
  patient: PatientResponse | any
  onEdit?: (patient: PatientResponse | any) => void
  onDelete?: (patient: PatientResponse | any) => void
}

export function PatientRow({ patient, onEdit, onDelete }: PatientRowProps) {
  const patientId = patient.patient_id || patient.id
  const fullName = patient.full_name || patient.name || 'Unknown Patient'
  const age = patient.dob_or_age || (patient.age ? `${patient.age} yrs` : '—')
  const phone = patient.phone || '—'
  const emergency = patient.emergency_contact || patient.emergencyContact || '—'
  const gender = patient.gender || 'Not specified'
  const email = patient.email

  return (
    <div className="grid grid-cols-[auto_1fr_90px_140px_130px_100px_88px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 group hover:bg-muted/50">
      <Link href={`/patients/${patientId}`} className="contents">
        <PatientAvatar name={fullName} avatarUrl={patient.avatar || patient.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
            {fullName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {patientId} {email ? `· ${email}` : ''}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">{age}</div>
        <div className="hidden text-sm text-muted-foreground md:block">{phone}</div>
        <div className="hidden truncate text-sm text-muted-foreground lg:block">{emergency}</div>
        <div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {gender}
          </span>
        </div>
      </Link>
      <div className="flex justify-end gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(patient)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit patient"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(patient)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
            title="Delete patient"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
        <Link href={`/patients/${patientId}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
