import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Store, ExternalLink, Loader2, Globe, Instagram, Facebook } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './StoreSettings.css'

export default function StoreSettings() {
  const { getStore, saveStore } = useData()
  const { user, profile } = useAuth()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    slug: '', store_name: '', tagline: '', description: '',
    email: '', phone: '', address: '', city: '', state: '', zip: '',
    instagram_url: '', facebook_url: '', tiktok_url: '',
    accepts_orders: true, delivery_available: false, pickup_available: true,
    delivery_radius_miles: '', minimum_order_amount: '', advance_days_required: 3,
    payment_policy: 'Full payment due at pickup/delivery.',
    cancellation_policy: '', allergen_notice: 'Items may contain common allergens including nuts, dairy, wheat, and eggs.',
    is_published: false, primary_color: '#C8913A'
  })

  useEffect(() => {
    if (!configured) { setLoading(false); return }
    getStore().then(store => {
      if (store) {
        setForm(prev => ({ ...prev, ...store }))
      } else if (profile) {
        setForm(prev => ({
          ...prev,
          store_name: profile.business_name || `${profile.full_name || ''}'s Bakery`,
          email: profile.email || '',
          slug: generateSlug(profile.business_name || profile.full_name || '')
        }))
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [configured, profile])

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.store_name.trim()) { toast.error('Store name is required'); return }
    if (!form.slug.trim()) { toast.error('Store URL is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        delivery_radius_miles: form.delivery_radius_miles === '' ? null : parseInt(form.delivery_radius_miles) || null,
        minimum_order_amount: form.minimum_order_amount === '' ? 0 : parseFloat(form.minimum_order_amount) || 0,
        advance_days_required: parseInt(form.advance_days_required) || 0,
      }
      await saveStore(payload)
      toast.success('Store settings saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save store settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><div className="loading-spinner" /></div>

  const storeUrl = `${window.location.origin}/store/${form.slug}`

  return (
    <div className="store-settings">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Store</h1>
          <p>Customize your public bakery storefront</p>
        </div>
        {form.slug && (
          <a href={`/store/${form.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink size={15} /> View Store
          </a>
        )}
      </div>

      <form onSubmit={handleSave} className="store-form">
        <div className="card card-padding store-section">
          <div className="store-section-title">Store Identity</div>
          <div className="store-form-grid">
            <div className="form-group">
              <label className="form-label">Store Name *</label>
              <input className="form-input" value={form.store_name} onChange={(e) => { set('store_name', e.target.value); if (!form.slug) set('slug', generateSlug(e.target.value)) }} placeholder="Jane's Sweet Creations" required />
            </div>
            <div className="form-group">
              <label className="form-label">Store URL *</label>
              <div className="store-url-wrap">
                <span className="store-url-prefix">doughpop.com/store/</span>
                <input className="form-input store-url-input" value={form.slug} onChange={(e) => set('slug', generateSlug(e.target.value))} placeholder="janes-bakery" required />
              </div>
              {form.slug && <span className="form-hint">{storeUrl}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input className="form-input" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Baked with love, delivered with care" />
            </div>
            <div className="form-group">
              <label className="form-label">Brand Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} style={{ width: '48px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px' }} />
                <input className="form-input" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} placeholder="#C8913A" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">About Your Bakery</label>
              <textarea className="form-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell your story — how you started baking, what makes your creations special, what you specialize in…" />
            </div>
          </div>
        </div>

        <div className="card card-padding store-section">
          <div className="store-section-title">Contact & Location</div>
          <div className="store-form-grid">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="hello@yourbakery.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Street Address</label>
              <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St (optional — for pickup orders)" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Austin" />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="TX" />
              </div>
              <div>
                <label className="form-label">ZIP</label>
                <input className="form-input" value={form.zip} onChange={(e) => set('zip', e.target.value)} placeholder="78701" />
              </div>
            </div>
          </div>
        </div>

        <div className="card card-padding store-section">
          <div className="store-section-title">Social Media</div>
          <div className="store-form-grid">
            <div className="form-group">
              <label className="form-label"><Instagram size={14} /> Instagram</label>
              <input className="form-input" value={form.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/yourbakery" />
            </div>
            <div className="form-group">
              <label className="form-label"><Facebook size={14} /> Facebook</label>
              <input className="form-input" value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/yourbakery" />
            </div>
          </div>
        </div>

        <div className="card card-padding store-section">
          <div className="store-section-title">Order & Delivery Settings</div>
          <div className="store-form-grid">
            <div className="form-group">
              <label className="form-label">Advance Notice Required (days)</label>
              <input className="form-input" type="number" min="0" value={form.advance_days_required} onChange={(e) => set('advance_days_required', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Order Amount ($)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.minimum_order_amount} onChange={(e) => set('minimum_order_amount', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.pickup_available} onChange={(e) => set('pickup_available', e.target.checked)} />
                Pickup available
              </label>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.delivery_available} onChange={(e) => set('delivery_available', e.target.checked)} />
                Delivery available
              </label>
            </div>
            {form.delivery_available && (
              <div className="form-group">
                <label className="form-label">Delivery Radius (miles)</label>
                <input className="form-input" type="number" min="0" value={form.delivery_radius_miles} onChange={(e) => set('delivery_radius_miles', e.target.value)} placeholder="10" />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Payment Policy</label>
              <textarea className="form-textarea" value={form.payment_policy} onChange={(e) => set('payment_policy', e.target.value)} style={{ minHeight: '70px' }} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Allergen Notice</label>
              <textarea className="form-textarea" value={form.allergen_notice} onChange={(e) => set('allergen_notice', e.target.value)} style={{ minHeight: '70px' }} />
            </div>
          </div>
        </div>

        <div className="card card-padding store-section">
          <div className="store-section-title">Visibility</div>
          <label className="store-publish-toggle">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
            <div className="toggle-track">
              <div className="toggle-thumb" />
            </div>
            <div>
              <strong>{form.is_published ? 'Store is Live' : 'Store is Hidden'}</strong>
              <span>{form.is_published ? 'Your store is visible to the public' : 'Only you can see your store'}</span>
            </div>
          </label>
        </div>

        <div className="store-save-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Loader2 size={16} className="spinner" />}
            Save Store Settings
          </button>
        </div>
      </form>
    </div>
  )
}
