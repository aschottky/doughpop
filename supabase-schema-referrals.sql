-- ============================================================================
-- MARKETING: Referral System
-- Run this in Supabase SQL Editor to add referral tracking
-- ============================================================================

-- REFERRALS (track referral relationships)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'converted', 'expired')),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_referrer_view" ON referrals FOR SELECT USING (referrer_id = auth.uid());

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "referrals_admin_all" ON referrals FOR ALL USING (is_admin_user());

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- REFERRAL REWARDS (track earned rewards)
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_days INTEGER NOT NULL DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_rewards_referrer_view" ON referral_rewards FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "referral_rewards_admin_all" ON referral_rewards FOR ALL USING (is_admin_user());

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id, status);
