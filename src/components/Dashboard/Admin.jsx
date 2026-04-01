import { useState, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Users, Crown, Shield, DollarSign, TrendingUp, Store, Search, Filter, MoreVertical, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '../Shared/Toast'
import { BarChart2 } from 'lucide-react'
import './Admin.css'

export default function Admin() {
  const navigate = useNavigate()
  const { getAllUsers, updateUserTier, updateUserAdminStatus, addAdminNote, deleteUserAsAdmin, getSystemStats } = useData()
  const { profile } = useAuth()
  const toast = useToast()
  const configured = isSupabaseConfigured()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Redirect non-admins
    if (configured && profile && !profile.is_admin) {
      navigate('/dashboard')
      toast.error('Admin access required')
      return
    }
    loadData()
  }, [configured, profile])

  const loadData = async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    try {
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getSystemStats()
      ])
      setUsers(usersData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToPro = async (userId) => {
    setProcessing(true)
    try {
      await updateUserTier(userId, 'pro')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: 'pro' } : u))
      toast.success('User upgraded to Pro')
    } catch {
      toast.error('Failed to update user')
    } finally {
      setProcessing(false)
    }
  }

  const handleDemoteToFree = async (userId) => {
    if (!window.confirm('Demote this user to Free?')) return
    setProcessing(true)
    try {
      await updateUserTier(userId, 'free')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: 'free' } : u))
      toast.success('User demoted to Free')
    } catch {
      toast.error('Failed to update user')
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleAdmin = async (userId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges?`)) return
    setProcessing(true)
    try {
      await updateUserAdminStatus(userId, !currentStatus)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u))
      toast.success(`Admin ${currentStatus ? 'removed' : 'granted'}`)
    } catch {
      toast.error('Failed to update admin status')
    } finally {
      setProcessing(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedUser) return
    setProcessing(true)
    try {
      await addAdminNote(selectedUser.id, adminNote)
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, admin_notes: adminNote } : u))
      toast.success('Note saved')
      setShowUserModal(false)
    } catch {
      toast.error('Failed to save note')
    } finally {
      setProcessing(false)
    }
  }

  const openUserModal = (user) => {
    setSelectedUser(user)
    setAdminNote(user.admin_notes || '')
    setShowUserModal(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    if (!window.confirm('Permanently delete this user and all of their data? This cannot be undone.')) return
    setProcessing(true)
    try {
      await deleteUserAsAdmin(selectedUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      setShowUserModal(false)
      setSelectedUser(null)
      toast.success('User account deleted')
    } catch (err) {
      console.error('deleteUserAsAdmin', err)
      const msg = err?.message || err?.error_description || err?.hint || String(err)
      const code = err?.code || ''
      const missingRpc =
        code === 'PGRST202' ||
        code === '42883' ||
        /could not find the function public\.admin_delete_user/i.test(msg) ||
        /function public\.admin_delete_user\(uuid\) does not exist/i.test(msg)
      if (missingRpc) {
        toast.error(
          'PostgREST cannot see admin_delete_user yet. In Supabase: re-run the CREATE FUNCTION block from supabase-schema.sql, then Settings → API → Restart, or wait a minute and retry.',
        )
      } else {
        toast.error(msg || 'Failed to delete user')
      }
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const searchMatch = !search || 
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.business_name || '').toLowerCase().includes(search.toLowerCase())
    
    const filterMatch = filter === 'all' || 
      (filter === 'pro' && u.subscription_tier === 'pro') ||
      (filter === 'free' && u.subscription_tier === 'free') ||
      (filter === 'admin' && u.is_admin) ||
      (filter === 'new' && new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    return searchMatch && filterMatch
  })

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="admin-container">
        <div className="empty-state">
          <Shield size={48} style={{ color: 'var(--honey)', marginBottom: '16px' }} />
          <h3>Admin Dashboard</h3>
          <p>Connect to Supabase to access admin features.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1><Shield size={28} style={{ color: 'var(--honey)' }} /> Admin Dashboard</h1>
          <p>Manage users, subscriptions, and system settings</p>
        </div>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-icon"><Users size={20} /></div>
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
          <div className="admin-stat pro">
            <div className="admin-stat-icon"><Crown size={20} /></div>
            <div className="admin-stat-value">{stats.proUsers}</div>
            <div className="admin-stat-label">Pro Users</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon"><Store size={20} /></div>
            <div className="admin-stat-value">{stats.publishedStores}</div>
            <div className="admin-stat-label">Live Stores</div>
          </div>
          <div className="admin-stat revenue">
            <div className="admin-stat-icon"><TrendingUp size={20} /></div>
            <div className="admin-stat-value">{fmt(stats.totalRevenue)}</div>
            <div className="admin-stat-label">Total Revenue</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-icon"><DollarSign size={20} /></div>
            <div className="admin-stat-value">{stats.pendingInvoices}</div>
            <div className="admin-stat-label">Pending Invoices</div>
          </div>
          <div className="admin-stat new">
            <div className="admin-stat-icon"><Users size={20} /></div>
            <div className="admin-stat-value">{stats.newUsersThisMonth}</div>
            <div className="admin-stat-label">New This Month</div>
          </div>
        </div>
      )}

      {stats?.acquisitionStats && (
        <div className="admin-section">
          <h3 className="admin-section-title"><BarChart2 size={18} /> Acquisition Sources</h3>
          <div className="acquisition-stats">
            {Object.entries(stats.acquisitionStats)
              .sort(([,a], [,b]) => b - a)
              .map(([source, count]) => (
                <div key={source} className="acquisition-stat">
                  <div className="acquisition-source">{source}</div>
                  <div className="acquisition-bar-container">
                    <div 
                      className="acquisition-bar" 
                      style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                    />
                  </div>
                  <div className="acquisition-count">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="admin-filters">
        <div className="admin-search">
          <Search size={16} />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search users by name, email, or business..."
          />
        </div>
        <div className="admin-filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Users</option>
            <option value="pro">Pro Tier</option>
            <option value="free">Free Tier</option>
            <option value="admin">Admins</option>
            <option value="new">New (Last 7 Days)</option>
          </select>
        </div>
      </div>

      <div className="admin-users-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Business</th>
              <th>Tier</th>
              <th>Store</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{(user.full_name || user.email || 'U')[0].toUpperCase()}</div>
                    <div className="user-info">
                      <strong>{user.full_name || 'No name'}</strong>
                      <span className="text-muted">{user.email}</span>
                      {user.is_admin && <span className="admin-badge"><Shield size={12} /> Admin</span>}
                    </div>
                  </div>
                </td>
                <td>{user.business_name || '—'}</td>
                <td>
                  <span className={`tier-badge tier-${user.subscription_tier}`}>
                    {user.subscription_tier === 'pro' ? <Crown size={12} /> : null}
                    {user.subscription_tier}
                  </span>
                </td>
                <td>
                  {user.stores?.is_published ? (
                    <span className="store-badge live"><CheckCircle size={12} /> Live</span>
                  ) : (
                    <span className="store-badge hidden"><XCircle size={12} /> Hidden</span>
                  )}
                </td>
                <td className="text-muted">{fmtDate(user.created_at)}</td>
                <td>
                  <div className="user-actions">
                    {user.subscription_tier === 'free' ? (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handlePromoteToPro(user.id)}
                        disabled={processing}
                      >
                        <Crown size={14} /> Upgrade to Pro
                      </button>
                    ) : (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleDemoteToFree(user.id)}
                        disabled={processing}
                      >
                        Demote to Free
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                      disabled={processing}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => openUserModal(user)}
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="empty-state-sm">
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>

      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="admin-user-detail">
              <div className="user-detail-header">
                <div className="user-avatar-lg">{(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}</div>
                <div>
                  <h4>{selectedUser.full_name || 'No name'}</h4>
                  <p className="text-muted">{selectedUser.email}</p>
                  <p className="text-muted">{selectedUser.business_name || 'No business name'}</p>
                </div>
              </div>

              <div className="user-detail-section">
                <h5>Subscription</h5>
                <div className="detail-row">
                  <span>Current Tier:</span>
                  <span className={`tier-badge tier-${selectedUser.subscription_tier}`}>
                    {selectedUser.subscription_tier}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span>{selectedUser.subscription_status || 'inactive'}</span>
                </div>
                {selectedUser.subscription_end_date && (
                  <div className="detail-row">
                    <span>Expires:</span>
                    <span>{fmtDate(selectedUser.subscription_end_date)}</span>
                  </div>
                )}
              </div>

              <div className="user-detail-section">
                <h5>Admin Notes</h5>
                <textarea 
                  className="form-textarea" 
                  value={adminNote} 
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add internal notes about this user..."
                  style={{ minHeight: '100px' }}
                />
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleSaveNote}
                  disabled={processing}
                  style={{ marginTop: '8px' }}
                >
                  {processing ? <Loader2 size={14} className="spinner" /> : 'Save Note'}
                </button>
              </div>

              {selectedUser.admin_notes && (
                <div className="user-detail-section">
                  <h5>Existing Notes</h5>
                  <div className="existing-notes">{selectedUser.admin_notes}</div>
                </div>
              )}

              <div className="user-detail-section danger-zone">
                <h5><AlertTriangle size={14} /> Danger Zone</h5>
                <div className="danger-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteUser}
                    disabled={processing}
                  >
                    {processing ? <Loader2 size={14} className="spinner" /> : 'Delete User Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
