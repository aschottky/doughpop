import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { ArrowLeft, Mail, Phone, MapPin, FileText, Receipt, Plus, Edit2 } from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import './ClientDetail.css'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getClients, getQuotes, getInvoices } = useData()
  const configured = isSupabaseConfigured()
  const [client, setClient] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!configured) {
      setClient({ id, first_name: 'Sarah', last_name: 'Thompson', email: 'sarah@example.com', phone: '(512) 555-0101', city: 'Austin', state: 'TX', total_spent: 1230, order_count: 4, notes: 'Prefers vanilla sponge. No nut allergens.', tags: ['wedding', 'vip'] })
      setLoading(false)
      return
    }
    try {
      const [clients, allQuotes, allInvoices] = await Promise.all([getClients(), getQuotes(), getInvoices()])
      const found = clients.find(c => c.id === id)
      if (!found) { navigate('/dashboard/clients'); return }
      setClient(found)
      setQuotes(allQuotes.filter(q => q.client_id === id))
      setInvoices(allInvoices.filter(i => i.client_id === id))
    } catch {
      navigate('/dashboard/clients')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><div className="loading-spinner" /></div>
  if (!client) return null

  return (
    <div className="client-detail">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/dashboard/clients" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{client.first_name} {client.last_name || ''}</h1>
            <p>{client.city && client.state ? `${client.city}, ${client.state}` : 'No location'}</p>
          </div>
        </div>
        <div className="page-header-actions">
          <Link to={`/dashboard/quotes/new?client=${id}`} className="btn btn-ghost btn-sm">
            <Plus size={15} /> New Quote
          </Link>
          <Link to={`/dashboard/invoices/new?client=${id}`} className="btn btn-primary btn-sm">
            <Plus size={15} /> New Invoice
          </Link>
        </div>
      </div>

      <div className="client-detail-grid">
        <div className="client-detail-sidebar">
          <div className="card card-padding">
            <div className="client-detail-avatar">
              {client.first_name[0]}{client.last_name?.[0] || ''}
            </div>
            <h2 className="client-detail-name">{client.first_name} {client.last_name || ''}</h2>

            <div className="client-detail-stats">
              <div className="client-stat"><div className="client-stat-value">{fmt(client.total_spent)}</div><div className="client-stat-label">Total Spent</div></div>
              <div className="client-stat"><div className="client-stat-value">{client.order_count || 0}</div><div className="client-stat-label">Orders</div></div>
            </div>

            <div className="client-detail-info">
              {client.email && <div className="client-info-row"><Mail size={16} /><a href={`mailto:${client.email}`}>{client.email}</a></div>}
              {client.phone && <div className="client-info-row"><Phone size={16} /><span>{client.phone}</span></div>}
              {(client.city || client.state) && <div className="client-info-row"><MapPin size={16} /><span>{[client.address, client.city, client.state, client.zip].filter(Boolean).join(', ')}</span></div>}
            </div>

            {(client.tags || []).length > 0 && (
              <div className="client-detail-tags">
                {client.tags.map((t, i) => <span key={i} className="client-tag">{t}</span>)}
              </div>
            )}

            {client.notes && (
              <div className="client-detail-notes">
                <div className="client-notes-label">Notes</div>
                <p>{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="client-detail-main">
          <div className="card">
            <div className="card-padding" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--chocolate)' }}>Quotes</h3>
            </div>
            {quotes.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <FileText size={24} style={{ color: 'var(--text-light)', margin: '0 auto 8px' }} />
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No quotes for this client yet</p>
              </div>
            ) : (
              <table>
                <thead><tr><th>Quote #</th><th>Title</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} onClick={() => navigate(`/dashboard/quotes/${q.id}`)}>
                      <td><strong>{q.quote_number}</strong></td>
                      <td className="text-muted">{q.title || '—'}</td>
                      <td><strong>{fmt(q.total)}</strong></td>
                      <td><StatusBadge status={q.status} /></td>
                      <td className="text-muted">{fmtDate(q.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-padding" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--chocolate)' }}>Invoices</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <Receipt size={24} style={{ color: 'var(--text-light)', margin: '0 auto 8px' }} />
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No invoices for this client yet</p>
              </div>
            ) : (
              <table>
                <thead><tr><th>Invoice #</th><th>Title</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                      <td><strong>{inv.invoice_number}</strong></td>
                      <td className="text-muted">{inv.title || '—'}</td>
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
    </div>
  )
}
