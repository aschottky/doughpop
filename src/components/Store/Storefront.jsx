import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Phone, Mail, Instagram, Facebook, ShoppingBag, Clock, Package, Croissant } from 'lucide-react'
import './Storefront.css'

const DEMO_STORE = {
  store_name: "Jane's Sweet Creations",
  tagline: "Baked with love, every single time",
  description: "Hi! I'm Jane, a home baker based in Austin, TX. I specialize in custom cakes, decorated cookies, and seasonal pastries for all of life's sweetest moments.",
  city: 'Austin', state: 'TX', phone: '(512) 555-0101', email: 'jane@sweeetcreations.com',
  instagram_url: 'https://instagram.com', primary_color: '#C8913A',
  accepts_orders: true, pickup_available: true, delivery_available: true, advance_days_required: 3,
  payment_policy: 'Full payment due at pickup/delivery.',
  allergen_notice: 'Items may contain common allergens including nuts, dairy, wheat, and eggs.',
  is_published: true
}

const DEMO_PRODUCTS = [
  { id: '1', name: '6" Custom Celebration Cake', description: 'Fully customizable. Perfect for birthdays, anniversaries, and celebrations. Serves 8-10.', price: 85, unit: 'each', is_featured: true, product_categories: { name: 'Cakes' }, lead_time_days: 3 },
  { id: '2', name: '8" Custom Cake', description: 'Our most popular size. Serves 12-16 guests.', price: 120, unit: 'each', is_featured: false, product_categories: { name: 'Cakes' }, lead_time_days: 3 },
  { id: '3', name: 'Dozen Decorated Sugar Cookies', description: 'Custom cut-out sugar cookies with royal icing in any theme.', price: 42, unit: 'dozen', is_featured: true, product_categories: { name: 'Cookies' }, lead_time_days: 2 },
  { id: '4', name: 'Classic Sourdough Loaf', description: 'Long-fermented wild yeast sourdough with a perfect crumb.', price: 14, unit: 'loaf', is_featured: false, product_categories: { name: 'Bread' }, lead_time_days: 1 },
]

