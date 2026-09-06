'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { PeripheralCreate, PeripheralResponse } from '@/types/api'

const CONDITION_CLASSES: Record<string, string> = {
  Good: 'bg-emerald-50 text-emerald-700',
  Service: 'bg-amber-50 text-amber-700',
  'Needs Check': 'bg-red-50 text-red-700',
}

export default function PeripheralsPage() {
  const [items, setItems] = useState<PeripheralResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<PeripheralCreate>({
    name: '',
    category: 'Equipment',
    location: '',
    condition: 'Good',
    serial_no: '',
    last_service: '',
  })

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await api.peripherals.list()
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setSubmitting(true)
    try {
      if (editingId) {
        await api.peripherals.update(editingId, form)
      } else {
        await api.peripherals.create(form)
      }
      setIsModalOpen(false)
      setEditingId(null)
      setForm({
        name: '',
        category: 'Equipment',
        location: '',
        condition: 'Good',
        serial_no: '',
        last_service: '',
      })
      loadItems()
    } catch (err: any) {
      alert(err.message || 'Failed to save asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Peripherals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Physical assets and equipment · {items.length} items
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setForm({
              name: '',
              category: 'Equipment',
              location: '',
              condition: 'Good',
              serial_no: '',
              last_service: '',
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" /> Add Asset
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading equipment...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, idx) => (
            <div
              key={`peri-${p.peripheral_id || 'p'}-${idx}`}
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
                <p>{p.location}</p>
                <p>S/N: {p.serial_no || '—'}</p>
                <p>Last service: {p.last_service || '—'}</p>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.peripheral_id)
                    setForm({
                      name: p.name,
                      category: p.category,
                      location: p.location,
                      condition: p.condition,
                      serial_no: p.serial_no || '',
                      last_service: p.last_service || '',
                    })
                    setIsModalOpen(true)
                  }}
                  className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                >
                  <Pencil className="mr-1 inline size-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Delete ${p.name}?`)) return
                    try {
                      await api.peripherals.delete(p.peripheral_id)
                      loadItems()
                    } catch (err: any) {
                      alert(err.message || 'Failed to delete asset')
                    }
                  }}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="mr-1 inline size-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Asset' : 'Add Asset'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Asset name"
                className="w-full rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Category"
                  className="rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
                />
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Location"
                  className="rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
                />
              </div>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              >
                <option value="Good">Good</option>
                <option value="Service">Service</option>
                <option value="Needs Check">Needs Check</option>
              </select>
              <input
                value={form.serial_no || ''}
                onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
                placeholder="Serial number"
                className="w-full rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              />
              <input
                type="date"
                value={form.last_service || ''}
                onChange={(e) => setForm({ ...form, last_service: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-border px-4 py-2 font-semibold hover:bg-muted">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
