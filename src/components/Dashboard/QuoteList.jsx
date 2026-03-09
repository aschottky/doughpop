import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Search, FileText, Trash2, Archive, Copy, RotateCcw } from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './QuoteList.css'

const DEMO_QUOTES = [
  { id: '1', quote_number: 'Q-0001', clients: { first_name: 'Sarah', last_name: 'Thompson' }, title: 'Wedding cake & cookies', total: 545, status: 'sent', valid_until: '2026-03-20', created_at: new Date().toISOString(), is_archived: false },
  { id: '2', quote_number: 'Q-0002', clients: { first_name: 'Mike', last_name: 'Jenkins' }, title: 'Birthday party order', total: 220, status: 'accepted', valid_until: '2026-03-15', created_at: new Date(Date.now() - 86400000).toISOString(), is_archived: false },
  { id: '3', quote_number: 'Q-0003', clients: null, title: 'Custom cake tasting', total: 95, status: 'draft', valid_until: null, created_at: new Date(Date.now() - 172800000).toISOString(), is_archived: false },
  { id: '4', quote_number: 'Q-0004', clients: { first_name: 'Emma', last_name: 'Clark' }, title: 'Baby shower dessert table', total: 680, status: 'converted', valid_until: '2026-02-28', created_at: new Date(Date.now() - 604800000).toISOString(), is_archived: false },
]

export default function QuoteList() {
  const navigate = useNavigate()
  const { getQuotes, deleteQuote, archiveQuote, duplicateQuote } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    loadQuotes()
  }, [configured])

  const loadQuotes = async () => {
    if (!configured) {
      setQuotes(DEMO_QUOTES)
      setLoading(false)
      return
    }
    try {
      const data = await getQuotes(showArchived)
      setQuotes(data)
    } catch {
      setQuotes(DEMO_QUOTES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [showArchived])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Archive this quote?')) return
    try {
      await deleteQuote(id)
      setQuotes(prev => prev.filter(q => q.id !== id))
      toast.success('Quote archived')
    } catch {
      toast.error('Failed to archive quote')
    }
  }

  const handleDuplicate = async (e, id) => {
    e.stopPropagation()
    try {
      const newQuote = await duplicateQuote(id)
      setQuotes(prev => [newQuote, ...prev])
      toast.success('Quote duplicated')
      navigate(`/dashboard/quotes/${newQuote.id}`)
    } catch {
      toast.error('Failed to duplicate quote')
    }
  }

  const handleArchiveToggle = async (e, id, isArchived) => {
    e.stopPropagation()
    try {
      await archiveQuote(id, !isArchived)
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, is_archived: !isArchived } : q))
      toast.success(isArchived ? 'Quote restored' : 'Quote archived')
      if (!showArchived) {
        setQuotes(prev => prev.filter(q => q.id !== id))
      }
    } catch {
      toast.error('Failed to update quote')
    }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const filtered = quotes.filter(q => {
    const client = q.clients ? `${q.clients.first_name} ${q.clients.last_name || ''}`.toLowerCase() : ''
    const matchSearch = !search || q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      client.includes(search.toLowerCase()) || (q.title || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || q.status === filter
    const matchArchive = showArchived ? q.is_archived : !q.is_archived
    return matchSearch && matchFilter && matchArchive
  })

  const statuses = ['all', 'draft', 'sent', 'accepted', 'declined', 'expired', 'converted']

  return (
    <div className="quote-list">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Quotes</h1>
          <p>Create and manage quotes for your clients</p>
        </div>
        <div className="page-header-actions">
          <Link to="/dashboard/quotes/new" className="btn btn-primary">
            <Plus size={17} /> New Quote
          </Link>
        </div>
      </div>

      <div className="quote-filters">
        {statuses.map(s => (
          <button
            key={s}
            className={`quote-filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotes…"
            />
          </div>
          <span className="quote-count">{filtered.length} quote{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">📋</div>
            <h3>{search || filter !== 'all' ? 'No quotes found' : 'No quotes yet'}</h3>
            <p>{search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first professional quote for a client.'}</p>
            {!search && filter === 'all' && (
              <Link to="/dashboard/quotes/new" className="btn btn-primary btn-sm">
                <Plus size={15} /> Create Your First Quote
              </Link>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Client</th>
                <th>Description</th>
                <th>Total</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} onClick={() => navigate(`/dashboard/quotes/${q.id}`)}>
                  <td>
                    <div className="quote-num-cell">
                      <FileText size={15} style={{ color: 'var(--honey)', flexShrink: 0 }} />
                      <strong>{q.quote_number}</strong>
                    </div>
                  </td>
                  <td>{q.clients ? `${q.clients.first_name} ${q.clients.last_name || ''}`.trim() : <span className="text-muted">No client</span>}</td>
                  <td className="text-muted">{q.title || '—'}</td>
                  <td><strong>{fmt(q.total)}</strong></td>
                  <td><StatusBadge status={q.status} /></td>
                  <td className="text-muted">{fmtDate(q.valid_until)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button
                        className="table-action-btn"
                        style={{ background: 'none', color: 'var(--text-muted)' }}
                        onClick={(e) => handleDuplicate(e, q.id)}
                        title="Duplicate"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="table-action-btn"
                        style={{ background: 'none', color: q.is_archived ? 'var(--success)' : 'var(--text-muted)' }}
                        onClick={(e) => handleArchiveToggle(e, q.id, q.is_archived)}
                        title={q.is_archived ? 'Restore' : 'Archive'}
                      >
                        {q.is_archived ? <RotateCcw size={15} /> : <Archive size={15} />}
                      </button>
                      <button
                        className="table-action-btn btn-danger"
                        style={{ background: 'none', color: 'var(--error)' }}
                        onClick={(e) => handleDelete(e, q.id)}
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
