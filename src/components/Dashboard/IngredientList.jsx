import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Plus, Trash2, Loader2, Search, Edit2, X, Check,
  Beaker, Package, Paintbrush, Tag, Filter
} from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './IngredientList.css'

const TYPE_TABS = [
  { key: 'ingredient', label: 'Ingredients', icon: <Beaker size={16} /> },
  { key: 'packaging', label: 'Packaging', icon: <Package size={16} /> },
  { key: 'decorating', label: 'Decorating', icon: <Paintbrush size={16} /> },
  { key: 'labeling', label: 'Labeling', icon: <Tag size={16} /> },
]

const CATEGORIES = ['Flour', 'Sugar', 'Dairy', 'Eggs', 'Chocolate', 'Leavening', 'Flavoring', 'Oil/Fat', 'Fruit', 'Nuts', 'Coloring', 'Packaging', 'Boxes', 'Boards', 'Ribbon', 'Labels', 'Other']

const EMPTY_ITEM = {
  name: '', category: '', unit: 'oz', unit_cost: '',
  stock_quantity: '', reorder_point: '', supplier: '', notes: '',
  ingredient_type: 'ingredient',
  avg_price_walmart: '', avg_price_costco: '', avg_price_sams: '',
  package_size: '', package_unit: '',
}

export default function IngredientList() {
  const { getIngredients, createIngredient, updateIngredient } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [typeTab, setTypeTab] = useState('ingredient')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_ITEM })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [configured])

  const loadData = async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await getIngredients()
      setItems(data)
    } catch (err) {
      console.error('Failed to load ingredients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(i => {
    const type = i.ingredient_type || 'ingredient'
    if (type !== typeTab) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && i.category !== categoryFilter) return false
    return true
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleEdit = (item) => {
    setForm({
      name: item.name || '', category: item.category || '', unit: item.unit || 'oz',
      unit_cost: item.unit_cost ?? '', stock_quantity: item.stock_quantity ?? '',
      reorder_point: item.reorder_point ?? '', supplier: item.supplier || '',
      notes: item.notes || '', ingredient_type: item.ingredient_type || 'ingredient',
      avg_price_walmart: item.avg_price_walmart ?? '', avg_price_costco: item.avg_price_costco ?? '',
      avg_price_sams: item.avg_price_sams ?? '', package_size: item.package_size ?? '',
      package_unit: item.package_unit || '',
    })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleNew = () => {
    setForm({ ...EMPTY_ITEM, ingredient_type: typeTab })
    setEditId(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        unit_cost: form.unit_cost === '' ? null : parseFloat(form.unit_cost),
        stock_quantity: form.stock_quantity === '' ? null : parseFloat(form.stock_quantity),
        reorder_point: form.reorder_point === '' ? null : parseFloat(form.reorder_point),
        avg_price_walmart: form.avg_price_walmart === '' ? null : parseFloat(form.avg_price_walmart),
        avg_price_costco: form.avg_price_costco === '' ? null : parseFloat(form.avg_price_costco),
        avg_price_sams: form.avg_price_sams === '' ? null : parseFloat(form.avg_price_sams),
        package_size: form.package_size === '' ? null : parseFloat(form.package_size),
      }
      if (editId) {
        const updated = await updateIngredient(editId, payload)
        setItems(prev => prev.map(i => i.id === editId ? updated : i))
        toast.success('Updated')
      } else {
        const created = await createIngredient(payload)
        setItems(prev => [...prev, created])
        toast.success('Added')
      }
      setShowForm(false)
      setEditId(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (v) => v != null && v !== '' ? `$${parseFloat(v).toFixed(2)}` : '—'

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="ingredient-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Ingredients & Materials</h1>
          <p>Master list with multi-store pricing</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} /> Add {typeTab === 'ingredient' ? 'Ingredient' : 'Material'}
        </button>
      </div>

      <div className="ing-tabs">
        {TYPE_TABS.map(t => (
          <button key={t.key} className={`bo-tab ${typeTab === t.key ? 'bo-tab-active' : ''}`} onClick={() => setTypeTab(t.key)}>
            {t.icon} {t.label}
            <span className="ing-tab-count">{items.filter(i => (i.ingredient_type || 'ingredient') === t.key).length}</span>
          </button>
        ))}
      </div>

      <div className="ing-toolbar">
        <div className="ing-search">
          <Search size={16} />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        </div>
        <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="card card-padding ing-form">
          <div className="ing-form-title">{editId ? 'Edit' : 'New'} {typeTab === 'ingredient' ? 'Ingredient' : 'Material'}</div>
          <div className="ing-form-grid">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. All-Purpose Flour" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {['oz', 'lb', 'g', 'kg', 'cup', 'tbsp', 'tsp', 'ml', 'L', 'each', 'dozen', 'box', 'roll', 'sheet', 'pack'].map(u =>
                  <option key={u} value={u}>{u}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your Cost / Unit</label>
              <input className="form-input" type="number" step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Package Size</label>
              <input className="form-input" type="number" step="0.01" value={form.package_size} onChange={e => set('package_size', e.target.value)} placeholder="e.g. 5" />
            </div>
            <div className="form-group">
              <label className="form-label">Package Unit</label>
              <input className="form-input" value={form.package_unit} onChange={e => set('package_unit', e.target.value)} placeholder="e.g. lb bag" />
            </div>
          </div>
          <div className="ing-form-subtitle">Store Pricing Comparison</div>
          <div className="ing-form-grid ing-form-grid-3">
            <div className="form-group">
              <label className="form-label">Walmart Avg</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_walmart} onChange={e => set('avg_price_walmart', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Costco Avg</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_costco} onChange={e => set('avg_price_costco', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Sam's Club Avg</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_sams} onChange={e => set('avg_price_sams', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="ing-form-grid">
            <div className="form-group">
              <label className="form-label">In Stock</label>
              <input className="form-input" type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Point</label>
              <input className="form-input" type="number" value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Costco" />
            </div>
          </div>
          <div className="ing-form-actions">
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="spinner" /> : <Check size={15} />} {editId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="card ing-table-wrap">
        {filtered.length === 0 ? (
          <div className="ing-empty">
            <p>No {typeTab === 'ingredient' ? 'ingredients' : 'materials'} found.</p>
            <button className="btn btn-primary btn-sm" onClick={handleNew}><Plus size={14} /> Add First</button>
          </div>
        ) : (
          <table className="ing-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Your Cost</th>
                <th>Walmart</th>
                <th>Costco</th>
                <th>Sam's</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const lowStock = item.reorder_point && item.stock_quantity != null && parseFloat(item.stock_quantity) <= parseFloat(item.reorder_point)
                return (
                  <tr key={item.id} className={lowStock ? 'ing-row-low' : ''}>
                    <td className="ing-name-cell">
                      <span>{item.name}</span>
                      {item.package_size && <span className="ing-pkg">{item.package_size} {item.package_unit}</span>}
                    </td>
                    <td>{item.category || '—'}</td>
                    <td>{item.unit}</td>
                    <td>{fmt(item.unit_cost)}</td>
                    <td>{fmt(item.avg_price_walmart)}</td>
                    <td>{fmt(item.avg_price_costco)}</td>
                    <td>{fmt(item.avg_price_sams)}</td>
                    <td>
                      <span className={lowStock ? 'ing-stock-low' : ''}>{item.stock_quantity ?? '—'}</span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(item)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
