import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const SubscriptionContext = createContext()

export const TIERS = {
  FREE: 'free',
  PRO: 'pro'
}

export const TIER_LIMITS = {
  [TIERS.FREE]: {
    products: 10,
    clients: 5,
    quotesPerMonth: 10,
    invoicesPerMonth: 10,
    hasClientPortal: false,
    hasCustomBranding: false,
    hasPdfExport: false,
    hasAnalytics: false,
    hasBranding: true // DoughPop branding shown
  },
  [TIERS.PRO]: {
    products: Infinity,
    clients: Infinity,
    quotesPerMonth: Infinity,
    invoicesPerMonth: Infinity,
    hasClientPortal: true,
    hasCustomBranding: true,
    hasPdfExport: true,
    hasAnalytics: true,
    hasBranding: false
  }
}

export const TIER_INFO = {
  [TIERS.FREE]: {
    name: 'Starter',
    price: '$0',
    priceNote: 'Free forever',
    features: [
      'Up to 10 products',
      'Up to 5 clients',
      '10 quotes per month',
      '10 invoices per month',
      'Public storefront',
      'Basic store customization',
      'DoughPop branding'
    ]
  },
  [TIERS.PRO]: {
    name: 'Pro',
    price: '$12.99',
    priceNote: 'per month',
    features: [
      'Unlimited products & clients',
      'Unlimited quotes & invoices',
      'Client portal with magic links',
      'Custom store branding',
      'PDF export for quotes/invoices',
      'Business analytics dashboard',
      'Priority support',
      'Remove DoughPop branding'
    ]
  }
}

export function SubscriptionProvider({ children }) {
  const { user, isConfigured: authConfigured } = useAuth()
  const isSupabaseReady = isSupabaseConfigured() && authConfigured
  const [tier, setTier] = useState(TIERS.FREE)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSupabaseReady && user) {
      loadFromSupabase()
    } else {
      loadFromLocalStorage()
    }
  }, [user, isSupabaseReady])

  const loadFromSupabase = async () => {
    setLoading(true)
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_end_date')
        .eq('id', user.id)
        .single()

      if (error) { loadFromLocalStorage(); return }

      if (profile.subscription_tier === 'pro') {
        const isActive = profile.subscription_status === 'active' || profile.subscription_status === 'trialing'
        if (profile.subscription_end_date) {
          const expired = new Date(profile.subscription_end_date) < new Date()
          setTier((!expired || isActive) ? TIERS.PRO : TIERS.FREE)
        } else {
          setTier(isActive ? TIERS.PRO : TIERS.FREE)
        }
      } else {
        setTier(TIERS.FREE)
      }
    } catch {
      loadFromLocalStorage()
    } finally {
      setLoading(false)
      setIsLoaded(true)
    }
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('doughpop_tier')
    if (saved && Object.values(TIERS).includes(saved)) setTier(saved)
    setLoading(false)
    setIsLoaded(true)
  }

  useEffect(() => {
    if (isLoaded) localStorage.setItem('doughpop_tier', tier)
  }, [tier, isLoaded])

  const refreshSubscription = async () => {
    if (isSupabaseReady && user) await loadFromSupabase()
  }

  const isPro = tier === TIERS.PRO
  const limits = TIER_LIMITS[tier]
  const info = TIER_INFO[tier]

  const canAddProduct = (currentCount) => isPro || currentCount < TIER_LIMITS[TIERS.FREE].products
  const canAddClient = (currentCount) => isPro || currentCount < TIER_LIMITS[TIERS.FREE].clients
  const canAddQuote = (monthlyCount) => isPro || monthlyCount < TIER_LIMITS[TIERS.FREE].quotesPerMonth
  const canAddInvoice = (monthlyCount) => isPro || monthlyCount < TIER_LIMITS[TIERS.FREE].invoicesPerMonth

  const value = {
    tier,
    isPro,
    limits,
    info,
    isLoaded,
    loading,
    refreshSubscription,
    canAddProduct,
    canAddClient,
    canAddQuote,
    canAddInvoice,
    TIERS,
    TIER_INFO,
    TIER_LIMITS
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider')
  return context
}
