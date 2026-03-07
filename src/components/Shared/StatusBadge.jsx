export default function StatusBadge({ status, size = 'md' }) {
  const labels = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    converted: 'Converted',
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    ready: 'Ready',
    delivered: 'Delivered',
    free: 'Starter',
    pro: 'Pro'
  }

  const cls = `badge badge-${status?.replace('_', '-') || 'draft'} ${size === 'sm' ? '' : ''}`
  return <span className={cls}>{labels[status] || status}</span>
}
