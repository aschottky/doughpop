import { useState, useEffect, useCallback } from 'react'
import { useData } from '../../context/DataContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  BarChart3, DollarSign, TrendingUp, Calendar, Download,
  Printer, ShoppingCart, Truck, Package, PieChart
} from 'lucide-react'
import { useToast } from '../Shared/Toast'
import './Reports.css'

const REPORT_TABS = [
  { key: 'cashflow', label: 'Cash Flow', icon: <DollarSign size={16} /> },
  { key: 'sales', label: 'Sales', icon: <TrendingUp size={16} /> },
  { key: 'orders-completed', label: 'Completed Orders', icon: <Package size={16} /> },
  { key: 'orders-upcoming', label: 'Upcoming Orders', icon: <Calendar size={16} /> },
  { key: 'by-event', label: 'By Event Type', icon: <PieChart size={16} /> },
  { key: 'expenses', label: 'Expenses', icon: <ShoppingCart size={16} /> },
  { key: 'mileage', label: 'Mileage', icon: <Truck size={16} /> },
  { key: 'monthly', label: 'Monthly Income', icon: <BarChart3 size={16} /> },
]

export default function Reports() {
  const { getOrders, getInvoices, getExpenses, getMileageLogs, getQuotes } = useData()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [tab, setTab] = useState('cashflow')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [expenses, setExpenses] = useState([])
  const [mileage, setMileage] = useState([])
  const [quotes, setQuotes] = useState([])

  const thisYear = new Date().getFullYear()
  const [dateFrom, setDateFrom] = useState(`${thisYear}-01-01`)
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  const loadData = useCallback(async () => {
    if (!configured) { setLoading(false); return }
    setLoading(true)
    try {
      const [ord, inv, exp, mil, quo] = await Promise.all([
        getOrders().catch(() => []),
        getInvoices().catch(() => []),
        getExpenses(dateFrom, dateTo).catch(() => []),
        getMileageLogs(dateFrom, dateTo).catch(() => []),
        getQuotes().catch(() => []),
      ])
      setOrders(ord || [])
      setInvoices(inv || [])
      setExpenses(exp || [])
      setMileage(mil || [])
      setQuotes(quo || [])
    } catch (err) {
      console.error('Reports load error:', err)
    } finally {
      setLoading(false)
    }
  }, [configured, dateFrom, dateTo])

  useEffect(() => { loadData() }, [loadData])

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const totalMileage = mileage.reduce((s, m) => s + parseFloat(m.amount || 0), 0)
  const netProfit = totalRevenue - totalExpenses - totalMileage

  const completedOrders = orders.filter(o => o.status === 'delivered')
  const upcomingOrders = orders.filter(o => !['cancelled', 'delivered'].includes(o.status) && o.event_date >= dateFrom)

  // Monthly breakdown
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    const prefix = `${thisYear}-${month}`
    const rev = paidInvoices.filter(inv => inv.created_at?.startsWith(prefix)).reduce((s, inv) => s + parseFloat(inv.total || 0), 0)
    const exp = expenses.filter(e => e.date?.startsWith(prefix)).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    return { month: new Date(thisYear, i).toLocaleString('default', { month: 'short' }), revenue: rev, expenses: exp, profit: rev - exp }
  })
  const maxMonthlyVal = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.expenses)), 1)

  // Expense categories
  const expenseByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'other'
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0)
    return acc
  }, {})

  // Event type breakdown (from quotes)
  const byEvent = {}
  quotes.forEach(q => {
    const evtName = q.event_type_id ? 'Custom' : 'General'
    byEvent[evtName] = (byEvent[evtName] || 0) + 1
  })

  const exportCSV = (rows, filename) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="loading-spinner" /></div>

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Financial reports, order analytics, and expense breakdowns</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </button>
      </div>

      <div className="reports-summary-cards">
        <div className="rpt-card rpt-card-revenue">
          <span className="rpt-card-label">Total Revenue</span>
          <span className="rpt-card-value">{fmt(totalRevenue)}</span>
        </div>
        <div className="rpt-card rpt-card-expenses">
          <span className="rpt-card-label">Total Expenses</span>
          <span className="rpt-card-value">{fmt(totalExpenses)}</span>
        </div>
        <div className="rpt-card rpt-card-mileage">
          <span className="rpt-card-label">Mileage Cost</span>
          <span className="rpt-card-value">{fmt(totalMileage)}</span>
        </div>
        <div className={`rpt-card ${netProfit >= 0 ? 'rpt-card-profit' : 'rpt-card-loss'}`}>
          <span className="rpt-card-label">Net Profit</span>
          <span className="rpt-card-value">{fmt(netProfit)}</span>
        </div>
      </div>

      <div className="reports-tabs">
        {REPORT_TABS.map(t => (
          <button key={t.key} className={`bo-tab ${tab === t.key ? 'bo-tab-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="reports-filters">
        <div className="lists-date-range">
          <label>From</label>
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label>To</label>
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="card reports-content">
        {tab === 'cashflow' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Cash Flow</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(
                [...paidInvoices.map(i => ({ type: 'income', date: i.created_at?.split('T')[0], description: i.invoice_number, amount: i.total })),
                 ...expenses.map(e => ({ type: 'expense', date: e.date, description: e.vendor, amount: `-${e.amount}` }))],
                'cashflow.csv'
              )}><Download size={14} /> CSV</button>
            </div>
            <table className="lists-table">
              <thead><tr><th>Type</th><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                {[...paidInvoices.map(i => ({ type: 'income', date: i.created_at?.split('T')[0] || '', desc: i.invoice_number, amount: parseFloat(i.total || 0), key: `i-${i.id}` })),
                  ...expenses.map(e => ({ type: 'expense', date: e.date || '', desc: `${e.vendor || ''} (${e.category || ''})`, amount: -parseFloat(e.amount || 0), key: `e-${e.id}` }))
                ].sort((a, b) => b.date.localeCompare(a.date)).map(row => (
                  <tr key={row.key}>
                    <td><span className={`lists-status ${row.type === 'income' ? 'lists-status-delivered' : 'lists-status-cancelled'}`}>{row.type}</span></td>
                    <td>{row.date}</td>
                    <td>{row.desc}</td>
                    <td className={row.amount >= 0 ? 'rpt-positive' : 'rpt-negative'}>{fmt(Math.abs(row.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'sales' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Sales Report</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(
                invoices.map(i => ({ invoice: i.invoice_number, date: i.created_at?.split('T')[0], status: i.status, total: i.total, paid: i.amount_paid, balance: i.balance_due })),
                'sales.csv'
              )}><Download size={14} /> CSV</button>
            </div>
            <table className="lists-table">
              <thead><tr><th>Invoice</th><th>Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead>
              <tbody>
                {invoices.length === 0 ? <tr><td colSpan="6" className="lists-empty">No invoices</td></tr> : null}
                {invoices.map(i => (
                  <tr key={i.id}>
                    <td className="lists-bold">{i.invoice_number}</td>
                    <td>{i.created_at?.split('T')[0]}</td>
                    <td><span className={`lists-status lists-status-${i.status}`}>{i.status}</span></td>
                    <td>{fmt(i.total)}</td>
                    <td>{fmt(i.amount_paid)}</td>
                    <td className={parseFloat(i.balance_due) > 0 ? 'rpt-negative' : ''}>{fmt(i.balance_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders-completed' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Completed Orders ({completedOrders.length})</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(
                completedOrders.map(o => ({ order: o.order_number, customer: o.customer_name, date: o.event_date, total: o.total })),
                'completed-orders.csv'
              )}><Download size={14} /> CSV</button>
            </div>
            <table className="lists-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Event Date</th><th>Total</th></tr></thead>
              <tbody>
                {completedOrders.length === 0 ? <tr><td colSpan="4" className="lists-empty">No completed orders</td></tr> : null}
                {completedOrders.map(o => (
                  <tr key={o.id}>
                    <td className="lists-bold">{o.order_number}</td>
                    <td>{o.customer_name || '—'}</td>
                    <td>{o.event_date || '—'}</td>
                    <td>{fmt(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders-upcoming' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Upcoming Orders ({upcomingOrders.length})</h3>
            </div>
            <table className="lists-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Event Date</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {upcomingOrders.length === 0 ? <tr><td colSpan="5" className="lists-empty">No upcoming orders</td></tr> : null}
                {upcomingOrders.map(o => (
                  <tr key={o.id}>
                    <td className="lists-bold">{o.order_number}</td>
                    <td>{o.customer_name || '—'}</td>
                    <td>{o.event_date || '—'}</td>
                    <td><span className={`lists-status lists-status-${o.status}`}>{o.status}</span></td>
                    <td>{fmt(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'by-event' && (
          <div className="rpt-section">
            <div className="rpt-section-header"><h3>Breakdown by Event Type</h3></div>
            <div className="rpt-bar-chart">
              {Object.entries(byEvent).length === 0 ? <p className="lists-empty">No data yet</p> : null}
              {Object.entries(byEvent).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} className="rpt-bar-row">
                  <span className="rpt-bar-label">{name}</span>
                  <div className="rpt-bar-track">
                    <div className="rpt-bar-fill" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(byEvent))) * 100)}%` }} />
                  </div>
                  <span className="rpt-bar-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Expense Report — {fmt(totalExpenses)}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(
                expenses.map(e => ({ date: e.date, vendor: e.vendor, category: e.category, amount: e.amount, notes: e.notes })),
                'expenses.csv'
              )}><Download size={14} /> CSV</button>
            </div>
            <div className="rpt-expense-cats">
              {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                <div key={cat} className="rpt-bar-row">
                  <span className="rpt-bar-label" style={{ textTransform: 'capitalize' }}>{cat}</span>
                  <div className="rpt-bar-track">
                    <div className="rpt-bar-fill rpt-bar-fill-expense" style={{ width: `${(amount / totalExpenses) * 100}%` }} />
                  </div>
                  <span className="rpt-bar-value">{fmt(amount)}</span>
                </div>
              ))}
            </div>
            <table className="lists-table" style={{ marginTop: '16px' }}>
              <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead>
              <tbody>
                {expenses.length === 0 ? <tr><td colSpan="5" className="lists-empty">No expenses recorded</td></tr> : null}
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.vendor || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{e.category || '—'}</td>
                    <td>{fmt(e.amount)}</td>
                    <td className="rpt-notes">{e.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'mileage' && (
          <div className="rpt-section">
            <div className="rpt-section-header">
              <h3>Mileage Report — {mileage.reduce((s, m) => s + parseFloat(m.miles || 0), 0).toFixed(1)} miles, {fmt(totalMileage)}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => exportCSV(
                mileage.map(m => ({ date: m.trip_date, from: m.from_address, to: m.to_address, miles: m.miles, rate: m.rate, amount: m.amount, purpose: m.purpose })),
                'mileage.csv'
              )}><Download size={14} /> CSV</button>
            </div>
            <table className="lists-table">
              <thead><tr><th>Date</th><th>From</th><th>To</th><th>Miles</th><th>Rate</th><th>Amount</th><th>Purpose</th></tr></thead>
              <tbody>
                {mileage.length === 0 ? <tr><td colSpan="7" className="lists-empty">No mileage recorded</td></tr> : null}
                {mileage.map(m => (
                  <tr key={m.id}>
                    <td>{m.trip_date}</td>
                    <td>{m.from_address || '—'}</td>
                    <td>{m.to_address || '—'}</td>
                    <td>{m.miles}</td>
                    <td>${m.rate}</td>
                    <td>{fmt(m.amount)}</td>
                    <td>{m.purpose || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'monthly' && (
          <div className="rpt-section">
            <div className="rpt-section-header"><h3>Monthly Income — {thisYear}</h3></div>
            <div className="rpt-monthly-chart">
              {monthlyData.map((d, i) => (
                <div key={i} className="rpt-month-col">
                  <div className="rpt-month-bars">
                    <div className="rpt-month-bar rpt-month-bar-rev" style={{ height: `${(d.revenue / maxMonthlyVal) * 140}px` }} title={`Revenue: ${fmt(d.revenue)}`} />
                    <div className="rpt-month-bar rpt-month-bar-exp" style={{ height: `${(d.expenses / maxMonthlyVal) * 140}px` }} title={`Expenses: ${fmt(d.expenses)}`} />
                  </div>
                  <span className="rpt-month-label">{d.month}</span>
                  <span className="rpt-month-val">{d.revenue > 0 ? fmt(d.revenue) : ''}</span>
                </div>
              ))}
            </div>
            <div className="rpt-chart-legend">
              <span><span className="rpt-legend-dot rpt-legend-rev" /> Revenue</span>
              <span><span className="rpt-legend-dot rpt-legend-exp" /> Expenses</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
