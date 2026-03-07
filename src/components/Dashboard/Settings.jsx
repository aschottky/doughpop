import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { Loader2, User, Mail, Building2, Phone, Globe, Lock } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './Settings.css'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const { isPro, info } = useSubscription()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    business_name: profile?.business_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    bio: profile?.bio || ''
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
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
            {!isPro && (
              <a href="/dashboard/upgrade" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Upgrade to Pro – $12.99/mo
              </a>
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
