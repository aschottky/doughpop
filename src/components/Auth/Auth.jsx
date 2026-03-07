import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Croissant, Mail, Lock, User, Eye, EyeOff,
  ArrowLeft, Loader2, AlertTriangle, CheckCircle, Building2
} from 'lucide-react'
import './Auth.css'

function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const { user, signIn, signUp, signInWithProvider, resetPassword, isConfigured } = useAuth()

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [user, redirectTo, navigate])

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  if (!isConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <Link to="/" className="auth-back-btn">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <div className="auth-header">
            <div className="auth-logo">
              <Croissant size={30} />
            </div>
            <h1>Demo Mode</h1>
            <p>Supabase is not configured yet</p>
          </div>
          <div className="auth-demo-notice">
            <AlertTriangle size={22} />
            <div>
              <h3>Setup Required</h3>
              <p>To enable accounts, create a Supabase project and add your credentials to <code>.env</code>.</p>
              <ol>
                <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                <li>Copy your project URL and anon key</li>
                <li>Create <code>.env</code> with the credentials</li>
                <li>Run <code>supabase-schema.sql</code> in your project</li>
              </ol>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate(redirectTo, { replace: true })
      } else if (mode === 'signup') {
        if (password !== confirmPassword) throw new Error('Passwords do not match')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        await signUp(email, password, { full_name: fullName, business_name: businessName })
        setMessage('Check your email to confirm your account!')
        setMode('login')
      } else if (mode === 'forgot') {
        await resetPassword(email)
        setMessage('Password reset email sent! Check your inbox.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider) => {
    setError('')
    setLoading(true)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  const switchMode = (newMode) => { setMode(newMode); setError(''); setMessage('') }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-back-btn">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="auth-header">
          <div className="auth-logo">
            <Croissant size={30} />
          </div>
          <h1>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Start baking smarter'}
            {mode === 'forgot' && 'Reset your password'}
          </h1>
          <p>
            {mode === 'login' && 'Sign in to your DoughPop account'}
            {mode === 'signup' && 'Create your free DoughPop account'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle size={17} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <User size={15} />
                  Your Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Baker"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Building2 size={15} />
                  Bakery Name <span className="auth-optional">(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Jane's Sweet Creations"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={15} />
              Email Address
            </label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label className="form-label">
                <Lock size={15} />
                Password
              </label>
              <div className="auth-password-wrap">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">
                <Lock size={15} />
                Confirm Password
              </label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
              Forgot your password?
            </button>
          )}

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="spinner" />
                {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending...'}</>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="auth-oauth">
              <button
                type="button"
                className="auth-oauth-btn"
                onClick={() => handleOAuth('google')}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>
          </>
        )}

        <div className="auth-footer">
          {mode === 'login' && (
            <p>No account yet? <button onClick={() => switchMode('signup')}>Sign up free</button></p>
          )}
          {mode === 'signup' && (
            <p>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></p>
          )}
          {mode === 'forgot' && (
            <p>Remember it? <button onClick={() => switchMode('login')}>Back to sign in</button></p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth
