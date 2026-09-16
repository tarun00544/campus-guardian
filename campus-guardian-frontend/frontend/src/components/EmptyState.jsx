import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon = Inbox, title, message, actionLabel, actionTo, onAction }) => (
  <div className="cg-card">
    <div className="cg-empty">
      <div className="cg-empty-icon"><Icon size={26} /></div>
      <h3 className="h5 mb-1">{title}</h3>
      {message && <p className="text-muted-cg mb-3">{message}</p>}
      {actionLabel && actionTo && <Link className="btn btn-guard" to={actionTo}>{actionLabel}</Link>}
      {actionLabel && !actionTo && onAction && (
        <button type="button" className="btn btn-guard" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  </div>
);

export default EmptyState;
