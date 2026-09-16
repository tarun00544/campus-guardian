import { Link } from 'react-router-dom';
import { ImageOff, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fileUrl } from '../services/api';
import { formatDay } from '../utils/auth';

const LostFoundCard = ({ item }) => {
  const id = item._id || item.id;
  const image = item.image || item.imageUrl || item.photo;
  const type = String(item.type || '').toLowerCase();

  return (
    <Link to={`/lost-found/${id}`} className="cg-card cg-card-link h-100 overflow-hidden">
      {image ? (
        <img className="cg-thumb" src={fileUrl(image)} alt={item.itemName || item.title || 'Item'} loading="lazy" />
      ) : (
        <div className="cg-thumb-empty"><ImageOff size={26} /></div>
      )}
      <div className="cg-card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 mb-0">{item.itemName || item.title || 'Item'}</h3>
          <span className={`cg-badge ${type === 'lost' ? 'warn' : 'info'}`}>{type === 'lost' ? 'Lost' : 'Found'}</span>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-2">
          {item.category && <span className="cg-badge neutral">{item.category}</span>}
          <StatusBadge status={item.status || 'open'} />
        </div>
        <div className="small text-muted-cg d-flex justify-content-between gap-2">
          <span className="d-inline-flex align-items-center gap-1 text-truncate"><MapPin size={13} /> {item.location || 'Unknown'}</span>
          <span>{formatDay(item.date || item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default LostFoundCard;
