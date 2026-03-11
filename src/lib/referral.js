// Referral System for DoughPop
// Handles referral code generation, tracking, and rewards

import { supabase } from './supabase'

const REFERRAL_REWARD_DAYS = 30 // Days of Pro given for successful referral
const REFERRAL_DISCOUNT_PERCENT = 20 // 20% off for referred users

/**
 * Generate a unique referral code for a user
 * Format: firstname + random 4 chars (e.g., "sarah7x2p")
 */
export function generateReferralCode(fullName) {
  const namePart = fullName?.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'baker'
  const randomPart = Math.random().toString(36).substring(2, 6)
  return `${namePart}${randomPart}`
}

/**
 * Get or create referral code for current user
 */
export async function getOrCreateReferralCode(userId, fullName) {
  // First check if user already has a code
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError

  // If they already have a code, return it
  if (profile?.referral_code) {
    return profile.referral_code
  }

  // Generate new code
  const code = generateReferralCode(fullName)

  // Check if code is unique
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single()

  // If not unique, generate another
  if (existing) {
    return getOrCreateReferralCode(userId, fullName + Math.random().toString(36).slice(2, 4))
  }

  // Save the code
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ referral_code: code })
    .eq('id', userId)

  if (updateError) throw updateError

  return code
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId) {
  // Get their referral code
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (error || !profile?.referral_code) {
    return { code: null, signups: 0, paid: 0, rewardsEarned: 0 }
  }

  // Count users who signed up with their code
  const { count: signups, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', userId)

  if (countError) throw countError

  // Count how many upgraded to Pro
  const { count: paid, error: paidError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', userId)
    .eq('subscription_tier', 'pro')

  if (paidError) throw paidError

  return {
    code: profile.referral_code,
    signups: signups || 0,
    paid: paid || 0,
    rewardsEarned: (paid || 0) * REFERRAL_REWARD_DAYS,
    rewardDays: REFERRAL_REWARD_DAYS,
    shareUrl: `${window.location.origin}/auth?mode=signup&ref=${profile.referral_code}`
  }
}

/**
 * Track a referral when someone signs up
 * This is called during the signup process
 */
export async function trackReferral(referralCode, newUserId) {
  if (!referralCode) return { tracked: false }

  // Find the referrer
  const { data: referrer, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .single()

  if (error || !referrer) {
    return { tracked: false, reason: 'invalid_code' }
  }

  // Don't allow self-referrals
  if (referrer.id === newUserId) {
    return { tracked: false, reason: 'self_referral' }
  }

  // Update the new user's profile with referrer
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      referred_by: referrer.id,
      acquisition_source: 'referral'
    })
    .eq('id', newUserId)

  if (updateError) throw updateError

  // Log the referral
  const { error: logError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      referral_code: referralCode,
      status: 'signed_up'
    })

  // Don't fail if logging fails
  if (logError && import.meta.env.DEV) {
    console.warn('Failed to log referral:', logError)
  }

  return { tracked: true, referrerId: referrer.id }
}

/**
 * Process reward when a referred user upgrades to Pro
 */
export async function processReferralReward(referredUserId) {
  // Get the referrer
  const { data: referred, error } = await supabase
    .from('profiles')
    .select('referred_by, subscription_tier')
    .eq('id', referredUserId)
    .single()

  if (error || !referred?.referred_by) return { rewarded: false }

  // Only reward if the referred user upgrades to Pro
  if (referred.subscription_tier !== 'pro') {
    return { rewarded: false, reason: 'not_pro' }
  }

  const referrerId = referred.referred_by

  // Update referral status
  await supabase
    .from('referrals')
    .update({ status: 'converted', converted_at: new Date().toISOString() })
    .eq('referred_id', referredUserId)

  // Extend referrer's Pro subscription (or give credit)
  // This would integrate with Stripe in production
  // For now, we log it
  const { error: creditError } = await supabase
    .from('referral_rewards')
    .insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      reward_days: REFERRAL_REWARD_DAYS,
      status: 'pending'
    })

  if (creditError && import.meta.env.DEV) {
    console.warn('Failed to log referral reward:', creditError)
  }

  return {
    rewarded: true,
    referrerId,
    rewardDays: REFERRAL_REWARD_DAYS
  }
}

/**
 * Get referral message templates for sharing
 */
export function getReferralMessages(referralCode, userName) {
  const shareUrl = `${window.location.origin}/auth?mode=signup&ref=${referralCode}`

  return {
    twitter: `I use @doughpop to send quotes and invoices for my home bakery. Game changer! 🎂

Get 20% off your first year with my link:
${shareUrl}`,

    instagram: `I have been using DoughPop to manage my custom cake orders and it is a total game changer! 🧁

Professional quotes, invoices, and a client portal — all in one place.

Want to try it? Use my link for 20% off: ${shareUrl}`,

    facebook: `Hey fellow bakers! 👋

I have been using DoughPop to manage my home bakery — quotes, invoices, client management, everything in one place. It's saved me so much time!

If you want to check it out, use my referral link for 20% off your first year: ${shareUrl}`,

    email: `Hi!

I wanted to share a tool that has been a total game-changer for my home bakery business.

DoughPop lets me send professional quotes, create invoices, manage clients, and even run a storefront — all in one place. No more spreadsheets or chasing payments.

If you are interested, here is a referral link that gets you 20% off your first year: ${shareUrl}

Let me know if you have any questions!

${userName}`,

    sms: `Hey! I've been using DoughPop for my bakery business - it's amazing for quotes and invoices. Want 20% off? Use my link: ${shareUrl}`
  }
}

// Referral events for analytics
export const ReferralEvents = {
  REFERRAL_LINK_SHARED: 'referral_link_shared',
  REFERRAL_SIGNUP: 'referral_signup',
  REFERRAL_CONVERTED: 'referral_converted',
  REWARD_EARNED: 'referral_reward_earned'
}
