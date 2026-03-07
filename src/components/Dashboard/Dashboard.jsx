import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { DataProvider } from '../../context/DataContext'
import { SubscriptionProvider } from '../../context/SubscriptionContext'
import Sidebar from './Sidebar'
import Overview from './Overview'
import QuoteList from './QuoteList'
import QuoteBuilder from './QuoteBuilder'
import InvoiceList from './InvoiceList'
import InvoiceBuilder from './InvoiceBuilder'
import ClientList from './ClientList'
import ClientDetail from './ClientDetail'
import ProductList from './ProductList'
import StoreSettings from './StoreSettings'
import Settings from './Settings'
import Upgrade from './Upgrade'
import './Dashboard.css'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SubscriptionProvider>
      <DataProvider>
        <div className="dashboard-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="dashboard-main">
            <div className="dashboard-topbar">
              <button
                className="dashboard-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="dashboard-content">
              <Routes>
                <Route index element={<Overview />} />
                <Route path="quotes" element={<QuoteList />} />
                <Route path="quotes/new" element={<QuoteBuilder />} />
                <Route path="quotes/:id" element={<QuoteBuilder />} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/new" element={<InvoiceBuilder />} />
                <Route path="invoices/:id" element={<InvoiceBuilder />} />
                <Route path="clients" element={<ClientList />} />
                <Route path="clients/:id" element={<ClientDetail />} />
                <Route path="products" element={<ProductList />} />
                <Route path="store" element={<StoreSettings />} />
                <Route path="settings" element={<Settings />} />
                <Route path="upgrade" element={<Upgrade />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </DataProvider>
    </SubscriptionProvider>
  )
}
