/**
 * Google Cloud Function (2nd gen): DoughPop API
 * - Create Stripe Checkout Session for Pro subscription
 * - Verify completed checkout & activate subscription
 * - Admin: list users, billing history, update subscription
 *
 * Deploy with:
 *   cd gcp-checkout && npm install
 *   gcloud functions deploy createCheckoutSession \
 *     --gen2 --runtime nodejs20 --trigger-http --allow-unauthenticated \
 *     --region us-central1 --project YOUR_GCP_PROJECT_ID \
 *     --set-env-vars STRIPE_SECRET_KEY=...,STRIPE_PRICE_ID=...,SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,SITE_URL=https://doughpop.app
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function setCors(res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v))
}

async function verifyJWT(req, body, supabaseUrl) {
  let token = null
  const authHeader = req.headers?.authorization || req.headers?.Authorization
  if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7).trim()
  if (!token && body?.access_token) token = String(body.access_token).trim()
  if (!token) throw Object.assign(new Error('No authorization token provided.'), { status: 401 })

  const JWKS = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  let payload
  try {
    const { payload: p } = await jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    })
    payload = p
  } catch {
    throw Object.assign(new Error('Session expired or invalid. Please sign out and sign in again.'), { status: 401 })
  }
  if (!payload.sub) throw Object.assign(new Error('Invalid token: missing user id.'), { status: 401 })
  return {
    userId: payload.sub,
    email: String(payload.email || payload.user_metadata?.email || ''),
    payload,
  }
}

async function requireAdmin(userId, supabase) {
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
  if (!profile?.is_admin) throw Object.assign(new Error('Forbidden: admin access required.'), { status: 403 })
}

export async function createCheckoutSession(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') { res.status(204).send(''); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  const sendError = (message, status = 400) => { setCors(res); res.status(status).json({ error: message }) }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}') } catch { body = {} } }
  body = body || {}

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.SITE_URL || 'https://doughpop.app'

  if (!supabaseUrl || !supabaseServiceKey) { sendError('Server configuration error', 500); return }

  // ── Create Stripe Customer Portal Session ──────────────────────────────────
  if (body.action === 'portal') {
    if (!stripeSecretKey) { sendError('Stripe not configured', 500); return }
    try {
      const { userId } = await verifyJWT(req, body, supabaseUrl)
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: profile } = await supabase.from('profiles').select('stripe_customer_id, email').eq('id', userId).maybeSingle()
      if (!profile?.stripe_customer_id) {
        sendError('No active subscription found. Please subscribe first.', 400); return
      }

      const stripe = new Stripe(stripeSecretKey)
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${siteUrl}/dashboard/settings`,
      })

      setCors(res); res.status(200).json({ url: session.url }); return
    } catch (err) {
      sendError(err?.message || 'Failed to create portal session', err?.status || 500); return
    }
  }

  // ── Verify completed checkout session ──────────────────────────────────────
  if (body.action === 'verify') {
    if (!stripeSecretKey) { sendError('Server configuration error', 500); return }
    const { session_id } = body
    if (!session_id) { sendError('Missing session_id', 400); return }
    try {
      const stripe = new Stripe(stripeSecretKey)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      if (session.payment_status !== 'paid' && session.status !== 'complete') {
        sendError('Payment not completed', 402); return
      }
      const userId = session.metadata?.supabase_user_id
      if (!userId) { sendError('Session missing user metadata', 400); return }

      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      let subscriptionEndDate = null
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        subscriptionEndDate = new Date(sub.current_period_end * 1000).toISOString()
      }
      const { error } = await supabase.from('profiles').update({
        subscription_tier: 'pro',
        subscription_status: 'active',
        stripe_subscription_id: session.subscription || null,
        subscription_end_date: subscriptionEndDate,
      }).eq('id', userId)
      if (error) { sendError('Failed to activate subscription.', 500); return }
      setCors(res); res.status(200).json({ success: true, tier: 'pro' }); return
    } catch (err) {
      sendError(err?.message || 'Verification failed', err?.status || 500); return
    }
  }

  // ── Admin: list all users ───────────────────────────────────────────────────
  if (body.action === 'admin-list-users') {
    try {
      const { userId } = await verifyJWT(req, body, supabaseUrl)
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await requireAdmin(userId, supabase)
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const authMap = {}
      authData?.users?.forEach(u => { authMap[u.id] = u })
      const users = (profiles || []).map(p => ({
        ...p,
        auth_email: authMap[p.id]?.email || p.email || '',
        email_confirmed: !!authMap[p.id]?.email_confirmed_at,
        last_sign_in: authMap[p.id]?.last_sign_in_at || null,
      }))
      setCors(res); res.status(200).json({ users }); return
    } catch (err) {
      sendError(err?.message || 'Failed to list users', err?.status || 500); return
    }
  }

  // ── Create Stripe Checkout Session ─────────────────────────────────────────
  try {
    const stripePriceId = getEnv('STRIPE_PRICE_ID')
    const siteUrl = process.env.SITE_URL || 'https://doughpop.app'
    if (!stripeSecretKey) throw new Error('Missing Stripe configuration')

    const { userId, email } = await verifyJWT(req, body, supabaseUrl)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let { data: profile } = await supabase.from('profiles').select('stripe_customer_id, email').eq('id', userId).maybeSingle()
    if (!profile) {
      await supabase.from('profiles').insert({ id: userId, email: email || '' })
      const { data: newProfile } = await supabase.from('profiles').select('stripe_customer_id, email').eq('id', userId).single()
      profile = newProfile
    }

    const stripe = new Stripe(stripeSecretKey)
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || email || '',
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      payment_method_types: ['card'],
      success_url: `${siteUrl}/dashboard/upgrade?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard/upgrade?canceled=true`,
      metadata: { supabase_user_id: userId },
    })

    setCors(res); res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (err) {
    const message = err?.message || 'Unknown error'
    const status = err?.status || 400
    sendError(message, status)
  }
}
