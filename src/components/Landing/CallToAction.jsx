import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './CallToAction.css'

export default function CallToAction() {
  return (
    <section className="cta-section section-sm">
      <div className="container">
        <div className="cta-inner animate-fade-in">
          <div className="cta-emoji">🎂</div>
          <h2>Your baking business deserves better than sticky notes</h2>
          <p>Join hundreds of home bakers running professional operations on DoughPop. Set up takes less than 20 minutes.</p>
          <div className="cta-actions">
            <Link to="/auth?mode=signup" className="btn btn-primary btn-lg">
              Create Your Free Account
              <ArrowRight size={18} />
            </Link>
            <p className="cta-note">No credit card required · Free forever plan available</p>
          </div>
        </div>
      </div>
    </section>
  )
}
