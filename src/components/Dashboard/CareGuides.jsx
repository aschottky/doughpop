import { useState, useEffect, useRef } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Trash2, Loader2, Edit2, Printer, Eye, X, Check, BookOpen } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './CareGuides.css'

const TEMPLATE_TYPES = [
  { value: 'serving', label: 'Serving Guide' },
  { value: 'care', label: 'Cake Care' },
  { value: 'storage', label: 'Storage Guide' },
  { value: 'custom', label: 'Custom' },
]

const CATEGORIES = [
  'cake_care', 'cookie_care', 'cupcake_care', 'cake_pop_care',
  'cutting_guide', 'serving_portions', 'storage',
]

const DEFAULT_TEMPLATES = {
  serving: `<h2>Serving Guide</h2>
<h3>Round Cake Serving Chart</h3>
<table><tr><th>Size</th><th>Party Servings</th><th>Wedding Servings</th></tr>
<tr><td>6"</td><td>12</td><td>18</td></tr>
<tr><td>8"</td><td>20</td><td>30</td></tr>
<tr><td>10"</td><td>28</td><td>40</td></tr>
<tr><td>12"</td><td>40</td><td>56</td></tr></table>
<p><em>Party servings are 2" x 2" slices. Wedding servings are 1" x 2" slices.</em></p>`,

  care: `<h2>Cake Care Instructions</h2>
<p>Thank you for your order! Please follow these guidelines to keep your cake fresh and beautiful.</p>
<h3>Before the Event</h3>
<ul>
<li>Keep refrigerated until 1-2 hours before serving</li>
<li>Do not place in direct sunlight or near heat sources</li>
<li>Transport on a flat, stable surface</li>
</ul>
<h3>Cutting Tips</h3>
<ul>
<li>Use a sharp, thin-bladed knife</li>
<li>Wipe the knife clean between cuts for clean slices</li>
<li>For tiered cakes, remove the top tier first</li>
</ul>
<h3>Storage</h3>
<ul>
<li>Leftover cake can be refrigerated for 3-5 days in an airtight container</li>
<li>Cake can be frozen for up to 3 months — wrap tightly in plastic wrap</li>
</ul>`,

  storage: `<h2>Storage Guide</h2>
<h3>Cookies</h3>
<p>Store in an airtight container at room temperature for up to 1 week. For longer storage, freeze for up to 3 months.</p>
<h3>Cupcakes</h3>
<p>Keep in a cool place. Refrigerate if frosted with cream cheese or whipped cream. Best consumed within 2-3 days.</p>
<h3>Cake Pops</h3>
<p>Store in an airtight container at room temperature for up to 1 week. Do not refrigerate as moisture may cause the coating to sweat.</p>`,
}

export default function CareGuides() {
  const { getCareTemplates, createCareTemplate, updateCareTemplate, deleteCareTemplate } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const printRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', template_type: 'care', category: '', content: '' })

  useEffect(() => { loadData() }, [configured])

  const loadData = async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await getCareTemplates()
      setTemplates(data)
    } catch (err) { console.error('Failed to load templates:', err) }
    finally { setLoading(false) }
  }

  const handleNew = (type = 'care') => {
    setForm({
      name: '',
      template_type: type,
      category: '',
      content: DEFAULT_TEMPLATES[type] || '',
    })
    setEditing('new')
  }

  const handleEdit = (t) => {
    setForm({ name: t.name, template_type: t.template_type, category: t.category || '', content: t.content })
    setEditing(t.id)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (editing === 'new') {
        const created = await createCareTemplate(form)
        setTemplates(prev => [created, ...prev])
        toast.success('Template created')
      } else {
        const updated = await updateCareTemplate(editing, form)
        setTemplates(prev => prev.map(t => t.id === editing ? updated : t))
        toast.success('Template updated')
      }
      setEditing(null)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await deleteCareTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Deleted')
    } catch (err) { toast.error(err.message) }
  }

  const handlePrint = (content) => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Care Guide</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333}h2{color:#5c3d2e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f0eb}</style></head><body>${content}</body></html>`)
    win.document.close()
    win.print()
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="care-guides-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Care Guides & Templates</h1>
          <p>Printable serving, cutting, and storage guides for your clients</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {TEMPLATE_TYPES.map(t => (
            <button key={t.value} className="btn btn-ghost btn-sm" onClick={() => handleNew(t.value)}>
              <Plus size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {editing && (
        <div className="card card-padding">
          <h3 style={{ marginBottom: '16px' }}>{editing === 'new' ? 'New' : 'Edit'} Template</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cake Care Instructions" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.template_type} onChange={e => setForm(f => ({ ...f, template_type: e.target.value }))}>
                {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">General</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Content (HTML supported)</label>
            <textarea className="form-textarea" style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => setPreview(form.content)}><Eye size={15} /> Preview</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="spinner" /> : <Check size={15} />} Save
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="contract-preview-overlay" onClick={() => setPreview(null)}>
          <div className="contract-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="contract-preview-header">
              <h3>Preview</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(preview)}><Printer size={14} /> Print</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}><X size={16} /></button>
              </div>
            </div>
            <div className="contract-preview-body" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}

      <div className="care-list">
        {templates.length === 0 && !editing && (
          <div className="card card-padding" style={{ textAlign: 'center', padding: '48px' }}>
            <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No care guides yet.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: '400px', margin: '0 auto 16px' }}>
              Create printable serving, cutting, and storage guides to include with your orders.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => handleNew('care')}><Plus size={14} /> Create First Guide</button>
          </div>
        )}
        {templates.map(t => (
          <div key={t.id} className="card card-padding care-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--chocolate)' }}>{t.name}</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{t.template_type}</span>
                  {t.category && <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{t.category.replace(/_/g, ' ')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-ghost btn-xs" onClick={() => handlePrint(t.content)} title="Print"><Printer size={14} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => setPreview(t.content)} title="Preview"><Eye size={14} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(t)} title="Edit"><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(t.id)} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              {t.content?.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
