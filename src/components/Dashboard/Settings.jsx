import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { Loader2, User, Mail, Building2, Phone, Globe, Lock, ExternalLink, CreditCard, Calendar, Link2 } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import { isSupabaseConfigured } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import './Settings.css'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const { isPro, info } = useSubscription()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    business_name: profile?.business_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    bio: profile?.bio || '',
    default_tax_rate: profile?.default_tax_rate ?? '',
    tax_name: profile?.tax_name || '',
    tax_apply_all: profile?.tax_apply_all || false,
    default_pricing_method: profile?.default_pricing_method || 'set_price',
    default_margin_percent: profile?.default_margin_percent ?? 30,
    hourly_rate: profile?.hourly_rate ?? '',
  })

  const configured = isSupabaseConfigured()
  const checkoutUrl = import.meta.env.VITE_CHECKOUT_API_URL

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const nextEmail = (form.email || '').trim()
      const authEmail = (user?.email || '').trim()
      if (nextEmail && nextEmail !== authEmail) {
        const { error: authErr } = await supabase.auth.updateUser({ email: nextEmail })
        if (authErr) throw authErr
      }
      const payload = {
        full_name: form.full_name,
        business_name: form.business_name,
        email: nextEmail || null,
        phone: form.phone,
        website: form.website,
        bio: form.bio,
        tax_name: form.tax_name,
        tax_apply_all: form.tax_apply_all,
        default_pricing_method: form.default_pricing_method,
        default_tax_rate: form.default_tax_rate === '' ? null : parseFloat(form.default_tax_rate),
        default_margin_percent: form.default_margin_percent === '' ? null : parseFloat(form.default_margin_percent),
        hourly_rate: form.hourly_rate === '' ? null : parseFloat(form.hourly_rate),
      }
      await updateProfile(payload)
      if (nextEmail && nextEmail !== authEmail) {
        toast.success('Profile updated. If your project requires email confirmation, check the new inbox to finish the change — then use that email to sign in.')
      } else {
        toast.success('Profile updated!')
      }
    } catch (err) {
      const msg = err?.message || err?.msg || String(err)
      if (/schema cache|column.*profiles/i.test(msg)) {
        toast.error(
          'Your database is missing a profiles column. Run supabase-profiles-patch.sql in the Supabase SQL editor, then try again.',
        )
      } else if (
        /already (been )?registered|already in use|email.*(taken|exists)|duplicate key|user_already_exists/i.test(
          msg,
        )
      ) {
        toast.error('That email is already used by another account. Use a different address or sign in with that account.')
      } else {
        toast.error(msg || 'Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!checkoutUrl) {
      toast.error('Billing portal not configured')
      return
    }
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'portal' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      toast.error(err.message || 'Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and subscription</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-main">
          <form onSubmit={handleSave}>
            <div className="card card-padding settings-section">
              <div className="settings-section-title">Profile Information</div>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label"><User size={14} /> Full Name</label>
                  <input className="form-input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Baker" />
                </div>
                <div className="form-group">
                  <label className="form-label"><Building2 size={14} /> Bakery Name</label>
                  <input className="form-input" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="Jane's Sweet Creations" />
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={14} /> Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={14} /> Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 000-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label"><Globe size={14} /> Website</label>
                  <input className="form-input" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourbakery.com" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="A short bio about you and your baking journey…" style={{ minHeight: '80px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <Loader2 size={15} className="spinner" />}
                  Save Changes
                </button>
              </div>
            </div>

            <div className="card card-padding settings-section">
              <div className="settings-section-title">Tax Configuration</div>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Default Tax Rate (%)</label>
                  <input className="form-input" type="number" min="0" max="20" step="0.01" value={form.default_tax_rate} onChange={e => set('default_tax_rate', e.target.value)} placeholder="e.g. 7.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Name</label>
                  <input className="form-input" value={form.tax_name} onChange={e => set('tax_name', e.target.value)} placeholder="e.g. FL Sales Tax" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.tax_apply_all} onChange={e => set('tax_apply_all', e.target.checked)} />
                    Auto-apply this tax rate to all new quotes and invoices
                  </label>
                </div>
              </div>
            </div>

            <div className="card card-padding settings-section">
              <div className="settings-section-title">Default Pricing</div>
              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Default Pricing Method</label>
                  <select className="form-select" value={form.default_pricing_method} onChange={e => set('default_pricing_method', e.target.value)}>
                    <option value="set_price">Set Custom Price</option>
                    <option value="per_serving">Price Per Serving</option>
                    <option value="cost_plus_margin">Cost + Margin %</option>
                    <option value="calculated_cost">Calculated Cost (ingredients + labor)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Margin %</label>
                  <input className="form-input" type="number" min="0" max="500" step="1" value={form.default_margin_percent} onChange={e => set('default_margin_percent', e.target.value)} placeholder="30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate ($)</label>
                  <input className="form-input" type="number" min="0" step="0.50" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="25.00" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Loader2 size={15} className="spinner" />}
                Save All Settings
              </button>
            </div>
          </form>
        </div>

        <div className="settings-sidebar">
          <div className="card card-padding settings-subscription-card">
            <div className="settings-section-title">Your Plan</div>
            <div className="settings-plan-badge">
              <span className={`badge badge-${isPro ? 'pro' : 'free'}`} style={{ fontSize: '0.875rem', padding: '6px 14px' }}>
                {isPro ? '⚡ Pro Plan' : '🆓 Starter Plan'}
              </span>
            </div>
            <div className="settings-plan-info">
              <p>{isPro
                ? 'You have full access to all Pro features — unlimited products, clients, invoices, and more.'
                : 'You are on the free Starter plan with limits on products, clients, and quotes.'
              }</p>
            </div>
            {!isPro ? (
              <a href="/dashboard/upgrade" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Upgrade to Pro – $12.99/mo
              </a>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              >
                {portalLoading ? (
                  <><Loader2 size={15} className="spinner" /> Opening...</>
                ) : (
                  <><CreditCard size={15} /> Manage Billing</>
                )}
              </button>
            )}
          </div>

          <div className="card card-padding">
            <div className="settings-section-title"><Calendar size={14} /> Calendar Sync</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Connect Google Calendar to sync orders and events automatically.
            </p>
            {profile?.google_calendar_id ? (
              <div>
                <span className="badge badge-pro" style={{ marginBottom: '8px' }}><Link2 size={10} /> Connected</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Syncing to: {profile.google_calendar_id}</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}>Disconnect</button>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const gcalAuthUrl = import.meta.env.VITE_CHECKOUT_API_URL
                  if (!gcalAuthUrl) { toast.error('Google Calendar sync requires the API to be configured'); return }
                  toast.info('Google Calendar integration coming soon. Configure OAuth in GCP console.')
                }}
              >
                <Calendar size={15} /> Connect Google Calendar
              </button>
            )}
          </div>

          <div className="card card-padding">
            <div className="settings-section-title">Security</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              To change your password, use the password reset flow.
            </p>
            <a href="/auth?mode=forgot" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex' }}>
              <Lock size={15} /> Reset Password
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
