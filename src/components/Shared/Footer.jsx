import { Link } from 'react-router-dom'
import { Croissant, Instagram, Twitter } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="footer-logo-icon">
              <Croissant size={20} />
            </div>
            <span>DoughPop</span>
          </Link>
          <p>Your baking business, beautifully managed. Built with love for home bakers who take their craft seriously.</p>
          <div className="footer-social">
            <a href="#" className="footer-social-link" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" className="footer-social-link" aria-label="Twitter"><Twitter size={18} /></a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="/#features">Features</a></li>
              <li><a href="/#pricing">Pricing</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><Link to="/auth?mode=signup">Get Started Free</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/checklist">Free Order Checklist</Link></li>
              <li><a href="/blog/how-to-invoice-home-bakery">Invoice Template</a></li>
              <li><a href="/blog/cake-order-form-template">Order Form Template</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} DoughPop. Made for home bakers everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
