import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, TriangleAlert, UserCheck } from 'lucide-react';
import { getEmergency } from '../services/emergencyService';
import { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';

const EmergencyDetails = () => {
  const { id } = useParams();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getEmergency(id);
        if (active) { setEmergency(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="container cg-page"><Loading label="Loading alert..." /></div>;

  if (error || !emergency) {
    return (
      <div className="container cg-page" style={{ maxWidth: 560 }}>
        <div className="alert alert-danger">{error || 'This alert is no longer available.'}</div>
        <Link to="/emergency" className="btn btn-guard-outline"><ArrowLeft size={16} className="me-1" />Back to emergency</Link>
      </div>
    );
  }

  const live = String(emergency.status || '').toLowerCase() === 'active';
  const responder = emergency.respondedBy?.name || emergency.responder?.name || emergency.assignedTo?.name;
  const lat = emergency.latitude ?? emergency.location?.latitude;
  const lng = emergency.longitude ?? emergency.location?.longitude;

  return (
    <div className="container cg-page" style={{ maxWidth: 760 }}>
      <Link to="/emergency" className="small d-inline-flex align-items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to emergency
      </Link>

      <div className={`cg-card ${live ? 'cg-live-banner' : ''}`}>
        <div className="cg-card-body">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
            <div className="d-flex align-items-center gap-2">
              <TriangleAlert size={22} style={{ color: 'var(--cg-alert)' }} />
              <h1 className="h5 mb-0">{emergency.type || 'Emergency'}</h1>
            </div>
            <StatusBadge status={emergency.status} />
          </div>

          <p>{emergency.description || 'No further details were given.'}</p>

          <div className="row g-3 small">
            <div className="col-sm-6">
              <div className="text-muted-cg">Location</div>
              <div className="d-inline-flex align-items-center gap-1"><MapPin size={14} /> {typeof emergency.location === 'string' ? emergency.location : 'Not given'}</div>
            </div>
            <div className="col-sm-6">
              <div className="text-muted-cg">Raised</div>
              <div className="d-inline-flex align-items-center gap-1"><Clock size={14} /> {formatDate(emergency.createdAt)}</div>
            </div>
            <div className="col-sm-6">
              <div className="text-muted-cg">Responder</div>
              <div className="d-inline-flex align-items-center gap-1"><UserCheck size={14} /> {responder || 'Not assigned yet'}</div>
            </div>
            {lat && lng && (
              <div className="col-sm-6">
                <div className="text-muted-cg">Coordinates</div>
                <div>{lat}, {lng}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cg-card mt-3">
        <div className="cg-card-body small text-muted-cg">
          Campus Guardian notifies the campus response team only. For police, ambulance or fire services,
          contact your local emergency number directly.
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetails;
