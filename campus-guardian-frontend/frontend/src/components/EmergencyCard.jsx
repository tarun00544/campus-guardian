import { Link } from 'react-router-dom';
import { Clock, MapPin, UserCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/auth';

const EmergencyCard = ({ emergency, actions }) => {
  const id = emergency._id || emergency.id;
  const status = String(emergency.status || '').toLowerCase();
  const live = status === 'active';
  const responder = emergency.respondedBy?.name || emergency.responder?.name || emergency.assignedTo?.name;

  return (
    <div className={`cg-card h-100 ${live ? 'cg-live-banner' : ''}`}>
      <div className="cg-card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 mb-0">{emergency.type || 'Emergency'}</h3>
          <StatusBadge status={emergency.status} />
        </div>
        <p className="small mb-3">{emergency.description || 'No description given.'}</p>
        <div className="d-flex flex-wrap gap-3 small text-muted-cg mb-3">
          <span className="d-inline-flex align-items-center gap-1"><MapPin size={13} /> {emergency.location || 'Location not given'}</span>
          <span className="d-inline-flex align-items-center gap-1"><Clock size={13} /> {formatDate(emergency.createdAt)}</span>
          {responder && <span className="d-inline-flex align-items-center gap-1"><UserCheck size={13} /> {responder}</span>}
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to={`/emergency/${id}`} className="btn btn-sm btn-guard-outline">View details</Link>
          {actions}
        </div>
      </div>
    </div>
  );
};

export default EmergencyCard;
