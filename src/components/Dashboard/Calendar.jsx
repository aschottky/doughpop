import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Receipt, ShoppingBag, CheckCircle } from 'lucide-react'
import './Calendar.css'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const navigate = useNavigate()
  const { getQuotes, getInvoices, getOrders, getTasks, completeTask } = useData()
  const configured = isSupabaseConfigured()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState({ quotes: [], invoices: [], orders: [], tasks: [] })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [view, setView] = useState('month') // month, week

  useEffect(() => {
    loadEvents()
  }, [currentDate, configured])

  const loadEvents = async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    
    try {
      const [quotes, invoices, orders, tasks] = await Promise.all([
        getQuotes(true), // include archived
        getInvoices(true),
        getOrders(),
        getTasks()
      ])
      
      setEvents({ quotes, invoices, orders, tasks })
    } catch (err) {
      console.error('Failed to load calendar events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskComplete = async (e, taskId, completed) => {
    e.stopPropagation()
    try {
      await completeTask(taskId, !completed)
      setEvents(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, is_completed: !completed } : t)
      }))
    } catch {
      // silently fail
    }
  }

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()
    
    const days = []
    
    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, events: [] })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      const dayEvents = {
        quotes: events.quotes.filter(q => q.event_date === dateStr && !q.is_archived),
        invoices: events.invoices.filter(i => i.due_date === dateStr && !i.is_archived && i.status !== 'paid'),
        orders: events.orders.filter(o => (o.event_date === dateStr || o.pickup_date === dateStr) && !o.is_archived),
        tasks: events.tasks.filter(t => t.due_date === dateStr)
      }
      
      days.push({ date: day, dateStr, events: dayEvents })
    }
    
    return days
  }, [currentDate, events])

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const goToToday = () => setCurrentDate(new Date())

  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="calendar-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h1>Calendar</h1>
          <p>View quotes, orders, and tasks at a glance</p>
        </div>
        <div className="calendar-controls">
          <button className="btn btn-ghost btn-sm" onClick={goToToday}>Today</button>
          <div className="calendar-nav">
            <button onClick={() => navigateMonth(-1)}><ChevronLeft size={18} /></button>
            <span className="calendar-month-label">{monthYearLabel}</span>
            <button onClick={() => navigateMonth(1)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="legend-dot legend-quotes" /> Quotes</div>
        <div className="legend-item"><span className="legend-dot legend-orders" /> Orders</div>
        <div className="legend-item"><span className="legend-dot legend-invoices" /> Invoices Due</div>
        <div className="legend-item"><span className="legend-dot legend-tasks" /> Tasks</div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-day-headers">
          {WEEK_DAYS.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day, idx) => (
            <div 
              key={idx} 
              className={`calendar-cell ${!day.date ? 'empty' : ''} ${day.dateStr === selectedDate ? 'selected' : ''}`}
              onClick={() => day.date && setSelectedDate(day.dateStr === selectedDate ? null : day.dateStr)}
            >
              {day.date && (
                <>
                  <div className="calendar-cell-date">{day.date}</div>
                  <div className="calendar-cell-events">
                    {day.events.quotes.length > 0 && (
                      <div className="event-row event-quotes">
                        <FileText size={12} />
                        {day.events.quotes.length}
                      </div>
                    )}
                    {day.events.orders.length > 0 && (
                      <div className="event-row event-orders">
                        <ShoppingBag size={12} />
                        {day.events.orders.length}
                      </div>
                    )}
                    {day.events.invoices.length > 0 && (
                      <div className="event-row event-invoices">
                        <Receipt size={12} />
                        {day.events.invoices.length}
                      </div>
                    )}
                    {day.events.tasks.length > 0 && (
                      <div className="event-row event-tasks">
                        <CheckCircle size={12} />
                        {day.events.tasks.filter(t => !t.is_completed).length}/{day.events.tasks.length}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="calendar-detail-panel">
          <div className="detail-panel-header">
            <h3>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>Close</button>
          </div>
          <DayDetail 
            date={selectedDate} 
            events={calendarDays.find(d => d.dateStr === selectedDate)?.events || { quotes: [], invoices: [], orders: [], tasks: [] }}
            onTaskComplete={handleTaskComplete}
            navigate={navigate}
          />
        </div>
      )}
    </div>
  )
}

function DayDetail({ date, events, onTaskComplete, navigate }) {
  return (
    <div className="day-detail">
      {events.orders.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Orders</h4>
          {events.orders.map(order => (
            <div key={order.id} className="detail-item detail-item-orders" onClick={() => navigate('/dashboard/orders')}>
              <ShoppingBag size={14} />
              <div>
                <strong>Order {order.order_number}</strong>
                <span className="text-muted">{order.customer_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.quotes.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Quotes</h4>
          {events.quotes.map(quote => (
            <div key={quote.id} className="detail-item detail-item-quotes" onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}>
              <FileText size={14} />
              <div>
                <strong>{quote.quote_number}</strong>
                <span className="text-muted">{quote.title || 'No title'}</span>
              </div>
              <span className={`status-badge status-${quote.status}`}>{quote.status}</span>
            </div>
          ))}
        </div>
      )}

      {events.invoices.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Invoices Due</h4>
          {events.invoices.map(invoice => (
            <div key={invoice.id} className="detail-item detail-item-invoices" onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}>
              <Receipt size={14} />
              <div>
                <strong>{invoice.invoice_number}</strong>
                <span className="text-muted">{invoice.title || 'No title'}</span>
              </div>
              <span className="amount">${invoice.total}</span>
            </div>
          ))}
        </div>
      )}

      {events.tasks.length > 0 && (
        <div className="detail-section">
          <h4 className="detail-section-title">Tasks</h4>
          {events.tasks.map(task => (
            <div key={task.id} className={`detail-item detail-item-tasks ${task.is_completed ? 'completed' : ''}`}>
              <button 
                className="task-check" 
                onClick={(e) => onTaskComplete(e, task.id, task.is_completed)}
              >
                <CheckCircle size={16} className={task.is_completed ? 'checked' : ''} />
              </button>
              <div>
                <strong>{task.description}</strong>
                <span className="text-muted task-category">{task.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.orders.length === 0 && events.quotes.length === 0 && events.invoices.length === 0 && events.tasks.length === 0 && (
        <div className="empty-state-sm">
          <p>No events scheduled for this day</p>
        </div>
      )}
    </div>
  )
}
