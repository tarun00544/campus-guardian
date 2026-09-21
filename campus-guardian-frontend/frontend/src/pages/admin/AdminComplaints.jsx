import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getAllComplaints, getAssignableUsers } from '../../services/adminService';
import { assignComplaint, updateComplaintStatus, deleteComplaint } from '../../services/complaintService';
import { getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/auth';
import { CATEGORIES } from '../ReportProblem';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');

  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const { isAdmin } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllComplaints();
      setComplaints(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    getAssignableUsers()
      .then(setAssignableUsers)
      .catch(() => setAssignableUsers([]));
  }, [isAdmin]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints.filter((c) => {
      const s = String(c.status || '').toLowerCase().replace(/[_-]/g, ' ');
      if (status !== 'All' && s !== status.toLowerCase()) return false;
      if (category !== 'All' && c.category !== category) return false;
      if (!q) return true;
      return [c.title, c.description, c.location, c.category, c.reportedBy?.name, c.user?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [complaints, query, status, category]);

  const saveStatus = async () => {
    if (!statusTarget || !nextStatus) return;
    setWorking(true);
    setActionError('');
    try {
      await updateComplaintStatus(statusTarget._id || statusTarget.id, nextStatus);
      setStatusTarget(null);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const removeComplaint = async (complaint) => {
    if (!isAdmin) return;
    const id = complaint._id || complaint.id;
    if (!window.confirm(`Delete complaint "${complaint.title}" permanently?`)) return;
    setWorking(true); setActionError('');
    try { await deleteComplaint(id); await load(); }
    catch (err) { setActionError(getErrorMessage(err)); }
    finally { setWorking(false); }
  };

  const saveAssignee = async () => {
    if (!assignTarget || !assignee) {
      setActionError('Select a staff or security user.');
      return;
    }
    setWorking(true);
    setActionError('');
    try {
      await assignComplaint(assignTarget._id || assignTarget.id, { assignedTo: assignee });
      setAssignTarget(null);
      setAssignee('');
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <h1 className="cg-page-title">Complaints</h1>
      <p className="cg-page-sub">Filter the queue, assign an owner and move each report forward.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="cg-card mb-3">
        <div className="cg-card-body">
          <div className="row g-2 align-items-end">
            <div className="col-lg-5">
              <label className="form-label" htmlFor="q">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><Search size={15} /></span>
                <input id="q" className="form-control" placeholder="Title, location or reporter" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label" htmlFor="st">Status</label>
              <select id="st" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label" htmlFor="ct">Category</label>
              <select id="ct" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-lg-1">
              <button type="button" className="btn btn-guard-outline w-100" onClick={() => { setQuery(''); setStatus('All'); setCategory('All'); }} aria-label="Clear filters">
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading complaints..." rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState title="No complaints match" message="Change the filters or clear the search." />
      ) : (
        <div className="cg-card cg-table-wrap">
          <table className="cg-table">
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Location</th><th>Reported by</th>
                <th>Priority</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c._id || c.id}>
                  <td><Link to={`/complaints/${c._id || c.id}`}>{c.title}</Link></td>
                  <td>{c.category || '—'}</td>
                  <td>{c.location || '—'}</td>
                  <td>{c.reportedBy?.name || c.user?.name || '—'}</td>
                  <td>{c.priority ? <StatusBadge status={c.priority} /> : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-muted-cg">{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-guard-outline"
                        onClick={() => { setStatusTarget(c); setNextStatus(c.status || 'Reported'); setActionError(''); }}>
                        Status
                      </button>
                      {isAdmin && <button type="button" className="btn btn-sm btn-guard-outline"
                        onClick={() => { setAssignTarget(c); setAssignee(c.assignedTo?._id || ''); setActionError(''); }}>
                        Assign
                      </button>}
                      {isAdmin && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeComplaint(c)} disabled={working}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(statusTarget)}
        title="Change status"
        onClose={() => setStatusTarget(null)}
        footer={(
          <>
            <button type="button" className="btn btn-guard-outline" onClick={() => setStatusTarget(null)}>Cancel</button>
            <button type="button" className="btn btn-guard" onClick={saveStatus} disabled={working}>
              {working ? 'Saving...' : 'Save status'}
            </button>
          </>
        )}
      >
        {actionError && <div className="alert alert-danger py-2 small">{actionError}</div>}
        <p className="small text-muted-cg">{statusTarget?.title}</p>
        <label className="form-label" htmlFor="newStatus">New status</label>
        <select id="newStatus" className="form-select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="form-text">The student is notified when this changes.</div>
      </Modal>

      <Modal
        open={Boolean(assignTarget)}
        title="Assign staff"
        onClose={() => setAssignTarget(null)}
        footer={(
          <>
            <button type="button" className="btn btn-guard-outline" onClick={() => setAssignTarget(null)}>Cancel</button>
            <button type="button" className="btn btn-guard" onClick={saveAssignee} disabled={working}>
              {working ? 'Saving...' : 'Assign'}
            </button>
          </>
        )}
      >
        {actionError && <div className="alert alert-danger py-2 small">{actionError}</div>}
        <p className="small text-muted-cg">{assignTarget?.title}</p>
        <label className="form-label" htmlFor="assignee">Assign to staff / security</label>
        <select id="assignee" className="form-select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Select a registered user</option>
          {['staff', 'security'].map((role) => {
            const group = assignableUsers.filter((u) => u.role === role);
            if (!group.length) return null;
            return (
              <optgroup key={role} label={role === 'staff' ? 'Staff' : 'Security'}>
                {group.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
        {assignableUsers.length === 0 && <div className="form-text text-danger">No active staff/security users available. First create the account, then change its role in Users.</div>}
      </Modal>
    </>
  );
};

export default AdminComplaints;
