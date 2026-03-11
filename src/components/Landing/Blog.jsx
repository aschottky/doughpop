import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import './Blog.css'

const blogPosts = [
  {
    slug: 'how-to-invoice-home-bakery',
    title: 'How to Invoice for Your Home Bakery (Free Template Included)',
    excerpt: 'Stop using spreadsheets and DMs. Learn how to create professional invoices that get you paid faster — plus a free template you can use today.',
    date: '2024-01-15',
    readTime: 5,
    category: 'Business Tips',
    keywords: ['home bakery invoice', 'cottage food invoice template', 'how to bill cake clients']
  },
  {
    slug: 'cake-order-form-template',
    title: 'The Complete Cake Order Form Template (Never Miss a Detail)',
    excerpt: 'A professional order form template for custom cakes. Capture flavors, fillings, design details, delivery info, and dietary restrictions — all in one place.',
    date: '2024-01-12',
    readTime: 4,
    category: 'Templates',
    keywords: ['cake order form', 'custom cake template', 'bakery order sheet']
  },
  {
    slug: 'pricing-custom-cakes-profit',
    title: 'How to Price Custom Cakes for Profit (Not Just Ingredients)',
    excerpt: 'Most home bakers undercharge. Here is the formula for pricing cakes that covers your time, supplies, and actually pays you what you are worth.',
    date: '2024-01-08',
    readTime: 7,
    category: 'Pricing',
    keywords: ['how to price cakes', 'custom cake pricing', 'home bakery pricing guide']
  },
  {
    slug: 'look-professional-home-baker',
    title: '5 Ways to Look Professional as a Home Baker (Without a Storefront)',
    excerpt: 'You do not need a commercial kitchen to look legit. These 5 simple strategies will make your home bakery look as professional as any brick-and-mortar shop.',
    date: '2024-01-05',
    readTime: 6,
    category: 'Branding',
    keywords: ['professional home baker', 'cottage food business tips', 'home bakery branding']
  },
  {
    slug: 'deposit-payment-policy',
    title: 'Why You Need a Deposit Policy (And What to Say)',
    excerpt: 'Protect yourself from no-shows and last-minute cancellations. Here is the exact deposit policy language to use, plus when and how to ask for payment.',
    date: '2024-01-02',
    readTime: 5,
    category: 'Business Tips',
    keywords: ['cake deposit policy', 'bakery payment terms', 'custom cake contract']
  },
  {
    slug: 'best-apps-home-bakers',
    title: 'The Best Apps and Tools for Home Bakers in 2024',
    excerpt: 'From order management to Instagram scheduling, these are the tools that will save you hours every week — so you can spend more time baking.',
    date: '2023-12-28',
    readTime: 8,
    category: 'Tools',
    keywords: ['best apps for bakers', 'home bakery software', 'bakery business tools']
  }
]

export default function Blog() {
  return (
    <div className="blog-page">
      <div className="blog-container">
        <Link to="/" className="blog-back-link">
          <ArrowLeft size={18} />
          Back to DoughPop
        </Link>

        <div className="blog-header">
          <span className="blog-label">Resources for Home Bakers</span>
          <h1 className="blog-title">DoughPop Blog</h1>
          <p className="blog-subtitle">
            Practical tips, free templates, and business advice for home bakers who want to turn their passion into profit.
          </p>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.slug} className="blog-card">
              <div className="blog-card-header">
                <span className="blog-category">{post.category}</span>
                <div className="blog-meta">
                  <span className="blog-date">
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className="blog-read-time">
                    <Clock size={14} />
                    {post.readTime} min read
                  </span>
                </div>
              </div>
              <h2 className="blog-card-title">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="blog-read-more">
                Read more →
              </Link>
            </article>
          ))}
        </div>

        <div className="blog-cta">
          <div className="blog-cta-content">
            <h3>Ready to streamline your bakery business?</h3>
            <p>
              DoughPop helps you send quotes, create invoices, and manage clients — all in one place.
            </p>
            <Link 
              to="/auth?mode=signup&utm_source=blog&utm_medium=content&utm_campaign=blog_footer" 
              className="btn btn-primary blog-cta-btn"
            >
              Start Free Today
            </Link>
          </div>
        </div>

        <div className="blog-footer">
          <p>
            Want to contribute? Email us at <a href="mailto:hello@doughpop.com">hello@doughpop.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

// SEO-optimized blog post content (for future expansion)
export const blogPostContent = {
  'how-to-invoice-home-bakery': {
    title: 'How to Invoice for Your Home Bakery (Free Template Included)',
    metaDescription: 'Learn how to create professional invoices for your home bakery. Includes a free invoice template and tips for getting paid faster.',
    content: `
# How to Invoice for Your Home Bakery

If you are still taking payments via Venmo requests in the DMs, you are leaving money on the table. Professional invoices do not just look better — they get you paid faster and help you track your income properly.

## Why Professional Invoices Matter

1. **You look legit**: Clients take you seriously when you send a branded invoice
2. **Payment terms are clear**: No more "when should I pay?" confusion
3. **You have a record**: Come tax time, you will thank yourself
4. **Fewer missed payments**: Automated reminders mean less awkward follow-ups

## What to Include on Your Invoice

- Your business name and contact info
- Client name and event date
- Itemized list of products/services
- Prices (including any deposits already paid)
- Payment terms (due date, accepted methods)
- Total amount due
- A thank you note

## Free Invoice Template

[Download our free invoice template for home bakers](/checklist)

Or better yet, use a tool that generates invoices automatically from your quotes — try DoughPop free.

## Best Practices

**Send invoices promptly**: Within 24 hours of order confirmation or delivery

**Require deposits**: 50% upfront is standard for custom orders

**Set clear due dates**: Net 7 or Net 14 for established clients, payment on delivery for new ones

**Follow up**: Send a polite reminder 3 days before the due date

## Ready to upgrade?

DoughPop turns quotes into invoices with one click. Track who has paid, who owes you, and your monthly revenue — all in one dashboard.

[Start your free account today](/auth?mode=signup)
    `
  },
  'cake-order-form-template': {
    title: 'The Complete Cake Order Form Template',
    metaDescription: 'Never miss a detail on your custom cake orders. Free printable order form template for home bakers.',
    content: 'Content for cake order form template post...'
  }
  // Additional posts can be added here
}
