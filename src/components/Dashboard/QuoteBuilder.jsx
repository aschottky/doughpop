import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  ArrowLeft, Plus, Trash2, Loader2, Send, CheckCircle,
  XCircle, FileText, Calendar, Tag, User, ChevronDown
} from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './Builder.css'

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0, subtotal: 0, notes: '' }

export default function QuoteBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getQuote, createQuote, updateQuote, getClients, getProducts } = useData()
  const { profile } = useAuth()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [showProductPicker, setShowProductPicker] = useState(null)

  // Form state
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [status, setStatus] = useState('draft')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [quoteNumber, setQuoteNumber] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [id, configured])

  const loadInitialData = async () => {
    if (configured) {
      try {
        const [clientData, productData] = await Promise.all([getClients(), getProducts()])
        setClients(clientData)
        setProducts(productData)
      } catch {}
    }

    if (isEdit && configured) {
      try {
        const quote = await getQuote(id)
        if (!quote) { toast.error('Quote not found'); navigate('/dashboard/quotes'); return }
        setClientId(quote.client_id || '')
        setTitle(quote.title || '')
        setNotes(quote.notes || '')
        setInternalNotes(quote.internal_notes || '')
        setValidUntil(quote.valid_until || '')
        setEventDate(quote.event_date || '')
        setTaxRate(quote.tax_rate || 0)
        setDiscountType(quote.discount_type || 'fixed')
        setDiscountValue(quote.discount_value || 0)
        setStatus(quote.status || 'draft')
        setQuoteNumber(quote.quote_number || '')
        setItems(quote.quote_items?.length ? quote.quote_items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          notes: i.notes || '',
          product_id: i.product_id || null
        })) : [{ ...EMPTY_ITEM }])
      } catch {
        toast.error('Failed to load quote')
        navigate('/dashboard/quotes')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
      // Default valid_until to 14 days from now
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setValidUntil(d.toISOString().split('T')[0])
    }
  }

  const updateItem = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'quantity' || field === 'unit_price') {
        const q = field === 'quantity' ? parseFloat(val) || 0 : parseFloat(next[i].unit_price) || 0
        const p = field === 'unit_price' ? parseFloat(val) || 0 : parseFloat(next[i].quantity) || 0
        next[i].subtotal = q * p
      }
      return next
    })
  }

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const addFromProduct = (itemIdx, product) => {
    setItems(prev => {
      const next = [...prev]
      next[itemIdx] = {
        description: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
        notes: '',
        product_id: product.id
      }
      return next
    })
    setShowProductPicker(null)
  }

  // Calculations
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0)
  const discountAmount = discountType === 'percent'
    ? subtotal * (parseFloat(discountValue) || 0) / 100
    : parseFloat(discountValue) || 0
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (parseFloat(taxRate) || 0) / 100
  const total = taxableAmount + taxAmount

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  const handleSave = async (newStatus) => {
    setSaving(true)
    const quoteData = {
      client_id: clientId || null,
      title, notes, internal_notes: internalNotes,
      valid_until: validUntil || null,
      event_date: eventDate || null,
      tax_rate: parseFloat(taxRate) || 0,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      subtotal,
      total,
      status: newStatus || status
    }
    const lineItems = items.filter(i => i.description.trim()).map(i => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 1,
      unit_price: parseFloat(i.unit_price) || 0,
      subtotal: parseFloat(i.subtotal) || 0,
      notes: i.notes || null,
      product_id: i.product_id || null
    }))

    try {
      if (isEdit) {
        await updateQuote(id, { ...quoteData, ...(newStatus && { sent_at: newStatus === 'sent' ? new Date().toISOString() : undefined }) }, lineItems)
        toast.success(newStatus === 'sent' ? 'Quote sent!' : 'Quote saved')
      } else {
        const q = await createQuote(quoteData, lineItems)
        toast.success('Quote created')
        navigate(`/dashboard/quotes/${q.id}`, { replace: true })
      }
      if (newStatus) setStatus(newStatus)
    } catch (err) {
      toast.error(err.message || 'Failed to save quote')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <div className="loading-spinner" />
    </div>
  )

  return (
    <div className="builder">
      <div className="builder-header">
        <Link to="/dashboard/quotes" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Quotes
        </Link>
        <div className="builder-header-center">
          <h1>{isEdit ? (quoteNumber || 'Edit Quote') : 'New Quote'}</h1>
          {isEdit && <StatusBadge status={status} />}
        </div>
        <div className="builder-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 size={15} className="spinner" /> : null}
            Save Draft
          </button>
          {status !== 'sent' && status !== 'accepted' && status !== 'converted' && (
            <button className="btn btn-primary btn-sm" onClick={() => handleSave('sent')} disabled={saving}>
              <Send size={15} />
              Send Quote
            </button>
          )}
        </div>
      </div>

      <div className="builder-body">
        <div className="builder-main">
          {/* Client & metadata */}
          <div className="card card-padding builder-section">
            <div className="builder-section-title">Quote Details</div>
            <div className="builder-form-grid">
              <div className="form-group">
                <label className="form-label"><User size={14} /> Client</label>
                <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">No client selected</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''}</option>
                  ))}
                </select>
                <span className="form-hint">
                  <Link to="/dashboard/clients" style={{ color: 'var(--honey)' }}>+ Add new client</Link>
                </span>
              </div>
              <div className="form-group">
                <label className="form-label"><Tag size={14} /> Quote Title</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Cake Order" />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Valid Until</label>
                <input className="form-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Event Date</label>
                <input className="form-input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card builder-section">
            <div className="builder-items-header">
              <div className="builder-section-title" style={{ padding: '20px 20px 0' }}>Line Items</div>
            </div>
            <div className="builder-items-table">
              <div className="items-table-head">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>Subtotal</span>
                <span></span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="items-table-row">
                  <div className="item-description-cell">
                    <div className="item-description-wrap">
                      <input
                        className="form-input item-desc-input"
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Item description…"
                      />
                      <button
                        className="item-product-picker-btn"
                        onClick={() => setShowProductPicker(showProductPicker === i ? null : i)}
                        title="Pick from products"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    {showProductPicker === i && products.length > 0 && (
                      <div className="product-picker-dropdown">
                        {products.map(p => (
                          <button key={p.id} className="product-picker-item" onClick={() => addFromProduct(i, p)}>
                            <span>{p.name}</span>
                            <span className="product-picker-price">{fmt(p.price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      className="form-input item-notes-input"
                      value={item.notes}
                      onChange={(e) => updateItem(i, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                    />
                  </div>
                  <input
                    className="form-input item-qty"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  />
                  <div className="item-price-cell">
                    <span className="item-currency">$</span>
                    <input
                      className="form-input item-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="item-subtotal">{fmt(item.subtotal)}</div>
                  <button
                    className="item-remove-btn"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <div className="items-add-row">
                <button className="btn btn-ghost btn-sm" onClick={addItem}>
                  <Plus size={15} /> Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card card-padding builder-section">
            <div className="builder-section-title">Notes</div>
            <div className="builder-form-grid builder-form-grid-full">
              <div className="form-group">
                <label className="form-label">Message to Client</label>
                <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your interest! Please review this quote and let me know if you have any questions or custom requests." />
              </div>
              <div className="form-group">
                <label className="form-label">Internal Notes (private)</label>
                <textarea className="form-textarea" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Notes only you can see…" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="builder-sidebar">
          <div className="card card-padding builder-summary">
            <div className="builder-section-title">Summary</div>
            <div className="summary-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>

            <div className="summary-discount">
              <div className="form-group">
                <label className="form-label">Discount</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="form-select" style={{ width: '80px' }} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="fixed">$</option>
                    <option value="percent">%</option>
                  </select>
                  <input className="form-input" type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="summary-row summary-row-discount">
                <span>Discount</span>
                <span>−{fmt(discountAmount)}</span>
              </div>
            )}

            <div className="summary-tax">
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
              </div>
            </div>

            {taxAmount > 0 && (
              <div className="summary-row"><span>Tax</span><span>{fmt(taxAmount)}</span></div>
            )}

            <div className="summary-total">
              <span>Total</span>
              <strong>{fmt(total)}</strong>
            </div>

            {isEdit && (
              <div className="builder-status-actions">
                {status === 'sent' && (
                  <>
                    <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', width: '100%' }} onClick={() => handleSave('accepted')} disabled={saving}>
                      <CheckCircle size={15} /> Mark Accepted
                    </button>
                    <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', width: '100%' }} onClick={() => handleSave('declined')} disabled={saving}>
                      <XCircle size={15} /> Mark Declined
                    </button>
                  </>
                )}
                {status === 'accepted' && (
                  <Link to="/dashboard/invoices/new" state={{ fromQuoteId: id }} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <FileText size={15} /> Convert to Invoice
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
