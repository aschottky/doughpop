import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Plus, Trash2, Loader2, Search, Edit2, X, Check,
  Beaker, Package, Paintbrush, Tag, Upload, Download, Sparkles
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

const UNITS = ['oz', 'lb', 'g', 'kg', 'cup', 'tbsp', 'tsp', 'ml', 'L', 'each', 'dozen', 'box', 'roll', 'sheet', 'pack']

const EMPTY_ITEM = {
  name: '', category: '', unit: 'oz', unit_cost: '',
  stock_quantity: '', reorder_point: '', supplier: '', notes: '',
  ingredient_type: 'ingredient',
  avg_price_walmart: '', avg_price_costco: '', avg_price_sams: '',
  package_size: '', package_unit: '',
}

const ING_CSV_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit' },
  { key: 'unit_cost', label: 'Your Cost' },
  { key: 'supplier', label: 'Vendor / Supplier' },
  { key: 'package_size', label: 'Pack Size (qty)' },
  { key: 'package_unit', label: 'Pack Unit (e.g. lb bag)' },
  { key: 'avg_price_walmart', label: 'Walmart Price' },
  { key: 'avg_price_costco', label: 'Costco Price' },
  { key: 'avg_price_sams', label: "Sam's Price" },
  { key: 'stock_quantity', label: 'In Stock' },
  { key: 'reorder_point', label: 'Reorder Point' },
  { key: 'notes', label: 'Notes' },
]

