import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Trash2, Loader2, GripVertical, Cake, Droplets, IceCream, Ruler, PartyPopper, X } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './BakerOptions.css'

const TABS = [
  { key: 'events', label: 'Event Types', icon: <PartyPopper size={16} /> },
  { key: 'batters', label: 'Batters / Flavors', icon: <Cake size={16} /> },
  { key: 'fillings', label: 'Fillings', icon: <Droplets size={16} /> },
  { key: 'frostings', label: 'Frostings', icon: <IceCream size={16} /> },
  { key: 'sizes', label: 'Sizes', icon: <Ruler size={16} /> },
]

export default function BakerOptions() {
  const {
    getEventTypes, createEventType, updateEventType, deleteEventType,
    getFlavors, createFlavor, updateFlavor, deleteFlavor,
    getSizes, createSize, updateSize, deleteSize,
  } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [tab, setTab] = useState('events')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eventTypes, setEventTypes] = useState([])
  const [batters, setBatters] = useState([])
  const [fillings, setFillings] = useState([])
  const [frostings, setFrostings] = useState([])
  const [sizes, setSizes] = useState([])
  const [newName, setNewName] = useState('')
  const [newSizeData, setNewSizeData] = useState({ name: '', product_type: 'cake', servings: '', batter_weight_grams: '' })

  useEffect(() => { loadAll() }, [configured])

  const loadAll = async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const [ev, bat, fil, fro, sz] = await Promise.all([
        getEventTypes(),
        getFlavors('batter'),
        getFlavors('filling'),
        getFlavors('frosting'),
        getSizes(),
      ])
      setEventTypes(ev)
      setBatters(bat)
      setFillings(fil)
      setFrostings(fro)
      setSizes(sz)
    } catch (err) {
      console.error('Failed to load baker options:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const item = await createEventType(newName.trim(), eventTypes.length)
      setEventTypes(prev => [...prev, item])
      setNewName('')
      toast.success('Event type added')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDeleteEvent = async (id) => {
    try {
      await deleteEventType(id)
      setEventTypes(prev => prev.filter(e => e.id !== id))
    } catch (err) { toast.error(err.message) }
  }

  const handleAddFlavor = async (category) => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const setter = category === 'batter' ? setBatters : category === 'filling' ? setFillings : setFrostings
      const list = category === 'batter' ? batters : category === 'filling' ? fillings : frostings
      const item = await createFlavor({ name: newName.trim(), category, sort_order: list.length })
      setter(prev => [...prev, item])
      setNewName('')
      toast.success('Added')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDeleteFlavor = async (id, category) => {
    try {
      await deleteFlavor(id)
      const setter = category === 'batter' ? setBatters : category === 'filling' ? setFillings : setFrostings
      setter(prev => prev.filter(e => e.id !== id))
    } catch (err) { toast.error(err.message) }
  }

  const handleAddSize = async () => {
    if (!newSizeData.name.trim()) return
    setSaving(true)
    try {
      const item = await createSize({
        name: newSizeData.name.trim(),
        product_type: newSizeData.product_type,
        servings: parseInt(newSizeData.servings) || 0,
        batter_weight_grams: parseInt(newSizeData.batter_weight_grams) || 0,
        sort_order: sizes.length,
      })
      setSizes(prev => [...prev, item])
      setNewSizeData({ name: '', product_type: 'cake', servings: '', batter_weight_grams: '' })
      toast.success('Size added')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDeleteSize = async (id) => {
    try {
      await deleteSize(id)
      setSizes(prev => prev.filter(s => s.id !== id))
    } catch (err) { toast.error(err.message) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  const renderSimpleList = (items, onDelete, category) => (
    <div className="bo-list">
      {items.length === 0 && <p className="bo-empty">No items yet. Add your first one below.</p>}
      {items.map(item => (
        <div key={item.id} className="bo-item">
          <GripVertical size={14} className="bo-grip" />
          <span className="bo-item-name">{item.name}</span>
          <button className="bo-delete-btn" onClick={() => category ? onDelete(item.id, category) : onDelete(item.id)} title="Remove">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <div className="baker-options-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Baker Options</h1>
          <p>Manage event types, flavors, fillings, frostings, and sizes used in quotes and orders</p>
        </div>
      </div>

      <div className="bo-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`bo-tab ${tab === t.key ? 'bo-tab-active' : ''}`} onClick={() => { setTab(t.key); setNewName('') }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card card-padding bo-content">
        {tab === 'events' && (
          <>
            <div className="bo-section-title">Event Types</div>
            <p className="bo-section-desc">These appear as options when creating quotes and orders.</p>
            {renderSimpleList(eventTypes, handleDeleteEvent)}
            <div className="bo-add-row">
              <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Birthday, Wedding..." onKeyDown={e => e.key === 'Enter' && handleAddEvent()} />
              <button className="btn btn-primary btn-sm" onClick={handleAddEvent} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />} Add
              </button>
            </div>
          </>
        )}

        {tab === 'batters' && (
          <>
            <div className="bo-section-title">Batter Flavors</div>
            <p className="bo-section-desc">Cake batter and base flavors for your products.</p>
            {renderSimpleList(batters, handleDeleteFlavor, 'batter')}
            <div className="bo-add-row">
              <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Golden Vanilla, Chocolate Fudge..." onKeyDown={e => e.key === 'Enter' && handleAddFlavor('batter')} />
              <button className="btn btn-primary btn-sm" onClick={() => handleAddFlavor('batter')} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />} Add
              </button>
            </div>
          </>
        )}

        {tab === 'fillings' && (
          <>
            <div className="bo-section-title">Fillings</div>
            <p className="bo-section-desc">Filling options for cakes and pastries.</p>
            {renderSimpleList(fillings, handleDeleteFlavor, 'filling')}
            <div className="bo-add-row">
              <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Bavarian Cream, Strawberry..." onKeyDown={e => e.key === 'Enter' && handleAddFlavor('filling')} />
              <button className="btn btn-primary btn-sm" onClick={() => handleAddFlavor('filling')} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />} Add
              </button>
            </div>
          </>
        )}

        {tab === 'frostings' && (
          <>
            <div className="bo-section-title">Frostings</div>
            <p className="bo-section-desc">Frosting and icing options.</p>
            {renderSimpleList(frostings, handleDeleteFlavor, 'frosting')}
            <div className="bo-add-row">
              <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Buttercream, Cream Cheese..." onKeyDown={e => e.key === 'Enter' && handleAddFlavor('frosting')} />
              <button className="btn btn-primary btn-sm" onClick={() => handleAddFlavor('frosting')} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />} Add
              </button>
            </div>
          </>
        )}

        {tab === 'sizes' && (
          <>
            <div className="bo-section-title">Product Sizes</div>
            <p className="bo-section-desc">Sizes with servings and batter weight for production planning.</p>
            <div className="bo-list">
              {sizes.length === 0 && <p className="bo-empty">No sizes yet.</p>}
              {sizes.map(s => (
                <div key={s.id} className="bo-item bo-item-size">
                  <GripVertical size={14} className="bo-grip" />
                  <span className="bo-item-name">{s.name}</span>
                  <span className="bo-item-meta">{s.product_type}</span>
                  <span className="bo-item-meta">{s.servings || '—'} servings</span>
                  <span className="bo-item-meta">{s.batter_weight_grams || '—'}g</span>
                  <button className="bo-delete-btn" onClick={() => handleDeleteSize(s.id)} title="Remove">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="bo-add-row bo-add-row-size">
              <input className="form-input" value={newSizeData.name} onChange={e => setNewSizeData(d => ({ ...d, name: e.target.value }))} placeholder='e.g. 7" Round' />
              <select className="form-select" value={newSizeData.product_type} onChange={e => setNewSizeData(d => ({ ...d, product_type: e.target.value }))}>
                <option value="cake">Cake</option>
                <option value="cupcakes">Cupcakes</option>
                <option value="cookies">Cookies</option>
                <option value="cake_pops">Cake Pops</option>
                <option value="other">Other</option>
              </select>
              <input className="form-input" type="number" value={newSizeData.servings} onChange={e => setNewSizeData(d => ({ ...d, servings: e.target.value }))} placeholder="Servings" />
              <input className="form-input" type="number" value={newSizeData.batter_weight_grams} onChange={e => setNewSizeData(d => ({ ...d, batter_weight_grams: e.target.value }))} placeholder="Batter (g)" />
              <button className="btn btn-primary btn-sm" onClick={handleAddSize} disabled={saving || !newSizeData.name.trim()}>
                {saving ? <Loader2 size={14} className="spinner" /> : <Plus size={14} />} Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
