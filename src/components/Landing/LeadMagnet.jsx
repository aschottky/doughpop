import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Download, ArrowLeft, FileText, Cake, Receipt, ClipboardList } from 'lucide-react'
import './LeadMagnet.css'

const checklistItems = [
  'Custom cake order form template (printable)',
  'Professional invoice checklist for home bakers',
  'Deposit & payment policy template',
  'Client communication best practices',
  'Order tracking spreadsheet template'
]

export default function LeadMagnet() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // In production, this would send to your email service (ConvertKit, Mailchimp, etc.)
    // For now, we'll simulate the submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
    
    // Track the conversion
    if (typeof gtag !== 'undefined') {
      gtag('event', 'lead_magnet_download', {
        event_category: 'marketing',
        event_label: 'cake_order_checklist'
      })
    }
  }

  return (
    <div className="lead-magnet-page">
      <div className="lm-container">
        <Link to="/" className="lm-back-link">
          <ArrowLeft size={18} />
          Back to DoughPop
        </Link>

        <div className="lm-content">
          <div className="lm-header">
            <div className="lm-badge">
              <Download size={14} />
              Free Download
            </div>
            <h1 className="lm-title">
              The Complete Cake Order & Invoice Checklist
            </h1>
            <p className="lm-subtitle">
              Everything you need to look professional and never miss a detail on your custom cake orders.
            </p>
          </div>

          <div className="lm-preview">
            <div className="lm-preview-card">
              <div className="lm-preview-icon">
                <FileText size={24} />
              </div>
              <h3>Order Form Template</h3>
              <p>Capture all client details: flavors, fillings, design, delivery, and allergies.</p>
            </div>
            <div className="lm-preview-card">
              <div className="lm-preview-icon lm-icon-rose">
                <Receipt size={24} />
              </div>
              <h3>Invoice Checklist</h3>
              <p>Never forget deposits, final payments, or delivery fees again.</p>
            </div>
            <div className="lm-preview-card">
              <div className="lm-preview-icon lm-icon-sage">
                <ClipboardList size={24} />
              </div>
              <h3>Policy Templates</h3>
              <p>Ready-to-use cancellation and payment policy language.</p>
            </div>
          </div>

          <div className="lm-includes">
            <h3>What you will get:</h3>
            <ul className="lm-checklist">
              {checklistItems.map((item, i) => (
                <li key={i}>
                  <Check size={18} className="lm-check-icon" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {!submitted ? (
            <div className="lm-form-section">
              <h3>Get your free checklist</h3>
              <p className="lm-form-subtitle">
                Enter your email and we will send the download link instantly.
              </p>
              <form onSubmit={handleSubmit} className="lm-form">
                <div className="lm-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="lm-input"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary lm-submit-btn"
                  >
                    {loading ? 'Sending...' : 'Get Free Checklist'}
                  </button>
                </div>
                <p className="lm-privacy">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            </div>
          ) : (
            <div className="lm-success">
              <div className="lm-success-icon">🎉</div>
              <h3>Check your email!</h3>
              <p>
                We have sent the download link to <strong>{email}</strong>.
                <br />
                (Check your spam folder just in case!)
              </p>
              <div className="lm-cta-box">
                <p className="lm-cta-text">
                  Want to skip the templates and get a tool that does it all?
                </p>
                <Link to="/auth?mode=signup&utm_source=lead_magnet&utm_medium=content&utm_campaign=cake_checklist" className="btn btn-primary lm-cta-btn">
                  Try DoughPop Free →
                </Link>
              </div>
            </div>
          )}

          <div className="lm-footer">
            <p>
              Brought to you by <Link to="/">DoughPop</Link> — the all-in-one platform for home bakers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
