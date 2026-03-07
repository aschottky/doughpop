import { Star } from 'lucide-react'
import './Testimonials.css'

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'Austin, TX',
    emoji: '🧁',
    stars: 5,
    quote: 'I used to send quotes as a photo of a sticky note. DoughPop made me look like a real professional. My clients now actually pay faster because invoices look so legitimate!'
  },
  {
    name: 'Jessica L.',
    location: 'Portland, OR',
    emoji: '🍰',
    stars: 5,
    quote: 'The client portal is a game-changer. My brides can see their wedding cake quote, request changes, and accept — without me having to chase them on Instagram.'
  },
  {
    name: 'Amanda R.',
    location: 'Nashville, TN',
    emoji: '🎂',
    stars: 5,
    quote: 'In my first month with DoughPop I sent 18 quotes and converted 14 of them. The professional presentation made such a difference. Worth every penny of Pro.'
  },
  {
    name: 'Priya K.',
    location: 'Chicago, IL',
    emoji: '🥐',
    stars: 5,
    quote: 'My storefront page has gotten me 6 new clients who just found me on Google. Never thought I\'d have a real online presence for my cottage bakery.'
  },
  {
    name: 'Lauren T.',
    location: 'Denver, CO',
    emoji: '🍩',
    stars: 5,
    quote: 'I finally know who my best clients are and what products make the most money. The analytics feature alone is worth upgrading to Pro.'
  },
  {
    name: 'Maria G.',
    location: 'Miami, FL',
    emoji: '🥧',
    stars: 5,
    quote: 'Setting it up took 20 minutes. By the end of the week I had sent 4 quotes and gotten paid for 3 of them. The free plan was more than enough to start.'
  }
]

function Stars({ count }) {
  return (
    <div className="testimonial-stars">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="currentColor" />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="testimonials section" id="testimonials">
      <div className="container">
        <div className="section-header animate-fade-in">
          <div className="section-label">Testimonials</div>
          <h2>Home bakers love DoughPop</h2>
          <p>Join hundreds of home bakers who turned their passion into a professional operation.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className={`testimonial-card animate-fade-in animate-delay-${Math.min(i % 3 + 1, 5)}`}>
              <Stars count={t.stars} />
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.emoji}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-location">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
