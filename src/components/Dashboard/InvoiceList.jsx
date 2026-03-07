import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Search, Receipt, Trash2 } from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './QuoteList.css'

const DEMO_INVOICES = [
  { id: '1', invoice_number: 'INV-0001', clients: { first_name: 'Emma', last_name: 'Rodriguez' }, title: 'Baby shower dessert table', total: 680, status: 'paid', due_date: '2026-02-15', created_at: new Date().toISOString() },
  { id: '2', invoice_number: 'INV-0002', clients: { first_name: 'Tom', last_name: 'Wilson' }, title: 'Corporate cookies', total: 165, status: 'overdue', due_date: '2026-02-01', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', invoice_number: 'INV-0003', clients: { first_name: 'Sarah', last_name: 'Thompson' }, title: 'Wedding cake', total: 545, status: 'sent', due_date: '2026-03-10', created_at: new Date(Date.now() - 172800000).toISOString() },
]

export default function InvoiceList() {
  const navigate = useNavigate()
  const { getInvoices, deleteInvoice } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!configured) { setInvoices(DEMO_INVOICES); setLoading(false); return }
    getInvoices().then(setInvoices).catch(() => setInvoices(DEMO_INVOICES)).finally(() => setLoading(false))
  }, [configured])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this invoice?')) return
    try { await deleteInvoice(id); setInvoices(prev => prev.filter(i => i.id !== id)); toast.success('Invoice deleted') }
    catch { toast.error('Failed to delete') }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const filtered = invoices.filter(inv => {
    const client = inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name || ''}`.toLowerCase() : ''
    const matchSearch = !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      client.includes(search.toLowerCase()) || (inv.title || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  const statuses = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']

  return (
    <div className="quote-list">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Invoices</h1>
          <p>Track payments and outstanding balances</p>
        </div>
        <Link to="/dashboard/invoices/new" className="btn btn-primary">
          <Plus size={17} /> New Invoice
        </Link>
      </div>

      <div className="quote-filters">
        {statuses.map(s => (
          <button key={s} className={`quote-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="data-table">
        <div className="data-table-header">
          <div className="data-table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…" />
          </div>
          <span className="quote-count">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">🧾</div>
            <h3>{search || filter !== 'all' ? 'No invoices found' : 'No invoices yet'}</h3>
            <p>Create your first invoice or convert an accepted quote.</p>
            {!search && filter === 'all' && <Link to="/dashboard/invoices/new" className="btn btn-primary btn-sm"><Plus size={15} /> Create Invoice</Link>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Description</th>
                <th>Total</th>
                <th>Status</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}>
                  <td>
                    <div className="quote-num-cell">
                      <Receipt size={15} style={{ color: 'var(--rose)', flexShrink: 0 }} />
                      <strong>{inv.invoice_number}</strong>
                    </div>
                  </td>
                  <td>{inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name || ''}`.trim() : <span className="text-muted">No client</span>}</td>
                  <td className="text-muted">{inv.title || '—'}</td>
                  <td><strong>{fmt(inv.total)}</strong></td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className={inv.status === 'overdue' ? '' : 'text-muted'} style={inv.status === 'overdue' ? { color: 'var(--error)', fontWeight: 600 } : {}}>
                    {fmtDate(inv.due_date)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={(e) => handleDelete(e, inv.id)} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
