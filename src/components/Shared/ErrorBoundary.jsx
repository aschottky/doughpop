import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: 'var(--cream)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🥐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--chocolate)', marginBottom: '12px' }}>
            Something went sideways
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            className="btn btn-primary"
          >
            Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
