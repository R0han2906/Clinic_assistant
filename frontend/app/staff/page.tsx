'use client'

import { useState, useEffect } from 'react'
import { Plus, Phone, Mail, X, Loader2, UserCheck, Shield, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { StaffResponse, StaffCreate } from '@/types/api'

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newStaff, setNewStaff] = useState<StaffCreate>({
    full_name: '',
    role: 'Dental Assistant',
    department: 'Clinical',
    phone: '',
    email: '',
    status: 'Active'
  })

  const loadStaff = async () => {
    setLoading(true)
    try {
      const data = await api.staff.list()
      setStaffList(data || [])
    } catch {
      setStaffList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaff.full_name) return
    setSubmitting(true)
    try {
      if (editingId) {
        await api.staff.update(editingId, newStaff)
      } else {
        await api.staff.create(newStaff)
      }
      setIsModalOpen(false)
      setEditingId(null)
      setNewStaff({
        full_name: '',
        role: 'Dental Assistant',
        department: 'Clinical',
        phone: '',
        email: '',
        status: 'Active'
      })
      loadStaff()
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff &amp; Practitioners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinic team members · {staffList.length} staff records in Supabase
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setNewStaff({
              full_name: '',
              role: 'Dental Assistant',
              department: 'Clinical',
              phone: '',
              email: '',
              status: 'Active'
            })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-6 animate-spin text-primary" /> Loading staff directory...
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No staff members registered. Click &quot;Add Staff Member&quot; to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((member: any, idx: number) => {
            const memberId = member.staff_id || member.id || `staff-${idx}`
            const memberName = member.full_name || member.name || 'Staff Member'
            const initials = member.initials || memberName.slice(0, 2).toUpperCase() || 'ST'

            return (
              <div
                key={`staff-${memberId}-${idx}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground">{memberName}</p>
                    <p className="truncate text-xs font-semibold text-primary">{member.role}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.department}</p>
                  </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : member.status === 'On Leave'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" /> {member.phone || 'No phone recorded'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" /> {member.email || 'No email recorded'}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] opacity-75">
                  <Shield className="size-3.5 text-muted-foreground" /> ID: {member.staff_id}
                </p>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(memberId)
                    setNewStaff({
                      full_name: memberName,
                      role: member.role || 'Staff',
                      department: member.department || 'Clinical',
                      phone: member.phone || '',
                      email: member.email || '',
                      status: member.status || 'Active'
                    })
                    setIsModalOpen(true)
                  }}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                >
                  <Pencil className="mr-1 inline size-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Remove ${memberName} from staff?`)) return
                    try {
                      await api.staff.delete(memberId)
                      loadStaff()
                    } catch (err: any) {
                      alert(err.message || 'Failed to delete staff member')
                    }
                  }}
                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="mr-1 inline size-3" /> Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="e.g. Rachel Green"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Role *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    placeholder="e.g. Clinic Manager"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Department</label>
                  <select
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="Administration">Administration</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Clinical">Clinical</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="text"
                    value={newStaff.phone || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+1-555-0199"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={newStaff.email || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="rachel@zendenta.com"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={newStaff.status}
                  onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="Active">Active</option>
                  <option value="Off">Off</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
