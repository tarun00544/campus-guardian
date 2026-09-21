import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { getAllLeaves, reviewLeave, deleteLeave } from '../../services/leaveService';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/auth';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('Approved');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setLeaves(await getAllLeaves(status === 'All' ? {} : { status })); setError(''); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const pendingCount = useMemo(() => leaves.filter((l) => l.status === 'Pending').length, [leaves]);

  const openReview = (leave, next) => { setTarget(leave); setNextStatus(next); setNote(''); };

  const removeLeave = async (leave) => {
    const studentName = leave.student?.name || 'this student';
    const confirmed = window.confirm(`Delete this leave application from ${studentName}?\n\nThis cannot be undone.`);
    if (!confirmed) return;

    setWorking(true);
    setError('');
    try {
      await deleteLeave(leave._id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const save = async () => {
    if (!target) return;
    setWorking(true);
    try { await reviewLeave(target._id, nextStatus, note); setTarget(null); await load(); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setWorking(false); }
  };

  return (
    <>
      <h1 className="cg-page-title">Leave applications</h1>
      <p className="cg-page-sub">Review student leave requests and approve or reject them.</p>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="cg-card mb-3"><div className="cg-card-body d-flex align-items-center gap-3 flex-wrap">
        <strong>{pendingCount} pending</strong>
        <select className="form-select" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option>
        </select>
      </div></div>

      {loading ? <Loading label="Loading leave applications..." rows={4} /> : leaves.length === 0 ? <EmptyState title="No leave applications" message="There are no requests for this filter." /> : (
        <div className="d-grid gap-3">
          {leaves.map((leave) => (
            <div className="cg-card" key={leave._id}>
              <div className="cg-card-body">
                <div className="d-flex justify-content-between gap-3 flex-wrap">
                  <div>
                    <div className="h6 mb-1">{leave.student?.name || 'Student'}</div>
                    <div className="small text-muted-cg">{leave.student?.email} · {leave.student?.phone || 'No phone'}</div>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
                <hr />
                <div className="row g-3 small">
                  <div className="col-md-4"><strong>Going to</strong><div>{leave.destination}</div></div>
                  <div className="col-md-4"><strong>From</strong><div>{formatDate(leave.fromDate)}</div></div>
                  <div className="col-md-4"><strong>Until</strong><div>{formatDate(leave.toDate)}</div></div>
                  <div className="col-12"><strong>Purpose</strong><div>{leave.purpose}</div></div>
                </div>
                {leave.adminNote && <div className="small text-muted-cg mt-3"><strong>Admin note:</strong> {leave.adminNote}</div>}
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  {leave.status === 'Pending' && <>
                    <button className="btn btn-sm btn-guard" onClick={() => openReview(leave, 'Approved')} disabled={working}><CheckCircle2 size={15} className="me-1" />Approve</button>
                    <button className="btn btn-sm btn-guard-outline" onClick={() => openReview(leave, 'Rejected')} disabled={working}><XCircle size={15} className="me-1" />Reject</button>
                  </>}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeLeave(leave)} disabled={working}>
                    <Trash2 size={15} className="me-1" />Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(target)} title={`${nextStatus} leave application`} onClose={() => setTarget(null)} footer={(
        <><button className="btn btn-guard-outline" onClick={() => setTarget(null)}>Cancel</button><button className="btn btn-guard" onClick={save} disabled={working}>{working ? 'Saving...' : `Confirm ${nextStatus}`}</button></>
      )}>
        <p className="small text-muted-cg">{target?.student?.name} · {target?.destination}</p>
        <label className="form-label" htmlFor="leaveNote">Admin note (optional)</label>
        <textarea id="leaveNote" className="form-control" rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the student..." />
      </Modal>
    </>
  );
};

export default AdminLeaves;
