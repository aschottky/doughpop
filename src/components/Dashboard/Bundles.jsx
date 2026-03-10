import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Package, Edit2, Trash2, Loader2, X } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './Bundles.css'

const DEMO_BUNDLES = [
  { 
    id: '1', 
    name: '6" Cake Bundle', 
    description: 'Everything needed for a 6" custom cake',
    bundle_items: [
      { id: '1', item_name: '6" Parchment Rounds', quantity: 3 },
      { id: '2', item_name: 'Piping Bags', quantity: 4 },
      { id: '3', item_name: 'Cake Board', quantity: 1 },
      { id: '4', item_name: '8" Drum', quantity: 1 },
      { id: '5', item_name: '8" Box', quantity: 1 }
    ]
  },
  { 
    id: '2', 
    name: 'Cookie Decorating Kit', 
    description: 'Supplies for decorating 2 dozen cookies',
    bundle_items: [
      { id: '6', item_name: 'Piping Bags', quantity: 6 },
      { id: '7', item_name: 'Couplers', quantity: 3 },
      { id: '8', item_name: 'Sprinkles Assorted', quantity: 4 }
    ]
  }
]

const EMPTY_BUNDLE = { name: '', description: '' }
const EMPTY_ITEM = { name: '', quantity: 1 }

export default function Bundles() {
  const { getBundles, createBundle, updateBundle, deleteBundle } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBundle, setEditBundle] = useState(null)
  const [form, setForm] = useState(EMPTY_BUNDLE)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBundles()
  }, [configured])

  const loadBundles = async () => {
    if (!configured) {
      setBundles(DEMO_BUNDLES)
      setLoading(false)
      return
    }
    try {
      const data = await getBundles()
      setBundles(data)
    } catch {
      setBundles(DEMO_BUNDLES)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditBundle(null)
    setForm(EMPTY_BUNDLE)
    setItems([{ ...EMPTY_ITEM }])
    setShowModal(true)
  }

  const openEdit = (bundle) => {
    setEditBundle(bundle)
    setForm({ name: bundle.name, description: bundle.description || '' })
    setItems(bundle.bundle_items?.length ? bundle.bundle_items.map(i => ({ name: i.item_name, quantity: i.quantity })) : [{ ...EMPTY_ITEM }])
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Bundle name is required'); return }
    if (!items.some(i => i.name.trim())) { toast.error('At least one item is required'); return }
    
    setSaving(true)
    const validItems = items.filter(i => i.name.trim())
    
    try {
      if (editBundle) {
        await updateBundle(editBundle.id, form, validItems)
        toast.success('Bundle updated')
      } else {
        await createBundle(form, validItems)
        toast.success('Bundle created')
      }
      setShowModal(false)
      loadBundles()
    } catch (err) {
      toast.error(err.message || 'Failed to save bundle')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bundle?')) return
    try {
      await deleteBundle(id)
      setBundles(prev => prev.filter(b => b.id !== id))
      toast.success('Bundle deleted')
    } catch {
      toast.error('Failed to delete bundle')
    }
  }

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  if (loading) {
    return (
      <div className="bundles-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="bundles-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Material Bundles</h1>
          <p>Create reusable kits of supplies for your orders</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={17} /> New Bundle
        </button>
      </div>

      <div className="bundles-grid">
        {bundles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">📦</div>
            <h3>No bundles yet</h3>
            <p>Create bundles to quickly add sets of materials to your orders.</p>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={15} /> Create First Bundle
            </button>
          </div>
        ) : (
          bundles.map(bundle => (
            <div key={bundle.id} className="bundle-card">
              <div className="bundle-card-header">
                <div className="bundle-icon">
                  <Package size={20} />
                </div>
                <div className="bundle-actions">
                  <button onClick={() => openEdit(bundle)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(bundle.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="bundle-name">{bundle.name}</h3>
              {bundle.description && <p className="bundle-description">{bundle.description}</p>}
              <div className="bundle-items">
                <h4>Items ({bundle.bundle_items?.length || 0})</h4>
                <ul>
                  {(bundle.bundle_items || []).slice(0, 5).map((item, i) => (
                    <li key={i}>
                      <span className="item-qty">{item.quantity}×</span>
                      <span className="item-name">{item.item_name}</span>
                    </li>
                  ))}
                  {(bundle.bundle_items?.length || 0) > 5 && (
                    <li className="more-items">+{bundle.bundle_items.length - 5} more items</li>
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content bundle-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editBundle ? 'Edit Bundle' : 'Create Bundle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="bundle-form">
              <div className="form-group">
                <label className="form-label">Bundle Name *</label>
                <input 
                  className="form-input" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder='e.g., 6" Cake Bundle'
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  className="form-input" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  placeholder="What this bundle includes..."
                />
              </div>

              <div className="bundle-items-section">
                <label className="form-label">Items *</label>
                <div className="bundle-items-list">
                  {items.map((item, idx) => (
                    <div key={idx} className="bundle-item-row">
                      <input 
                        className="form-input item-name-input" 
                        value={item.name} 
                        onChange={(e) => updateItem(idx, 'name', e.target.value)} 
                        placeholder="Item name"
                      />
                      <input 
                        className="form-input item-qty-input" 
                        type="number"
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-ghost btn-sm add-item-btn" onClick={addItem}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <Loader2 size={15} className="spinner" />}
                  {editBundle ? 'Save Changes' : 'Create Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
