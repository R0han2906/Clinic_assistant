'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Clock, DollarSign, X, Loader2, Trash2, Timer, Pencil } from 'lucide-react'
import { api } from '@/lib/api-client'
import { TreatmentResponse, TreatmentCreate } from '@/types/api'
import { formatDuration } from '@/lib/formatters'

// Category styling metadata matching Screenshot 142022
const CATEGORY_STYLES: Record<
  string,
  { borderTop: string; badge: string }
> = {
  Preventive: {
    borderTop: 'border-t-4 border-t-cyan-400',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  Surgical: {
    borderTop: 'border-t-4 border-t-rose-400',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  },
  Restorative: {
    borderTop: 'border-t-4 border-t-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  Endodontic: {
    borderTop: 'border-t-4 border-t-pink-500',
    badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300',
  },
  Cosmetic: {
    borderTop: 'border-t-4 border-t-purple-400',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
  Orthodontic: {
    borderTop: 'border-t-4 border-t-sky-400',
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300',
  },
  Periodontic: {
    borderTop: 'border-t-4 border-t-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  Diagnostic: {
    borderTop: 'border-t-4 border-t-amber-300',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
}

const DEFAULT_TREATMENTS: TreatmentResponse[] = [
  {
    treatment_id: 'TRT-001',
    name: 'General Checkup',
    category: 'Preventive',
    default_duration_minutes: 60,
    estimated_cost: 85,
    description: 'Comprehensive dental examination and cleaning',
  },
  {
    treatment_id: 'TRT-002',
    name: 'Scaling & Polishing',
    category: 'Preventive',
    default_duration_minutes: 90,
    estimated_cost: 120,
    description: 'Professional cleaning to remove plaque and tartar',
  },
  {
    treatment_id: 'TRT-003',
    name: 'Tooth Extraction',
    category: 'Surgical',
    default_duration_minutes: 45,
    estimated_cost: 150,
    description: 'Removal of damaged or impacted teeth',
  },
  {
    treatment_id: 'TRT-004',
    name: 'Dental Filling',
    category: 'Restorative',
    default_duration_minutes: 60,
    estimated_cost: 180,
    description: 'Composite resin or amalgam fillings for cavities',
  },
  {
    treatment_id: 'TRT-005',
    name: 'Root Canal',
    category: 'Endodontic',
    default_duration_minutes: 120,
    estimated_cost: 650,
    description: 'Treatment for infected or damaged tooth pulp',
  },
  {
    treatment_id: 'TRT-006',
    name: 'Dental Crown',
    category: 'Restorative',
    default_duration_minutes: 90,
    estimated_cost: 900,
    description: 'Custom-fitted cap to restore damaged teeth',
  },
  {
    treatment_id: 'TRT-007',
    name: 'Dental Implant',
    category: 'Surgical',
    default_duration_minutes: 180,
    estimated_cost: 2500,
    description: 'Permanent tooth replacement with titanium implant',
  },
  {
    treatment_id: 'TRT-008',
    name: 'Teeth Whitening',
    category: 'Cosmetic',
    default_duration_minutes: 90,
    estimated_cost: 350,
    description: 'Professional bleaching for a brighter smile',
  },
  {
    treatment_id: 'TRT-009',
    name: 'Dental Veneers',
    category: 'Cosmetic',
    default_duration_minutes: 120,
    estimated_cost: 1200,
    description: 'Thin porcelain shells bonded to front of teeth',
  },
  {
    treatment_id: 'TRT-010',
    name: 'Orthodontic Braces',
    category: 'Orthodontic',
    default_duration_minutes: 60,
    estimated_cost: 3200,
    description: 'Comprehensive alignment and bite correction system',
  },
  {
    treatment_id: 'TRT-011',
    name: 'Periodontal Therapy',
    category: 'Periodontic',
    default_duration_minutes: 90,
    estimated_cost: 280,
    description: 'Deep root planing and gum therapy for periodontal disease',
  },
  {
    treatment_id: 'TRT-012',
    name: 'Diagnostic X-Ray & Scan',
    category: 'Diagnostic',
    default_duration_minutes: 45,
    estimated_cost: 95,
    description: 'Full intraoral digital X-ray set and panoramic imaging',
  },
]

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [newTreatment, setNewTreatment] = useState<TreatmentCreate>({
    name: '',
    category: 'Preventive',
    default_duration_minutes: 60,
    estimated_cost: 100.0,
    description: '',
  })

  const loadTreatments = async () => {
    setLoading(true)
    try {
      const data = await api.treatments.list()
      setTreatments(data || [])
    } catch {
      setTreatments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTreatments()
  }, [])

  const categories = [
    'All',
    'Preventive',
    'Surgical',
    'Restorative',
    'Endodontic',
    'Cosmetic',
    'Orthodontic',
    'Periodontic',
    'Diagnostic',
  ]

  const filteredTreatments = treatments.filter((t) => {
    if (selectedCategory === 'All') return true
    return t.category.toLowerCase() === selectedCategory.toLowerCase()
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTreatment.name) return
    setSubmitting(true)
    try {
      if (editingId) {
        const updated = await api.treatments.update(editingId, newTreatment)
        setTreatments((prev) => prev.map((t) => (t.treatment_id === editingId ? updated : t)))
      } else {
        const created = await api.treatments.create(newTreatment)
        setTreatments((prev) => [created, ...prev])
      }
      setIsModalOpen(false)
      setEditingId(null)
      setNewTreatment({
        name: '',
        category: 'Preventive',
        default_duration_minutes: 60,
        estimated_cost: 100.0,
        description: '',
      })
    } catch {
      if (!editingId) {
        const mockCreated: TreatmentResponse = {
          treatment_id: `TRT-${Date.now().toString().slice(-4)}`,
          name: newTreatment.name,
          category: newTreatment.category,
          default_duration_minutes: newTreatment.default_duration_minutes,
          estimated_cost: newTreatment.estimated_cost,
          description: newTreatment.description || 'Standard clinic treatment',
        }
        setTreatments((prev) => [mockCreated, ...prev])
        setIsModalOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete treatment "${name}"?`)) return
    try {
      await api.treatments.delete(id)
      setTreatments((prev) => prev.filter((t) => t.treatment_id !== id))
    } catch {
      setTreatments((prev) => prev.filter((t) => t.treatment_id !== id))
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Header matching Screenshot 142022 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Treatments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Service catalog · {treatments.length} treatments across {categories.length - 1} categories
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setNewTreatment({
              name: '',
              category: 'Preventive',
              default_duration_minutes: 60,
              estimated_cost: 100.0,
              description: '',
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] shadow-sm"
        >
          <Plus className="size-4" /> Add Treatment
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Treatments 3-Column Card Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-6 animate-spin text-primary" /> Loading treatments catalog...
        </div>
      ) : filteredTreatments.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No procedures found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTreatments.map((t, idx) => {
            const style = CATEGORY_STYLES[t.category] || {
              borderTop: 'border-t-4 border-t-primary',
              badge: 'bg-primary/10 text-primary border-primary/20',
            }

            return (
              <div
                key={`trt-${t.treatment_id || 't'}-${idx}`}
                className={`rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md flex flex-col justify-between overflow-hidden ${style.borderTop}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base text-foreground leading-tight">{t.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${style.badge}`}
                    >
                      {t.category}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground min-h-[38px]">
                    {t.description || 'Standard clinic procedural treatment.'}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Timer className="size-3.5 text-muted-foreground" />
                    <span>{formatDuration(t.default_duration_minutes)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-foreground">
                      ${Number(t.estimated_cost).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        setEditingId(t.treatment_id)
                        setNewTreatment({
                          name: t.name,
                          category: t.category,
                          default_duration_minutes: t.default_duration_minutes,
                          estimated_cost: t.estimated_cost,
                          description: t.description || '',
                        })
                        setIsModalOpen(true)
                      }}
                      className="p-1 text-muted-foreground/50 hover:text-primary transition"
                      title="Edit procedure"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.treatment_id, t.name)}
                      className="p-1 text-muted-foreground/50 hover:text-rose-600 transition"
                      title="Delete procedure"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Treatment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Treatment Procedure' : 'New Treatment Procedure'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTreatment.name}
                  onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                  placeholder="e.g. Composite Veneer"
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={newTreatment.category}
                    onChange={(e) => setNewTreatment({ ...newTreatment, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card p-2.5 text-xs outline-none focus:border-primary"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    required
                    value={newTreatment.default_duration_minutes}
                    onChange={(e) =>
                      setNewTreatment({
                        ...newTreatment,
                        default_duration_minutes: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Estimated Rate / Fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  value={newTreatment.estimated_cost}
                  onChange={(e) =>
                    setNewTreatment({
                      ...newTreatment,
                      estimated_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTreatment.description}
                  onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                  placeholder="Summary of clinical procedure..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Procedure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
