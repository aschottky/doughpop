// Marketing utilities for DoughPop
// Handles UTM tracking, referral codes, and acquisition attribution

const UTM_STORAGE_KEY = 'doughpop_attribution'
const REFERRAL_STORAGE_KEY = 'doughpop_referral'

/**
 * Capture UTM parameters from URL and store in localStorage
 * Should be called on app initialization (e.g., in App.jsx or main.jsx)
 */
export function captureAttribution() {
  const urlParams = new URLSearchParams(window.location.search)
  const utmData = {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign'),
    term: urlParams.get('utm_term'),
    content: urlParams.get('utm_content'),
    referrer: document.referrer || null,
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString()
  }

  // Only store if we have at least one UTM param or it's a new session
  const hasUtm = utmData.source || utmData.medium || utmData.campaign
  const existing = getAttribution()

  // Update if new UTM params exist, or if no existing data
  if (hasUtm || !existing.source) {
    const dataToStore = hasUtm ? utmData : { ...utmData, source: existing.source || 'direct' }
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(dataToStore))
  }

  // Also check for referral code
  const refCode = urlParams.get('ref')
  if (refCode) {
    localStorage.setItem(REFERRAL_STORAGE_KEY, refCode)
    utmData.referral = refCode
  }

  return utmData
}

/**
 * Get stored attribution data
 */
export function getAttribution() {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Get referral code if present
 */
export function getReferralCode() {
  return localStorage.getItem(REFERRAL_STORAGE_KEY)
}

/**
 * Clear attribution data (call after successful signup)
 */
export function clearAttribution() {
  localStorage.removeItem(UTM_STORAGE_KEY)
  localStorage.removeItem(REFERRAL_STORAGE_KEY)
}

/**
 * Build signup URL with UTM params for marketing campaigns
 */
export function buildSignupUrl(utmParams = {}) {
  const base = '/auth?mode=signup'
  const params = new URLSearchParams()
  
  if (utmParams.source) params.set('utm_source', utmParams.source)
  if (utmParams.medium) params.set('utm_medium', utmParams.medium)
  if (utmParams.campaign) params.set('utm_campaign', utmParams.campaign)
  
  const queryString = params.toString()
  return queryString ? `${base}&${queryString}` : base
}

/**
 * Predefined campaign URLs for common use cases
 */
export const CampaignUrls = {
  // Social media
  facebook: buildSignupUrl({ source: 'facebook', medium: 'social', campaign: 'organic' }),
  instagram: buildSignupUrl({ source: 'instagram', medium: 'social', campaign: 'bio_link' }),
  pinterest: buildSignupUrl({ source: 'pinterest', medium: 'social', campaign: 'organic' }),
  tiktok: buildSignupUrl({ source: 'tiktok', medium: 'social', campaign: 'organic' }),
  
  // Content
  blog: buildSignupUrl({ source: 'blog', medium: 'content', campaign: 'seo' }),
  
  // Partners
  influencer: (name) => buildSignupUrl({ source: name, medium: 'influencer', campaign: 'partnership' }),
  
  // Referral
  referral: (code) => `/auth?mode=signup&ref=${code}`,
}

/**
 * Track event for analytics (placeholder for future analytics integration)
 */
export function trackEvent(eventName, properties = {}) {
  // Placeholder for analytics tracking
  // Could integrate with: PostHog, Mixpanel, Amplitude, or Google Analytics
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties)
  }
}

/**
 * Key events to track
 */
export const Events = {
  LANDING_PAGE_VIEW: 'landing_page_view',
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  TRIAL_START: 'trial_start',
  FIRST_QUOTE_CREATED: 'first_quote_created',
  FIRST_INVOICE_SENT: 'first_invoice_sent',
  UPGRADE_TO_PRO: 'upgrade_to_pro',
  REFERRAL_INVITE_SENT: 'referral_invite_sent',
}
