import { Link } from 'react-router-dom'
import { ArrowRight, Star, FileText, Users, ShoppingBag } from 'lucide-react'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-pattern" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">
            <Star size={13} fill="currentColor" />
            Made for home bakers
          </div>
          <h1 className="hero-headline">
            Your baking business,
            <span className="hero-headline-accent"> beautifully managed.</span>
          </h1>
          <p className="hero-subhead">
            DoughPop is the all-in-one platform for home bakers — send professional quotes, create invoices, manage clients, and run your own storefront. No spreadsheets. No chaos.
          </p>
          <div className="hero-cta">
            <Link to="/auth?mode=signup" className="btn btn-primary btn-lg hero-cta-primary">
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>
          <div className="hero-trust-badges">
            <span className="trust-badge">✓ No credit card required</span>
            <span className="trust-badge">✓ Free forever plan</span>
            <span className="trust-badge">✓ Cancel anytime</span>
          </div>
          <div className="hero-social-proof">
            <div className="hero-avatars">
              {['🧁', '🎂', '🥐', '🍰', '🍩'].map((emoji, i) => (
                <div key={i} className="hero-avatar-circle">{emoji}</div>
              ))}
            </div>
            <p>Join home bakers who manage <strong>quotes & invoices</strong> in one place</p>
          </div>
        </div>

        <div className="hero-visual animate-fade-in animate-delay-2">
          <div className="hero-mockup">
            <div className="hero-mockup-header">
              <div className="mockup-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="mockup-title">DoughPop Dashboard</span>
            </div>
            <div className="hero-mockup-body">
              <div className="mockup-stat-row">
                <div className="mockup-stat">
                  <div className="mockup-stat-icon mockup-stat-honey">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="mockup-stat-num">$3,240</div>
                    <div className="mockup-stat-label">This month</div>
                  </div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-icon mockup-stat-rose">
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="mockup-stat-num">47</div>
                    <div className="mockup-stat-label">Clients</div>
                  </div>
                </div>
                <div className="mockup-stat">
                  <div className="mockup-stat-icon mockup-stat-sage">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <div className="mockup-stat-num">12</div>
                    <div className="mockup-stat-label">Active orders</div>
                  </div>
                </div>
              </div>

              <div className="mockup-quote-card">
                <div className="mockup-quote-header">
                  <span className="mockup-quote-num">Q-0024</span>
                  <span className="badge badge-sent">Sent</span>
                </div>
                <div className="mockup-quote-client">Sarah Thompson</div>
                <div className="mockup-quote-items">
                  <div className="mockup-item">
                    <span>3-tier custom wedding cake</span>
                    <span>$420.00</span>
                  </div>
                  <div className="mockup-item">
                    <span>50× decorated cookies</span>
                    <span>$125.00</span>
                  </div>
                </div>
                <div className="mockup-quote-total">
                  <span>Total</span>
                  <strong>$545.00</strong>
                </div>
              </div>

              <div className="mockup-orders">
                <div className="mockup-orders-title">Recent Orders</div>
                {[
                  { name: 'Birthday cake – Emma R.', status: 'in_progress' },
                  { name: 'Macarons box – Tom W.', status: 'ready' },
                  { name: 'Sourdough loaves – Lisa K.', status: 'delivered' },
                ].map((o, i) => (
                  <div key={i} className="mockup-order-row">
                    <span>{o.name}</span>
                    <span className={`badge badge-${o.status.replace('_','-')}`}>
                      {o.status === 'in_progress' ? 'In Progress' : o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-floating-card hero-fc-1">
            <span className="hero-fc-emoji">✅</span>
            <span>Quote accepted!</span>
          </div>
          <div className="hero-floating-card hero-fc-2">
            <span className="hero-fc-emoji">💸</span>
            <span>Invoice paid — $185</span>
          </div>
        </div>
      </div>
    </section>
  )
}
