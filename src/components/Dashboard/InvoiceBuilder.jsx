import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  ArrowLeft, Plus, Trash2, Loader2, Send, CheckCircle,
  XCircle, Calendar, Tag, User, ChevronDown
} from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './Builder.css'

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0, subtotal: 0, notes: '' }

export default function InvoiceBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getInvoice, createInvoice, updateInvoice, getClients, getProducts, getQuote } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const isEdit = !!id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [showProductPicker, setShowProductPicker] = useState(null)

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt')
  const [dueDate, setDueDate] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [status, setStatus] = useState('draft')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [quoteId, setQuoteId] = useState(null)

  useEffect(() => {
    loadData()
  }, [id, configured])

  const loadData = async () => {
    if (configured) {
      try {
        const [clientData, productData] = await Promise.all([getClients(), getProducts()])
        setClients(clientData)
        setProducts(productData)
      } catch {}
    }

    // Check if coming from a quote conversion
    const fromQuoteId = location.state?.fromQuoteId
    if (fromQuoteId && !isEdit && configured) {
      try {
        const quote = await getQuote(fromQuoteId)
        if (quote) {
          setClientId(quote.client_id || '')
          setTitle(quote.title || '')
          setNotes(quote.notes || '')
          setTaxRate(quote.tax_rate || 0)
          setDiscountType(quote.discount_type || 'fixed')
          setDiscountValue(quote.discount_value || 0)
          setQuoteId(fromQuoteId)
          setItems(quote.quote_items?.length ? quote.quote_items.map(i => ({
            description: i.description, quantity: i.quantity, unit_price: i.unit_price,
            subtotal: i.subtotal, notes: i.notes || '', product_id: i.product_id || null
          })) : [{ ...EMPTY_ITEM }])
        }
      } catch {}
    }

    if (isEdit && configured) {
      try {
        const invoice = await getInvoice(id)
        if (!invoice) { toast.error('Invoice not found'); navigate('/dashboard/invoices'); return }
        setClientId(invoice.client_id || '')
        setTitle(invoice.title || '')
        setNotes(invoice.notes || '')
        setPaymentTerms(invoice.payment_terms || 'Due on receipt')
        setDueDate(invoice.due_date || '')
        setEventDate(invoice.event_date || '')
        setTaxRate(invoice.tax_rate || 0)
        setDiscountType(invoice.discount_type || 'fixed')
        setDiscountValue(invoice.discount_value || 0)
        setStatus(invoice.status || 'draft')
        setInvoiceNumber(invoice.invoice_number || '')
        setItems(invoice.invoice_items?.length ? invoice.invoice_items.map(i => ({
          description: i.description, quantity: i.quantity, unit_price: i.unit_price,
          subtotal: i.subtotal, notes: i.notes || '', product_id: i.product_id || null
        })) : [{ ...EMPTY_ITEM }])
      } catch {
        toast.error('Failed to load invoice')
        navigate('/dashboard/invoices')
      }
    } else if (!fromQuoteId) {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      setDueDate(d.toISOString().split('T')[0])
    }
    setLoading(false)
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
      next[itemIdx] = { description: product.name, quantity: 1, unit_price: product.price, subtotal: product.price, notes: '', product_id: product.id }
      return next
    })
    setShowProductPicker(null)
  }

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0)
  const discountAmount = discountType === 'percent' ? subtotal * (parseFloat(discountValue) || 0) / 100 : parseFloat(discountValue) || 0
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (parseFloat(taxRate) || 0) / 100
  const total = taxableAmount + taxAmount
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  const handleSave = async (newStatus) => {
    setSaving(true)
    const invoiceData = {
      client_id: clientId || null, quote_id: quoteId || null,
      title, notes, payment_terms: paymentTerms,
      due_date: dueDate || null, event_date: eventDate || null,
      tax_rate: parseFloat(taxRate) || 0, discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0, discount_amount: discountAmount,
      tax_amount: taxAmount, subtotal, total, balance_due: total,
      status: newStatus || status,
      ...(newStatus === 'sent' ? { sent_at: new Date().toISOString() } : {}),
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString(), amount_paid: total, balance_due: 0 } : {})
    }
    const lineItems = items.filter(i => i.description.trim()).map(i => ({
      description: i.description, quantity: parseFloat(i.quantity) || 1,
      unit_price: parseFloat(i.unit_price) || 0, subtotal: parseFloat(i.subtotal) || 0,
      notes: i.notes || null, product_id: i.product_id || null
    }))

    try {
      if (isEdit) {
        await updateInvoice(id, invoiceData, lineItems)
        if (newStatus) setStatus(newStatus)
        toast.success(newStatus === 'paid' ? 'Invoice marked as paid!' : newStatus === 'sent' ? 'Invoice sent!' : 'Invoice saved')
      } else {
        const inv = await createInvoice(invoiceData, lineItems)
        toast.success('Invoice created')
        navigate(`/dashboard/invoices/${inv.id}`, { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><div className="loading-spinner" /></div>

  return (
    <div className="builder">
      <div className="builder-header">
        <Link to="/dashboard/invoices" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Invoices</Link>
        <div className="builder-header-center">
          <h1>{isEdit ? (invoiceNumber || 'Edit Invoice') : 'New Invoice'}</h1>
          {isEdit && <StatusBadge status={status} />}
        </div>
        <div className="builder-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => handleSave()} disabled={saving}>
            {saving && <Loader2 size={15} className="spinner" />}
            Save Draft
          </button>
          {status !== 'sent' && status !== 'paid' && status !== 'cancelled' && (
            <button className="btn btn-primary btn-sm" onClick={() => handleSave('sent')} disabled={saving}>
              <Send size={15} /> Send Invoice
            </button>
          )}
        </div>
      </div>

      <div className="builder-body">
        <div className="builder-main">
          <div className="card card-padding builder-section">
            <div className="builder-section-title">Invoice Details</div>
            <div className="builder-form-grid">
              <div className="form-group">
                <label className="form-label"><User size={14} /> Client</label>
                <select className="form-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">No client selected</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><Tag size={14} /> Invoice Title</label>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Cake – June 2026" />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Due Date</label>
                <input className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={14} /> Event Date</label>
                <input className="form-input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Payment Terms</label>
                <select className="form-select" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                  <option>Due on receipt</option>
                  <option>Net 7</option>
                  <option>Net 14</option>
                  <option>Net 30</option>
                  <option>50% upfront, 50% on delivery</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card builder-section">
            <div style={{ padding: '20px 20px 0' }}><div className="builder-section-title">Line Items</div></div>
            <div className="builder-items-table">
              <div className="items-table-head">
                <span>Description</span><span>Qty</span><span>Unit Price</span><span>Subtotal</span><span></span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="items-table-row">
                  <div className="item-description-cell">
                    <div className="item-description-wrap">
                      <input className="form-input item-desc-input" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Item description…" />
                      <button className="item-product-picker-btn" onClick={() => setShowProductPicker(showProductPicker === i ? null : i)}><ChevronDown size={14} /></button>
                    </div>
                    {showProductPicker === i && products.length > 0 && (
                      <div className="product-picker-dropdown">
                        {products.map(p => (
                          <button key={p.id} className="product-picker-item" onClick={() => addFromProduct(i, p)}>
                            <span>{p.name}</span><span className="product-picker-price">{fmt(p.price)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input className="form-input item-qty" type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  <div className="item-price-cell">
                    <span className="item-currency">$</span>
                    <input className="form-input item-price" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
                  </div>
                  <div className="item-subtotal">{fmt(item.subtotal)}</div>
                  <button className="item-remove-btn" onClick={() => removeItem(i)} disabled={items.length === 1}><Trash2 size={15} /></button>
                </div>
              ))}
              <div className="items-add-row">
                <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={15} /> Add Item</button>
              </div>
            </div>
          </div>

          <div className="card card-padding builder-section">
            <div className="builder-section-title">Notes to Client</div>
            <div className="form-group">
              <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment instructions, thank you note, or any other message…" />
            </div>
          </div>
        </div>

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
            {discountAmount > 0 && <div className="summary-row summary-row-discount"><span>Discount</span><span>−{fmt(discountAmount)}</span></div>}
            <div className="summary-tax">
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
              </div>
            </div>
            {taxAmount > 0 && <div className="summary-row"><span>Tax</span><span>{fmt(taxAmount)}</span></div>}
            <div className="summary-total"><span>Total</span><strong>{fmt(total)}</strong></div>
            {isEdit && (
              <div className="builder-status-actions">
                {status === 'sent' && (
                  <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', width: '100%', justifyContent: 'center' }} onClick={() => handleSave('paid')} disabled={saving}>
                    <CheckCircle size={15} /> Mark as Paid
                  </button>
                )}
                {(status === 'sent' || status === 'overdue') && (
                  <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', width: '100%', justifyContent: 'center' }} onClick={() => handleSave('cancelled')} disabled={saving}>
                    <XCircle size={15} /> Cancel Invoice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
