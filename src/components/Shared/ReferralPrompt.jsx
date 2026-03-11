import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getOrCreateReferralCode, getReferralStats, getReferralMessages } from '../../lib/referral'
import { X, Copy, Check, Share2, Gift } from 'lucide-react'
import { useToast } from './Toast'
import './ReferralPrompt.css'

export default function ReferralPrompt({ trigger, onClose }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [showPrompt, setShowPrompt] = useState(false)
  const [referralData, setReferralData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadReferralData()
  }, [user])

  // Show prompt based on trigger
  useEffect(() => {
    if (trigger === 'first_invoice' || trigger === 'fifth_client') {
      // Check if we've already shown this prompt to this user
      const dismissed = localStorage.getItem(`referral_prompt_dismissed_${trigger}`)
      if (!dismissed) {
        setShowPrompt(true)
      }
    }
  }, [trigger])

  const loadReferralData = async () => {
    try {
      setLoading(true)
      const code = await getOrCreateReferralCode(user.id, profile?.full_name)
      const stats = await getReferralStats(user.id)
      setReferralData({ ...stats, code })
    } catch (err) {
      console.error('Failed to load referral data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(`referral_prompt_dismissed_${trigger}`, 'true')
    onClose?.()
  }

  const handleCopy = async () => {
    if (!referralData?.shareUrl) return
    try {
      await navigator.clipboard.writeText(referralData.shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (platform) => {
    if (!referralData) return
    const messages = getReferralMessages(referralData.code, profile?.full_name)
    const text = messages[platform] || messages.email

    if (platform === 'clipboard') {
      handleCopy()
      return
    }

    // Open share dialog for supported platforms
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(messages.twitter)}`, '_blank')
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.shareUrl)}`, '_blank')
    } else {
      // For others, copy to clipboard
      handleCopy()
    }

    // Track the share event
    // trackEvent(ReferralEvents.REFERRAL_LINK_SHARED, { platform })
  }

  if (!showPrompt || loading) return null

  const messages = getReferralMessages(referralData?.code, profile?.full_name)

  return (
    <div className="referral-prompt-overlay">
      <div className="referral-prompt">
        <button className="referral-prompt-close" onClick={handleDismiss}>
          <X size={18} />
        </button>

        <div className="referral-prompt-icon">
          <Gift size={32} />
        </div>

        <h3 className="referral-prompt-title">
          Love DoughPop? Share the love!
        </h3>

        <p className="referral-prompt-text">
          Give friends <strong>20% off</strong> their first year of Pro, 
          and get <strong>1 month free</strong> for each friend who subscribes.
        </p>

        {referralData?.signups > 0 && (
          <div className="referral-prompt-stats">
            <div className="referral-stat">
              <span className="referral-stat-value">{referralData.signups}</span>
              <span className="referral-stat-label">Friends joined</span>
            </div>
            <div className="referral-stat">
              <span className="referral-stat-value">{referralData.paid}</span>
              <span className="referral-stat-label">Upgraded to Pro</span>
            </div>
            <div className="referral-stat highlight">
              <span className="referral-stat-value">{referralData.rewardsEarned}</span>
              <span className="referral-stat-label">Days earned</span>
            </div>
          </div>
        )}

        <div className="referral-prompt-link">
          <input
            type="text"
            readOnly
            value={referralData?.shareUrl || ''}
            className="referral-link-input"
          />
          <button
            className="btn btn-primary referral-copy-btn"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="referral-prompt-share">
          <span className="referral-share-label">Share:</span>
          <div className="referral-share-buttons">
            <button
              className="referral-share-btn twitter"
              onClick={() => handleShare('twitter')}
              title="Share on Twitter"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              className="referral-share-btn facebook"
              onClick={() => handleShare('facebook')}
              title="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button
              className="referral-share-btn email"
              onClick={() => handleShare('email')}
              title="Share via Email"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>
            <button
              className="referral-share-btn sms"
              onClick={() => handleShare('sms')}
              title="Share via SMS"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="referral-prompt-footer">
          <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