export default function Storefront() {
  const { slug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [orderForm, setOrderForm] = useState({ name: '', email: '', phone: '', notes: '', delivery_type: 'pickup', event_date: '' })
  const [orderItems, setOrderItems] = useState([])
  const [showOrder, setShowOrder] = useState(false)

  useEffect(() => {
    loadStore()
  }, [slug])

  const loadStore = async () => {
    try {
      const { data: storeData } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if (!storeData) { setLoading(false); return }
      setStore(storeData)
      const { data: productsData } = await supabase.from('products').select('*, product_categories(name)').eq('baker_id', storeData.baker_id).eq('is_available', true).order('sort_order')
      setProducts(productsData || [])
    } catch {
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const allCategories = ['All', ...new Set(products.map(p => p.product_categories?.name || 'Other').filter(Boolean))]
  const filtered = activeCategory === 'All' ? products : products.filter(p => (p.product_categories?.name || 'Other') === activeCategory)
  const featured = products.filter(p => p.is_featured)

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  if (loading) return <div className="storefront-loading"><div className="loading-spinner" /></div>
  if (!store) return (
    <div className="storefront-not-found">
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
      <h2>Bakery not found</h2>
      <p>This store may not exist or isn't published yet.</p>
      <Link to="/" className="btn btn-primary">Back to DoughPop</Link>
    </div>
  )

  return (
    <div className="storefront" style={{ '--store-color': store.primary_color }}>
      {!store.is_published && (
        <div style={{ background: '#FEF7EC', borderBottom: '2px solid #C8913A', padding: '10px 20px', textAlign: 'center', fontSize: '0.875rem', color: '#A87530' }}>
          <strong>Preview Mode</strong> — Your store is not yet published. Only you can see this page. Enable "Store is Live" in your Store Settings to make it public.
        </div>
      )}
      {/* Header */}
      <header className="storefront-header">
        <div className="storefront-header-top">
          <Link to="/" className="storefront-powered-by">
            <Croissant size={14} />
            Powered by DoughPop
          </Link>
        </div>
        <div className="storefront-banner">
          <div className="storefront-banner-content">
            <div className="storefront-logo-circle">
              {store.store_name[0]}
            </div>
            <h1>{store.store_name}</h1>
            {store.tagline && <p className="storefront-tagline">{store.tagline}</p>}
            <div className="storefront-location">
              {store.city && store.state && <span><MapPin size={14} /> {store.city}, {store.state}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="container storefront-body">
        <div className="storefront-main">
          {/* About */}
          {store.description && (
            <div className="storefront-about card card-padding">
              <h2>About</h2>
              <p>{store.description}</p>
              <div className="storefront-contact">
                {store.phone && <a href={`tel:${store.phone}`} className="storefront-contact-link"><Phone size={15} /> {store.phone}</a>}
                {store.email && <a href={`mailto:${store.email}`} className="storefront-contact-link"><Mail size={15} /> {store.email}</a>}
                {store.instagram_url && <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="storefront-contact-link"><Instagram size={15} /> Instagram</a>}
              </div>
            </div>
          )}

          {/* Featured */}
          {featured.length > 0 && (
            <div className="storefront-featured">
              <h2>⭐ Featured Products</h2>
              <div className="storefront-products-grid">
                {featured.map(p => <ProductCard key={p.id} product={p} fmt={fmt} />)}
              </div>
            </div>
          )}

          {/* All products */}
          <div className="storefront-catalog">
            <div className="storefront-catalog-header">
              <h2>Our Menu</h2>
              <div className="storefront-categories">
                {allCategories.map(c => (
                  <button key={c} className={`storefront-cat-btn ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state"><Package size={32} style={{ color: 'var(--text-light)', margin: '0 auto 12px' }} /><p>No products in this category yet</p></div>
            ) : (
              <div className="storefront-products-grid">
                {filtered.map(p => <ProductCard key={p.id} product={p} fmt={fmt} />)}
              </div>
            )}
          </div>
        </div>

        {/* Info sidebar */}
        <aside className="storefront-sidebar">
          <div className="card card-padding storefront-info-card">
            <h3>Order Info</h3>
            {store.pickup_available && (
              <div className="storefront-info-row">
                <ShoppingBag size={16} style={{ color: 'var(--store-color)' }} />
                <span>Pickup available</span>
              </div>
            )}
            {store.delivery_available && (
              <div className="storefront-info-row">
                <MapPin size={16} style={{ color: 'var(--store-color)' }} />
                <span>Delivery available{store.delivery_radius_miles ? ` (${store.delivery_radius_miles}mi radius)` : ''}</span>
              </div>
            )}
            <div className="storefront-info-row">
              <Clock size={16} style={{ color: 'var(--store-color)' }} />
              <span>{store.advance_days_required || 3} days advance notice required</span>
            </div>
            {store.payment_policy && (
              <div className="storefront-policy">
                <div className="storefront-policy-label">Payment</div>
                <p>{store.payment_policy}</p>
              </div>
            )}
            {store.allergen_notice && (
              <div className="storefront-policy">
                <div className="storefront-policy-label">Allergens</div>
                <p>{store.allergen_notice}</p>
              </div>
            )}
            {store.accepts_orders && (
              <a href={`mailto:${store.email || ''}?subject=Order Request from ${store.store_name}`} className="btn btn-primary storefront-order-btn">
                Request an Order
              </a>
            )}
          </div>
        </aside>
      </div>

      <footer className="storefront-footer">
        <p>© {new Date().getFullYear()} {store.store_name} · <Link to="/">Powered by DoughPop</Link></p>
      </footer>
    </div>
  )
}

function ProductCard({ product, fmt }) {
  return (
    <div className="storefront-product-card">
      <div className="storefront-product-emoji">
        {getCategoryEmoji(product.product_categories?.name)}
      </div>
      <div className="storefront-product-info">
        <div className="storefront-product-category">{product.product_categories?.name || 'Specialty'}</div>
        <h3>{product.name}</h3>
        {product.description && <p>{product.description}</p>}
        <div className="storefront-product-footer">
          <strong>{fmt(product.price)} <span>/{product.unit}</span></strong>
          {product.lead_time_days > 0 && <span className="storefront-lead">{product.lead_time_days}d lead time</span>}
        </div>
      </div>
    </div>
  )
}

function getCategoryEmoji(cat) {
  const map = { 'Cakes': '🎂', 'Cupcakes': '🧁', 'Cookies': '🍪', 'Bread': '🍞', 'Pies': '🥧', 'Pastries': '🥐', 'Custom Orders': '✨' }
  return map[cat] || '🎂'
}
