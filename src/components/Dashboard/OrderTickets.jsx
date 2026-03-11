import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, 
  CheckCircle, Printer, Filter, Search, Package,
  AlertCircle, ChevronDown, X, Cake, Cookie, ShoppingBag
} from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './OrderTickets.css'

const DEMO_ORDERS = [
  {
    id: '1',
    order_number: 'ORD-0001',
    customer_name: 'Sarah Thompson',
    customer_phone: '(512) 555-0101',
    customer_email: 'sarah@example.com',
    delivery_type: 'pickup',
    pickup_date: new Date(Date.now() + 86400000).toISOString(),
    event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'confirmed',
    notes: 'Allergic to nuts',
    internal_notes: 'VIP customer - extra care',
    order_items: [
      { 
        id: '1', 
        description: '6" Custom Birthday Cake',
        quantity: 1,
        customization_notes: 'Vanilla cake with strawberry filling. Buttercream frosting. "Happy 30th Birthday John" message. Blue and gold theme.',
        product_categories: { name: 'Cakes' }
      },
      { 
        id: '2', 
        description: 'Dozen Sugar Cookies',
        quantity: 1,
        customization_notes: 'Royal icing, star theme to match cake',
        product_categories: { name: 'Cookies' }
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    order_number: 'ORD-0002',
    customer_name: 'Mike & Jennifer',
    customer_phone: '(512) 555-0183',
    customer_email: 'mike@example.com',
    delivery_type: 'delivery',
    pickup_date: new Date(Date.now() + 172800000).toISOString(),
    event_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    status: 'in_progress',
    delivery_address: '123 Oak Street, Austin, TX 78701',
    notes: 'Wedding cake tasting went well',
    order_items: [
      { 
        id: '3', 
        description: 'Tiered Wedding Cake - 3 Tier',
        quantity: 1,
        customization_notes: '12"/9"/6" tiers. White almond cake with raspberry filling and vanilla buttercream. Fresh flowers on top tier. Serves 75.',
        product_categories: { name: 'Cakes' }
      },
      { 
        id: '4', 
        description: 'Cake Pops - 24 count',
        quantity: 1,
        customization_notes: 'White chocolate coating, silver sprinkles',
        product_categories: { name: 'Other' }
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    order_number: 'ORD-0003',
    customer_name: 'Emma Clark',
    customer_phone: '(512) 555-0294',
    customer_email: 'emma@example.com',
    delivery_type: 'pickup',
    pickup_date: new Date(Date.now() - 3600000).toISOString(),
    event_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: 'Rush order - baby shower tomorrow',
    internal_notes: 'Needs to be ready by 10am!',
    order_items: [
      { 
        id: '5', 
        description: 'Baby Shower Cupcakes',
        quantity: 2,
        customization_notes: '24 cupcakes total. Pink and mint green frosting. Baby themed toppers.',
        product_categories: { name: 'Cupcakes' }
      }
    ],
    created_at: new Date().toISOString()
  }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' }
]

export default function OrderTickets() {
  const { getOrders, updateOrderStatus } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadOrders()
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [configured])

  const loadOrders = async () => {
    if (!configured) {
      setOrders(DEMO_ORDERS)
      setLoading(false)
      return
    }
    try {
      const data = await getOrders()
      // Filter out archived orders
      setOrders(data.filter(o => !o.is_archived))
    } catch (err) {
      console.error('Failed to load orders:', err)
      setOrders(DEMO_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success(`Order marked as ${newStatus}`)
    } catch {
      toast.error('Failed to update order')
    }
  }

  const handlePrint = (order) => {
    // Open print dialog for the order ticket
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Ticket #${order.order_number}</title>
          <style>
            body { font-family: monospace; font-size: 14px; max-width: 300px; margin: 0 auto; padding: 20px; }
            h1 { font-size: 18px; text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .ticket-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .customer { text-align: center; margin: 15px 0; border: 1px solid #000; padding: 10px; }
            .item { border: 1px solid #000; margin: 10px 0; padding: 10px; }
            .notes { font-style: italic; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; }
            @media print { body { max-width: 100%; } }
          </style>
        </head>
        <body>
          <h1>ORDER TICKET<br>${order.order_number}</h1>
          <div class="customer">
            <strong>${order.customer_name}</strong><br>
            ${order.customer_phone || ''}<br>
            ${order.delivery_type === 'delivery' ? 'DELIVERY' : 'PICKUP'}<br>
            ${new Date(order.event_date || order.pickup_date).toLocaleDateString()}
          </div>
          ${order.order_items?.map(item => `
            <div class="item">
              <strong>${item.quantity}× ${item.description}</strong>
              ${item.customization_notes ? `<br><br>${item.customization_notes}` : ''}
            </div>
          `).join('') || ''}
          ${order.notes ? `<div class="notes"><strong>Customer Notes:</strong><br>${order.notes}</div>` : ''}
          ${order.internal_notes ? `<div class="notes"><strong>Kitchen Notes:</strong><br>${order.internal_notes}</div>` : ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const openDetail = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const filteredOrders = orders.filter(order => {
    const statusMatch = filter === 'all' || order.status === filter
    const searchMatch = !search || 
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_phone?.includes(search)
    return statusMatch && searchMatch
  })

  // Sort by date (soonest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.event_date || a.pickup_date || a.created_at)
    const dateB = new Date(b.event_date || b.pickup_date || b.created_at)
    return dateA - dateB
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'confirmed': return 'status-confirmed'
      case 'in_progress': return 'status-progress'
      case 'ready': return 'status-ready'
      case 'completed': return 'status-completed'
      default: return 'status-pending'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'cakes': return <Cake size={16} />
      case 'cookies': return <Cookie size={16} />
      default: return <ShoppingBag size={16} />
    }
  }

  if (loading) {
    return (
      <div className="order-tickets-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="order-tickets-container">
      <div className="order-tickets-header">
        <div className="order-tickets-header-left">
          <h1><Package size={28} style={{ color: 'var(--honey)' }} /> Order Tickets</h1>
          <p>Manage and track all your orders</p>
        </div>
        <div className="order-tickets-stats">
          <div className="ticket-stat">
            <span className="ticket-stat-value">{orders.filter(o => o.status === 'pending').length}</span>
            <span className="ticket-stat-label">Pending</span>
          </div>
          <div className="ticket-stat">
            <span className="ticket-stat-value">{orders.filter(o => o.status === 'in_progress').length}</span>
            <span className="ticket-stat-label">In Progress</span>
          </div>
          <div className="ticket-stat">
            <span className="ticket-stat-value">{orders.filter(o => o.status === 'ready').length}</span>
            <span className="ticket-stat-label">Ready</span>
          </div>
        </div>
      </div>

      <div className="order-tickets-filters">
        <div className="tickets-search">
          <Search size={16} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search order # or customer..."
          />
        </div>
        <div className="tickets-filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''} 
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ☐
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className={`order-tickets-${viewMode}`}>
        {sortedOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">🎂</div>
            <h3>No orders found</h3>
            <p>{search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'Orders will appear here when customers place them.'}</p>
          </div>
        ) : (
          sortedOrders.map(order => (
            <div 
              key={order.id} 
              className={`order-ticket ${getStatusColor(order.status)}`}
              onClick={() => openDetail(order)}
            >
              <div className="ticket-header">
                <div className="ticket-number">{order.order_number}</div>
                <div className={`ticket-status-badge ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="ticket-customer">
                <div className="customer-name">
                  <User size={14} />
                  {order.customer_name}
                </div>
                {order.customer_phone && (
                  <div className="customer-phone">
                    <Phone size={12} />
                    {order.customer_phone}
                  </div>
                )}
              </div>

              <div className="ticket-delivery">
                <div className="delivery-type">
                  {order.delivery_type === 'delivery' ? (
                    <><MapPin size={14} /> Delivery</>
                  ) : (
                    <><ShoppingBag size={14} /> Pickup</>
                  )}
                </div>
                <div className="due-date">
                  <Calendar size={12} />
                  {new Date(order.event_date || order.pickup_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="ticket-items">
                {(order.order_items || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="ticket-item">
                    <div className="item-icon">
                      {getCategoryIcon(item.product_categories?.name)}
                    </div>
                    <div className="item-details">
                      <div className="item-name">
                        {item.quantity}× {item.description}
                      </div>
                      {item.customization_notes && (
                        <div className="item-notes">{item.customization_notes}</div>
                      )}
                    </div>
                  </div>
                ))}
                {(order.order_items || []).length > 3 && (
                  <div className="more-items">+{(order.order_items.length - 3)} more items</div>
                )}
              </div>

              {(order.notes || order.internal_notes) && (
                <div className="ticket-alerts">
                  {order.notes && (
                    <div className="alert alert-customer">
                      <AlertCircle size={12} />
                      Customer Note
                    </div>
                  )}
                  {order.internal_notes && (
                    <div className="alert alert-internal">
                      <AlertCircle size={12} />
                      Kitchen Note
                    </div>
                  )}
                </div>
              )}

              <div className="ticket-actions" onClick={e => e.stopPropagation()}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => handlePrint(order)}
                  title="Print Ticket"
                >
                  <Printer size={14} />
                </button>
                {order.status !== 'completed' && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const nextStatus = 
                        order.status === 'pending' ? 'confirmed' :
                        order.status === 'confirmed' ? 'in_progress' :
                        order.status === 'in_progress' ? 'ready' : 'completed'
                      handleStatusChange(order.id, nextStatus)
                    }}
                  >
                    <CheckCircle size={14} />
                    {order.status === 'pending' ? 'Confirm' :
                     order.status === 'confirmed' ? 'Start' :
                     order.status === 'in_progress' ? 'Mark Ready' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content ticket-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order {selectedOrder.order_number}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            <div className="ticket-detail-content">
              <div className="detail-section customer-section">
                <h4>Customer</h4>
                <div className="detail-customer-info">
                  <div className="detail-row">
                    <User size={14} />
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="detail-row">
                      <Phone size={14} />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                  {selectedOrder.customer_email && (
                    <div className="detail-row">
                      <Mail size={14} />
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section delivery-section">
                <h4>Delivery / Pickup</h4>
                <div className="detail-delivery-info">
                  <div className="detail-row">
                    {selectedOrder.delivery_type === 'delivery' ? <MapPin size={14} /> : <ShoppingBag size={14} />}
                    <span>{selectedOrder.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                  </div>
                  <div className="detail-row">
                    <Calendar size={14} />
                    <span>{new Date(selectedOrder.event_date || selectedOrder.pickup_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="detail-address">
                      <MapPin size={14} />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section items-section">
                <h4>Order Items</h4>
                {(selectedOrder.order_items || []).map((item, idx) => (
                  <div key={idx} className="detail-item-card">
                    <div className="detail-item-header">
                      <span className="detail-item-qty">{item.quantity}×</span>
                      <span className="detail-item-name">{item.description}</span>
                    </div>
                    {item.customization_notes && (
                      <div className="detail-item-customization">
                        <strong>Details:</strong><br />
                        {item.customization_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div className="detail-section notes-section">
                  <h4>Customer Notes</h4>
                  <div className="detail-note-box customer-note">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {selectedOrder.internal_notes && (
                <div className="detail-section notes-section">
                  <h4>Kitchen Notes</h4>
                  <div className="detail-note-box internal-note">
                    {selectedOrder.internal_notes}
                  </div>
                </div>
              )}

              <div className="detail-status-flow">
                <h4>Update Status</h4>
                <div className="status-buttons">
                  {['pending', 'confirmed', 'in_progress', 'ready', 'completed'].map(status => (
                    <button
                      key={status}
                      className={`status-btn ${selectedOrder.status === status ? 'active' : ''}`}
                      onClick={() => {
                        handleStatusChange(selectedOrder.id, status)
                        setShowDetailModal(false)
                      }}
                    >
                      {status === 'pending' && <AlertCircle size={14} />}
                      {status === 'confirmed' && <CheckCircle size={14} />}
                      {status === 'in_progress' && <Clock size={14} />}
                      {status === 'ready' && <Package size={14} />}
                      {status === 'completed' && <CheckCircle size={14} />}
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => handlePrint(selectedOrder)}>
                  <Printer size={14} /> Print Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
