import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Search, Receipt, Trash2, Archive, Copy, RotateCcw } from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './QuoteList.css'

export default function InvoiceList() {
  const navigate = useNavigate()
  const { getInvoices, deleteInvoice, archiveInvoice, duplicateInvoice } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!configured) { setInvoices([]); setLoading(false); return }
    getInvoices(showArchived).then(data => setInvoices(data || [])).catch(() => setInvoices([])).finally(() => setLoading(false))
  }, [configured, showArchived])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Archive this invoice?')) return
    try { await deleteInvoice(id); setInvoices(prev => prev.filter(i => i.id !== id)); toast.success('Invoice archived') }
    catch { toast.error('Failed to archive') }
  }

  const handleDuplicate = async (e, id) => {
    e.stopPropagation()
    try {
      const newInvoice = await duplicateInvoice(id)
      setInvoices(prev => [newInvoice, ...prev])
      toast.success('Invoice duplicated')
      navigate(`/dashboard/invoices/${newInvoice.id}`)
    } catch {
      toast.error('Failed to duplicate invoice')
    }
  }

  const handleArchiveToggle = async (e, id, isArchived) => {
    e.stopPropagation()
    try {
      await archiveInvoice(id, !isArchived)
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, is_archived: !isArchived } : i))
      toast.success(isArchived ? 'Invoice restored' : 'Invoice archived')
      if (!showArchived) {
        setInvoices(prev => prev.filter(i => i.id !== id))
      }
    } catch {
      toast.error('Failed to update invoice')
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const filtered = invoices.filter(inv => {
    const client = inv.clients ? `${inv.clients.first_name} ${inv.clients.last_name || ''}`.toLowerCase() : ''
    const matchSearch = !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      client.includes(search.toLowerCase()) || (inv.title || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter
    const matchArchive = showArchived ? inv.is_archived : !inv.is_archived
    return matchSearch && matchFilter && matchArchive
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
        <button
          className={`quote-filter-btn ${showArchived ? 'active' : ''}`}
          onClick={() => setShowArchived(!showArchived)}
          style={{ marginLeft: 'auto' }}
        >
          <Archive size={14} /> {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>
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
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        className="table-action-btn"
                        style={{ background: 'none', color: 'var(--text-muted)' }}
                        onClick={(e) => handleDuplicate(e, inv.id)}
                        title="Duplicate"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="table-action-btn"
                        style={{ background: 'none', color: inv.is_archived ? 'var(--success)' : 'var(--text-muted)' }}
                        onClick={(e) => handleArchiveToggle(e, inv.id, inv.is_archived)}
                        title={inv.is_archived ? 'Restore' : 'Archive'}
                      >
                        {inv.is_archived ? <RotateCcw size={15} /> : <Archive size={15} />}
                      </button>
                      <button
                        className="table-action-btn btn-danger"
                        style={{ background: 'none', color: 'var(--error)' }}
                        onClick={(e) => handleDelete(e, inv.id)}
                        title="Archive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
