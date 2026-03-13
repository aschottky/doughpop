import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Plus, Search, Mail, Phone, Trash2, Edit2, Loader2, X, Upload } from 'lucide-react'
import Modal from '../Shared/Modal'
import { useToast } from '../Shared/Toast'
import './ClientList.css'

const EMPTY_CLIENT = { first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '', tags: [] }

export default function ClientList() {
  const navigate = useNavigate()
  const { getClients, createClient, updateClient, deleteClient } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [form, setForm] = useState(EMPTY_CLIENT)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvMapping, setCsvMapping] = useState({})
  const [importing, setImporting] = useState(false)

  const CLIENT_FIELDS = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'Zip' },
    { key: 'notes', label: 'Notes' },
  ]

  const handleCSVFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { toast.error('CSV must have at least a header row and one data row'); return }
      const headers = lines[0].split(',').map(h => h.replace(/^"/, '').replace(/"$/, '').trim())
      const rows = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^",]+)/g) || []
        return vals.map(v => v.replace(/^"/, '').replace(/"$/, '').trim())
      })
      setCsvHeaders(headers)
      setCsvData(rows)
      const autoMap = {}
      headers.forEach((h, i) => {
        const hl = h.toLowerCase().replace(/[^a-z]/g, '')
        if (hl.includes('first') || hl === 'firstname') autoMap['first_name'] = i
        else if (hl.includes('last') || hl === 'lastname') autoMap['last_name'] = i
        else if (hl.includes('email') || hl.includes('mail')) autoMap['email'] = i
        else if (hl.includes('phone') || hl.includes('tel') || hl.includes('mobile')) autoMap['phone'] = i
        else if (hl.includes('address') || hl.includes('street')) autoMap['address'] = i
        else if (hl.includes('city')) autoMap['city'] = i
        else if (hl.includes('state') || hl.includes('province')) autoMap['state'] = i
        else if (hl.includes('zip') || hl.includes('postal')) autoMap['zip'] = i
        else if (hl.includes('note')) autoMap['notes'] = i
      })
      setCsvMapping(autoMap)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvData?.length) return
    setImporting(true)
    let imported = 0
    try {
      for (const row of csvData) {
        const clientData = {}
        CLIENT_FIELDS.forEach(f => {
          const colIdx = csvMapping[f.key]
          if (colIdx !== undefined && colIdx !== '' && row[colIdx]) {
            clientData[f.key] = row[colIdx]
          }
        })
        if (!clientData.first_name) continue
        try {
          const newClient = await createClient(clientData)
          setClients(prev => [newClient, ...prev])
          imported++
        } catch {}
      }
      toast.success(`Imported ${imported} client${imported !== 1 ? 's' : ''}`)
      setShowImport(false)
      setCsvData(null)
      setCsvHeaders([])
      setCsvMapping({})
    } catch (err) {
      toast.error(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    if (!configured) { setClients([]); setLoading(false); return }
    getClients().then(data => setClients(data || [])).catch(() => setClients([])).finally(() => setLoading(false))
  }, [configured])

  const openAddModal = () => { setEditClient(null); setForm(EMPTY_CLIENT); setModalOpen(true) }
  const openEditModal = (e, client) => {
    e.stopPropagation()
    setEditClient(client)
    setForm({
      first_name: client.first_name || '', last_name: client.last_name || '',
      email: client.email || '', phone: client.phone || '',
      address: client.address || '', city: client.city || '',
      state: client.state || '', zip: client.zip || '',
      notes: client.notes || '', tags: client.tags || []
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.first_name.trim()) { toast.error('First name is required'); return }
    setSaving(true)
    try {
      if (editClient) {
        const updated = await updateClient(editClient.id, form)
        setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, ...updated } : c))
        toast.success('Client updated')
      } else {
        const newClient = await createClient(form)
        setClients(prev => [newClient, ...prev])
        toast.success('Client added')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Archive this client?')) return
    try { await deleteClient(id); setClients(prev => prev.filter(c => c.id !== id)); toast.success('Client archived') }
    catch { toast.error('Failed to archive client') }
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
  const filtered = clients.filter(c => {
    const name = `${c.first_name} ${c.last_name || ''}`.toLowerCase()
    return !search || name.includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="client-list">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Clients</h1>
          <p>Manage your client relationships</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={17} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={17} /> Add Client
          </button>
        </div>
      </div>

      {showImport && (
        <div className="card card-padding" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Import Clients from CSV</h3>
            <button className="btn btn-ghost btn-xs" onClick={() => { setShowImport(false); setCsvData(null) }}><X size={16} /></button>
          </div>

          {!csvData ? (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload a CSV file from Google Contacts, iPhone, or any spreadsheet. The first row should be headers.
              </p>
              <input type="file" accept=".csv" onChange={handleCSVFile} style={{ fontSize: '0.875rem' }} />
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}><strong>{csvData.length}</strong> rows found. Map your CSV columns:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {CLIENT_FIELDS.map(f => (
                  <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{f.label}</label>
                    <select className="form-select" style={{ fontSize: '0.8rem' }}
                      value={csvMapping[f.key] ?? ''}
                      onChange={e => setCsvMapping(prev => ({ ...prev, [f.key]: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                    >
                      <option value="">— skip —</option>
                      {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Preview (first 3 rows):
              </p>
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table className="lists-table" style={{ fontSize: '0.8rem' }}>
                  <thead><tr>{CLIENT_FIELDS.filter(f => csvMapping[f.key] !== undefined).map(f => <th key={f.key}>{f.label}</th>)}</tr></thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, ri) => (
                      <tr key={ri}>{CLIENT_FIELDS.filter(f => csvMapping[f.key] !== undefined).map(f => <td key={f.key}>{row[csvMapping[f.key]] || '—'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setCsvData(null); setCsvHeaders([]); setCsvMapping({}) }}>Back</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing || !csvMapping.first_name}>
                  {importing ? <><Loader2 size={15} className="spinner" /> Importing...</> : <><Upload size={15} /> Import {csvData.length} Contacts</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="data-table">
        <div className="data-table-header">
          <div className="data-table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" />
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">👥</div>
            <h3>{search ? 'No clients found' : 'No clients yet'}</h3>
            <p>Add your first client to start tracking orders and quotes.</p>
            {!search && <button className="btn btn-primary btn-sm" onClick={openAddModal}><Plus size={15} /> Add First Client</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => navigate(`/dashboard/clients/${c.id}`)}>
                  <td>
                    <div className="client-name-cell">
                      <div className="client-avatar-sm">{c.first_name[0]}{c.last_name?.[0] || ''}</div>
                      <strong>{c.first_name} {c.last_name || ''}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="client-contact-cell">
                      {c.email && <span><Mail size={13} /> {c.email}</span>}
                      {c.phone && <span><Phone size={13} /> {c.phone}</span>}
                    </div>
                  </td>
                  <td className="text-muted">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                  <td>{c.order_count || 0}</td>
                  <td><strong>{fmt(c.total_spent)}</strong></td>
                  <td>
                    {(c.tags || []).slice(0, 2).map((t, i) => (
                      <span key={i} className="client-tag">{t}</span>
                    ))}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }} onClick={(e) => openEditModal(e, c)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }} onClick={(e) => handleDelete(e, c.id)} title="Archive">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editClient ? 'Edit Client' : 'Add New Client'} size="lg">
        <form onSubmit={handleSave} className="client-form">
          <div className="client-form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Jane" required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Baker" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Street Address</label>
              <input className="form-input" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Austin" />
            </div>
            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} placeholder="TX" />
              </div>
              <div>
                <label className="form-label">ZIP</label>
                <input className="form-input" value={form.zip} onChange={(e) => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="78701" />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Allergies, preferences, special instructions…" style={{ minHeight: '80px' }} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Tags</label>
              <div className="tags-input" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                {(form.tags || []).map((tag, i) => (
                  <span key={i} className="tag-chip" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'var(--honey-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                    {tag}
                    <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))} style={{ padding: '2px', lineHeight: 1 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag and press Enter…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = e.target.value.trim()
                      if (val && !form.tags?.includes(val)) {
                        setForm(f => ({ ...f, tags: [...(f.tags || []), val] }))
                        e.target.value = ''
                      }
                    }
                  }}
                  style={{ flex: 1, minWidth: '120px', border: 'none', background: 'transparent', padding: '4px' }}
                />
              </div>
              <p className="form-hint">Press Enter to add a tag (e.g., wedding, vip, corporate, birthday)</p>
            </div>
          </div>
          <div className="client-form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 size={15} className="spinner" />}
              {editClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
