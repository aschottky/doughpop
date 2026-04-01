import { createContext, useContext, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export function DataProvider({ children }) {
  const { user } = useAuth()
  const configured = isSupabaseConfigured()

  // ─── Generic helpers ───────────────────────────────────────────────────────

  const q = useCallback((table) => {
    if (!configured || !user) throw new Error('Not authenticated')
    return supabase.from(table)
  }, [configured, user])

  // ─── Clients ───────────────────────────────────────────────────────────────

  const getClients = useCallback(async () => {
    const { data, error } = await q('clients')
      .select('*')
      .eq('baker_id', user.id)
      .eq('is_archived', false)
      .order('last_name', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createClient = useCallback(async (clientData) => {
    const { data, error } = await q('clients')
      .insert({ ...clientData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const updateClient = useCallback(async (id, updates) => {
    const { data, error } = await q('clients')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteClient = useCallback(async (id) => {
    const { error } = await q('clients')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Products ──────────────────────────────────────────────────────────────

  const getProducts = useCallback(async () => {
    const { data, error } = await q('products')
      .select('*, product_categories(name)')
      .eq('baker_id', user.id)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createProduct = useCallback(async (productData) => {
    const { data, error } = await q('products')
      .insert({ ...productData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const updateProduct = useCallback(async (id, updates) => {
    const { data, error } = await q('products')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteProduct = useCallback(async (id) => {
    const { error } = await q('products')
      .delete()
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Categories ────────────────────────────────────────────────────────────

  const getCategories = useCallback(async () => {
    const { data, error } = await q('product_categories')
      .select('*')
      .eq('baker_id', user.id)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createCategory = useCallback(async (name) => {
    const { data, error } = await q('product_categories')
      .insert({ name, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  // ─── Discount Presets ────────────────────────────────────────────────────

  const getDiscountPresets = useCallback(async () => {
    const { data, error } = await q('discount_presets')
      .select('*')
      .eq('baker_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createDiscountPreset = useCallback(async (presetData) => {
    const { data, error } = await q('discount_presets')
      .insert({ ...presetData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const updateDiscountPreset = useCallback(async (id, updates) => {
    const { data, error } = await q('discount_presets')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteDiscountPreset = useCallback(async (id) => {
    const { error } = await q('discount_presets')
      .delete()
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Quotes ────────────────────────────────────────────────────────────────

  const getQuotes = useCallback(async (includeArchived = false) => {
    let query = q('quotes')
      .select('*, clients(first_name, last_name, email)')
      .eq('baker_id', user.id)
    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const archiveQuote = useCallback(async (id, isArchived = true) => {
    const { data, error } = await q('quotes')
      .update({ is_archived: isArchived })
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const duplicateQuote = useCallback(async (quoteId) => {
    const { data: original } = await q('quotes')
      .select('*, quote_items(*)')
      .eq('id', quoteId)
      .eq('baker_id', user.id)
      .single()

    if (!original) throw new Error('Quote not found')

    const { data: numData } = await supabase.rpc('next_quote_number', { baker: user.id })

    const newQuote = {
      client_id: original.client_id,
      title: original.title ? `${original.title} (Copy)` : 'Copy of Quote',
      notes: original.notes,
      internal_notes: original.internal_notes,
      fees: original.fees,
      subtotal: original.subtotal,
      discount_type: original.discount_type,
      discount_value: original.discount_value,
      discount_amount: original.discount_amount,
      tax_rate: original.tax_rate,
      tax_amount: original.tax_amount,
      total: original.total,
      valid_until: null,
      event_date: original.event_date,
      status: 'draft'
    }

    const { data: quote, error } = await q('quotes')
      .insert({
        ...newQuote,
        baker_id: user.id,
        quote_number: numData || `Q-${Date.now()}`
      })
      .select()
      .single()
    if (error) throw error

    const items = original.quote_items || []
    if (items.length > 0) {
      const lineItems = items.map((item, i) => ({
        quote_id: quote.id,
        baker_id: user.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes,
        sort_order: i
      }))
      const { error: itemsError } = await q('quote_items').insert(lineItems)
      if (itemsError) throw itemsError
    }

    return quote
  }, [q, user])

  const getQuote = useCallback(async (id) => {
    const { data, error } = await q('quotes')
      .select('*, clients(*), quote_items(*)')
      .eq('id', id)
      .eq('baker_id', user.id)
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const createQuote = useCallback(async (quoteData, items = []) => {
    // Generate quote number
    const { data: numData } = await supabase.rpc('next_quote_number', { baker: user.id })
    const { data: quote, error } = await q('quotes')
      .insert({
        ...quoteData,
        baker_id: user.id,
        quote_number: numData || `Q-${Date.now()}`
      })
      .select()
      .single()
    if (error) throw error

    if (items.length > 0) {
      const lineItems = items.map((item, i) => ({
        ...item,
        quote_id: quote.id,
        baker_id: user.id,
        sort_order: i
      }))
      const { error: itemsError } = await q('quote_items').insert(lineItems)
      if (itemsError) throw itemsError
    }
    return quote
  }, [q, user])

  const updateQuote = useCallback(async (id, updates, items) => {
    const { data, error } = await q('quotes')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error

    if (items !== undefined) {
      await q('quote_items').delete().eq('quote_id', id).eq('baker_id', user.id)
      if (items.length > 0) {
        const lineItems = items.map((item, i) => ({
          ...item,
          quote_id: id,
          baker_id: user.id,
          sort_order: i
        }))
        const { error: itemsError } = await q('quote_items').insert(lineItems)
        if (itemsError) throw itemsError
      }
    }
    return data
  }, [q, user])

  const deleteQuote = useCallback(async (id) => {
    const { error } = await q('quotes')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Invoices ──────────────────────────────────────────────────────────────

  const getInvoices = useCallback(async (includeArchived = false) => {
    let query = q('invoices')
      .select('*, clients(first_name, last_name, email)')
      .eq('baker_id', user.id)
    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const archiveInvoice = useCallback(async (id, isArchived = true) => {
    const { data, error } = await q('invoices')
      .update({ is_archived: isArchived })
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const duplicateInvoice = useCallback(async (invoiceId) => {
    const { data: original } = await q('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .eq('baker_id', user.id)
      .single()

    if (!original) throw new Error('Invoice not found')

    const { data: numData } = await supabase.rpc('next_invoice_number', { baker: user.id })

    const newInvoice = {
      client_id: original.client_id,
      title: original.title ? `${original.title} (Copy)` : 'Copy of Invoice',
      notes: original.notes,
      internal_notes: original.internal_notes,
      fees: original.fees,
      payment_terms: original.payment_terms,
      subtotal: original.subtotal,
      discount_type: original.discount_type,
      discount_value: original.discount_value,
      discount_amount: original.discount_amount,
      tax_rate: original.tax_rate,
      tax_amount: original.tax_amount,
      total: original.total,
      due_date: null,
      event_date: original.event_date,
      status: 'draft'
    }

    const { data: invoice, error } = await q('invoices')
      .insert({
        ...newInvoice,
        baker_id: user.id,
        invoice_number: numData || `INV-${Date.now()}`
      })
      .select()
      .single()
    if (error) throw error

    const items = original.invoice_items || []
    if (items.length > 0) {
      const lineItems = items.map((item, i) => ({
        invoice_id: invoice.id,
        baker_id: user.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes,
        sort_order: i
      }))
      const { error: itemsError } = await q('invoice_items').insert(lineItems)
      if (itemsError) throw itemsError
    }

    return invoice
  }, [q, user])

  const getInvoice = useCallback(async (id) => {
    const { data, error } = await q('invoices')
      .select('*, clients(*), invoice_items(*)')
      .eq('id', id)
      .eq('baker_id', user.id)
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const createInvoice = useCallback(async (invoiceData, items = []) => {
    const { data: numData } = await supabase.rpc('next_invoice_number', { baker: user.id })
    const { data: invoice, error } = await q('invoices')
      .insert({
        ...invoiceData,
        baker_id: user.id,
        invoice_number: numData || `INV-${Date.now()}`
      })
      .select()
      .single()
    if (error) throw error

    if (items.length > 0) {
      const lineItems = items.map((item, i) => ({
        ...item,
        invoice_id: invoice.id,
        baker_id: user.id,
        sort_order: i
      }))
      const { error: itemsError } = await q('invoice_items').insert(lineItems)
      if (itemsError) throw itemsError
    }
    return invoice
  }, [q, user])

  const updateInvoice = useCallback(async (id, updates, items) => {
    const { data, error } = await q('invoices')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error

    if (items !== undefined) {
      await q('invoice_items').delete().eq('invoice_id', id).eq('baker_id', user.id)
      if (items.length > 0) {
        const lineItems = items.map((item, i) => ({
          ...item,
          invoice_id: id,
          baker_id: user.id,
          sort_order: i
        }))
        const { error: itemsError } = await q('invoice_items').insert(lineItems)
        if (itemsError) throw itemsError
      }
    }
    return data
  }, [q, user])

  const deleteInvoice = useCallback(async (id) => {
    const { error } = await q('invoices')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Store ─────────────────────────────────────────────────────────────────

  const getStore = useCallback(async () => {
    const { data, error } = await q('stores')
      .select('*')
      .eq('baker_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data
  }, [q, user])

  const saveStore = useCallback(async (storeData) => {
    const { data, error } = await q('stores')
      .upsert({ ...storeData, baker_id: user.id }, { onConflict: 'baker_id' })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  // ─── Orders ────────────────────────────────────────────────────────────────

  const getOrders = useCallback(async () => {
    const { data, error } = await q('orders')
      .select('*, clients(first_name, last_name), order_items(*)')
      .eq('baker_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const updateOrderStatus = useCallback(async (id, status) => {
    const { data, error } = await q('orders')
      .update({ status })
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  // ─── Dashboard stats ───────────────────────────────────────────────────────

  const getDashboardStats = useCallback(async () => {
    if (!configured || !user) return null
    try {
      const [invoicesRes, quotesRes, clientsRes, ordersRes] = await Promise.all([
        supabase.from('invoices').select('total, status, created_at').eq('baker_id', user.id),
        supabase.from('quotes').select('status, created_at').eq('baker_id', user.id),
        supabase.from('clients').select('id').eq('baker_id', user.id).eq('is_archived', false),
        supabase.from('orders').select('total, status, created_at').eq('baker_id', user.id)
      ])

      const invoices = invoicesRes.data || []
      const quotes = quotesRes.data || []
      const clients = clientsRes.data || []
      const orders = ordersRes.data || []

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const revenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.total || 0), 0)

      const monthlyRevenue = invoices
        .filter(i => i.status === 'paid' && new Date(i.created_at) >= thisMonth)
        .reduce((sum, i) => sum + parseFloat(i.total || 0), 0)

      return {
        totalRevenue: revenue,
        monthlyRevenue,
        totalClients: clients.length,
        pendingQuotes: quotes.filter(q => q.status === 'sent').length,
        activeOrders: orders.filter(o => ['pending','confirmed','in_progress'].includes(o.status)).length,
        unpaidInvoices: invoices.filter(i => i.status === 'sent').length,
        overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
        totalOrders: orders.length
      }
    } catch {
      return null
    }
  }, [configured, user])

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  const getTasks = useCallback(async (dateRange = null) => {
    let query = q('tasks')
      .select('*')
      .eq('baker_id', user.id)
      .order('due_date', { ascending: true })
      .order('sort_order', { ascending: true })
    
    if (dateRange?.from) {
      query = query.gte('due_date', dateRange.from)
    }
    if (dateRange?.to) {
      query = query.lte('due_date', dateRange.to)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [q, user])

  const createTask = useCallback(async (taskData) => {
    const { data, error } = await q('tasks')
      .insert({ ...taskData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const updateTask = useCallback(async (id, updates) => {
    const { data, error } = await q('tasks')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const completeTask = useCallback(async (id, isCompleted = true) => {
    const { data, error } = await q('tasks')
      .update({ 
        is_completed: isCompleted, 
        completed_at: isCompleted ? new Date().toISOString() : null 
      })
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteTask = useCallback(async (id) => {
    const { error } = await q('tasks')
      .delete()
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // Generate tasks from orders
  const generateTasksFromOrders = useCallback(async (orders, weekStart) => {
    const taskTemplates = {
      'Cakes': ['baking', 'frosting', 'decorating'],
      'Cupcakes': ['baking', 'frosting'],
      'Cookies': ['dough', 'baking', 'decorating'],
      'Bread': ['dough', 'baking'],
      'Pies': ['prepping', 'baking'],
      'Pastries': ['prepping', 'baking', 'frosting'],
      'default': ['prepping', 'baking']
    }

    const tasks = []
    
    for (const order of orders) {
      const items = order.order_items || []
      const categories = new Set()
      
      items.forEach(item => {
        const cat = item.product_categories?.name || 'default'
        const templates = taskTemplates[cat] || taskTemplates.default
        templates.forEach(t => categories.add(t))
      })

      // Create tasks 2 days before event/pickup
      const eventDate = new Date(order.event_date || order.pickup_date)
      const taskDate = new Date(eventDate)
      taskDate.setDate(taskDate.getDate() - 2)
      
      if (taskDate >= new Date(weekStart)) {
        categories.forEach((category, idx) => {
          tasks.push({
            order_id: order.id,
            category,
            description: `${category.charAt(0).toUpperCase() + category.slice(1)} for ${order.customer_name || 'Order ' + order.order_number}`,
            due_date: taskDate.toISOString().split('T')[0],
            sort_order: idx
          })
        })
      }
    }

    // Save all tasks
    if (tasks.length > 0) {
      const { error } = await q('tasks').insert(tasks.map(t => ({ ...t, baker_id: user.id })))
      if (error) throw error
    }
    
    return tasks.length
  }, [q, user])

  // ─── Payments ────────────────────────────────────────────────────────────────

  const getPayments = useCallback(async (invoiceId = null) => {
    let query = q('payments')
      .select('*')
      .eq('baker_id', user.id)
      .order('paid_at', { ascending: false })
    
    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [q, user])

  const recordPayment = useCallback(async (paymentData) => {
    const { data, error } = await q('payments')
      .insert({ ...paymentData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    
    // Update invoice balance
    const { data: invoice } = await q('invoices')
      .select('amount_paid, total')
      .eq('id', paymentData.invoice_id)
      .single()
    
    const newAmountPaid = (parseFloat(invoice.amount_paid) || 0) + parseFloat(paymentData.amount)
    const balanceDue = parseFloat(invoice.total) - newAmountPaid
    
    await q('invoices')
      .update({ 
        amount_paid: newAmountPaid, 
        balance_due: balanceDue,
        status: balanceDue <= 0 ? 'paid' : 'sent'
      })
      .eq('id', paymentData.invoice_id)
      .eq('baker_id', user.id)
    
    return data
  }, [q, user])

  const deletePayment = useCallback(async (paymentId, invoiceId, amount) => {
    const { error } = await q('payments')
      .delete()
      .eq('id', paymentId)
      .eq('baker_id', user.id)
    if (error) throw error
    
    // Update invoice balance
    const { data: invoice } = await q('invoices')
      .select('amount_paid, total')
      .eq('id', invoiceId)
      .single()
    
    const newAmountPaid = (parseFloat(invoice.amount_paid) || 0) - parseFloat(amount)
    const balanceDue = parseFloat(invoice.total) - newAmountPaid
    
    await q('invoices')
      .update({ 
        amount_paid: newAmountPaid, 
        balance_due: balanceDue,
        status: newAmountPaid <= 0 ? 'sent' : 'paid'
      })
      .eq('id', invoiceId)
      .eq('baker_id', user.id)
  }, [q, user])

  // ─── Email Log ───────────────────────────────────────────────────────────────

  const logEmail = useCallback(async (emailData) => {
    const { data, error } = await q('email_log')
      .insert({ ...emailData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const getEmailLog = useCallback(async (filters = {}) => {
    let query = q('email_log')
      .select('*')
      .eq('baker_id', user.id)
      .order('sent_at', { ascending: false })
    
    if (filters.type) {
      query = query.eq('email_type', filters.type)
    }
    if (filters.invoiceId) {
      query = query.eq('related_invoice_id', filters.invoiceId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [q, user])

  // ─── Email Templates ───────────────────────────────────────────────────────

  const getEmailTemplates = useCallback(async (type = null) => {
    let query = q('email_templates')
      .select('*')
      .eq('baker_id', user.id)
    
    if (type) {
      query = query.eq('template_type', type)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [q, user])

  const saveEmailTemplate = useCallback(async (templateData) => {
    const { data, error } = await q('email_templates')
      .upsert({ ...templateData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  // ─── Ingredients & Inventory ─────────────────────────────────────────────

  const getIngredients = useCallback(async () => {
    const { data, error } = await q('ingredients')
      .select('*')
      .eq('baker_id', user.id)
      .order('category', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createIngredient = useCallback(async (ingredientData) => {
    const { data, error } = await q('ingredients')
      .insert({ ...ingredientData, baker_id: user.id })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const updateIngredient = useCallback(async (id, updates) => {
    const { data, error } = await q('ingredients')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteIngredient = useCallback(async (id) => {
    const { error } = await q('ingredients')
      .delete()
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  const adjustInventory = useCallback(async (ingredientId, changeAmount, reason, notes = '', orderId = null) => {
    const { data: ingredient } = await q('ingredients')
      .select('stock_quantity')
      .eq('id', ingredientId)
      .single()
    
    const newQuantity = parseFloat(ingredient.stock_quantity) + parseFloat(changeAmount)
    
    await q('ingredients')
      .update({ stock_quantity: newQuantity })
      .eq('id', ingredientId)
      .eq('baker_id', user.id)
    
    const { data, error } = await q('inventory_log')
      .insert({
        ingredient_id: ingredientId,
        baker_id: user.id,
        change_amount: changeAmount,
        reason,
        related_order_id: orderId,
        notes
      })
      .select()
      .single()
    if (error) throw error
    return data
  }, [q, user])

  // ─── Bundles ───────────────────────────────────────────────────────────────

  const getBundles = useCallback(async () => {
    const { data, error } = await q('bundles')
      .select('*, bundle_items(*)')
      .eq('baker_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createBundle = useCallback(async (bundleData, items) => {
    const { data: bundle, error } = await q('bundles')
      .insert({ name: bundleData.name, description: bundleData.description, baker_id: user.id })
      .select()
      .single()
    if (error) throw error

    if (items?.length > 0) {
      const bundleItems = items.map((item, i) => ({
        bundle_id: bundle.id,
        item_name: item.name,
        quantity: item.quantity,
        sort_order: i
      }))
      await q('bundle_items').insert(bundleItems)
    }
    return bundle
  }, [q, user])

  const updateBundle = useCallback(async (id, updates, items) => {
    const { data, error } = await q('bundles')
      .update(updates)
      .eq('id', id)
      .eq('baker_id', user.id)
      .select()
      .single()
    if (error) throw error

    if (items !== undefined) {
      await q('bundle_items').delete().eq('bundle_id', id)
      if (items.length > 0) {
        const bundleItems = items.map((item, i) => ({
          bundle_id: id,
          item_name: item.name,
          quantity: item.quantity,
          sort_order: i
        }))
        await q('bundle_items').insert(bundleItems)
      }
    }
    return data
  }, [q, user])

  const deleteBundle = useCallback(async (id) => {
    const { error } = await q('bundles')
      .delete()
      .eq('id', id)
      .eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Baker Event Types ───────────────────────────────────────────────────

  const getEventTypes = useCallback(async () => {
    const { data, error } = await q('baker_event_types')
      .select('*').eq('baker_id', user.id).order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createEventType = useCallback(async (name, sortOrder = 0) => {
    const { data, error } = await q('baker_event_types')
      .insert({ baker_id: user.id, name, sort_order: sortOrder }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateEventType = useCallback(async (id, updates) => {
    const { data, error } = await q('baker_event_types')
      .update(updates).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteEventType = useCallback(async (id) => {
    const { error } = await q('baker_event_types').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Baker Flavors ──────────────────────────────────────────────────────

  const getFlavors = useCallback(async (category) => {
    let query = q('baker_flavors').select('*').eq('baker_id', user.id)
    if (category) query = query.eq('category', category)
    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createFlavor = useCallback(async (flavorData) => {
    const { data, error } = await q('baker_flavors')
      .insert({ ...flavorData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateFlavor = useCallback(async (id, updates) => {
    const { data, error } = await q('baker_flavors')
      .update(updates).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteFlavor = useCallback(async (id) => {
    const { error } = await q('baker_flavors').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Baker Sizes ────────────────────────────────────────────────────────

  const getSizes = useCallback(async (productType) => {
    let query = q('baker_sizes').select('*').eq('baker_id', user.id)
    if (productType) query = query.eq('product_type', productType)
    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createSize = useCallback(async (sizeData) => {
    const { data, error } = await q('baker_sizes')
      .insert({ ...sizeData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateSize = useCallback(async (id, updates) => {
    const { data, error } = await q('baker_sizes')
      .update(updates).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteSize = useCallback(async (id) => {
    const { error } = await q('baker_sizes').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Baker Contracts ────────────────────────────────────────────────────

  const getContracts = useCallback(async () => {
    const { data, error } = await q('baker_contracts')
      .select('*').eq('baker_id', user.id).eq('is_active', true).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const createContract = useCallback(async (contractData) => {
    const { data, error } = await q('baker_contracts')
      .insert({ ...contractData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateContract = useCallback(async (id, updates) => {
    const { data, error } = await q('baker_contracts')
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteContract = useCallback(async (id) => {
    const { error } = await q('baker_contracts').update({ is_active: false }).eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Baker Pricing Rules ────────────────────────────────────────────────

  const getPricingRules = useCallback(async () => {
    const { data, error } = await q('baker_pricing_rules')
      .select('*').eq('baker_id', user.id).order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const createPricingRule = useCallback(async (ruleData) => {
    const { data, error } = await q('baker_pricing_rules')
      .insert({ ...ruleData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updatePricingRule = useCallback(async (id, updates) => {
    const { data, error } = await q('baker_pricing_rules')
      .update(updates).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deletePricingRule = useCallback(async (id) => {
    const { error } = await q('baker_pricing_rules').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Recipes ────────────────────────────────────────────────────────────

  const getRecipes = useCallback(async () => {
    const { data, error } = await q('recipes')
      .select('*, recipe_ingredients(*, ingredients(*)), products(name)')
      .eq('baker_id', user.id)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  }, [q, user])

  const getRecipe = useCallback(async (id) => {
    const { data, error } = await q('recipes')
      .select('*, recipe_ingredients(*, ingredients(*)), products(name)')
      .eq('id', id).eq('baker_id', user.id).single()
    if (error) throw error
    return data
  }, [q, user])

  const createRecipe = useCallback(async (recipeData, ingredients = []) => {
    const { data: recipe, error } = await q('recipes')
      .insert({ ...recipeData, baker_id: user.id }).select().single()
    if (error) throw error
    if (ingredients.length > 0) {
      const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: recipe.id, sort_order: i }))
      await q('recipe_ingredients').insert(rows)
    }
    return recipe
  }, [q, user])

  const updateRecipe = useCallback(async (id, recipeData, ingredients) => {
    const { data, error } = await q('recipes')
      .update(recipeData).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    if (ingredients !== undefined) {
      await q('recipe_ingredients').delete().eq('recipe_id', id)
      if (ingredients.length > 0) {
        const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: id, sort_order: i }))
        await q('recipe_ingredients').insert(rows)
      }
    }
    return data
  }, [q, user])

  const deleteRecipe = useCallback(async (id) => {
    await q('recipe_ingredients').delete().eq('recipe_id', id)
    const { error } = await q('recipes').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Expenses ───────────────────────────────────────────────────────────

  const getExpenses = useCallback(async (startDate, endDate) => {
    let query = q('expenses').select('*').eq('baker_id', user.id)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    const { data, error } = await query.order('date', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const createExpense = useCallback(async (expenseData) => {
    const { data, error } = await q('expenses')
      .insert({ ...expenseData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateExpense = useCallback(async (id, updates) => {
    const { data, error } = await q('expenses')
      .update(updates).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteExpense = useCallback(async (id) => {
    const { error } = await q('expenses').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Mileage ────────────────────────────────────────────────────────────

  const getMileageLogs = useCallback(async (startDate, endDate) => {
    let query = q('mileage_logs').select('*, orders(order_number)').eq('baker_id', user.id)
    if (startDate) query = query.gte('trip_date', startDate)
    if (endDate) query = query.lte('trip_date', endDate)
    const { data, error } = await query.order('trip_date', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const createMileageLog = useCallback(async (logData) => {
    const amount = (parseFloat(logData.miles) || 0) * (parseFloat(logData.rate) || 0.67)
    const { data, error } = await q('mileage_logs')
      .insert({ ...logData, baker_id: user.id, amount: amount.toFixed(2) }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteMileageLog = useCallback(async (id) => {
    const { error } = await q('mileage_logs').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Care / Guide Templates ──────────────────────────────────────────────

  const getCareTemplates = useCallback(async () => {
    const { data, error } = await q('templates')
      .select('*').eq('baker_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q, user])

  const createCareTemplate = useCallback(async (templateData) => {
    const { data, error } = await q('templates')
      .insert({ ...templateData, baker_id: user.id }).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const updateCareTemplate = useCallback(async (id, updates) => {
    const { data, error } = await q('templates')
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('baker_id', user.id).select().single()
    if (error) throw error
    return data
  }, [q, user])

  const deleteCareTemplate = useCallback(async (id) => {
    const { error } = await q('templates').delete().eq('id', id).eq('baker_id', user.id)
    if (error) throw error
  }, [q, user])

  // ─── Generate Shopping List from Orders ────────────────────────────────────

  const generateShoppingList = useCallback(async (orders) => {
    // Get all recipes for products in orders
    const productIds = orders.flatMap(o => (o.order_items || []).map(i => i.product_id)).filter(Boolean)
    
    if (productIds.length === 0) return []

    const { data: recipes } = await q('recipes')
      .select('*, recipe_ingredients(*, ingredients(*))')
      .in('product_id', productIds)
      .eq('baker_id', user.id)

    // Aggregate ingredient quantities
    const ingredientMap = new Map()
    
    recipes?.forEach(recipe => {
      const orderItems = orders.flatMap(o => o.order_items || []).filter(i => i.product_id === recipe.product_id)
      const totalQuantity = orderItems.reduce((sum, i) => sum + (i.quantity || 1), 0)
      
      recipe.recipe_ingredients?.forEach(ri => {
        const needed = (ri.quantity || 0) * totalQuantity
        const current = ingredientMap.get(ri.ingredient_id) || { ...ri.ingredients, needed: 0 }
        current.needed += needed
        ingredientMap.set(ri.ingredient_id, current)
      })
    })

    // Check stock levels
    const shoppingList = []
    ingredientMap.forEach((ingredient, id) => {
      const inStock = parseFloat(ingredient.stock_quantity) || 0
      const needed = ingredient.needed
      const toBuy = Math.max(0, needed - inStock)
      
      if (toBuy > 0) {
        shoppingList.push({
          ingredient_id: id,
          name: ingredient.name,
          unit: ingredient.unit,
          needed,
          in_stock: inStock,
          to_buy: toBuy,
          unit_cost: ingredient.unit_cost
        })
      }
    })

    return shoppingList.sort((a, b) => a.name.localeCompare(b.name))
  }, [q, user])

  // ─── Admin Functions ─────────────────────────────────────────────────────

  const getAllUsers = useCallback(async () => {
    // Only admins can fetch all users
    const { data, error } = await q('profiles')
      .select('*, stores(slug, is_published)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [q])

  const updateUserTier = useCallback(async (userId, tier) => {
    const { data, error } = await q('profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q])

  const updateUserAdminStatus = useCallback(async (userId, isAdmin) => {
    const { data, error } = await q('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q])

  const addAdminNote = useCallback(async (userId, notes) => {
    const { data, error } = await q('profiles')
      .update({ admin_notes: notes })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }, [q])

  /** Calls DB RPC admin_delete_user (requires SQL from supabase-schema.sql on the project). */
  const deleteUserAsAdmin = useCallback(async (userId) => {
    if (!configured || !user) throw new Error('Not authenticated')
    if (user.id === userId) throw new Error('Cannot delete your own account')
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
    if (error) throw error
  }, [configured, user])

  const processRefund = useCallback(async (paymentId, amount, reason) => {
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        baker_id: user.id,
        amount,
        reason,
        processed_by: user.id
      })
      .select()
      .single()
    if (error) throw error
    return data
  }, [user])

  const getSystemStats = useCallback(async () => {
    const { data: users, error: usersError } = await q('profiles')
      .select('subscription_tier, is_admin, created_at, acquisition_source')
    if (usersError) throw usersError

    const { data: stores, error: storesError } = await q('stores')
      .select('is_published')
    if (storesError) throw storesError

    const { data: invoices, error: invoicesError } = await q('invoices')
      .select('total, status, created_at')
    if (invoicesError) throw invoicesError

    // Calculate acquisition stats
    const acquisitionStats = users.reduce((acc, u) => {
      const source = u.acquisition_source || 'direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.subscription_tier === 'pro').length,
      adminUsers: users.filter(u => u.is_admin).length,
      publishedStores: stores.filter(s => s.is_published).length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total || 0), 0),
      pendingInvoices: invoices.filter(i => i.status === 'sent').length,
      newUsersThisMonth: users.filter(u => {
        const created = new Date(u.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      acquisitionStats
    }
  }, [q])

  const value = {
    // Clients
    getClients, createClient, updateClient, deleteClient,
    // Products
    getProducts, createProduct, updateProduct, deleteProduct,
    // Categories
    getCategories, createCategory,
    // Discount Presets
    getDiscountPresets, createDiscountPreset, updateDiscountPreset, deleteDiscountPreset,
    // Quotes
    getQuotes, getQuote, createQuote, updateQuote, deleteQuote,
    archiveQuote, duplicateQuote,
    // Invoices
    getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice,
    archiveInvoice, duplicateInvoice,
    // Store
    getStore, saveStore,
    // Orders
    getOrders, updateOrderStatus,
    // Tasks
    getTasks, createTask, updateTask, completeTask, deleteTask, generateTasksFromOrders,
    // Payments
    getPayments, recordPayment, deletePayment,
    // Email
    logEmail, getEmailLog, getEmailTemplates, saveEmailTemplate,
    // Inventory
    getIngredients, createIngredient, updateIngredient, deleteIngredient, adjustInventory,
    // Bundles
    getBundles, createBundle, updateBundle, deleteBundle,
    // Shopping List
    generateShoppingList,
    // Baker Options (dropdowns)
    getEventTypes, createEventType, updateEventType, deleteEventType,
    getFlavors, createFlavor, updateFlavor, deleteFlavor,
    getSizes, createSize, updateSize, deleteSize,
    // Contracts
    getContracts, createContract, updateContract, deleteContract,
    // Pricing Rules
    getPricingRules, createPricingRule, updatePricingRule, deletePricingRule,
    // Recipes
    getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe,
    // Care Templates
    getCareTemplates, createCareTemplate, updateCareTemplate, deleteCareTemplate,
    // Expenses
    getExpenses, createExpense, updateExpense, deleteExpense,
    // Mileage
    getMileageLogs, createMileageLog, deleteMileageLog,
    // Admin
    getAllUsers, updateUserTier, updateUserAdminStatus, addAdminNote, deleteUserAsAdmin, processRefund, getSystemStats,
    // Stats
    getDashboardStats
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within a DataProvider')
  return context
}
