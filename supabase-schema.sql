-- DoughPop Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  business_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  website TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT DEFAULT 'inactive',
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Acquisition / Marketing
  acquisition_source TEXT DEFAULT 'direct',
  acquisition_medium TEXT,
  acquisition_campaign TEXT,
  landing_page TEXT DEFAULT '/',
  referral_code TEXT,
  referred_by UUID REFERENCES profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup with acquisition tracking
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    email, 
    full_name,
    business_name,
    acquisition_source,
    acquisition_medium,
    acquisition_campaign,
    landing_page,
    referral_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'acquisition_source', 'direct'),
    NEW.raw_user_meta_data->>'acquisition_medium',
    NEW.raw_user_meta_data->>'acquisition_campaign',
    COALESCE(NEW.raw_user_meta_data->>'landing_page', '/'),
    NEW.raw_user_meta_data->>'referral_code'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Admin bypass using security definer function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin_user());


-- ─────────────────────────────────────────────
-- STORES (baker's storefront config)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#C8913A',
  -- Contact / Social
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  -- Settings
  accepts_orders BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT FALSE,
  pickup_available BOOLEAN DEFAULT TRUE,
  delivery_radius_miles INTEGER,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  advance_days_required INTEGER DEFAULT 3,
  payment_policy TEXT DEFAULT 'Full payment due at pickup/delivery.',
  cancellation_policy TEXT,
  allergen_notice TEXT DEFAULT 'Items may contain common allergens including nuts, dairy, wheat, and eggs.',
  custom_domain TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_baker_all" ON stores FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "stores_public_read" ON stores FOR SELECT USING (is_published = TRUE);


-- ─────────────────────────────────────────────
-- PRODUCT CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_baker_all" ON product_categories FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "categories_public_read" ON product_categories FOR SELECT USING (TRUE);


-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'each',
  image_url TEXT,
  images JSONB DEFAULT '[]',
  allergens TEXT[],
  lead_time_days INTEGER DEFAULT 2,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  serves TEXT,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_baker_all" ON products FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_available = TRUE);


-- ─────────────────────────────────────────────
-- CLIENTS (CRM)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  tags TEXT[],
  total_spent DECIMAL(10,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_baker_all" ON clients FOR ALL USING (auth.uid() = baker_id);


-- ─────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired','converted')),
  title TEXT,
  notes TEXT,
  internal_notes TEXT,
  -- Pricing
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('fixed','percent')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  -- Dates
  valid_until DATE,
  event_date DATE,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_baker_all" ON quotes FOR ALL USING (auth.uid() = baker_id);


-- ─────────────────────────────────────────────
-- QUOTE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_items_baker_all" ON quote_items FOR ALL USING (auth.uid() = baker_id);


-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  title TEXT,
  notes TEXT,
  payment_terms TEXT DEFAULT 'Due on receipt',
  -- Pricing (same as quote)
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('fixed','percent')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  -- Dates
  due_date DATE,
  event_date DATE,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_baker_all" ON invoices FOR ALL USING (auth.uid() = baker_id);


-- ─────────────────────────────────────────────
-- INVOICE ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_items_baker_all" ON invoice_items FOR ALL USING (auth.uid() = baker_id);


-- ─────────────────────────────────────────────
-- ORDERS (from public storefront)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','ready','delivered','cancelled')),
  -- Customer info (for non-client orders)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  -- Order details
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  special_instructions TEXT,
  delivery_type TEXT DEFAULT 'pickup' CHECK (delivery_type IN ('pickup','delivery')),
  delivery_address TEXT,
  pickup_date DATE,
  event_date DATE,
  -- Portal access
  portal_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_baker_all" ON orders FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "orders_portal_read" ON orders FOR SELECT USING (TRUE);


-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  customization_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_baker_all" ON order_items FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "order_items_portal_read" ON order_items FOR SELECT USING (TRUE);


-- ─────────────────────────────────────────────
-- CLIENT TOKENS (magic link for client portal)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_tokens_baker_all" ON client_tokens FOR ALL USING (auth.uid() = baker_id);
CREATE POLICY "client_tokens_public_read" ON client_tokens FOR SELECT USING (TRUE);


-- ─────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','stores','products','clients','quotes','quote_items','invoices','invoice_items','orders']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END;
$$;

-- Generate sequential quote/invoice numbers per baker
CREATE OR REPLACE FUNCTION next_quote_number(baker UUID)
RETURNS TEXT AS $$
DECLARE
  n INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO n FROM quotes WHERE baker_id = baker;
  RETURN 'Q-' || LPAD(n::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION next_invoice_number(baker UUID)
RETURNS TEXT AS $$
DECLARE
  n INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO n FROM invoices WHERE baker_id = baker;
  RETURN 'INV-' || LPAD(n::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION next_order_number(baker UUID)
RETURNS TEXT AS $$
DECLARE
  n INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO n FROM orders WHERE baker_id = baker;
  RETURN 'ORD-' || LPAD(n::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default product categories per baker (call after profile created)
CREATE OR REPLACE FUNCTION seed_default_categories(baker UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO product_categories (baker_id, name, sort_order) VALUES
    (baker, 'Cakes', 1),
    (baker, 'Cupcakes', 2),
    (baker, 'Cookies', 3),
    (baker, 'Pies', 4),
    (baker, 'Bread', 5),
    (baker, 'Pastries', 6),
    (baker, 'Custom Orders', 7)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- PHASE 1 FEATURES: Fees, Discounts, Archiving, Invoice Notes
-- ============================================================================

-- DISCOUNT PRESETS (saved discount templates per baker)
CREATE TABLE IF NOT EXISTS discount_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed','percent')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discount_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discount_presets_baker_all" ON discount_presets FOR ALL USING (auth.uid() = baker_id);

-- Add fees JSONB and is_archived to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS fees JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add fees JSONB, is_archived, and internal_notes to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fees JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add is_archived to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_archived ON quotes(baker_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_invoices_archived ON invoices(baker_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(baker_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_quotes_status_date ON quotes(baker_id, status, valid_until);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(baker_id, status, due_date);

-- Trigger to auto-expire old quotes (can be called via cron or on load)
CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE quotes
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'sent'
    AND valid_until < CURRENT_DATE - INTERVAL '14 days'
    AND is_archived = FALSE;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to discount_presets
DROP TRIGGER IF EXISTS set_updated_at ON discount_presets;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON discount_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- PHASE 2 FEATURES: Tasks and Calendar
-- ============================================================================

-- TASKS (for weekly task lists and general to-dos)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('baking', 'shopping', 'prepping', 'fondant', 'fillings', 'frosting', 'dough', 'decorating', 'delivery', 'other')),
  description TEXT NOT NULL,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_baker_all" ON tasks FOR ALL USING (auth.uid() = baker_id);

-- Index for calendar queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(baker_id, due_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(order_id);

-- Apply updated_at trigger to tasks
DROP TRIGGER IF EXISTS set_updated_at ON tasks;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- PHASE 3 FEATURES: Payments, Email Log, Time Tracking
-- ============================================================================

-- PAYMENTS (track invoice payments)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('stripe', 'venmo', 'paypal', 'cash', 'check', 'other')),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_baker_all" ON payments FOR ALL USING (auth.uid() = baker_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_baker ON payments(baker_id, paid_at);

-- EMAIL LOG (track sent emails)
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('receipt', 'reminder', 'confirmation', 'birthday', 'custom')),
  subject TEXT NOT NULL,
  related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_log_baker_all" ON email_log FOR ALL USING (auth.uid() = baker_id);

CREATE INDEX IF NOT EXISTS idx_email_log_baker ON email_log(baker_id, sent_at);

-- EMAIL TEMPLATES (per baker)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('receipt', 'reminder', 'confirmation', 'birthday', 'custom')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_baker_all" ON email_templates FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON email_templates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add hourly_rate to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0;

-- Add hours_worked to orders and invoices
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(6,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(6,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0;

-- Add payment method configuration to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS venmo_username TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS paypal_email TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accept_cash BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS accept_check BOOLEAN DEFAULT TRUE;


-- ============================================================================
-- PHASE 4 FEATURES: Inventory, Recipes, Bundles
-- ============================================================================

-- INGREDIENTS (inventory items)
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL, -- e.g., 'lbs', 'cups', 'each', 'oz'
  unit_cost DECIMAL(10,4),
  stock_quantity DECIMAL(10,2) DEFAULT 0,
  reorder_point DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_baker_all" ON ingredients FOR ALL USING (auth.uid() = baker_id);

CREATE INDEX IF NOT EXISTS idx_ingredients_baker ON ingredients(baker_id, category);
CREATE INDEX IF NOT EXISTS idx_ingredients_low_stock ON ingredients(baker_id, stock_quantity, reorder_point) WHERE stock_quantity <= reorder_point;

DROP TRIGGER IF EXISTS set_updated_at ON ingredients;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RECIPES (link products to ingredients)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT,
  instructions TEXT,
  yield_amount INTEGER DEFAULT 1,
  yield_unit TEXT DEFAULT 'each',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_baker_all" ON recipes FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON recipes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RECIPE INGREDIENTS (link recipes to ingredients with quantities)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_ingredients_baker_all" ON recipe_ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND baker_id = auth.uid())
);

-- BUNDLES (material kits for specific products/orders)
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bundles_baker_all" ON bundles FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON bundles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- BUNDLE ITEMS (items in a bundle)
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bundle_items_baker_all" ON bundle_items FOR ALL USING (
  EXISTS (SELECT 1 FROM bundles WHERE id = bundle_id AND baker_id = auth.uid())
);

-- PRODUCT BUNDLE LINK (assign bundles to products)
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_bundles_baker_all" ON product_bundles FOR ALL USING (auth.uid() = baker_id);

-- INVENTORY LOG (track inventory changes)
CREATE TABLE IF NOT EXISTS inventory_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_amount DECIMAL(10,2) NOT NULL, -- positive for stock in, negative for usage
  reason TEXT, -- 'order', 'restock', 'adjustment'
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_log_baker_all" ON inventory_log FOR ALL USING (auth.uid() = baker_id);


-- ============================================================================
-- PHASE 5 FEATURES: Client Experience (Inquiries, Templates, Birthday Reminders)
-- ============================================================================

-- TEMPLATES (care instructions, serving guides, etc.)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('care', 'serving', 'storage', 'custom')),
  category TEXT, -- 'cake_care', 'cookie_care', 'storage', etc.
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_baker_all" ON templates FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON templates;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- INQUIRIES (customer inquiries from storefront)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  event_date DATE,
  event_type TEXT,
  guest_count INTEGER,
  budget DECIMAL(10,2),
  product_interests TEXT[],
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'responded', 'converted', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiries_baker_all" ON inquiries FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON inquiries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_inquiries_baker ON inquiries(baker_id, status, created_at);

-- Add important_dates to clients for birthday reminders
ALTER TABLE clients ADD COLUMN IF NOT EXISTS important_dates JSONB DEFAULT '[]';


-- ============================================================================
-- PHASE 6 FEATURES: Expense Tracking
-- ============================================================================

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ingredients', 'supplies', 'packaging', 'marketing', 'delivery', 'equipment', 'other')),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_baker_all" ON expenses FOR ALL USING (auth.uid() = baker_id);

DROP TRIGGER IF EXISTS set_updated_at ON expenses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_expenses_baker ON expenses(baker_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(baker_id, category);

-- MILEAGE LOGS
CREATE TABLE IF NOT EXISTS mileage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL,
  miles DECIMAL(6,1) NOT NULL,
  from_address TEXT,
  to_address TEXT,
  purpose TEXT,
  rate DECIMAL(4,3) DEFAULT 0.67, -- IRS rate per mile (2024)
  amount DECIMAL(8,2), -- calculated: miles * rate
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mileage_logs_baker_all" ON mileage_logs FOR ALL USING (auth.uid() = baker_id);

CREATE INDEX IF NOT EXISTS idx_mileage_baker ON mileage_logs(baker_id, trip_date);


-- ============================================================================
-- ADMIN FEATURES: Refunds and User Management
-- ============================================================================

-- REFUNDS (track refunds issued by admin)
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  processed_by UUID NOT NULL REFERENCES profiles(id),
  stripe_refund_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds_admin_all" ON refunds FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "refunds_baker_view" ON refunds FOR SELECT USING (baker_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_baker ON refunds(baker_id, created_at);

-- Add admin_notes to profiles for internal admin tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add default tax / pricing config to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_apply_all BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_pricing_method TEXT DEFAULT 'set_price';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_margin_percent DECIMAL(5,2) DEFAULT 30;

-- Per-baker curated vendor list for ingredients (JSON array of strings). NULL = use app defaults only until customized.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ingredient_vendors JSONB DEFAULT NULL;


-- ============================================================================
-- CONFIGURABLE DROPDOWNS: Event Types, Flavors, Sizes
-- ============================================================================

CREATE TABLE IF NOT EXISTS baker_event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE baker_event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baker_event_types_owner" ON baker_event_types FOR ALL USING (auth.uid() = baker_id);
CREATE INDEX IF NOT EXISTS idx_event_types_baker ON baker_event_types(baker_id, sort_order);

CREATE TABLE IF NOT EXISTS baker_flavors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('batter', 'filling', 'frosting')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE baker_flavors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baker_flavors_owner" ON baker_flavors FOR ALL USING (auth.uid() = baker_id);
CREATE INDEX IF NOT EXISTS idx_flavors_baker ON baker_flavors(baker_id, category, sort_order);

CREATE TABLE IF NOT EXISTS baker_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_type TEXT DEFAULT 'cake',
  servings INTEGER DEFAULT 0,
  batter_weight_grams INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE baker_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baker_sizes_owner" ON baker_sizes FOR ALL USING (auth.uid() = baker_id);
CREATE INDEX IF NOT EXISTS idx_sizes_baker ON baker_sizes(baker_id, product_type, sort_order);

-- Seed function for default event types
CREATE OR REPLACE FUNCTION seed_default_baker_options(baker UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO baker_event_types (baker_id, name, sort_order, is_default) VALUES
    (baker, 'Birthday', 0, true), (baker, 'Baby Shower', 1, true),
    (baker, 'Gender Reveal', 2, true), (baker, 'Wedding', 3, true),
    (baker, 'Anniversary', 4, true), (baker, 'Graduation', 5, true),
    (baker, 'Retirement', 6, true), (baker, 'Bridal', 7, true),
    (baker, 'Corporate', 8, true), (baker, 'Holiday', 9, true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add dropdown foreign keys to quote_items and order_items
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES baker_event_types(id) ON DELETE SET NULL;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS flavor_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS filling_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS frosting_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS size_id UUID REFERENCES baker_sizes(id) ON DELETE SET NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES baker_event_types(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS flavor_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS filling_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS frosting_id UUID REFERENCES baker_flavors(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_id UUID REFERENCES baker_sizes(id) ON DELETE SET NULL;

-- Add event_type_id to quotes (for quote-level event type)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES baker_event_types(id) ON DELETE SET NULL;


-- ============================================================================
-- ENHANCED INGREDIENTS: Multi-store pricing + material types
-- ============================================================================

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS ingredient_type TEXT DEFAULT 'ingredient' CHECK (ingredient_type IN ('ingredient', 'packaging', 'decorating', 'labeling'));
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS avg_price_walmart DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS avg_price_costco DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS avg_price_sams DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_size DECIMAL(10,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_unit TEXT;


-- ============================================================================
-- PRICING RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS baker_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('set_price', 'per_serving', 'cost_plus_margin', 'calculated_cost')),
  margin_percent DECIMAL(5,2) DEFAULT 0,
  hourly_rate DECIMAL(8,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE baker_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baker_pricing_rules_owner" ON baker_pricing_rules FOR ALL USING (auth.uid() = baker_id);


-- ============================================================================
-- CONTRACTS / TERMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS baker_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content_html TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE baker_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baker_contracts_owner" ON baker_contracts FOR ALL USING (auth.uid() = baker_id);

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES baker_contracts(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS terms_accepted_ip TEXT;
