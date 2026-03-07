import './HowItWorks.css'

const steps = [
  {
    num: '01',
    title: 'Set up your bakery',
    desc: 'Create your profile, add your signature products with photos and pricing, and customize your store page with your brand colors and story.',
    emoji: '🥐'
  },
  {
    num: '02',
    title: 'Send a quote',
    desc: 'When a client reaches out, build a detailed quote with line items, set a valid-until date, and send it. They get a clean client portal link — no login needed.',
    emoji: '📨'
  },
  {
    num: '03',
    title: 'Convert to invoice',
    desc: 'Quote accepted? Convert it to an invoice in one click. Set a due date, track payment, and mark it paid. Your books stay spotless.',
    emoji: '✅'
  },
  {
    num: '04',
    title: 'Grow your business',
    desc: 'Watch your revenue dashboard fill up. See your best clients, most popular products, and monthly revenue at a glance. Bake more, stress less.',
    emoji: '📈'
  }
]

export default function HowItWorks() {
  return (
    <section className="how-it-works section" id="how-it-works">
      <div className="container">
        <div className="section-header animate-fade-in">
          <div className="section-label">How It Works</div>
          <h2>From first order to final payment in minutes</h2>
          <p>A workflow built around how home bakers actually work — no accounting degree required.</p>
        </div>

        <div className="hiw-steps">
          {steps.map((step, i) => (
            <div key={i} className={`hiw-step animate-fade-in animate-delay-${i + 1}`}>
              <div className="hiw-step-num">{step.num}</div>
              <div className="hiw-step-emoji">{step.emoji}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
