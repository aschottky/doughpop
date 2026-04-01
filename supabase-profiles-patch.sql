-- DoughPop: ensure profiles columns used by Settings + app exist.
-- Run the whole file in Supabase → SQL Editor, then Settings → API → Restart (optional, if errors persist).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_apply_all BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_pricing_method TEXT DEFAULT 'set_price';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_margin_percent DECIMAL(5,2) DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ingredient_vendors JSONB DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
