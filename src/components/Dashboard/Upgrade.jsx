import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { getStripe } from '../../lib/stripe'
import { isSupabaseConfigured } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { Check, Zap, Loader2, AlertTriangle, CheckCircle, ExternalLink, Settings } from 'lucide-react'
import { TIER_INFO } from '../../context/SubscriptionContext'
import './Upgrade.css'

export default function Upgrade() {
  const { user } = useAuth()
  const { isPro, refreshSubscription } = useSubscription()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const configured = isSupabaseConfigured()

  const checkoutUrl = import.meta.env.VITE_CHECKOUT_API_URL

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const canceled = searchParams.get('canceled')
    if (sessionId) {
      verifyCheckout(sessionId)
    } else if (canceled) {
      setError('Checkout was canceled. You can try again whenever you\'re ready.')
    }
  }, [searchParams])

  const verifyCheckout = async (sessionId) => {
    setVerifying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const url = checkoutUrl || (configured ? null : null)
      if (!url || !token) { setMessage('Subscription activated!'); await refreshSubscription(); return }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'verify', session_id: sessionId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('🎉 Welcome to Pro! Your subscription is now active.')
      await refreshSubscription()
    } catch (err) {
      setError(err.message || 'Verification failed. Please contact support.')
    } finally {
      setVerifying(false)
    }
  }

  const handleCheckout = async () => {
    setError('')
    setLoading(true)
    try {
      if (!configured) {
        setMessage('Stripe checkout requires Supabase and Stripe to be configured. See README for setup.')
        setLoading(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!checkoutUrl || !token) throw new Error('Checkout not configured. Add VITE_CHECKOUT_API_URL to .env')

      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!checkoutUrl || !token) throw new Error('Checkout not configured. Add VITE_CHECKOUT_API_URL to .env')

      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'portal' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) return (
    <div className="upgrade-loading"><div className="loading-spinner" /><p>Verifying your subscription…</p></div>
  )

  const pro = TIER_INFO.pro

  return (
    <div className="upgrade-page">
      <div className="upgrade-header">
        <Zap size={32} style={{ color: 'var(--honey)' }} />
        <h1>Upgrade to DoughPop Pro</h1>
        <p>Unlock everything you need to run a professional home bakery business.</p>
      </div>

      {message && (
        <div className="upgrade-alert upgrade-alert-success">
          <CheckCircle size={20} /> {message}
          <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>Go to Dashboard</Link>
        </div>
      )}

      {error && (
        <div className="upgrade-alert upgrade-alert-error">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {isPro ? (
        <div className="upgrade-already-pro">
          <CheckCircle size={48} style={{ color: 'var(--sage)', margin: '0 auto 16px' }} />
          <h2>You're on Pro! 🎉</h2>
          <p>You have full access to all DoughPop Pro features.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
            <button
              className="btn btn-secondary"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              {loading ? <><Loader2 size={18} className="spinner" /></> : <><Settings size={18} /> Manage Subscription</>}
            </button>
          </div>
          <p className="upgrade-guarantee" style={{ marginTop: '16px' }}>
            Manage billing, payment methods, or cancel anytime
          </p>
        </div>
      ) : (
        <div className="upgrade-card">
          <div className="upgrade-card-badge">Most Popular</div>
          <div className="upgrade-price">
            <span className="upgrade-amount">$12.99</span>
            <span className="upgrade-period">/month</span>
          </div>
          <p className="upgrade-tagline">Billed monthly. Cancel anytime.</p>

          <ul className="upgrade-features">
            {pro.features.map((f, i) => (
              <li key={i}><Check size={17} style={{ color: 'var(--honey)', flexShrink: 0 }} /> <span>{f}</span></li>
            ))}
          </ul>

          <button className="btn btn-primary upgrade-btn" onClick={handleCheckout} disabled={loading}>
            {loading ? <><Loader2 size={18} className="spinner" /> Starting checkout…</> : <><Zap size={18} /> Upgrade to Pro</>}
          </button>

          <p className="upgrade-guarantee">🛡️ 30-day money-back guarantee · Secure checkout via Stripe</p>
        </div>
      )}
    </div>
  )
}
