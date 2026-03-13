import { useState, useEffect, useCallback } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  List, ShoppingCart, Truck, Calendar, CheckSquare, Printer,
  Filter, Search, Cake, ClipboardList, ChevronDown
} from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './Lists.css'

const LIST_TABS = [
  { key: 'orders', label: 'Orders', icon: <ClipboardList size={16} /> },
  { key: 'quotes', label: 'Quotes', icon: <List size={16} /> },
  { key: 'baking', label: 'Baking List', icon: <Cake size={16} /> },
  { key: 'baking-type', label: 'By Flavor', icon: <Cake size={16} /> },
  { key: 'shopping', label: 'Shopping', icon: <ShoppingCart size={16} /> },
  { key: 'deliveries', label: 'Deliveries', icon: <Truck size={16} /> },
  { key: 'todos', label: 'To-Do', icon: <CheckSquare size={16} /> },
]

export default function Lists() {
  const {
    getOrders, getQuotes, getTasks, completeTask,
    generateShoppingList, getFlavors, getSizes,
  } = useData()
  const { profile } = useAuth()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [tab, setTab] = useState('orders')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [bakingData, setBakingData] = useState([])
  const [checkedItems, setCheckedItems] = useState(new Set())

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(nextWeek)
  const [statusFilter, setStatusFilter] = useState('')

  const loadData = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    try {
      const [orderData, quoteData, taskData] = await Promise.all([
        getOrders().catch(() => []),
        getQuotes().catch(() => []),
        getTasks().catch(() => []),
      ])
      setOrders(orderData || [])
      setQuotes(quoteData || [])
      setTasks(taskData || [])

      if (orderData?.length) {
        try {
          const sl = await generateShoppingList(orderData.filter(o => o.status !== 'cancelled' && o.status !== 'delivered'))
          setShoppingList(sl || [])
        } catch { setShoppingList([]) }
      }

      buildBakingList(orderData || [])
    } catch (err) {
      console.error('Lists load error:', err)
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => { loadData() }, [loadData])

  const buildBakingList = (orderData) => {
    const activeOrders = orderData.filter(o => !['cancelled', 'delivered'].includes(o.status))
    const itemsByProduct = new Map()

    activeOrders.forEach(order => {
      (order.order_items || []).forEach(item => {
        const key = item.description || item.product_id || 'Unknown'
        const existing = itemsByProduct.get(key) || { description: key, totalQty: 0, orders: [] }
        existing.totalQty += item.quantity || 1
        existing.orders.push({
          orderNumber: order.order_number,
          quantity: item.quantity || 1,
          eventDate: order.event_date || order.pickup_date,
          flavor: item.flavor_id,
          size: item.size_id,
          notes: item.customization_notes || item.notes,
        })
        itemsByProduct.set(key, existing)
      })
    })

    setBakingData(Array.from(itemsByProduct.values()).sort((a, b) => b.totalQty - a.totalQty))
  }

  const filterByDate = (items, dateField) => {
    return items.filter(i => {
      const d = i[dateField]
      if (!d) return true
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
  }

  const filteredOrders = filterByDate(orders, 'event_date').filter(o => !statusFilter || o.status === statusFilter)
  const filteredQuotes = filterByDate(quotes, 'event_date').filter(q => !statusFilter || q.status === statusFilter)
  const deliveries = filteredOrders.filter(o => o.delivery_type === 'delivery' && !['cancelled', 'delivered'].includes(o.status))
  const filteredTasks = filterByDate(tasks, 'due_date').filter(t => !statusFilter || (statusFilter === 'done' ? t.is_completed : !t.is_completed))

  const handleToggleTask = async (id) => {
    try {
      await completeTask(id)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    } catch (err) { toast.error(err.message) }
  }

  const toggleCheck = (id) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handlePrint = () => window.print()

  const fmt = (n) => n != null ? `$${parseFloat(n).toFixed(2)}` : '—'

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="lists-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Lists</h1>
          <p>Order, baking, shopping, delivery, and to-do lists</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="lists-tabs">
        {LIST_TABS.map(t => (
          <button key={t.key} className={`bo-tab ${tab === t.key ? 'bo-tab-active' : ''}`} onClick={() => { setTab(t.key); setStatusFilter('') }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="lists-filters">
        <div className="lists-date-range">
          <label>From</label>
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label>To</label>
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="card lists-content">
        {tab === 'orders' && (
          <div className="lists-table-wrap">
            <table className="lists-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Event Date</th><th>Status</th><th>Total</th><th>Delivery</th></tr></thead>
              <tbody>
                {filteredOrders.length === 0 ? <tr><td colSpan="6" className="lists-empty">No orders in this date range</td></tr> : null}
                {filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td className="lists-bold">{o.order_number}</td>
                    <td>{o.customer_name || o.clients?.first_name || '—'}</td>
                    <td>{o.event_date || '—'}</td>
                    <td><span className={`lists-status lists-status-${o.status}`}>{o.status}</span></td>
                    <td>{fmt(o.total)}</td>
                    <td>{o.delivery_type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'quotes' && (
          <div className="lists-table-wrap">
            <table className="lists-table">
              <thead><tr><th>Quote #</th><th>Client</th><th>Title</th><th>Event Date</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {filteredQuotes.length === 0 ? <tr><td colSpan="6" className="lists-empty">No quotes in this date range</td></tr> : null}
                {filteredQuotes.map(q => (
                  <tr key={q.id}>
                    <td className="lists-bold">{q.quote_number}</td>
                    <td>{q.clients?.first_name} {q.clients?.last_name || ''}</td>
                    <td>{q.title || '—'}</td>
                    <td>{q.event_date || '—'}</td>
                    <td><span className={`lists-status lists-status-${q.status}`}>{q.status}</span></td>
                    <td>{fmt(q.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'baking' && (
          <div className="lists-table-wrap">
            <table className="lists-table">
              <thead><tr><th>Item</th><th>Total Qty</th><th>Orders</th></tr></thead>
              <tbody>
                {bakingData.length === 0 ? <tr><td colSpan="3" className="lists-empty">No active baking items</td></tr> : null}
                {bakingData.map((item, i) => (
                  <tr key={i}>
                    <td className="lists-bold">{item.description}</td>
                    <td>{item.totalQty}</td>
                    <td>
                      {item.orders.map((o, j) => (
                        <span key={j} className="lists-order-tag">{o.orderNumber} ({o.quantity}x) {o.eventDate ? `— ${o.eventDate}` : ''}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'baking-type' && (
          <div className="baking-by-type">
            {bakingData.length === 0 ? (
              <div className="lists-empty-block">No active orders to generate baking list</div>
            ) : (
              bakingData.map((item, i) => (
                <div key={i} className="baking-type-card">
                  <div className="baking-type-header">
                    <Cake size={18} />
                    <h3>{item.description}</h3>
                    <span className="baking-type-qty">{item.totalQty} total</span>
                  </div>
                  <div className="baking-type-orders">
                    {item.orders.map((o, j) => (
                      <div key={j} className="baking-type-order">
                        <span className="baking-type-order-num">{o.orderNumber}</span>
                        <span>{o.quantity}x</span>
                        {o.notes && <span className="baking-type-note">{o.notes}</span>}
                        {o.eventDate && <span className="baking-type-date">{o.eventDate}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'shopping' && (
          <div className="lists-table-wrap">
            <table className="lists-table">
              <thead><tr><th></th><th>Ingredient</th><th>Needed</th><th>In Stock</th><th>To Buy</th><th>Unit</th><th>Est. Cost</th></tr></thead>
              <tbody>
                {shoppingList.length === 0 ? <tr><td colSpan="7" className="lists-empty">Shopping list is empty (no recipes linked to orders)</td></tr> : null}
                {shoppingList.map(item => (
                  <tr key={item.ingredient_id} className={checkedItems.has(item.ingredient_id) ? 'lists-checked' : ''}>
                    <td><input type="checkbox" checked={checkedItems.has(item.ingredient_id)} onChange={() => toggleCheck(item.ingredient_id)} /></td>
                    <td className="lists-bold">{item.name}</td>
                    <td>{item.needed?.toFixed(1)}</td>
                    <td>{item.in_stock?.toFixed(1)}</td>
                    <td className="lists-bold">{item.to_buy?.toFixed(1)}</td>
                    <td>{item.unit}</td>
                    <td>{item.unit_cost ? fmt(item.to_buy * item.unit_cost) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'deliveries' && (
          <div className="lists-table-wrap">
            <table className="lists-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Address</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {deliveries.length === 0 ? <tr><td colSpan="6" className="lists-empty">No upcoming deliveries</td></tr> : null}
                {deliveries.map(o => (
                  <tr key={o.id}>
                    <td className="lists-bold">{o.order_number}</td>
                    <td>{o.customer_name || '—'}</td>
                    <td>{o.event_date || o.pickup_date || '—'}</td>
                    <td>{o.delivery_address ? <a href={`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address)}`} target="_blank" rel="noreferrer">{o.delivery_address}</a> : '—'}</td>
                    <td>{o.customer_phone || '—'}</td>
                    <td><span className={`lists-status lists-status-${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'todos' && (
          <div className="lists-todo">
            {filteredTasks.length === 0 ? (
              <div className="lists-empty-block">No tasks in this date range</div>
            ) : (
              filteredTasks.map(t => (
                <div key={t.id} className={`lists-todo-item ${t.is_completed ? 'lists-todo-done' : ''}`}>
                  <input type="checkbox" checked={t.is_completed} onChange={() => handleToggleTask(t.id)} />
                  <div className="lists-todo-info">
                    <span className="lists-todo-desc">{t.description}</span>
                    <span className="lists-todo-meta">{t.category} {t.due_date ? `· ${t.due_date}` : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
