import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public pages
import Navbar from './components/Shared/Navbar'
import Footer from './components/Shared/Footer'
import Hero from './components/Landing/Hero'
import Features from './components/Landing/Features'
import HowItWorks from './components/Landing/HowItWorks'
import Pricing from './components/Landing/Pricing'
import Testimonials from './components/Landing/Testimonials'
import CallToAction from './components/Landing/CallToAction'

// Auth
import Auth from './components/Auth/Auth'

// Dashboard
import Dashboard from './components/Dashboard/Dashboard'

// Public store
import Storefront from './components/Store/Storefront'

// Client portal
import ClientPortal from './components/Portal/ClientPortal'

import './App.css'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) { el.scrollIntoView({ behavior: 'smooth' }) } else { window.scrollTo(0, 0) }
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function DashboardGate({ children }) {
  const { user, loading, isConfigured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isConfigured) return children
  if (!loading && !user && location.pathname.startsWith('/dashboard')) {
    navigate('/auth?redirect=' + encodeURIComponent(location.pathname + location.search), { replace: true })
    return null
  }
  return children
}

function AppContent() {
  const { user, loading, isConfigured } = useAuth()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const location = useLocation()

  const isDashboard = location.pathname.startsWith('/dashboard')
  const isAuthPage = location.pathname === '/auth'
  const isAuthRequired = isDashboard || isAuthPage

  useEffect(() => {
    if (loading && isConfigured && isAuthRequired) {
      const t = setTimeout(() => setLoadingTimeout(true), 5000)
      return () => clearTimeout(t)
    }
    setLoadingTimeout(false)
  }, [loading, isConfigured, isAuthRequired])

  if (loading && isConfigured && isAuthRequired && !loadingTimeout) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '8px' }}>
          Taking too long? <a href="/" style={{ color: 'var(--honey)' }}>Refresh page</a>
        </p>
      </div>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Landing */}
        <Route path="/" element={
          <div className="app">
            <Navbar />
            <main>
              <Hero />
              <Features />
              <HowItWorks />
              <Testimonials />
              <Pricing />
              <CallToAction />
            </main>
            <Footer />
          </div>
        } />

        {/* Auth */}
        <Route path="/auth" element={<Auth />} />

        {/* Dashboard (protected) */}
        <Route path="/dashboard" element={
          <DashboardGate>
            <Dashboard />
          </DashboardGate>
        } />
        <Route path="/dashboard/*" element={
          <DashboardGate>
            <Dashboard />
          </DashboardGate>
        } />

        {/* Public store */}
        <Route path="/store/:slug" element={<Storefront />} />

        {/* Client portal */}
        <Route path="/portal/:token" element={<ClientPortal />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
