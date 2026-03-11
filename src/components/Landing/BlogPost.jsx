import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { blogPostContent } from './Blog'
import './BlogPost.css'

// Blog post metadata (same as in Blog.jsx)
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

// Full blog post content
const postContent = {
  'how-to-invoice-home-bakery': {
    title: 'How to Invoice for Your Home Bakery (Free Template Included)',
    content: `
      <p>If you are still taking payments via Venmo requests in the DMs, you are leaving money on the table. Professional invoices do not just look better — they get you paid faster and help you track your income properly.</p>
      
      <h2>Why Professional Invoices Matter</h2>
      <ol>
        <li><strong>You look legit:</strong> Clients take you seriously when you send a branded invoice</li>
        <li><strong>Payment terms are clear:</strong> No more "when should I pay?" confusion</li>
        <li><strong>You have a record:</strong> Come tax time, you will thank yourself</li>
        <li><strong>Fewer missed payments:</strong> Automated reminders mean less awkward follow-ups</li>
      </ol>
      
      <h2>What to Include on Your Invoice</h2>
      <ul>
        <li>Your business name and contact info</li>
        <li>Client name and event date</li>
        <li>Itemized list of products/services</li>
        <li>Prices (including any deposits already paid)</li>
        <li>Payment terms (due date, accepted methods)</li>
        <li>Total amount due</li>
        <li>A thank you note</li>
      </ul>
      
      <div class="cta-box">
        <h3>Free Invoice Template</h3>
        <p>Download our free invoice template for home bakers, or better yet, use a tool that generates invoices automatically from your quotes.</p>
        <a href="/checklist" class="btn btn-primary">Get the Free Template</a>
      </div>
      
      <h2>Best Practices</h2>
      <p><strong>Send invoices promptly:</strong> Within 24 hours of order confirmation or delivery</p>
      <p><strong>Require deposits:</strong> 50% upfront is standard for custom orders</p>
      <p><strong>Set clear due dates:</strong> Net 7 or Net 14 for established clients, payment on delivery for new ones</p>
      <p><strong>Follow up:</strong> Send a polite reminder 3 days before the due date</p>
      
      <h2>Ready to upgrade?</h2>
      <p>DoughPop turns quotes into invoices with one click. Track who has paid, who owes you, and your monthly revenue — all in one dashboard.</p>
      <p><a href="/auth?mode=signup">Start your free account today</a></p>
    `
  },
  'cake-order-form-template': {
    title: 'The Complete Cake Order Form Template',
    content: `
      <p>Never miss a detail on your custom cake orders again. A professional order form protects you and your client by capturing everything upfront.</p>
      
      <h2>What to Include on Your Order Form</h2>
      <ul>
        <li>Client contact information</li>
        <li>Event date and delivery/pickup time</li>
        <li>Cake size and servings needed</li>
        <li>Flavor, filling, and frosting choices</li>
        <li>Design details and reference photos</li>
        <li>Dietary restrictions and allergies</li>
        <li>Topper, stand, or special equipment needed</li>
        <li>Delivery address or pickup instructions</li>
      </ul>
      
      <div class="cta-box">
        <h3>Get the Free Template</h3>
        <p>Download our printable cake order form template plus invoice checklist.</p>
        <a href="/checklist" class="btn btn-primary">Download Now</a>
      </div>
      
      <h2>Why Order Forms Matter</h2>
      <p>Without a proper order form, details get lost in Instagram DMs, text messages, and phone calls. "I thought you said..." conversations lead to unhappy clients and lost revenue.</p>
      
      <p>A good order form:</p>
      <ul>
        <li>Sets clear expectations</li>
        <li>Protects you from scope creep</li>
        <li>Gives you a reference for future orders</li>
        <li>Makes you look professional</li>
      </ul>
      
      <h2>Digital Order Forms</h2>
      <p>While paper forms work, digital order forms are even better. Clients can fill them out anytime, you get notified instantly, and everything is searchable.</p>
      <p>With DoughPop, your storefront acts as a digital order form — clients select products, add customization details, and submit requests directly.</p>
    `
  },
  'pricing-custom-cakes-profit': {
    title: 'How to Price Custom Cakes for Profit',
    content: `
      <p>Most home bakers undercharge. They price based on ingredients plus a little extra, without accounting for their time, skill, overhead, or profit margin.</p>
      
      <h2>The Real Cost of a Custom Cake</h2>
      <p>When pricing, consider:</p>
      <ul>
        <li><strong>Ingredients:</strong> Flour, sugar, eggs, butter, decorations</li>
        <li><strong>Supplies:</strong> Cake boards, boxes, dowels, ribbon</li>
        <li><strong>Your time:</strong> Baking, decorating, cleaning, communicating</li>
        <li><strong>Overhead:</strong> Electricity, gas, equipment depreciation</li>
        <li><strong>Profit margin:</strong> The reason you are in business</li>
      </ul>
      
      <h2>The Pricing Formula</h2>
      <p><strong>Total Cost = Ingredients + Supplies + (Hours × Hourly Rate) + Overhead</strong></p>
      <p><strong>Final Price = Total Cost × 1.5 (for 50% profit margin)</strong></p>
      
      <h2>What to Charge Per Hour</h2>
      <p>Your time is valuable. Consider:</p>
      <ul>
        <li>Your skill level and experience</li>
        <li>Local market rates</li>
        <li>Complexity of the design</li>
      </ul>
      <p>Most home bakers charge $15-35/hour. Master decorators with years of experience charge $50+/hour.</p>
      
      <div class="cta-box">
        <h3>Track Your Time</h3>
        <p>DoughPop Pro lets you track hours per order and calculates labor costs automatically.</p>
        <a href="/auth?mode=signup" class="btn btn-primary">Try DoughPop Free</a>
      </div>
    `
  },
  'look-professional-home-baker': {
    title: '5 Ways to Look Professional as a Home Baker',
    content: `
      <p>You do not need a commercial kitchen or storefront to look like a legitimate business. These 5 strategies will elevate your brand instantly.</p>
      
      <h2>1. Professional Invoices and Quotes</h2>
      <p>Stop sending prices in Instagram DMs. Use branded documents with your logo, clear pricing, and payment terms. Tools like DoughPop make this effortless.</p>
      
      <h2>2. A Dedicated Website or Store Page</h2>
      <p>Even a simple one-page site with your story, photos, and contact form looks more professional than just an Instagram profile. DoughPop gives you a free storefront page at doughpop.com/store/your-bakery.</p>
      
      <h2>3. Consistent Branding</h2>
      <p>Use the same colors, fonts, and logo everywhere — Instagram, invoices, business cards. Consistency builds trust.</p>
      
      <h2>4. Clear Policies</h2>
      <p>Have written policies for deposits, cancellations, and delivery. Post them on your website and reference them in contracts. This protects you and shows clients you are serious.</p>
      
      <h2>5. Professional Communication</h2>
      <p>Respond promptly, use proper grammar, and be courteous even with difficult clients. Word of mouth is everything in the baking business.</p>
      
      <div class="cta-box">
        <h3>Get Professional Tools</h3>
        <p>DoughPop gives you quotes, invoices, a storefront, and client management — everything you need to look legit.</p>
        <a href="/auth?mode=signup" class="btn btn-primary">Start Free</a>
      </div>
    `
  },
  'deposit-payment-policy': {
    title: 'Why You Need a Deposit Policy',
    content: `
      <p>Custom cakes take time, ingredients cost money, and no-shows kill your profit. A deposit policy protects your business and sets clear expectations.</p>
      
      <h2>Why Deposits Matter</h2>
      <ul>
        <li>Covers ingredient costs if client cancels</li>
        <li>Shows client is committed to the order</li>
        <li>Reduces last-minute cancellations</li>
        <li>Protects your schedule from empty slots</li>
      </ul>
      
      <h2>What to Charge</h2>
      <p><strong>Standard: 50% deposit</strong> for custom orders</p>
      <p><strong>Non-refundable:</strong> If they cancel within 48 hours of the event</p>
      <p><strong>Full payment:</strong> Due 1 week before pickup/delivery</p>
      
      <h2>Sample Policy Language</h2>
      <blockquote>
        "A 50% non-refundable deposit is required to secure your order date. 
        The remaining balance is due one week before your event. 
        Deposits cover ingredient costs and are non-refundable for cancellations 
        made within 48 hours of the event date."
      </blockquote>
      
      <h2>When to Ask for Payment</h2>
      <ul>
        <li><strong>Deposit:</strong> At order confirmation, before you buy supplies</li>
        <li><strong>Final payment:</strong> 3-7 days before delivery</li>
        <li><strong>Rush orders:</strong> Full payment upfront (within 1 week)</li>
      </ul>
      
      <div class="cta-box">
        <h3>Get Our Free Templates</h3>
        <p>Download deposit policy templates plus invoice and order form checklists.</p>
        <a href="/checklist" class="btn btn-primary">Get Free Templates</a>
      </div>
    `
  },
  'best-apps-home-bakers': {
    title: 'The Best Apps and Tools for Home Bakers in 2024',
    content: `
      <p>Running a home bakery business means wearing many hats: baker, accountant, marketer, customer service rep. These tools will save you hours every week.</p>
      
      <h2>Order Management & Invoicing</h2>
      <p><strong>DoughPop</strong> — All-in-one platform for quotes, invoices, client management, and storefront. Built specifically for home bakers.</p>
      
      <h2>Social Media Scheduling</h2>
      <p><strong>Later</strong> or <strong>Planoly</strong> — Schedule Instagram posts in advance so you are not scrambling for content during busy weeks.</p>
      
      <h2>Photo Editing</h2>
      <p><strong>Lightroom Mobile</strong> — Professional photo editing on your phone. Consistent, bright photos sell more cakes.</p>
      
      <h2>Accounting</h2>
      <p><strong>QuickBooks Self-Employed</strong> — Track income, expenses, and mileage. Makes tax time much easier.</p>
      
      <h2>Inventory & Recipes</h2>
      <p><strong>Google Sheets</strong> — Simple, free, and accessible everywhere. Track inventory costs and standardize recipes.</p>
      
      <h2>Communication</h2>
      <p><strong>Google Voice</strong> — Get a business phone number that forwards to your cell. Keeps personal and business calls separate.</p>
      
      <div class="cta-box">
        <h3>Start with DoughPop</h3>
        <p>The only tool built specifically for home bakers. Quotes, invoices, client portal, and storefront — free to start.</p>
        <a href="/auth?mode=signup" class="btn btn-primary">Try It Free</a>
      </div>
    `
  }
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find(p => p.slug === slug)
  const content = postContent[slug]

  if (!post || !content) {
    return (
      <div className="blog-post-page">
        <div className="blog-container">
          <Link to="/blog" className="blog-back-link">
            <ArrowLeft size={18} />
            Back to Blog
          </Link>
          <div className="blog-post-not-found">
            <h1>Post Not Found</h1>
            <p>Sorry, we could not find that blog post.</p>
            <Link to="/blog" className="btn btn-primary">View All Posts</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-post-page">
      <div className="blog-container">
        <Link to="/blog" className="blog-back-link">
          <ArrowLeft size={18} />
          Back to Blog
        </Link>

        <article className="blog-post">
          <header className="blog-post-header">
            <span className="blog-category">{post.category}</span>
            <h1 className="blog-post-title">{content.title}</h1>
            <div className="blog-post-meta">
              <span className="blog-date">
                <Calendar size={14} />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <span className="blog-read-time">
                <Clock size={14} />
                {post.readTime} min read
              </span>
            </div>
          </header>

          <div 
            className="blog-post-content" 
            dangerouslySetInnerHTML={{ __html: content.content }}
          />

          <div className="blog-post-footer">
            <div className="blog-post-cta">
              <h3>Ready to streamline your bakery business?</h3>
              <p>DoughPop helps you send quotes, create invoices, and manage clients — all in one place.</p>
              <Link 
                to="/auth?mode=signup&utm_source=blog&utm_medium=content&utm_campaign=blog_post" 
                className="btn btn-primary"
              >
                Start Free Today
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
