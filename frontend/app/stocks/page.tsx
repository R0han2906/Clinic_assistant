'use client'

import { useState, useEffect } from 'react'
import { Plus, Download, X, Loader2, AlertTriangle, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { InventoryResponse, InventoryCreate } from '@/types/api'
export default function StocksPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const [newItem, setNewItem] = useState<InventoryCreate>({
    name: '',
    category: 'Consumables',
    quantity: 10,
    min_stock: 5,
    unit: 'pcs',
    unit_price: 15.0,
    supplier: 'DentSupply Co.'
  })

  const loadInventory = async () => {
    try {
      const data = await api.inventory.list({
        category: categoryFilter === 'All' ? undefined : categoryFilter
      })
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [categoryFilter])

  const lowStock = items.filter((i) => i.quantity <= i.min_stock)
  const categories = ['All', 'Consumables', 'Pharmaceuticals', 'Materials', 'Instruments', 'Diagnostic']

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name) return
    setSubmitting(true)
    try {
      if (editingId) {
        await api.inventory.update(editingId, newItem)
      } else {
        await api.inventory.create(newItem)
      }
      setIsModalOpen(false)
      setEditingId(null)
      setNewItem({
        name: '',
        category: 'Consumables',
        quantity: 10,
        min_stock: 5,
        unit: 'pcs',
        unit_price: 15.0,
        supplier: 'DentSupply Co.'
      })
      loadInventory()
    } catch (err: any) {
      alert(err.message || 'Failed to add inventory item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, currentQty: number) => {
    const input = prompt(`Update stock quantity (currently ${currentQty}):`, String(currentQty))
    if (input === null) return
    const newQty = parseInt(input, 10)
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid non-negative integer.')
      return
    }
    try {
      await api.inventory.updateQuantity(itemId, newQty)
      loadInventory()
    } catch (err: any) {
      alert(err.message || 'Failed to update stock quantity')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory &amp; Stock Levels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Supplies catalog · {items.length} items in Supabase · {lowStock.length} low stock alerts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(api.inventory.exportCsvUrl(), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted active:scale-[0.98]"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              setEditingId(null)
              setNewItem({
                name: '',
                category: 'Consumables',
                quantity: 10,
                min_stock: 5,
                unit: 'pcs',
                unit_price: 15.0,
                supplier: 'DentSupply Co.'
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle className="size-4" />
            {lowStock.length} items at or below minimum reorder threshold!
          </div>
          <p className="mt-1 text-xs text-rose-700">
            Immediate reorder required for: {lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit} left)`).join(', ')}
          </p>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_130px_100px_90px_110px_90px_120px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Item Name / Supplier</div>
          <div>Category</div>
          <div>Current Qty</div>
          <div>Min Stock</div>
          <div>Unit Price</div>
          <div>Status</div>
          <div className="text-right">Adjust</div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading stock items...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No items in inventory matching category. Click &quot;Add Item&quot; to stock supplies.
          </div>
        ) : (
          items.map((item: any, idx: number) => {
            const isLow = Number(item.quantity) <= Number(item.min_stock)
            return (
              <div
                key={item.item_id || item.id || `inv-${idx}`}
                className="grid grid-cols-[1fr_130px_100px_90px_110px_90px_120px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/40 transition text-sm"
              >
                <div>
                  <p className="font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.supplier || 'No supplier listed'} · {item.item_id}</p>
                </div>
                <div className="text-xs text-muted-foreground">{item.category}</div>
                <div className={`font-bold text-sm ${isLow ? 'text-rose-600' : 'text-foreground'}`}>
                  {item.quantity} {item.unit}
                </div>
                <div className="text-xs text-muted-foreground">{item.min_stock} {item.unit}</div>
                <div className="text-xs font-medium text-foreground">${Number(item.unit_price).toFixed(2)}</div>
                <div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isLow ? 'Low Stock' : 'Optimal'}
                  </span>
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.item_id, item.quantity)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition"
                    title="Update Quantity"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.item_id)
                      setNewItem({
                        name: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        min_stock: item.min_stock,
                        unit: item.unit,
                        unit_price: item.unit_price,
                        supplier: item.supplier || ''
                      })
                      setIsModalOpen(true)
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition text-[10px] font-bold"
                    title="Edit item"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Delete ${item.name}?`)) return
                      try {
                        await api.inventory.delete(item.item_id)
                        loadInventory()
                      } catch (err: any) {
                        alert(err.message || 'Failed to delete item')
                      }
                    }}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                    title="Delete item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Inventory Item' : 'New Inventory Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Disposable Saliva Ejectors (100pk)"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="Consumables">Consumables</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                    <option value="Materials">Materials</option>
                    <option value="Instruments">Instruments</option>
                    <option value="Diagnostic">Diagnostic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="pcs / box / pk"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Min Stock</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground">Supplier / Vendor</label>
                <input
                  type="text"
                  value={newItem.supplier || ''}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="e.g. DentSupply Co."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
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
                  {editingId ? 'Save Changes' : 'Save Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
