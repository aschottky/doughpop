import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import {
  Croissant, LayoutDashboard, FileText, Receipt,
  Users, Package, ShoppingBag, Settings, Zap, X, LogOut, Store, Calendar, CheckSquare, Archive, Shield
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { icon: <LayoutDashboard size={19} />, label: 'Overview', path: '/dashboard' },
  { icon: <Calendar size={19} />, label: 'Calendar', path: '/dashboard/calendar' },
  { icon: <CheckSquare size={19} />, label: 'Tasks', path: '/dashboard/tasks' },
  { icon: <FileText size={19} />, label: 'Quotes', path: '/dashboard/quotes' },
  { icon: <Receipt size={19} />, label: 'Invoices', path: '/dashboard/invoices' },
  { icon: <Users size={19} />, label: 'Clients', path: '/dashboard/clients' },
  { icon: <Package size={19} />, label: 'Products', path: '/dashboard/products' },
  { icon: <Archive size={19} />, label: 'Bundles', path: '/dashboard/bundles' },
  { icon: <Store size={19} />, label: 'My Store', path: '/dashboard/store' },
]

const bottomItems = [
  { icon: <Settings size={19} />, label: 'Settings', path: '/dashboard/settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const { isPro } = useSubscription()

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    try { await signOut() } catch {}
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={onClose}>
            <div className="sidebar-logo-icon">
              <Croissant size={20} />
            </div>
            <span>DoughPop</span>
          </Link>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {(profile?.full_name || profile?.email || 'B')[0].toUpperCase()}
          </div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">
              {profile?.business_name || profile?.full_name || 'My Bakery'}
            </div>
            <div className="sidebar-profile-tier">
              <span className={`badge badge-${isPro ? 'pro' : 'free'}`}>
                {isPro ? 'Pro' : 'Starter'}
              </span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'sidebar-nav-item-active' : ''}`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              to="/dashboard/admin"
              className={`sidebar-nav-item ${isActive('/dashboard/admin') ? 'sidebar-nav-item-active' : ''}`}
              onClick={onClose}
            >
              <Shield size={19} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          {!isPro && (
            <Link to="/dashboard/upgrade" className="sidebar-upgrade-card" onClick={onClose}>
              <Zap size={16} />
              <div>
                <strong>Upgrade to Pro</strong>
                <span>Unlock unlimited everything</span>
              </div>
            </Link>
          )}

          {bottomItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'sidebar-nav-item-active' : ''}`}
              onClick={onClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <button className="sidebar-nav-item sidebar-signout-btn" onClick={handleSignOut}>
            <LogOut size={19} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
