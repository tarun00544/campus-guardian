// Maps every status the backend can send to one visual tone.
const TONES = {
  reported: 'neutral',
  pending: 'warn',
  open: 'warn',
  assigned: 'info',
  'in progress': 'info',
  in_progress: 'info',
  inprogress: 'info',
  responding: 'info',
  resolved: 'good',
  closed: 'good',
  returned: 'good',
  matched: 'good',
  claimed: 'good',
  active: 'alert',
  rejected: 'alert',
  cancelled: 'neutral',
  canceled: 'neutral',
  lost: 'warn',
  found: 'info',
  high: 'alert',
  critical: 'alert',
  urgent: 'alert',
  medium: 'warn',
  low: 'neutral',
  admin: 'info',
  staff: 'info',
  security: 'warn',
  student: 'neutral',
  inactive: 'neutral',
  verified: 'good',
  'verification pending': 'warn'
};

export const prettify = (value) => {
  if (value === true) return 'Active';
  if (value === false) return 'Inactive';
  if (!value) return 'Unknown';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const StatusBadge = ({ status, prefix, className = '' }) => {
  const key = String(status ?? '').toLowerCase().trim();
  const tone = TONES[key] || 'neutral';
  return (
    <span className={`cg-badge ${tone} ${className}`}>
      {tone === 'alert' && key === 'active' && <span className="cg-live-dot" />}
      {prefix ? `${prefix} ` : ''}{prettify(status)}
    </span>
  );
};

export default StatusBadge;
