import { Link } from 'react-router-dom';
import { MapPin, Tag, ThumbsUp } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/auth';

const ComplaintCard = ({ complaint }) => {
  const id = complaint._id || complaint.id;
  const upvotes = Array.isArray(complaint.upvotes) ? complaint.upvotes.length : (complaint.upvoteCount ?? complaint.upvotes ?? 0);

  return (
    <Link to={`/complaints/${id}`} className="cg-card cg-card-link h-100">
      <div className="cg-card-body d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 mb-0">{complaint.title || 'Untitled report'}</h3>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="small text-muted-cg mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {complaint.description}
        </p>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {complaint.category && <span className="cg-badge neutral"><Tag size={12} /> {complaint.category}</span>}
          {complaint.location && <span className="cg-badge neutral"><MapPin size={12} /> {complaint.location}</span>}
          {complaint.priority && <StatusBadge status={complaint.priority} prefix="Priority:" />}
        </div>
        <div className="d-flex justify-content-between align-items-center small text-muted-cg mt-auto">
          <span>{formatDate(complaint.createdAt)}</span>
          <span className="d-inline-flex align-items-center gap-1"><ThumbsUp size={13} /> {Number(upvotes) || 0}</span>
        </div>
      </div>
    </Link>
  );
};

export default ComplaintCard;