export default function IngredientList() {
  const { getIngredients, createIngredient, updateIngredient, deleteIngredient } = useData()
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

  const [showImport, setShowImport] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvMapping, setCsvMapping] = useState({})
  const [importing, setImporting] = useState(false)

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
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !(i.supplier || '').toLowerCase().includes(search.toLowerCase())) return false
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

  const buildPayload = (formData) => ({
    ...formData,
    unit_cost: formData.unit_cost === '' ? null : parseFloat(formData.unit_cost),
    stock_quantity: formData.stock_quantity === '' ? null : parseFloat(formData.stock_quantity),
    reorder_point: formData.reorder_point === '' ? null : parseFloat(formData.reorder_point),
    avg_price_walmart: formData.avg_price_walmart === '' ? null : parseFloat(formData.avg_price_walmart),
    avg_price_costco: formData.avg_price_costco === '' ? null : parseFloat(formData.avg_price_costco),
    avg_price_sams: formData.avg_price_sams === '' ? null : parseFloat(formData.avg_price_sams),
    package_size: formData.package_size === '' ? null : parseFloat(formData.package_size),
  })

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload = buildPayload(form)
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this ingredient?')) return
    try {
      await deleteIngredient(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // --- CSV parsing ---
  const parseCSVText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return null
    const headers = lines[0].split(',').map(h => h.replace(/^"/, '').replace(/"$/, '').trim())
    const rows = lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^",]+)/g) || []
      return vals.map(v => v.replace(/^"/, '').replace(/"$/, '').trim())
    })
    const autoMap = {}
    headers.forEach((h, i) => {
      const hl = h.toLowerCase().replace(/[^a-z]/g, '')
      if (hl.includes('name') || hl === 'item' || hl === 'ingredient') autoMap['name'] = i
      else if (hl.includes('category') || hl.includes('type')) autoMap['category'] = i
      else if (hl === 'unit' || hl.includes('measure')) autoMap['unit'] = i
      else if (hl.includes('yourcost') || (hl.includes('cost') && !hl.includes('costco'))) autoMap['unit_cost'] = i
      else if (hl.includes('vendor') || hl.includes('supplier') || hl.includes('source')) autoMap['supplier'] = i
      else if (hl.includes('packsize') || (hl.includes('pack') && hl.includes('size'))) autoMap['package_size'] = i
      else if (hl.includes('packunit') || (hl.includes('pack') && hl.includes('unit'))) autoMap['package_unit'] = i
      else if (hl.includes('walmart')) autoMap['avg_price_walmart'] = i
      else if (hl.includes('costco')) autoMap['avg_price_costco'] = i
      else if (hl.includes('sam')) autoMap['avg_price_sams'] = i
      else if (hl.includes('stock') || hl.includes('onhand') || hl.includes('instock')) autoMap['stock_quantity'] = i
      else if (hl.includes('reorder') || hl.includes('minimum')) autoMap['reorder_point'] = i
      else if (hl.includes('note')) autoMap['notes'] = i
    })
    return { headers, rows, autoMap }
  }

  const handleCSVFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = parseCSVText(ev.target.result)
      if (!result) { toast.error('CSV needs a header row and at least one data row'); return }
      setCsvHeaders(result.headers)
      setCsvData(result.rows)
      setCsvMapping(result.autoMap)
    }
    reader.readAsText(file)
  }

  const [loadingStarter, setLoadingStarter] = useState(false)

  const loadStarterList = async () => {
    setLoadingStarter(true)
    try {
      const res = await fetch('/starter-ingredients.csv')
      const text = await res.text()
      const result = parseCSVText(text)
      if (!result) { toast.error('Failed to parse starter list'); return }
      setCsvHeaders(result.headers)
      setCsvData(result.rows)
      setCsvMapping(result.autoMap)
      setShowImport(true)
    } catch (err) {
      toast.error('Failed to load starter list')
    } finally {
      setLoadingStarter(false)
    }
  }

  const inferType = (cat) => {
    if (!cat) return null
    const cl = cat.toLowerCase()
    if (cl === 'packaging' || cl === 'boxes' || cl === 'boards' || cl === 'ribbon') return 'packaging'
    if (cl === 'decorating') return 'decorating'
    if (cl === 'labeling' || cl === 'labels') return 'labeling'
    return 'ingredient'
  }

  const handleImport = async () => {
    if (!csvData?.length) return
    setImporting(true)
    let imported = 0
    try {
      for (const row of csvData) {
        const data = {}
        ING_CSV_FIELDS.forEach(f => {
          const colIdx = csvMapping[f.key]
          if (colIdx !== undefined && colIdx !== '' && row[colIdx]) {
            data[f.key] = row[colIdx]
          }
        })
        if (!data.name) continue
        const autoType = inferType(data.category)
        data.ingredient_type = autoType || typeTab
        try {
          const created = await createIngredient(buildPayload(data))
          setItems(prev => [...prev, created])
          imported++
        } catch {}
      }
      toast.success(`Imported ${imported} item${imported !== 1 ? 's' : ''}`)
      setShowImport(false)
      setCsvData(null)
      setCsvHeaders([])
      setCsvMapping({})
    } catch (err) {
      toast.error(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = () => {
    const rows = filtered.map(i => ({
      Name: i.name, Category: i.category || '', Unit: i.unit,
      'Your Cost': i.unit_cost ?? '', Vendor: i.supplier || '',
      'Pack Size': i.package_size ?? '', 'Pack Unit': i.package_unit || '',
      Walmart: i.avg_price_walmart ?? '', Costco: i.avg_price_costco ?? '',
      "Sam's": i.avg_price_sams ?? '', Stock: i.stock_quantity ?? '',
      'Reorder Point': i.reorder_point ?? '', Notes: i.notes || '',
    }))
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ingredients-${typeTab}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  const fmt = (v) => v != null && v !== '' ? `$${parseFloat(v).toFixed(2)}` : '—'

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="ingredient-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Ingredients & Materials</h1>
          <p>Master list with vendors, pack sizes, and multi-store pricing</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExportCSV} title="Export current list">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-ghost btn-sm" onClick={loadStarterList} disabled={loadingStarter} title="Load 90+ common baking ingredients">
            {loadingStarter ? <Loader2 size={16} className="spinner" /> : <Sparkles size={16} />} Starter List
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={handleNew}>
            <Plus size={16} /> Add {typeTab === 'ingredient' ? 'Ingredient' : 'Material'}
          </button>
        </div>
      </div>

      <div className="ing-tabs">
        {TYPE_TABS.map(t => (
          <button key={t.key} className={`bo-tab ${typeTab === t.key ? 'bo-tab-active' : ''}`} onClick={() => setTypeTab(t.key)}>
            {t.icon} {t.label}
            <span className="ing-tab-count">{items.filter(i => (i.ingredient_type || 'ingredient') === t.key).length}</span>
          </button>
        ))}
      </div>

      {/* CSV Import Panel */}
      {showImport && (
        <div className="card card-padding" style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Import Ingredients from CSV</h3>
            <button className="btn btn-ghost btn-xs" onClick={() => { setShowImport(false); setCsvData(null) }}><X size={16} /></button>
          </div>

          {!csvData ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Upload a CSV or spreadsheet export. The first row should be column headers.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Supported columns: Name, Category, Unit, Cost/Price, Vendor/Supplier, Pack Size, Pack Unit, Walmart, Costco, Sam's, Stock, Reorder Point, Notes
              </p>
              <input type="file" accept=".csv,.txt" onChange={handleCSVFile} style={{ fontSize: '0.875rem' }} />
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
                <strong>{csvData.length}</strong> rows found. Map your columns to ingredient fields:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {ING_CSV_FIELDS.map(f => (
                  <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>{f.label}</label>
                    <select className="form-select" style={{ fontSize: '0.8rem' }}
                      value={csvMapping[f.key] ?? ''}
                      onChange={e => setCsvMapping(prev => ({ ...prev, [f.key]: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                    >
                      <option value="">— skip —</option>
                      {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Preview (first 3 rows):</p>
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table className="ing-table" style={{ fontSize: '0.8rem' }}>
                  <thead><tr>{ING_CSV_FIELDS.filter(f => csvMapping[f.key] !== undefined).map(f => <th key={f.key}>{f.label}</th>)}</tr></thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, ri) => (
                      <tr key={ri}>{ING_CSV_FIELDS.filter(f => csvMapping[f.key] !== undefined).map(f => <td key={f.key}>{row[csvMapping[f.key]] || '—'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Items auto-sort into tabs by category (Packaging, Decorating, Labeling go to their tabs; everything else goes to Ingredients).
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setCsvData(null); setCsvHeaders([]); setCsvMapping({}) }}>Back</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing || !csvMapping.name}>
                  {importing ? <><Loader2 size={15} className="spinner" /> Importing...</> : <><Upload size={15} /> Import {csvData.length} Items</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ing-toolbar">
        <div className="ing-search">
          <Search size={16} />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or vendor..." />
        </div>
        <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card card-padding ing-form">
          <div className="ing-form-title">{editId ? 'Edit' : 'New'} {typeTab === 'ingredient' ? 'Ingredient' : 'Material'}</div>

          <div className="ing-form-subtitle">Basic Info</div>
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
              <label className="form-label">Vendor / Supplier</label>
              <input className="form-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Costco, Walmart" />
            </div>
          </div>

          <div className="ing-form-subtitle">Purchasing Details</div>
          <div className="ing-form-grid">
            <div className="form-group">
              <label className="form-label">Pack Size (quantity)</label>
              <input className="form-input" type="number" step="0.01" value={form.package_size} onChange={e => set('package_size', e.target.value)} placeholder="e.g. 5" />
            </div>
            <div className="form-group">
              <label className="form-label">Pack Unit (what you buy)</label>
              <input className="form-input" value={form.package_unit} onChange={e => set('package_unit', e.target.value)} placeholder="e.g. lb bag, 12-ct box" />
            </div>
            <div className="form-group">
              <label className="form-label">Recipe Unit (what you measure)</label>
              <select className="form-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your Cost (per pack)</label>
              <input className="form-input" type="number" step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="ing-form-subtitle">Store Price Comparison</div>
          <div className="ing-form-grid ing-form-grid-3">
            <div className="form-group">
              <label className="form-label">Walmart</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_walmart} onChange={e => set('avg_price_walmart', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Costco</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_costco} onChange={e => set('avg_price_costco', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Sam's Club</label>
              <input className="form-input" type="number" step="0.01" value={form.avg_price_sams} onChange={e => set('avg_price_sams', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="ing-form-subtitle">Inventory</div>
          <div className="ing-form-grid">
            <div className="form-group">
              <label className="form-label">Currently In Stock</label>
              <input className="form-input" type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder When Below</label>
              <input className="form-input" type="number" value={form.reorder_point} onChange={e => set('reorder_point', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
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

      {/* Table */}
      <div className="card ing-table-wrap">
        {filtered.length === 0 ? (
          <div className="ing-empty">
            <p>No {typeTab === 'ingredient' ? 'ingredients' : 'materials'} found.</p>
            <p style={{ fontSize: '0.8rem', marginBottom: '12px' }}>Add one manually, import your own CSV, or start with our curated list.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={loadStarterList} disabled={loadingStarter}>
                {loadingStarter ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />} Load Starter List (90+)
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}><Upload size={14} /> Import CSV</button>
              <button className="btn btn-primary btn-sm" onClick={handleNew}><Plus size={14} /> Add Manually</button>
            </div>
          </div>
        ) : (
          <table className="ing-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vendor</th>
                <th>Pack Size</th>
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
                      {item.category && <span className="ing-pkg">{item.category}</span>}
                    </td>
                    <td>{item.supplier || '—'}</td>
                    <td>{item.package_size ? `${item.package_size} ${item.package_unit || ''}` : '—'}</td>
                    <td>{item.unit}</td>
                    <td>{fmt(item.unit_cost)}</td>
                    <td>{fmt(item.avg_price_walmart)}</td>
                    <td>{fmt(item.avg_price_costco)}</td>
                    <td>{fmt(item.avg_price_sams)}</td>
                    <td>
                      <span className={lowStock ? 'ing-stock-low' : ''}>{item.stock_quantity ?? '—'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(item)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: 'var(--error)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
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
