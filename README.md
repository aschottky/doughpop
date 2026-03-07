# 🥐 DoughPop

**Your baking business, beautifully managed.**

DoughPop is a SaaS platform for home bakers — send professional quotes, create invoices, manage clients, and run your own public storefront.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Auth & DB | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Stripe Subscriptions |
| Checkout API | Google Cloud Functions (2nd gen) |
| Hosting | Cloudflare Pages |
| Icons | Lucide React |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Then run `supabase-schema-stripe.sql`
4. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Stripe & Subscriptions Setup

### Create Stripe product

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a product: **DoughPop Pro**
3. Add a recurring price: **$12.99/month**
4. Copy the **Price ID** (`price_...`)

### Deploy GCP Cloud Function

```bash
cd gcp-checkout
npm install
gcloud functions deploy createCheckoutSession \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --project YOUR_GCP_PROJECT_ID \
  --set-env-vars \
    STRIPE_SECRET_KEY=sk_live_...,\
    STRIPE_PRICE_ID=price_...,\
    SUPABASE_URL=https://your-project.supabase.co,\
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key,\
    SITE_URL=https://doughpop.app
```

Copy the function URL and add it to `.env`:
```
VITE_CHECKOUT_API_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/createCheckoutSession
```

---

## Email Templates

Upload the HTML templates in `email-templates/` to your Supabase project:
- **Settings > Auth > Email Templates**
- Confirm Signup → `confirm-signup.html`
- Reset Password → `reset-password.html`

---

## Deployment (Cloudflare Pages)

1. Push to GitHub
2. Connect repo to [Cloudflare Pages](https://pages.cloudflare.com)
3. Build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add all `VITE_*` environment variables in Cloudflare Pages settings

---

## Features

### For Home Bakers
- **Quote Builder** — Create itemized quotes with line items, discounts, and tax
- **Invoice Generator** — Convert quotes to invoices or create standalone
- **Client CRM** — Manage contacts, notes, tags, and order history
- **Product Catalog** — Build a catalog with pricing, allergens, and lead times
- **Public Storefront** — Share a branded store page with customers
- **Client Portal** — Magic-link portal for clients to view/accept quotes
- **Business Dashboard** — Revenue stats, pending quotes, active orders

### Subscription Tiers
| Feature | Starter (Free) | Pro ($12.99/mo) |
|---------|---------------|-----------------|
| Products | 10 | Unlimited |
| Clients | 5 | Unlimited |
| Quotes/mo | 10 | Unlimited |
| Invoices/mo | 10 | Unlimited |
| Client portal | ✗ | ✓ |
| Custom branding | ✗ | ✓ |
| Analytics | ✗ | ✓ |

---

## Project Structure

```
bakery/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login, signup, forgot password
│   │   ├── Dashboard/      # All baker dashboard pages
│   │   ├── Landing/        # Marketing landing page sections
│   │   ├── Portal/         # Client portal (magic link)
│   │   ├── Shared/         # Reusable components
│   │   └── Store/          # Public storefront
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── DataContext.jsx
│   │   └── SubscriptionContext.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   └── stripe.js
│   ├── App.jsx
│   └── main.jsx
├── gcp-checkout/           # GCP Cloud Function
├── email-templates/        # Supabase auth email templates
├── supabase-schema.sql     # Main database schema
├── supabase-schema-stripe.sql
└── .env.example
```

---

## Demo Mode

If Supabase is not configured (no `.env` file), DoughPop runs in demo mode:
- All dashboard features work with sample data
- Changes are saved to localStorage
- Auth shows a "Continue in Demo Mode" option

This is great for local development and testing before connecting a Supabase project.

---

Made with ❤️ for home bakers everywhere.
