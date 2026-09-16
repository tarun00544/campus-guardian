import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ImageOff, MapPin, Tag, ThumbsUp, UserCheck } from 'lucide-react';
import { getComplaint, upvoteComplaint } from '../services/complaintService';
import { fileUrl, getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';

const STEPS = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

const stepIndex = (status) => {
  const s = String(status || '').toLowerCase().replace(/[_-]/g, ' ');
  if (s === 'resolved' || s === 'closed') return 3;
  if (s === 'in progress') return 2;
  if (s === 'assigned') return 1;
  return 0;
};

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteError, setVoteError] = useState('');
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getComplaint(id);
        if (active) { setComplaint(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const upvote = async () => {
    setVoting(true);
    setVoteError('');
    try {
      const updated = await upvoteComplaint(id);
      if (updated && (updated._id || updated.id)) setComplaint(updated);
      else setComplaint(await getComplaint(id));
    } catch (err) {
      setVoteError(getErrorMessage(err));
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="container cg-page"><Loading label="Loading complaint..." /></div>;

  if (error || !complaint) {
    return (
      <div className="container cg-page" style={{ maxWidth: 560 }}>
        <div className="alert alert-danger">{error || 'This complaint is no longer available.'}</div>
        <Link to="/my-complaints" className="btn btn-guard-outline"><ArrowLeft size={16} className="me-1" />Back to my complaints</Link>
      </div>
    );
  }

  const rejected = String(complaint.status || '').toLowerCase() === 'rejected';
  const current = stepIndex(complaint.status);
  const image = complaint.image || complaint.imageUrl || complaint.photo;
  const assignee = complaint.assignedTo?.name || complaint.assignedStaff?.name || complaint.assignedTo;
  const upvotes = Array.isArray(complaint.upvotes) ? complaint.upvotes.length : (complaint.upvoteCount ?? complaint.upvotes ?? 0);

  return (
    <div className="container cg-page">
      <Link to="/my-complaints" className="small d-inline-flex align-items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to my complaints
      </Link>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="cg-card">
            <div className="cg-card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <h1 className="h4 mb-0">{complaint.title}</h1>
                <StatusBadge status={complaint.status} />
              </div>
              <div className="small text-muted-cg mb-3">Reported {formatDate(complaint.createdAt)}</div>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {complaint.category && <span className="cg-badge neutral"><Tag size={12} /> {complaint.category}</span>}
                {complaint.location && <span className="cg-badge neutral"><MapPin size={12} /> {complaint.location}</span>}
                {complaint.priority && <StatusBadge status={complaint.priority} prefix="Priority:" />}
              </div>

              <p className="mb-4">{complaint.description}</p>

              {image ? (
                <img className="cg-detail-image mb-3" src={fileUrl(image)} alt={complaint.title} />
              ) : (
                <div className="cg-thumb-empty mb-3" style={{ borderRadius: 12 }}><ImageOff size={24} /></div>
              )}

              {voteError && <div className="alert alert-warning py-2 small">{voteError}</div>}
              <button type="button" className="btn btn-guard-outline" onClick={upvote} disabled={voting}>
                <ThumbsUp size={15} className="me-2" />
                {voting ? 'Saving...' : `Upvote (${Number(upvotes) || 0})`}
              </button>
              <div className="form-text">Upvotes tell the campus team how many people this affects.</div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="cg-card">
            <div className="cg-card-body">
              <h2 className="h6 mb-3">Progress</h2>
              {rejected ? (
                <div className="alert alert-danger py-2 small mb-0">
                  This report was rejected by the campus team. Check your notifications for the reason.
                </div>
              ) : (
                <ul className="cg-timeline">
                  {STEPS.map((step, i) => (
                    <li key={step} className={i <= current ? 'done' : ''}>
                      <div className="step-name">{step}</div>
                      <div className="step-time">
                        {i === 0 ? formatDate(complaint.createdAt) : i <= current ? 'Done' : 'Waiting'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="cg-card mt-3">
            <div className="cg-card-body">
              <h2 className="h6 mb-3">Handled by</h2>
              <div className="d-flex align-items-center gap-2 small">
                <UserCheck size={16} style={{ color: 'var(--cg-deep)' }} />
                <span>{typeof assignee === 'string' && assignee ? assignee : 'Not assigned yet'}</span>
              </div>
              {complaint.updatedAt && (
                <div className="small text-muted-cg mt-2">Last update {formatDate(complaint.updatedAt)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
