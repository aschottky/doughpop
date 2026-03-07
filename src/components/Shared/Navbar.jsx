import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Croissant, Menu, X, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut, profile } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    try { await signOut() } catch {}
  }

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'For Bakers', href: '/#how-it-works' },
  ]

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Croissant size={22} />
          </div>
          <span>DoughPop</span>
        </Link>

        <nav className="navbar-links">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="navbar-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user">
              <button
                className="navbar-user-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="navbar-avatar">
                  {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
                </div>
                <span className="navbar-user-name">
                  {profile?.business_name || profile?.full_name || 'My Bakery'}
                </span>
                <ChevronDown size={15} />
              </button>
              {userMenuOpen && (
                <div className="navbar-user-menu">
                  <Link to="/dashboard" className="navbar-user-item">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="navbar-user-item navbar-user-item-danger">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/auth" className="navbar-signin-link">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn btn-primary btn-sm">
                Start Free
              </Link>
            </>
          )}
        </div>

        <button
          className="navbar-mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="navbar-mobile-link">
              {link.label}
            </a>
          ))}
          <div className="navbar-mobile-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Sign In
                </Link>
                <Link to="/auth?mode=signup" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
