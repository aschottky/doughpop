import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  ArrowLeft, Plus, Trash2, Loader2, Send, CheckCircle,
  XCircle, Calendar, Tag, User, ChevronDown, Fee, FileText,
  Clock, DollarSign, CreditCard
} from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './Builder.css'

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0, subtotal: 0, notes: '' }
const EMPTY_FEE = { name: '', type: 'fixed', value: 0 }

const FEE_PRESETS = [
  { name: 'Rush Fee', type: 'fixed' },
  { name: 'Delivery Fee', type: 'fixed' },
  { name: 'Setup Fee', type: 'fixed' },
  { name: 'Cake Cutting Fee', type: 'fixed' },
  { name: 'Custom Fee', type: 'fixed' }
]

export default function InvoiceBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getInvoice, createInvoice, updateInvoice, getClients, getProducts, getQuote, getDiscountPresets, getPayments, recordPayment, deletePayment, getStore } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const isEdit = !!id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [discountPresets, setDiscountPresets] = useState([])
  const [showProductPicker, setShowProductPicker] = useState(null)

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt')
  const [dueDate, setDueDate] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [status, setStatus] = useState('draft')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [fees, setFees] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [quoteId, setQuoteId] = useState(null)

  // Payment & Time Tracking
  const [payments, setPayments] = useState([])
  const [hoursWorked, setHoursWorked] = useState(0)
  const [hourlyRate, setHourlyRate] = useState(0)
  const [store, setStore] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'cash', notes: '' })

  // Auto-save state
  const autoSaveRef = useRef(null)
  const lastSavedRef = useRef(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, configured])

  // Auto-save to localStorage
  const getFormState = useCallback(() => ({
    clientId, title, notes, internalNotes, paymentTerms, dueDate, eventDate,
    taxRate, discountType, discountValue, items, fees
  }), [clientId, title, notes, internalNotes, paymentTerms, dueDate, eventDate, taxRate, discountType, discountValue, items, fees])

  useEffect(() => {
    if (!isEdit && configured) {
      const state = getFormState()
      const stateHash = JSON.stringify(state)
      if (lastSavedRef.current !== stateHash) {
        setHasUnsavedChanges(true)
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          localStorage.setItem('invoice_draft', JSON.stringify(state))
          lastSavedRef.current = stateHash
          setHasUnsavedChanges(false)
        }, 5000)
      }
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [getFormState, isEdit, configured])

  // Restore draft on mount
  useEffect(() => {
    if (!isEdit && !id) {
      const clientFromQuery = searchParams.get('client')
      if (clientFromQuery) {
        setClientId(clientFromQuery)
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('client')
        setSearchParams(newParams, { replace: true })
      } else {
        const saved = localStorage.getItem('invoice_draft')
        if (saved) {
          try {
            const draft = JSON.parse(saved)
            setClientId(draft.clientId || '')
            setTitle(draft.title || '')
            setNotes(draft.notes || '')
            setInternalNotes(draft.internalNotes || '')
            setPaymentTerms(draft.paymentTerms || 'Due on receipt')
            setDueDate(draft.dueDate || '')
            setEventDate(draft.eventDate || '')
            setTaxRate(draft.taxRate || 0)
            setDiscountType(draft.discountType || 'fixed')
            setDiscountValue(draft.discountValue || 0)
            setItems(draft.items?.length ? draft.items : [{ ...EMPTY_ITEM }])
            setFees(draft.fees || [])
          } catch {}
        }
      }
      if (!dueDate) {
        const d = new Date()
        d.setDate(d.getDate() + 14)
        setDueDate(d.toISOString().split('T')[0])
      }
    }
  }, [isEdit, id, dueDate, searchParams, setSearchParams])

  const clearDraft = () => {
    localStorage.removeItem('invoice_draft')
    lastSavedRef.current = null
    setHasUnsavedChanges(false)
  }

  const loadData = async () => {
    if (configured) {
      try {
        const [clientData, productData, presetData] = await Promise.all([
          getClients(), getProducts(), getDiscountPresets()
        ])
        setClients(clientData)
        setProducts(productData)
        setDiscountPresets(presetData)
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
          setInternalNotes(quote.internal_notes || '')
          setTaxRate(quote.tax_rate || 0)
          setDiscountType(quote.discount_type || 'fixed')
          setDiscountValue(quote.discount_value || 0)
          setFees(quote.fees || [])
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
        const [invoice, paymentsData, storeData] = await Promise.all([
          getInvoice(id),
          getPayments(id),
          getStore()
        ])
        if (!invoice) { toast.error('Invoice not found'); navigate('/dashboard/invoices'); return }
        setClientId(invoice.client_id || '')
        setTitle(invoice.title || '')
        setNotes(invoice.notes || '')
        setInternalNotes(invoice.internal_notes || '')
        setPaymentTerms(invoice.payment_terms || 'Due on receipt')
        setDueDate(invoice.due_date || '')
        setEventDate(invoice.event_date || '')
        setTaxRate(invoice.tax_rate || 0)
        setDiscountType(invoice.discount_type || 'fixed')
        setDiscountValue(invoice.discount_value || 0)
        setStatus(invoice.status || 'draft')
        setInvoiceNumber(invoice.invoice_number || '')
        setFees(invoice.fees || [])
        setHoursWorked(invoice.hours_worked || 0)
        setItems(invoice.invoice_items?.length ? invoice.invoice_items.map(i => ({
          description: i.description, quantity: i.quantity, unit_price: i.unit_price,
          subtotal: i.subtotal, notes: i.notes || '', product_id: i.product_id || null
        })) : [{ ...EMPTY_ITEM }])
        setPayments(paymentsData || [])
        setStore(storeData)
        setHourlyRate(storeData?.hourly_rate || 0)
      } catch {
        toast.error('Failed to load invoice')
        navigate('/dashboard/invoices')
      }
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

  // Fee management
  const addFee = () => setFees(prev => [...prev, { ...EMPTY_FEE }])
  const removeFee = (i) => setFees(prev => prev.filter((_, idx) => idx !== i))
  const updateFee = (i, field, val) => {
    setFees(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  const applyDiscountPreset = (preset) => {
    setDiscountType(preset.discount_type)
    setDiscountValue(preset.discount_value)
  }

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
  const subtotalAfterDiscount = subtotal - discountAmount

  // Calculate fees (fixed or percentage)
  const feesTotal = fees.reduce((sum, fee) => {
    if (!fee.name) return sum
    const val = parseFloat(fee.value) || 0
    if (fee.type === 'percent') {
      return sum + (subtotalAfterDiscount * val / 100)
    }
    return sum + val
  }, 0)

  const taxableAmount = subtotalAfterDiscount
  const taxAmount = taxableAmount * (parseFloat(taxRate) || 0) / 100
  const total = taxableAmount + taxAmount + feesTotal
  const laborCost = (parseFloat(hoursWorked) || 0) * (parseFloat(hourlyRate) || 0)
  const grandTotal = total + laborCost
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  const handleSave = async (newStatus) => {
    setSaving(true)
    const invoiceData = {
      client_id: clientId || null, quote_id: quoteId || null,
      title, notes, internal_notes: internalNotes, payment_terms: paymentTerms,
      due_date: dueDate || null, event_date: eventDate || null,
      tax_rate: parseFloat(taxRate) || 0, discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0, discount_amount: discountAmount,
      fees: fees.filter(f => f.name.trim()),
      tax_amount: taxAmount, subtotal, total: grandTotal, balance_due: grandTotal,
      hours_worked: parseFloat(hoursWorked) || 0,
      labor_cost: laborCost,
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
        clearDraft()
      } else {
        const inv = await createInvoice(invoiceData, lineItems)
        toast.success('Invoice created')
        clearDraft()
        navigate(`/dashboard/invoices/${inv.id}`, { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  // Payment handling
  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!newPayment.amount || isNaN(newPayment.amount)) {
      toast.error('Valid payment amount is required')
      return
    }
    
    try {
      const payment = await recordPayment({
        invoice_id: id,
        amount: parseFloat(newPayment.amount),
        method: newPayment.method,
        notes: newPayment.notes
      })
      
      setPayments(prev => [payment, ...prev])
      setNewPayment({ amount: '', method: 'cash', notes: '' })
      setShowPaymentModal(false)
      toast.success('Payment recorded')
      
      // Refresh to get updated balance
      const invoice = await getInvoice(id)
      if (invoice) {
        setStatus(invoice.status)
      }
    } catch {
      toast.error('Failed to record payment')
    }
  }

  const handleDeletePayment = async (paymentId, amount) => {
    if (!window.confirm('Delete this payment record?')) return
    try {
      await deletePayment(paymentId, id, amount)
      setPayments(prev => prev.filter(p => p.id !== paymentId))
      toast.success('Payment deleted')
      
      // Refresh to get updated balance
      const invoice = await getInvoice(id)
      if (invoice) {
        setStatus(invoice.status)
      }
    } catch {
      toast.error('Failed to delete payment')
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const balanceDue = grandTotal - totalPaid

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
          {!isEdit && hasUnsavedChanges && (
            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginRight: '8px' }}>
              Auto-saved draft
            </span>
          )}
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

          <div className="card card-padding builder-section">
            <div className="builder-section-title"><FileText size={14} /> Internal Notes</div>
            <div className="form-group">
              <textarea className="form-textarea" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Private notes only visible to you…" style={{ minHeight: '80px', background: 'var(--cream-dark)' }} />
            </div>
          </div>

          <div className="card card-padding builder-section">
            <div className="builder-section-title"><Fee size={14} /> Additional Fees</div>
            <div className="fees-list">
              {fees.map((fee, i) => (
                <div key={i} className="fee-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select className="form-select" style={{ flex: 2 }} value={fee.name} onChange={(e) => updateFee(i, 'name', e.target.value)}>
                    <option value="">Select fee type…</option>
                    {FEE_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                  <select className="form-select" style={{ width: '80px' }} value={fee.type} onChange={(e) => updateFee(i, 'type', e.target.value)}>
                    <option value="fixed">$</option>
                    <option value="percent">%</option>
                  </select>
                  <input className="form-input" type="number" min="0" style={{ width: '100px' }} value={fee.value} onChange={(e) => updateFee(i, 'value', e.target.value)} placeholder="0" />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFee(i)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addFee}><Plus size={14} /> Add Fee</button>
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
                {discountPresets.length > 0 && (
                  <select className="form-select" style={{ marginBottom: '8px' }} onChange={(e) => {
                    const p = discountPresets.find(d => d.id === e.target.value)
                    if (p) applyDiscountPreset(p)
                  }}>
                    <option value="">Quick select preset…</option>
                    {discountPresets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.discount_type === 'percent' ? p.discount_value + '%' : '$' + p.discount_value})</option>
                    ))}
                  </select>
                )}
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

            {fees.length > 0 && fees.some(f => f.name) && (
              <>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                  {fees.filter(f => f.name).map((fee, i) => {
                    const val = parseFloat(fee.value) || 0
                    const amount = fee.type === 'percent' ? (subtotalAfterDiscount * val / 100) : val
                    return (
                      <div key={i} className="summary-row" style={{ fontSize: '0.875rem' }}>
                        <span>{fee.name}</span><span>{fmt(amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="summary-tax">
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
              </div>
            </div>
            {taxAmount > 0 && <div className="summary-row"><span>Tax</span><span>{fmt(taxAmount)}</span></div>}
            <div className="summary-total"><span>Subtotal</span><strong>{fmt(total)}</strong></div>
            
            {laborCost > 0 && (
              <div className="summary-row" style={{ fontSize: '0.875rem' }}>
                <span>Labor ({hoursWorked}h × ${hourlyRate}/hr)</span>
                <span>{fmt(laborCost)}</span>
              </div>
            )}
            
            <div className="summary-grand-total">
              <span>Grand Total</span>
              <strong>{fmt(grandTotal)}</strong>
            </div>

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

          {isEdit && (
            <div className="card card-padding builder-payments">
              <div className="builder-section-title"><DollarSign size={14} /> Payments</div>
              <div className="payment-summary">
                <div className="payment-row paid">
                  <span>Total Paid</span>
                  <strong>{fmt(totalPaid)}</strong>
                </div>
                <div className={`payment-row balance ${balanceDue > 0 ? 'due' : 'paid'}`}>
                  <span>Balance Due</span>
                  <strong>{fmt(balanceDue)}</strong>
                </div>
              </div>
              
              {payments.length > 0 && (
                <div className="payment-history">
                  {payments.map(payment => (
                    <div key={payment.id} className="payment-item">
                      <div className="payment-info">
                        <span className="payment-method">
                          <CreditCard size={12} />
                          {payment.method}
                        </span>
                        <span className="payment-date">
                          {new Date(payment.paid_at).toLocaleDateString()}
                        </span>
                        {payment.notes && <span className="payment-note">{payment.notes}</span>}
                      </div>
                      <div className="payment-amount">
                        <strong>{fmt(payment.amount)}</strong>
                        <button className="btn btn-ghost btn-xs" onClick={() => handleDeletePayment(payment.id, payment.amount)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {balanceDue > 0 && (
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => setShowPaymentModal(true)}>
                  <Plus size={14} /> Record Payment
                </button>
              )}
            </div>
          )}

          {isEdit && (
            <div className="card card-padding builder-time">
              <div className="builder-section-title"><Clock size={14} /> Time Tracking</div>
              <div className="time-inputs">
                <div className="form-group">
                  <label className="form-label">Hours Worked</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="0" 
                    step="0.25"
                    value={hoursWorked} 
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              {laborCost > 0 && (
                <div className="labor-cost-display">
                  Labor Cost: <strong>{fmt(laborCost)}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <form onSubmit={handleRecordPayment} className="payment-form">
              <div className="form-group">
                <label className="form-label">Amount *</label>
                <input 
                  className="form-input" 
                  type="number" 
                  min="0.01" 
                  step="0.01"
                  value={newPayment.amount} 
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder={fmt(balanceDue)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-select" 
                  value={newPayment.method} 
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="venmo">Venmo</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Credit Card (Stripe)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input 
                  className="form-input" 
                  value={newPayment.notes} 
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Check number, transaction ID, etc."
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
