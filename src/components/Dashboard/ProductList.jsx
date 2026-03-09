import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Search, Package, Edit2, Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import Modal from '../Shared/Modal'
import { useToast } from '../Shared/Toast'
import './ProductList.css'

const DEMO_PRODUCTS = [
  { id: '1', name: '6" Custom Celebration Cake', description: 'Fully customizable design. Serves 8-10.', price: 85, unit: 'each', category_id: null, product_categories: { name: 'Cakes' }, lead_time_days: 3, is_available: true, is_featured: true, allergens: ['gluten', 'dairy', 'eggs'] },
  { id: '2', name: 'Dozen Decorated Sugar Cookies', description: 'Custom designs, any occasion.', price: 42, unit: 'dozen', product_categories: { name: 'Cookies' }, lead_time_days: 2, is_available: true, is_featured: false, allergens: ['gluten', 'dairy'] },
  { id: '3', name: 'Classic Sourdough Loaf', description: 'Long-fermented wild yeast sourdough.', price: 14, unit: 'loaf', product_categories: { name: 'Bread' }, lead_time_days: 1, is_available: true, is_featured: false, allergens: ['gluten'] },
]

const EMPTY_PRODUCT = { name: '', description: '', price: '', unit: 'each', category_id: '', lead_time_days: 2, min_quantity: 1, serves: '', allergens: [], is_available: true, is_featured: false, tags: [] }
const ALLERGEN_LIST = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish', 'Sesame']

export default function ProductList() {
  const { getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory } = useData()
  const { isPro, canAddProduct } = useSubscription()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!configured) { setProducts(DEMO_PRODUCTS); setLoading(false); return }
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c) })
      .catch(() => setProducts(DEMO_PRODUCTS))
      .finally(() => setLoading(false))
  }, [configured])

  const openAdd = () => {
    if (!canAddProduct(products.length)) { toast.error(`Free plan limited to 10 products. Upgrade to Pro for unlimited.`); return }
    setEditProduct(null); setForm(EMPTY_PRODUCT); setModalOpen(true)
  }

  const openEdit = (e, p) => {
    e.stopPropagation()
    setEditProduct(p)
    setForm({
      name: p.name || '', description: p.description || '', price: p.price || '',
      unit: p.unit || 'each', category_id: p.category_id || '',
      lead_time_days: p.lead_time_days || 2, min_quantity: p.min_quantity || 1,
      max_quantity: p.max_quantity || '', serves: p.serves || '', allergens: p.allergens || [],
      is_available: p.is_available !== false, is_featured: p.is_featured || false, tags: p.tags || []
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    if (!form.price || isNaN(form.price)) { toast.error('Valid price is required'); return }
    setSaving(true)
    const data = { ...form, price: parseFloat(form.price), category_id: form.category_id || null }
    try {
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, data)
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...updated } : p))
        toast.success('Product updated')
      } else {
        const newP = await createProduct(data)
        setProducts(prev => [...prev, newP])
        toast.success('Product added')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this product?')) return
    try { await deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); toast.success('Product deleted') }
    catch { toast.error('Failed to delete product') }
  }

  const toggleAllergen = (a) => {
    setForm(f => {
      const arr = f.allergens || []
      return { ...f, allergens: arr.includes(a.toLowerCase()) ? arr.filter(x => x !== a.toLowerCase()) : [...arr, a.toLowerCase()] }
    })
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="product-list">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>Manage your bakery catalog · {products.length}{!isPro ? '/10' : ''} products</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={17} /> Add Product
        </button>
      </div>

      {!isPro && products.length >= 8 && (
        <div className="product-limit-warning">
          <AlertTriangle size={16} />
          <span>You're using {products.length} of 10 products on the free plan. <a href="/dashboard/upgrade">Upgrade to Pro</a> for unlimited.</span>
        </div>
      )}

      <div className="products-grid-header">
        <div className="data-table-search" style={{ maxWidth: '300px' }}>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-emoji">🧁</div>
          <h3>{search ? 'No products found' : 'No products yet'}</h3>
          <p>Add your first product to start building your catalog.</p>
          {!search && <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={15} /> Add First Product</button>}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <div key={p.id} className={`product-card ${!p.is_available ? 'product-card-unavailable' : ''}`}>
              <div className="product-card-header">
                <div className="product-card-category">
                  {p.product_categories?.name || 'Uncategorized'}
                </div>
                <div className="product-card-actions">
                  <button onClick={(e) => openEdit(e, p)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => handleDelete(e, p.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="product-card-name">{p.name}</div>
              {p.description && <p className="product-card-desc">{p.description}</p>}
              <div className="product-card-footer">
                <strong className="product-card-price">{fmt(p.price)} <span>/{p.unit}</span></strong>
                <div className="product-card-meta">
                  <span>{p.lead_time_days}d lead time</span>
                  {!p.is_available && <span className="product-badge-unavailable">Hidden</span>}
                  {p.is_featured && <span className="product-badge-featured">Featured</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSave} className="product-form">
          <div className="product-form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Product Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder='e.g. 8" Custom Celebration Cake' required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your product, what's included, customization options…" style={{ minHeight: '80px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Price *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}>
                {['each', 'dozen', 'box', 'loaf', 'slice', 'tray', 'lb', 'kg', 'serving', 'custom'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time (days)</label>
              <input className="form-input" type="number" min="0" value={form.lead_time_days} onChange={(e) => setForm(f => ({ ...f, lead_time_days: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Serves</label>
              <input className="form-input" value={form.serves} onChange={(e) => setForm(f => ({ ...f, serves: e.target.value }))} placeholder="e.g. 8-10 people" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Allergens</label>
              <div className="allergen-chips">
                {ALLERGEN_LIST.map(a => (
                  <button key={a} type="button" className={`allergen-chip ${(form.allergens || []).includes(a.toLowerCase()) ? 'allergen-chip-active' : ''}`} onClick={() => toggleAllergen(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Min Quantity</label>
              <input className="form-input" type="number" min="1" value={form.min_quantity || 1} onChange={(e) => setForm(f => ({ ...f, min_quantity: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Quantity</label>
              <input className="form-input" type="number" min="1" value={form.max_quantity || ''} onChange={(e) => setForm(f => ({ ...f, max_quantity: e.target.value ? parseInt(e.target.value) : null }))} placeholder="No limit" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Tags</label>
              <div className="tags-input" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                {(form.tags || []).map((tag, i) => (
                  <span key={i} className="tag-chip" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'var(--honey-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                    {tag}
                    <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))} style={{ padding: '2px', lineHeight: 1 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag and press Enter…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = e.target.value.trim().toLowerCase()
                      if (val && !form.tags?.includes(val)) {
                        setForm(f => ({ ...f, tags: [...(f.tags || []), val] }))
                        e.target.value = ''
                      }
                    }
                  }}
                  style={{ flex: 1, minWidth: '120px', border: 'none', background: 'transparent', padding: '4px' }}
                />
              </div>
              <p className="form-hint">Press Enter to add a tag (e.g., custom, holiday, vegan)</p>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                Available in store
              </label>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                Featured product
              </label>
            </div>
          </div>
          <div className="client-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 size={15} className="spinner" />}
              {editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
