import {
  FileText, Receipt, Users, ShoppingBag,
  Smartphone, BarChart2, Link2, Shield
} from 'lucide-react'
import './Features.css'

const features = [
  {
    icon: <FileText size={24} />,
    title: 'Professional Quotes',
    desc: 'Build itemized quotes in seconds. Add your products, set pricing, and send them to clients with a single click. Clients can accept or decline right in the portal.',
    color: 'honey'
  },
  {
    icon: <Receipt size={24} />,
    title: 'Beautiful Invoices',
    desc: 'Convert quotes to invoices instantly. Track payment status, set due dates, and mark invoices paid. Know exactly what\'s outstanding at all times.',
    color: 'rose'
  },
  {
    icon: <Users size={24} />,
    title: 'Client CRM',
    desc: 'Keep all your clients organized in one place. Add notes, track order history, see lifetime spend, and tag clients for easy filtering.',
    color: 'sage'
  },
  {
    icon: <ShoppingBag size={24} />,
    title: 'Online Storefront',
    desc: 'Get your own shareable store page at doughpop.com/store/your-bakery. Showcase your products, accept custom orders, and take requests 24/7.',
    color: 'honey'
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Client Portal',
    desc: 'Clients get a magic-link portal to view their quotes, accept orders, and track delivery — no password required. Elegant and friction-free.',
    color: 'rose'
  },
  {
    icon: <BarChart2 size={24} />,
    title: 'Business Insights',
    desc: 'Track revenue, best-selling items, top clients, and monthly trends. Know what\'s working in your bakery business at a glance.',
    color: 'sage'
  },
  {
    icon: <Link2 size={24} />,
    title: 'Quote → Invoice Flow',
    desc: 'Turn an accepted quote into a professional invoice in one click. No double entry, no copy-pasting. Just a seamless workflow from first ask to final payment.',
    color: 'honey'
  },
  {
    icon: <Shield size={24} />,
    title: 'Secure & Private',
    desc: 'All your data is encrypted and private. Row-level security ensures only you can see your clients and financials. You own your data, always.',
    color: 'rose'
  }
]

export default function Features() {
  return (
    <section className="features section" id="features">
      <div className="container">
        <div className="section-header animate-fade-in">
          <div className="section-label">Features</div>
          <h2>Everything you need to run your bakery business</h2>
          <p>All the tools professional bakers need — from first quote to final delivery — in one beautiful place.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className={`feature-card animate-fade-in animate-delay-${Math.min(i % 4 + 1, 5)}`}>
              <div className={`feature-icon feature-icon-${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
