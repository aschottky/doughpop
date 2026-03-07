import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  DollarSign, FileText, Receipt, Users,
  ShoppingBag, TrendingUp, Plus, ArrowRight
} from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import './Overview.css'

const DEMO_STATS = {
  totalRevenue: 4820,
  monthlyRevenue: 1240,
  totalClients: 18,
  pendingQuotes: 3,
  activeOrders: 5,
  unpaidInvoices: 2,
  overdueInvoices: 1,
  totalOrders: 34
}

const DEMO_RECENT = {
  quotes: [
    { id: '1', quote_number: 'Q-0003', clients: { first_name: 'Sarah', last_name: 'Thompson' }, total: 545, status: 'sent', created_at: new Date().toISOString() },
    { id: '2', quote_number: 'Q-0002', clients: { first_name: 'Mike', last_name: 'Jenkins' }, total: 220, status: 'accepted', created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  invoices: [
    { id: '1', invoice_number: 'INV-0005', clients: { first_name: 'Emma', last_name: 'Rodriguez' }, total: 380, status: 'paid', created_at: new Date().toISOString() },
    { id: '2', invoice_number: 'INV-0004', clients: { first_name: 'Tom', last_name: 'Wilson' }, total: 165, status: 'overdue', created_at: new Date(Date.now() - 172800000).toISOString() },
  ]
}

function StatCard({ icon, label, value, subLabel, color, to }) {
  const content = (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {subLabel && <div className="stat-card-sublabel">{subLabel}</div>}
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

export default function Overview() {
  const { profile } = useAuth()
  const { getDashboardStats, getQuotes, getInvoices } = useData()
  const configured = isSupabaseConfigured()
  const [stats, setStats] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (configured) {
      loadData()
    } else {
      setStats(DEMO_STATS)
      setQuotes(DEMO_RECENT.quotes)
      setInvoices(DEMO_RECENT.invoices)
      setLoading(false)
    }
  }, [configured])

  const loadData = async () => {
    try {
      const [s, q, i] = await Promise.all([
        getDashboardStats(),
        getQuotes(),
        getInvoices()
      ])
      setStats(s || DEMO_STATS)
      setQuotes((q || []).slice(0, 4))
      setInvoices((i || []).slice(0, 4))
    } catch {
      setStats(DEMO_STATS)
      setQuotes(DEMO_RECENT.quotes)
      setInvoices(DEMO_RECENT.invoices)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="overview">
      <div className="overview-welcome">
        <div>
          <h1>Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Baker'} 👋</h1>
          <p>Here's what's happening with your bakery business.</p>
        </div>
        <Link to="/dashboard/quotes/new" className="btn btn-primary">
          <Plus size={17} />
          New Quote
        </Link>
      </div>

      <div className="overview-stats">
        <StatCard
          icon={<DollarSign size={22} />}
          label="Total Revenue"
          value={fmt(stats?.totalRevenue)}
          subLabel={`${fmt(stats?.monthlyRevenue)} this month`}
          color="honey"
        />
        <StatCard
          icon={<FileText size={22} />}
          label="Pending Quotes"
          value={stats?.pendingQuotes ?? 0}
          subLabel="awaiting response"
          color="rose"
          to="/dashboard/quotes"
        />
        <StatCard
          icon={<Receipt size={22} />}
          label="Unpaid Invoices"
          value={stats?.unpaidInvoices ?? 0}
          subLabel={stats?.overdueInvoices ? `${stats.overdueInvoices} overdue` : 'all current'}
          color={stats?.overdueInvoices ? 'danger' : 'sage'}
          to="/dashboard/invoices"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Total Clients"
          value={stats?.totalClients ?? 0}
          subLabel="in your CRM"
          color="espresso"
          to="/dashboard/clients"
        />
      </div>

      <div className="overview-activity">
        <div className="overview-section">
          <div className="overview-section-header">
            <h2>Recent Quotes</h2>
            <Link to="/dashboard/quotes" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card">
            {quotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">📋</div>
                <h3>No quotes yet</h3>
                <p>Create your first quote to start tracking client requests.</p>
                <Link to="/dashboard/quotes/new" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Create Quote
                </Link>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} onClick={() => {}}>
                      <td><Link to={`/dashboard/quotes/${q.id}`} className="table-link">{q.quote_number}</Link></td>
                      <td>{q.clients ? `${q.clients.first_name} ${q.clients.last_name || ''}`.trim() : '—'}</td>
                      <td><strong>{fmt(q.total)}</strong></td>
                      <td><StatusBadge status={q.status} /></td>
                      <td className="text-muted">{fmtDate(q.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="overview-section">
          <div className="overview-section-header">
            <h2>Recent Invoices</h2>
            <Link to="/dashboard/invoices" className="btn btn-ghost btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card">
            {invoices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">🧾</div>
                <h3>No invoices yet</h3>
                <p>Turn a quote into an invoice or create a new one.</p>
                <Link to="/dashboard/invoices/new" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Create Invoice
                </Link>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><Link to={`/dashboard/invoices/${inv.id}`} className="table-link">{inv.invoice_number}</Link></td>
                      <td>{inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name || ''}`.trim() : '—'}</td>
                      <td><strong>{fmt(inv.total)}</strong></td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-muted">{fmtDate(inv.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="overview-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {[
            { icon: '📋', label: 'New Quote', desc: 'Send a quote to a client', to: '/dashboard/quotes/new', color: 'honey' },
            { icon: '🧾', label: 'New Invoice', desc: 'Create a standalone invoice', to: '/dashboard/invoices/new', color: 'rose' },
            { icon: '👤', label: 'Add Client', desc: 'Add someone to your CRM', to: '/dashboard/clients', color: 'sage' },
            { icon: '🧁', label: 'Add Product', desc: 'List a new item or service', to: '/dashboard/products', color: 'espresso' },
          ].map((a, i) => (
            <Link key={i} to={a.to} className={`quick-action quick-action-${a.color}`}>
              <div className="quick-action-emoji">{a.icon}</div>
              <div>
                <strong>{a.label}</strong>
                <span>{a.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
