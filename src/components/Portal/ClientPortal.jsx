import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Croissant, FileText, Receipt, CheckCircle, XCircle, Package, Clock } from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import './ClientPortal.css'

const DEMO_DATA = {
  client: { first_name: 'Sarah', last_name: 'Thompson', email: 'sarah@example.com' },
  baker: { business_name: "Jane's Sweet Creations", full_name: 'Jane Baker', email: 'jane@sweetcreations.com' },
  quotes: [
    {
      id: 'q1', quote_number: 'Q-0024', title: 'Wedding Cake & Cookies', status: 'sent',
      total: 545, valid_until: '2026-03-20', created_at: new Date().toISOString(),
      quote_items: [
        { description: '3-tier custom wedding cake', quantity: 1, unit_price: 420, subtotal: 420 },
        { description: 'Decorated cookies (50 pcs)', quantity: 50, unit_price: 2.50, subtotal: 125 }
      ]
    }
  ],
  orders: [
    { id: 'o1', order_number: 'ORD-0005', status: 'in_progress', total: 380, event_date: '2026-03-15', created_at: new Date(Date.now() - 86400000).toISOString() }
  ]
}

export default function ClientPortal() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('quotes')
  const [respondingTo, setRespondingTo] = useState(null)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadPortal()
  }, [token])

  const loadPortal = async () => {
    if (token === 'demo') {
      setData(DEMO_DATA)
      setLoading(false)
      return
    }
    try {
      const { data: tokenData } = await supabase
        .from('client_tokens')
        .select('*, clients(*), profiles(*)')
        .eq('token', token)
        .maybeSingle()

      if (!tokenData) { setLoading(false); return }

      const clientId = tokenData.client_id
      const bakerId = tokenData.baker_id

      const [{ data: quotes }, { data: orders }] = await Promise.all([
        supabase.from('quotes').select('*, quote_items(*)').eq('client_id', clientId).eq('baker_id', bakerId).order('created_at', { ascending: false }),
        supabase.from('orders').select('*, order_items(*)').eq('client_id', clientId).eq('baker_id', bakerId).order('created_at', { ascending: false })
      ])

      setData({
        client: tokenData.clients,
        baker: tokenData.profiles,
        quotes: quotes || [],
        orders: orders || []
      })
    } catch {
      setData(DEMO_DATA)
    } finally {
      setLoading(false)
    }
  }

  const respondToQuote = async (quoteId, action) => {
    setResponding(true)
    setRespondingTo(quoteId)
    try {
      if (token !== 'demo') {
        await supabase.from('quotes')
          .update({ status: action, ...(action === 'accepted' ? { accepted_at: new Date().toISOString() } : { declined_at: new Date().toISOString() }) })
          .eq('id', quoteId)
      }
      setData(prev => ({
        ...prev,
        quotes: prev.quotes.map(q => q.id === quoteId ? { ...q, status: action } : q)
      }))
    } catch {}
    finally { setResponding(false); setRespondingTo(null) }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (loading) return (
    <div className="portal-loading">
      <div className="loading-spinner" />
      <p>Loading your portal…</p>
    </div>
  )

  if (!data) return (
    <div className="portal-not-found">
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
      <h2>Portal link not found</h2>
      <p>This link may be expired or invalid. Please contact your baker for a new link.</p>
    </div>
  )

  return (
    <div className="client-portal">
      <header className="portal-header">
        <div className="container portal-header-inner">
          <div className="portal-header-brand">
            <Croissant size={20} />
            <span>{data.baker?.business_name || data.baker?.full_name || 'Your Baker'}</span>
          </div>
          <div className="portal-header-client">
            Hi, <strong>{data.client?.first_name || 'there'}!</strong>
          </div>
        </div>
      </header>

      <div className="container portal-body">
        <div className="portal-welcome">
          <h1>Your Client Portal</h1>
          <p>View your quotes, track orders, and manage your requests with {data.baker?.business_name || 'your baker'}.</p>
        </div>

        <div className="portal-tabs">
          <button className={`portal-tab ${activeTab === 'quotes' ? 'active' : ''}`} onClick={() => setActiveTab('quotes')}>
            <FileText size={16} /> Quotes ({data.quotes.length})
          </button>
          <button className={`portal-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Package size={16} /> Orders ({data.orders.length})
          </button>
        </div>

        {activeTab === 'quotes' && (
          <div className="portal-section">
            {data.quotes.length === 0 ? (
              <div className="portal-empty">
                <FileText size={32} />
                <h3>No quotes yet</h3>
                <p>Quotes from your baker will appear here.</p>
              </div>
            ) : (
              <div className="portal-quotes">
                {data.quotes.map(q => (
                  <div key={q.id} className="portal-quote-card card">
                    <div className="portal-quote-header card-padding">
                      <div>
                        <div className="portal-quote-num">{q.quote_number}</div>
                        <div className="portal-quote-title">{q.title || 'Custom Order Quote'}</div>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>

                    {q.quote_items?.length > 0 && (
                      <div className="portal-quote-items">
                        {q.quote_items.map((item, i) => (
                          <div key={i} className="portal-quote-item">
                            <span>{item.description}</span>
                            <span>{fmt(item.subtotal)}</span>
                          </div>
                        ))}
                        <div className="portal-quote-total">
                          <span>Total</span>
                          <strong>{fmt(q.total)}</strong>
                        </div>
                      </div>
                    )}

                    {q.valid_until && (
                      <div className="portal-quote-validity card-padding">
                        <Clock size={14} />
                        Valid until {fmtDate(q.valid_until)}
                      </div>
                    )}

                    {q.status === 'sent' && (
                      <div className="portal-quote-actions card-padding">
                        <button
                          className="btn btn-sm portal-accept-btn"
                          onClick={() => respondToQuote(q.id, 'accepted')}
                          disabled={responding && respondingTo === q.id}
                        >
                          <CheckCircle size={15} /> Accept Quote
                        </button>
                        <button
                          className="btn btn-sm portal-decline-btn"
                          onClick={() => respondToQuote(q.id, 'declined')}
                          disabled={responding && respondingTo === q.id}
                        >
                          <XCircle size={15} /> Decline
                        </button>
                      </div>
                    )}

                    {q.status === 'accepted' && (
                      <div className="portal-quote-accepted card-padding">
                        <CheckCircle size={16} />
                        You accepted this quote! Your baker will be in touch to confirm details.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="portal-section">
            {data.orders.length === 0 ? (
              <div className="portal-empty">
                <Package size={32} />
                <h3>No orders yet</h3>
                <p>Your active and past orders will appear here.</p>
              </div>
            ) : (
              <div className="portal-orders">
                {data.orders.map(o => (
                  <div key={o.id} className="card card-padding portal-order-card">
                    <div className="portal-order-header">
                      <div>
                        <div className="portal-quote-num">{o.order_number}</div>
                        <div className="portal-order-total">{fmt(o.total)}</div>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    {o.event_date && (
                      <div className="portal-order-date">
                        <Clock size={14} />
                        {o.status === 'delivered' ? 'Delivered' : 'Event date'}: {fmtDate(o.event_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="portal-contact-baker">
          <p>Questions? Reach out to {data.baker?.business_name || 'your baker'}:</p>
          {data.baker?.email && <a href={`mailto:${data.baker.email}`} className="btn btn-ghost btn-sm">Email Baker</a>}
        </div>
      </div>

      <footer className="portal-footer">
        <p>Secured by <Link to="/">DoughPop</Link> · Magic link expires 30 days after creation</p>
      </footer>
    </div>
  )
}
