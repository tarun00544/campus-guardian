import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Wrench } from 'lucide-react';
import { getMyComplaints } from '../services/complaintService';
import { getErrorMessage } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';

const FILTERS = ['All', 'Reported', 'Assigned', 'In Progress', 'Resolved'];

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('grid');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyComplaints();
        if (active) { setComplaints(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    if (filter === 'All') return complaints;
    const want = filter.toLowerCase();
    return complaints.filter((c) => String(c.status || '').toLowerCase().replace(/[_-]/g, ' ') === want);
  }, [complaints, filter]);

  return (
    <div className="container cg-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 className="cg-page-title">My complaints</h1>
          <p className="cg-page-sub">Every problem you have reported and where it stands.</p>
        </div>
        <Link to="/report-problem" className="btn btn-guard">Report a problem</Link>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`btn btn-sm ${filter === f ? 'btn-guard' : 'btn-guard-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="btn-group btn-group-sm d-none d-md-inline-flex">
          <button type="button" className={`btn ${view === 'grid' ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setView('grid')} aria-label="Card view">
            <LayoutGrid size={15} />
          </button>
          <button type="button" className={`btn ${view === 'table' ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setView('table')} aria-label="Table view">
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading complaints..." rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={filter === 'All' ? 'No complaints yet' : `Nothing under ${filter}`}
          message={filter === 'All' ? 'Report the first problem you run into and track it here.' : 'Try another status filter.'}
          actionLabel={filter === 'All' ? 'Report a problem' : undefined}
          actionTo={filter === 'All' ? '/report-problem' : undefined}
        />
      ) : view === 'grid' ? (
        <div className="row g-3">
          {visible.map((c) => (
            <div className="col-md-6 col-xl-4" key={c._id || c.id}>
              <ComplaintCard complaint={c} />
            </div>
          ))}
        </div>
      ) : (
        <div className="cg-card cg-table-wrap">
          <table className="cg-table">
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Location</th><th>Priority</th><th>Status</th><th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c._id || c.id}>
                  <td><Link to={`/complaints/${c._id || c.id}`}>{c.title}</Link></td>
                  <td>{c.category || '—'}</td>
                  <td>{c.location || '—'}</td>
                  <td>{c.priority ? <StatusBadge status={c.priority} /> : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-muted-cg">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
