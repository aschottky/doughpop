import { Link } from 'react-router-dom'
import { Check, ArrowRight, FileText, Receipt, Users, Star } from 'lucide-react'
import './PaidLanding.css'

// This is a focused landing page for paid ads (Meta/Google)
// It has a single clear CTA and matches typical ad copy

const benefits = [
  'Send professional quotes in under 2 minutes',
  'Convert quotes to invoices with one click',
  'Get your own store page at doughpop.com/store/your-bakery',
  'Clients view and accept quotes without logging in',
  'Track who owes you money at a glance',
  'Free forever plan — no credit card required'
]

const socialProof = [
  { stars: 5, text: 'I used to send quotes as photos of sticky notes. DoughPop made me look professional.' },
  { stars: 5, text: 'My clients now pay faster because invoices look legit. Game changer!' },
  { stars: 5, text: 'Set up took 20 minutes. Sent 4 quotes the first week. Love it.' }
]

export default function PaidLanding() {
  // Get UTM params to pass through to signup
  const urlParams = new URLSearchParams(window.location.search)
  const utmSource = urlParams.get('utm_source') || 'paid'
  const utmMedium = urlParams.get('utm_medium') || 'ads'
  const utmCampaign = urlParams.get('utm_campaign') || 'acquisition'

  const signupUrl = `/auth?mode=signup&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`

  return (
    <div className="paid-landing">
      {/* Hero Section */}
      <section className="pl-hero">
        <div className="pl-container">
          <div className="pl-badge">
            <Star size={14} fill="currentColor" />
            Made for home bakers
          </div>
          <h1 className="pl-headline">
            Stop sending quotes in Instagram DMs.
            <span className="pl-headline-accent"> Get paid like a pro.</span>
          </h1>
          <p className="pl-subhead">
            DoughPop gives you professional quotes, invoices, and a client portal 
            — all in one place. Free to start. No credit card required.
          </p>
          <div className="pl-cta">
            <Link to={signupUrl} className="btn btn-primary btn-lg pl-cta-btn">
              Start Free — No Credit Card
              <ArrowRight size={18} />
            </Link>
            <p className="pl-cta-note">
              ✓ Free forever plan available &nbsp;|&nbsp; ✓ Cancel anytime
            </p>
          </div>

          {/* Social Proof */}
          <div className="pl-proof">
            {socialProof.map((item, i) => (
              <div key={i} className="pl-proof-card">
                <div className="pl-proof-stars">
                  {Array.from({ length: item.stars }).map((_, j) => (
                    <Star key={j} size={12} fill="currentColor" />
                  ))}
                </div>
                <p className="pl-proof-text">"{item.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="pl-benefits">
        <div className="pl-container">
          <h2 className="pl-section-title">
            Everything you need to run your bakery business
          </h2>
          <div className="pl-benefits-grid">
            {benefits.map((benefit, i) => (
              <div key={i} className="pl-benefit-item">
                <div className="pl-benefit-check">
                  <Check size={16} />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="pl-how-it-works">
        <div className="pl-container">
          <h2 className="pl-section-title">How it works</h2>
          <div className="pl-steps">
            <div className="pl-step">
              <div className="pl-step-num">1</div>
              <div className="pl-step-icon">
                <FileText size={20} />
              </div>
              <h3>Send a quote</h3>
              <p>Add your products, set prices, and send a professional quote in 2 minutes.</p>
            </div>
            <div className="pl-step">
              <div className="pl-step-num">2</div>
              <div className="pl-step-icon">
                <Users size={20} />
              </div>
              <h3>Client accepts</h3>
              <p>They view and accept your quote in a clean portal — no login required.</p>
            </div>
            <div className="pl-step">
              <div className="pl-step-num">3</div>
              <div className="pl-step-icon">
                <Receipt size={20} />
              </div>
              <h3>Get paid</h3>
              <p>Convert to invoice in one click. Track payments. Know who owes you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="pl-pricing">
        <div className="pl-container">
          <div className="pl-pricing-card">
            <div className="pl-pricing-badge">Start Free</div>
            <h3 className="pl-pricing-title">Free Forever Plan</h3>
            <div className="pl-pricing-price">
              <span className="pl-price">$0</span>
              <span className="pl-period">forever</span>
            </div>
            <ul className="pl-pricing-features">
              <li><Check size={14} /> Up to 10 products</li>
              <li><Check size={14} /> Up to 5 clients</li>
              <li><Check size={14} /> 10 quotes per month</li>
              <li><Check size={14} /> 10 invoices per month</li>
              <li><Check size={14} /> Public storefront</li>
            </ul>
            <Link to={signupUrl} className="btn btn-primary btn-lg pl-pricing-cta">
              Get Started Free
            </Link>
            <p className="pl-pricing-note">
              Upgrade to Pro ($12.99/mo) for unlimited everything
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pl-final-cta">
        <div className="pl-container">
          <h2>Ready to look professional?</h2>
          <p>Join home bakers who use DoughPop to send quotes and get paid.</p>
          <Link to={signupUrl} className="btn btn-primary btn-lg pl-cta-btn">
            Start Free — No Credit Card Required
            <ArrowRight size={18} />
          </Link>
          <p className="pl-cta-guarantee">
            ✓ Free forever plan &nbsp;|&nbsp; ✓ 30-day money-back guarantee on Pro
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pl-footer">
        <div className="pl-container">
          <p>© {new Date().getFullYear()} DoughPop. Built for home bakers.</p>
          <div className="pl-footer-links">
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/checklist">Free Resources</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
