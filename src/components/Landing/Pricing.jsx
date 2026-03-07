import { Link } from 'react-router-dom'
import { Check, Zap } from 'lucide-react'
import { TIER_INFO } from '../../context/SubscriptionContext'
import './Pricing.css'

export default function Pricing() {
  const starter = TIER_INFO.free
  const pro = TIER_INFO.pro

  return (
    <section className="pricing section" id="pricing">
      <div className="container">
        <div className="section-header animate-fade-in">
          <div className="section-label">Pricing</div>
          <h2>Start free, grow into Pro</h2>
          <p>No credit card required to get started. Upgrade when your baking business takes off.</p>
        </div>

        <div className="pricing-cards">
          <div className="pricing-card animate-fade-in animate-delay-1">
            <div className="pricing-card-header">
              <div className="pricing-plan-badge pricing-plan-badge-free">Free</div>
              <div className="pricing-price">
                <span className="pricing-amount">$0</span>
                <span className="pricing-period">forever</span>
              </div>
              <p className="pricing-desc">Perfect for getting started and testing the waters with your first clients.</p>
            </div>
            <ul className="pricing-features">
              {starter.features.map((f, i) => (
                <li key={i}>
                  <Check size={16} className="pricing-check pricing-check-free" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth?mode=signup" className="btn btn-ghost pricing-btn">
              Get Started Free
            </Link>
          </div>

          <div className="pricing-card pricing-card-pro animate-fade-in animate-delay-2">
            <div className="pricing-popular-badge">
              <Zap size={12} fill="currentColor" />
              Most Popular
            </div>
            <div className="pricing-card-header">
              <div className="pricing-plan-badge pricing-plan-badge-pro">Pro</div>
              <div className="pricing-price">
                <span className="pricing-amount">{pro.price}</span>
                <span className="pricing-period">{pro.priceNote}</span>
              </div>
              <p className="pricing-desc">For home bakers ready to run a serious, professional operation.</p>
            </div>
            <ul className="pricing-features">
              {pro.features.map((f, i) => (
                <li key={i}>
                  <Check size={16} className="pricing-check pricing-check-pro" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth?mode=signup" className="btn btn-primary pricing-btn">
              Start Free Trial
            </Link>
            <p className="pricing-trial-note">14-day free trial, cancel anytime</p>
          </div>
        </div>

        <div className="pricing-guarantee animate-fade-in animate-delay-3">
          <span className="pricing-guarantee-emoji">🛡️</span>
          <div>
            <strong>30-day money-back guarantee</strong>
            <p>If DoughPop doesn't work for your baking business within 30 days, we'll give you a full refund. No questions asked.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
