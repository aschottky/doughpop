// Email Welcome Sequence for DoughPop
// This defines the content and timing for onboarding emails
// Integration with email service (ConvertKit, Mailchimp, SendGrid, etc.) would go here

export const WelcomeSequence = {
  // Day 0: Welcome email (sent immediately after signup)
  day0: {
    subject: 'Welcome to DoughPop! Let us get your first quote ready',
    previewText: 'Your baking business toolkit is ready — here is how to get started',
    content: `
<h1>Welcome to DoughPop, {{firstName}}!</h1>

<p>You are now part of a community of home bakers who take their business seriously. No more spreadsheets. No more chaos.</p>

<h2>Your first 3 steps:</h2>

<ol>
  <li><strong>Set up your profile</strong> — Add your bakery name and logo to make it yours</li>
  <li><strong>Add your first product</strong> — Start with your most popular cake or cookie</li>
  <li><strong>Send your first quote</strong> — Create a professional quote in under 2 minutes</li>
</ol>

<p><a href="{{dashboardUrl}}" class="btn btn-primary">Go to Your Dashboard →</a></p>

<h3>Quick tip:</h3>
<p>Your custom storefront link is: <code>doughpop.com/store/{{storeSlug}}</code><br>
Add this to your Instagram bio so clients can find you easily!</p>

<p>Questions? Just reply to this email — we read every one.</p>

<p>Happy baking,<br>
The DoughPop Team</p>
    `,
    sendDelay: 0 // Immediate
  },

  // Day 2: Add your store link to Instagram
  day2: {
    subject: 'Pro tip: Add your store link to Instagram',
    previewText: 'One simple change that will get you more orders',
    content: `
<h1>Hey {{firstName}},</h1>

<p>Quick win for you today:</p>

<h2>Add your DoughPop store link to your Instagram bio</h2>

<p>Your link is: <code>doughpop.com/store/{{storeSlug}}</code></p>

<p>Why this matters:</p>
<ul>
  <li>Clients can browse your products 24/7</li>
  <li>They can request custom orders without DMing you</li>
  <li>You look professional and legit</li>
</ul>

<p><strong>How to do it:</strong></p>
<ol>
  <li>Go to your Instagram profile</li>
  <li>Tap "Edit Profile"</li>
  <li>Paste your DoughPop link in the Website field</li>
  <li>Save it!</li>
</ol>

<p>We have seen bakers get their first order within 24 hours of doing this.</p>

<p>Keep baking,<br>
The DoughPop Team</p>
    `,
    sendDelay: 2 * 24 * 60 * 60 * 1000 // 2 days
  },

  // Day 5: Turn quote into invoice
  day5: {
    subject: 'Magic feature: Quote → Invoice in 1 click',
    previewText: 'Stop copying and pasting. Here is the faster way.',
    content: `
<h1>Hi {{firstName}},</h1>

<p>Have you sent your first quote yet? If so, here is a trick that will save you time:</p>

<h2>Turn any quote into an invoice with one click</h2>

<p>No need to re-enter prices, client info, or line items. Just:</p>
<ol>
  <li>Open the quote your client accepted</li>
  <li>Click "Convert to Invoice"</li>
  <li>Set your due date and payment terms</li>
  <li>Send!</li>
</ol>

<p>Your invoice will look professional, include your branding, and have a clear payment due date.</p>

<p><a href="{{dashboardUrl}}/quotes" class="btn btn-primary">View Your Quotes →</a></p>

<h3>Pro tip:</h3>
<p>Require a 50% deposit on custom orders. It protects your time and ingredients, and clients who pay deposits are more committed.</p>

<p>Happy invoicing,<br>
The DoughPop Team</p>
    `,
    sendDelay: 5 * 24 * 60 * 60 * 1000 // 5 days
  },

  // Day 12: Upgrade to Pro (only for free users)
  day12_upgrade: {
    subject: 'Ready to go Pro? Here is what you are missing',
    previewText: 'Unlimited clients, client portal, and more — try Pro free for 14 days',
    content: `
<h1>Hey {{firstName}},</h1>

<p>You have been using DoughPop for almost 2 weeks now. How is it going?</p>

<p>If you are hitting the limits of the free plan, it might be time to upgrade to <strong>DoughPop Pro</strong>.</p>

<h2>What you get with Pro:</h2>

<ul>
  <li><strong>Unlimited clients</strong> — Never worry about hitting a limit</li>
  <li><strong>Client portal</strong> — Clients view quotes and track orders without bugging you</li>
  <li><strong>PDF exports</strong> — Download beautiful PDFs of any quote or invoice</li>
  <li><strong>Remove DoughPop branding</strong> — Your store looks 100% like your brand</li>
  <li><strong>Analytics dashboard</strong> — See your best clients and most popular items</li>
</ul>

<p>Most bakers make their money back on the first order.</p>

<p><a href="{{dashboardUrl}}/upgrade" class="btn btn-primary">Start Your 14-Day Free Trial →</a></p>

<p><strong>No risk:</strong> Cancel anytime during the trial and pay nothing.</p>

<p>Questions? Just hit reply.</p>

<p>Cheers,<br>
The DoughPop Team</p>
    `,
    sendDelay: 12 * 24 * 60 * 60 * 1000, // 12 days
    condition: (user) => user.subscription_tier === 'free' // Only send to free users
  },

  // Day 21: Tips for at-risk users (no quote sent yet)
  day21_nurture: {
    subject: 'Stuck? Here is how to send your first quote in 2 minutes',
    previewText: 'You signed up but have not sent a quote yet — here is a quick guide',
    content: `
<h1>Hi {{firstName}},</h1>

<p>You signed up for DoughPop a few weeks ago, but we noticed you have not sent a quote yet.</p>

<p>That is totally okay — we know you are busy! But if you are stuck, here is the simplest way to get started:</p>

<h2>Send your first quote in 2 minutes:</h2>

<ol>
  <li>Go to your <a href="{{dashboardUrl}}">Dashboard</a></li>
  <li>Click "Quotes" → "New Quote"</li>
  <li>Add a client (or use a test name for now)</li>
  <li>Add one product with a price</li>
  <li>Click "Send Quote"</li>
</ol>

<p>That is it! You will see how easy it is.</p>

<h3>Not ready for real clients yet?</h3>

<p>No problem. Use DoughPop to create quotes for yourself — plan out your pricing, experiment with different packages, and get comfortable with the tool before you go live.</p>

<p><strong>Still have questions?</strong> Reply to this email and we will help you out.</p>

<p>We are rooting for you,<br>
The DoughPop Team</p>
    `,
    sendDelay: 21 * 24 * 60 * 60 * 1000, // 21 days
    condition: (user) => !user.has_sent_quote // Only for users who haven't sent a quote
  }
}

