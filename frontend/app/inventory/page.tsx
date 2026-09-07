'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Package, Wrench, Users, Plus, Download, RefreshCw, AlertTriangle,
  Loader2, Pencil, Trash2, X, CheckCircle2, ShieldCheck, Phone, Mail
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { InventoryCreate } from '@/types/api'

interface InventoryOverviewData {
  total_consumables_count: number
  low_stock_items_count: number
  total_inventory_valuation: number
  total_peripherals_count: number
  maintenance_due_count: number
  suppliers_count: number
  recent_activity: any[]
}

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTabParam = searchParams.get('tab') || 'consumables'

  const [activeTab, setActiveTab] = useState<'consumables' | 'equipment' | 'suppliers'>(
    activeTabParam === 'equipment' || activeTabParam === 'suppliers' ? activeTabParam : 'consumables'
  )

  const [overview, setOverview] = useState<InventoryOverviewData | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [peripherals, setPeripherals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [newItem, setNewItem] = useState<InventoryCreate>({
    name: '',
    category: 'Consumables',
    quantity: 10,
    min_stock: 5,
    unit: 'pcs',
    unit_price: 15.0,
    supplier: 'DentSupply Co.',
  })

  const switchTab = (tab: 'consumables' | 'equipment' | 'suppliers') => {
    setActiveTab(tab)
    router.replace(`/inventory?tab=${tab}`)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, inventoryData, peripheralsData] = await Promise.all([
        fetch('/api/v1/inventory-hub/overview').then((r) => r.ok ? r.json() : null).catch(() => null),
        api.inventory.list({ category: categoryFilter === 'All' ? undefined : categoryFilter }).catch(() => []),
        api.peripherals.list().catch(() => []),
      ])

      if (overviewRes) setOverview(overviewRes)
      setItems(inventoryData || [])
      setPeripherals(peripheralsData || [])
    } catch (err) {
      console.error('Failed to load inventory data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [categoryFilter])

  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.min_stock))
  const categories = ['All', 'Consumables', 'Pharmaceuticals', 'Materials', 'Instruments', 'Diagnostic']

  const handleCreateItem = async (e: React.FormEvent) => {
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
        supplier: 'DentSupply Co.',
      })
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to save item')
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
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update stock quantity')
    }
  }

  const suppliersList = [
    { id: 'sup-1', name: 'DentSupply Co.', contact: 'Sarah Jenkins', phone: '+1 (555) 234-5678', email: 'orders@dentsupply.com', items: 'Consumables, Anesthetics' },
    { id: 'sup-2', name: 'MedTech Equipment Inc.', contact: 'David Ross', phone: '+1 (555) 876-5432', email: 'support@medtechequip.com', items: 'Autoclaves, X-Ray Sensors' },
    { id: 'sup-3', name: 'BioPharma Dental', contact: 'Elena Rostova', phone: '+1 (555) 345-6789', email: 'sales@biopharmadental.io', items: 'Fluoride, Composite Resins' },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Inventory & Equipment Hub</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consolidated stock levels, clinical peripherals maintenance, and supplier directory
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => window.open(api.inventory.exportCsvUrl(), '_blank')}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
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
                supplier: 'DentSupply Co.',
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Add Item
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consumables Catalog</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {overview?.total_consumables_count || items.length} Items
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Active clinical stock items</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alerts</p>
          <p className={`mt-2 text-3xl font-bold ${lowStock.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStock.length} Alert{lowStock.length === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">At or below reorder threshold</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Equipment &amp; Peripherals</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {peripherals.length || overview?.total_peripherals_count || 28} Units
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Sensors, sterilizers, handpieces</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Maintenance Due</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">
            {overview?.maintenance_due_count || 2} Unit(s)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Routine servicing requested</p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => switchTab('consumables')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'consumables'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="size-4" /> Consumable Supplies ({items.length})
        </button>
        <button
          onClick={() => switchTab('equipment')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'equipment'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench className="size-4" /> Equipment & Peripherals ({peripherals.length})
        </button>
        <button
          onClick={() => switchTab('suppliers')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'suppliers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="size-4" /> Suppliers & Vendors ({suppliersList.length})
        </button>
      </div>

      {/* TAB 1: CONSUMABLES */}
      {activeTab === 'consumables' && (
        <div className="space-y-6">
          {/* Low Stock Warning */}
          {lowStock.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-800 p-4 text-sm">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="size-4" />
                {lowStock.length} items require immediate reorder!
              </div>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                Low stock for: {lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit} left)`).join(', ')}
              </p>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="grid grid-cols-[1fr_130px_100px_90px_110px_90px_120px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>Item Name / Supplier</div>
              <div>Category</div>
              <div>Current Qty</div>
              <div>Min Stock</div>
              <div>Unit Price</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin text-primary" /> Loading stock items...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No items matching category. Click &quot;Add Item&quot; to populate inventory.
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
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
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
                        onClick={async () => {
                          if (!confirm(`Delete ${item.name}?`)) return
                          try {
                            await api.inventory.delete(item.item_id)
                            loadData()
                          } catch (err: any) {
                            alert(err.message || 'Failed to delete item')
                          }
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
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
        </div>
      )}

      {/* TAB 2: EQUIPMENT & PERIPHERALS */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {peripherals.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No equipment units registered.
            </div>
          ) : (
            peripherals.map((p: any, idx: number) => (
              <div
                key={p.peripheral_id || p.id || `peri-${idx}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      p.status === 'Active' || p.status === 'Connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {p.status || 'Active'}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-base text-foreground">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.type} · Serial: {p.serial_number || 'N/A'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Operatory: {p.location || 'Op 1'}</span>
                  <span>Last Service: {p.last_serviced || '2026-08-01'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SUPPLIERS & VENDORS */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {suppliersList.map((sup) => (
            <div key={sup.id} className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">{sup.name}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  Verified Vendor
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">Contact: {sup.contact}</p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-primary" /> {sup.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-primary" /> {sup.email}
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
                Supplies: {sup.items}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-foreground">
                {editingId ? 'Edit Inventory Item' : 'New Inventory Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Item Name *</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Disposable Saliva Ejectors (100pk)"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="Consumables">Consumables</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                    <option value="Materials">Materials</option>
                    <option value="Instruments">Instruments</option>
                    <option value="Diagnostic">Diagnostic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="pcs / box / pk"
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Stock</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier / Vendor</label>
                <input
                  type="text"
                  value={newItem.supplier || ''}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="e.g. DentSupply Co."
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
