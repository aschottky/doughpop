import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  ArrowLeft, Plus, Trash2, Loader2, Send, CheckCircle,
  XCircle, FileText, Calendar, Tag, User, ChevronDown, Receipt
} from 'lucide-react'
import StatusBadge from '../Shared/StatusBadge'
import { useToast } from '../Shared/Toast'
import './Builder.css'

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0, subtotal: 0, notes: '', flavor_id: '', filling_id: '', frosting_id: '', size_id: '' }
const EMPTY_FEE = { name: '', type: 'fixed', value: 0 }

const FEE_PRESETS = [
  { name: 'Rush Fee', type: 'fixed' },
  { name: 'Delivery Fee', type: 'fixed' },
  { name: 'Setup Fee', type: 'fixed' },
  { name: 'Cake Cutting Fee', type: 'fixed' },
  { name: 'Custom Fee', type: 'fixed' }
]

export default function QuoteBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getQuote, createQuote, updateQuote, getClients, createClient, getProducts, getDiscountPresets, getEventTypes, getFlavors, getSizes, getContracts } = useData()
  const { profile } = useAuth()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [discountPresets, setDiscountPresets] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [batters, setBatters] = useState([])
  const [fillings, setFillings] = useState([])
  const [frostings, setFrostings] = useState([])
  const [sizes, setSizes] = useState([])
  const [contracts, setContracts] = useState([])
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
  const [eventTypeId, setEventTypeId] = useState('')
  const [contractId, setContractId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [fees, setFees] = useState([])
  const [quoteNumber, setQuoteNumber] = useState('')

  // Auto-save state
  const autoSaveRef = useRef(null)
  const lastSavedRef = useRef(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [id, configured])

  // Auto-save to localStorage
  const getFormState = useCallback(() => ({
    clientId, title, notes, internalNotes, validUntil, eventDate,
    taxRate, discountType, discountValue, items, fees
  }), [clientId, title, notes, internalNotes, validUntil, eventDate, taxRate, discountType, discountValue, items, fees])

  useEffect(() => {
    if (!isEdit && configured) {
      const state = getFormState()
      const stateHash = JSON.stringify(state)
      if (lastSavedRef.current !== stateHash) {
        setHasUnsavedChanges(true)
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          localStorage.setItem('quote_draft', JSON.stringify(state))
          lastSavedRef.current = stateHash
          setHasUnsavedChanges(false)
        }, 5000)
      }
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [getFormState, isEdit, configured])

  // Restore draft on mount or set client from query param
  useEffect(() => {
    if (!isEdit && !id) {
      const clientFromQuery = searchParams.get('client')
      if (clientFromQuery) {
        setClientId(clientFromQuery)
        // Remove client from URL after setting it
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('client')
        setSearchParams(newParams, { replace: true })
      } else {
        const saved = localStorage.getItem('quote_draft')
        if (saved) {
          try {
            const draft = JSON.parse(saved)
            setClientId(draft.clientId || '')
            setTitle(draft.title || '')
            setNotes(draft.notes || '')
            setInternalNotes(draft.internalNotes || '')
            setValidUntil(draft.validUntil || '')
            setEventDate(draft.eventDate || '')
            setTaxRate(draft.taxRate || 0)
            setDiscountType(draft.discountType || 'fixed')
            setDiscountValue(draft.discountValue || 0)
            setItems(draft.items?.length ? draft.items : [{ ...EMPTY_ITEM }])
            setFees(draft.fees || [])
          } catch {}
        }
      }
      if (!validUntil) {
        const d = new Date()
        d.setDate(d.getDate() + 14)
        setValidUntil(d.toISOString().split('T')[0])
      }
    }
  }, [isEdit, id, validUntil, searchParams, setSearchParams])

  const clearDraft = () => {
    localStorage.removeItem('quote_draft')
    lastSavedRef.current = null
    setHasUnsavedChanges(false)
  }

  const loadInitialData = async () => {
    if (configured) {
      try {
        const [clientData, productData] = await Promise.all([getClients(), getProducts()])
        setClients(clientData || [])
        setProducts(productData || [])
      } catch (err) {
        console.error('Failed to load clients/products:', err)
        toast.error('Failed to load clients and products')
      }
      try {
        const [presetData, evtData, batData, filData, froData, szData, conData] = await Promise.all([
          getDiscountPresets().catch(() => []),
          getEventTypes().catch(() => []),
          getFlavors('batter').catch(() => []),
          getFlavors('filling').catch(() => []),
          getFlavors('frosting').catch(() => []),
          getSizes().catch(() => []),
          getContracts().catch(() => []),
        ])
        setDiscountPresets(presetData || [])
        setEventTypes(evtData || [])
        setBatters(batData || [])
        setFillings(filData || [])
        setFrostings(froData || [])
        setSizes(szData || [])
        setContracts(conData || [])
      } catch (err) {
        console.error('Failed to load options:', err)
      }
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
        setEventTypeId(quote.event_type_id || '')
        setContractId(quote.contract_id || '')
        setQuoteNumber(quote.quote_number || '')
        setFees(quote.fees || [])
        setItems(quote.quote_items?.length ? quote.quote_items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          notes: i.notes || '',
          product_id: i.product_id || null,
          flavor_id: i.flavor_id || '',
          filling_id: i.filling_id || '',
          frosting_id: i.frosting_id || '',
          size_id: i.size_id || '',
        })) : [{ ...EMPTY_ITEM }])
      } catch {
        toast.error('Failed to load quote')
        navigate('/dashboard/quotes')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
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

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  const handleSave = async (newStatus) => {
    setSaving(true)
    const quoteData = {
      client_id: clientId || null,
      title, notes, internal_notes: internalNotes,
      valid_until: validUntil || null,
      event_date: eventDate || null,
      event_type_id: eventTypeId || null,
      contract_id: contractId || null,
      tax_rate: parseFloat(taxRate) || 0,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      discount_amount: discountAmount,
      fees: fees.filter(f => f.name.trim()),
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
      product_id: i.product_id || null,
      flavor_id: i.flavor_id || null,
      filling_id: i.filling_id || null,
      frosting_id: i.frosting_id || null,
      size_id: i.size_id || null,
    }))

    try {
      if (isEdit) {
        await updateQuote(id, { ...quoteData, ...(newStatus && { sent_at: newStatus === 'sent' ? new Date().toISOString() : undefined }) }, lineItems)
        toast.success(newStatus === 'sent' ? 'Quote sent!' : 'Quote saved')
        clearDraft()
      } else {
        const q = await createQuote(quoteData, lineItems)
        toast.success('Quote created')
        clearDraft()
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
          {!isEdit && hasUnsavedChanges && (
            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginRight: '8px' }}>
              Auto-saved draft
            </span>
          )}
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
              {eventTypes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select className="form-select" value={eventTypeId} onChange={(e) => setEventTypeId(e.target.value)}>
                    <option value="">Select event type…</option>
                    {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                  </select>
                </div>
              )}
              {contracts.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Contract / Terms</label>
                  <select className="form-select" value={contractId} onChange={(e) => setContractId(e.target.value)}>
                    <option value="">No contract attached</option>
                    {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
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
                    {(batters.length > 0 || fillings.length > 0 || frostings.length > 0 || sizes.length > 0) && (
                      <div className="item-options-row">
                        {batters.length > 0 && (
                          <select className="form-select item-option-select" value={item.flavor_id || ''} onChange={(e) => updateItem(i, 'flavor_id', e.target.value)}>
                            <option value="">Flavor…</option>
                            {batters.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        )}
                        {fillings.length > 0 && (
                          <select className="form-select item-option-select" value={item.filling_id || ''} onChange={(e) => updateItem(i, 'filling_id', e.target.value)}>
                            <option value="">Filling…</option>
                            {fillings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        )}
                        {frostings.length > 0 && (
                          <select className="form-select item-option-select" value={item.frosting_id || ''} onChange={(e) => updateItem(i, 'frosting_id', e.target.value)}>
                            <option value="">Frosting…</option>
                            {frostings.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        )}
                        {sizes.length > 0 && (
                          <select className="form-select item-option-select" value={item.size_id || ''} onChange={(e) => updateItem(i, 'size_id', e.target.value)}>
                            <option value="">Size…</option>
                            {sizes.map(s => <option key={s.id} value={s.id}>{s.name} {s.servings ? `(${s.servings} svg)` : ''}</option>)}
                          </select>
                        )}
                      </div>
                    )}
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

          <div className="card card-padding builder-section">
            <div className="builder-section-title"><Receipt size={14} /> Additional Fees</div>
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

        {/* Sidebar summary */}
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

            {discountAmount > 0 && (
              <div className="summary-row summary-row-discount">
                <span>Discount</span>
                <span>−{fmt(discountAmount)}</span>
              </div>
            )}

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