// Email service integration placeholder
// In production, this would connect to ConvertKit, Mailchimp, SendGrid, etc.
export class EmailService {
  // Placeholder for sending emails
  // Would integrate with your email provider's API
  static async sendEmail({ to, subject, html, templateId, metadata }) {
    // Example integration:
    // return fetch('https://api.convertkit.com/v3/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${API_KEY}` },
    //   body: JSON.stringify({ to, subject, html })
    // })

    if (import.meta.env.DEV) {
      console.log('[Email]', { to, subject, templateId, metadata })
    }

    // Log to Supabase for tracking
    // await supabase.from('email_log').insert({...})

    return { success: true, messageId: `msg_${Date.now()}` }
  }

  // Schedule a sequence email
  static async scheduleEmail(userId, emailKey, delayMs, userData) {
    const scheduledTime = new Date(Date.now() + delayMs)

    // In production, this would add to a queue (Redis, Bull, etc.)
    // For now, we log it
    if (import.meta.env.DEV) {
      console.log('[Email Scheduled]', {
        userId,
        emailKey,
        scheduledTime,
        userData
      })
    }

    return { scheduled: true, scheduledTime }
  }

  // Trigger welcome sequence for new user
  static async startWelcomeSequence(user, storeData = {}) {
    const sequence = []

    // Day 0: Welcome (immediate)
    const welcomeEmail = await this.scheduleEmail(
      user.id,
      'day0',
      0,
      { ...user, ...storeData }
    )
    sequence.push(welcomeEmail)

    // Day 2: Instagram tip
    const day2Email = await this.scheduleEmail(
      user.id,
      'day2',
      WelcomeSequence.day2.sendDelay,
      { ...user, ...storeData }
    )
    sequence.push(day2Email)

    // Day 5: Quote to invoice
    const day5Email = await this.scheduleEmail(
      user.id,
      'day5',
      WelcomeSequence.day5.sendDelay,
      { ...user, ...storeData }
    )
    sequence.push(day5Email)

    // Day 12: Pro upgrade (conditional)
    const day12Email = await this.scheduleEmail(
      user.id,
      'day12_upgrade',
      WelcomeSequence.day12_upgrade.sendDelay,
      { ...user, ...storeData }
    )
    sequence.push(day12Email)

    // Day 21: Nurture at-risk users (conditional)
    const day21Email = await this.scheduleEmail(
      user.id,
      'day21_nurture',
      WelcomeSequence.day21_nurture.sendDelay,
      { ...user, ...storeData, has_sent_quote: false }
    )
    sequence.push(day21Email)

    return { sequenceStarted: true, emailsScheduled: sequence.length }
  }
}

// Helper to personalize email content
export function personalizeEmail(template, data) {
  return template
    .replace(/\{\{firstName\}\}/g, data.full_name?.split(' ')[0] || 'Baker')
    .replace(/\{\{storeSlug\}\}/g, data.store_slug || 'your-bakery')
    .replace(/\{\{dashboardUrl\}\}/g, `${window.location.origin}/dashboard`)
}

// Key email events to track
export const EmailEvents = {
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_BOUNCED: 'email_bounced',
  EMAIL_UNSUBSCRIBED: 'email_unsubscribed'
}
