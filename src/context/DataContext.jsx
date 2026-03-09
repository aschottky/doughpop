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
