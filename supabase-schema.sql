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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);


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
