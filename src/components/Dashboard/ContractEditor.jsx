import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Trash2, Loader2, Edit2, Eye, X, Check, ScrollText, Star } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './ContractEditor.css'

export default function ContractEditor() {
  const { getContracts, createContract, updateContract, deleteContract } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState([])
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', content_html: '', is_default: false })

  useEffect(() => { loadData() }, [configured])

  const loadData = async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await getContracts()
      setContracts(data)
    } catch (err) {
      console.error('Failed to load contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setForm({ name: '', content_html: DEFAULT_CONTRACT, is_default: false })
    setEditing('new')
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, content_html: c.content_html, is_default: c.is_default })
    setEditing(c.id)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Contract name is required'); return }
    setSaving(true)
    try {
      if (editing === 'new') {
        const created = await createContract(form)
        setContracts(prev => [...prev, created])
        toast.success('Contract created')
      } else {
        const updated = await updateContract(editing, form)
        setContracts(prev => prev.map(c => c.id === editing ? updated : c))
        toast.success('Contract updated')
      }
      setEditing(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contract template?')) return
    try {
      await deleteContract(id)
      setContracts(prev => prev.filter(c => c.id !== id))
      toast.success('Contract removed')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="contract-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Contracts & Terms</h1>
          <p>Create contract templates to attach to quotes. Clients accept terms when approving quotes.</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} /> New Contract
        </button>
      </div>

      {editing && (
        <div className="card card-padding contract-form">
          <div className="contract-form-title">{editing === 'new' ? 'New' : 'Edit'} Contract</div>
          <div className="form-group">
            <label className="form-label">Template Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Order Terms" />
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Contract Content (HTML supported)</label>
            <textarea
              className="form-textarea contract-textarea"
              value={form.content_html}
              onChange={e => setForm(f => ({ ...f, content_html: e.target.value }))}
              placeholder="Enter your contract terms..."
            />
          </div>
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
              Set as default contract for new quotes
            </label>
          </div>
          <div className="contract-form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => setPreview(form.content_html)}>
              <Eye size={15} /> Preview
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="spinner" /> : <Check size={15} />}
              {editing === 'new' ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="contract-preview-overlay" onClick={() => setPreview(null)}>
          <div className="contract-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="contract-preview-header">
              <h3>Contract Preview</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}><X size={16} /></button>
            </div>
            <div className="contract-preview-body" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}

      <div className="contract-list">
        {contracts.length === 0 && !editing && (
          <div className="contract-empty card card-padding">
            <ScrollText size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
            <p>No contract templates yet.</p>
            <p className="contract-empty-hint">Create a contract template to attach to your quotes. Clients will need to accept terms before approving.</p>
            <button className="btn btn-primary btn-sm" onClick={handleNew} style={{ marginTop: '12px' }}><Plus size={14} /> Create First Contract</button>
          </div>
        )}
        {contracts.map(c => (
          <div key={c.id} className="card card-padding contract-card">
            <div className="contract-card-header">
              <div>
                <h3 className="contract-card-name">{c.name}</h3>
                {c.is_default && <span className="badge badge-pro" style={{ fontSize: '0.7rem' }}><Star size={10} /> Default</span>}
              </div>
              <div className="contract-card-actions">
                <button className="btn btn-ghost btn-xs" onClick={() => setPreview(c.content_html)} title="Preview"><Eye size={14} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(c)} title="Edit"><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="contract-card-excerpt">
              {c.content_html?.replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
            <div className="contract-card-meta">Updated {new Date(c.updated_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const DEFAULT_CONTRACT = `<h2>Order Terms & Conditions</h2>

<h3>1. Order Confirmation</h3>
<p>A non-refundable deposit of 50% is required to confirm your order. The remaining balance is due upon pickup or delivery.</p>

<h3>2. Changes & Cancellations</h3>
<p>Changes to your order must be requested at least 7 days before your event date. Orders cancelled within 7 days of the event are non-refundable.</p>

<h3>3. Allergies & Dietary Restrictions</h3>
<p>All items are made in a home kitchen that processes common allergens including wheat, eggs, dairy, nuts, and soy. While we take care to accommodate dietary restrictions, we cannot guarantee a completely allergen-free environment.</p>

<h3>4. Delivery & Pickup</h3>
<p>Delivery fees are based on distance. The customer assumes responsibility for the order once it has been delivered or picked up. We are not liable for damage after transfer.</p>

<h3>5. Photos & Social Media</h3>
<p>We reserve the right to photograph all orders for portfolio and social media use unless otherwise requested in writing.</p>

<p><em>By accepting this quote, you agree to the terms and conditions outlined above.</em></p>`
