import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, ClipboardList, Search, TriangleAlert, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyComplaints } from '../services/complaintService';
import { getNotifications } from '../services/notificationService';
import { getErrorMessage } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';

const countBy = (complaints, matcher) =>
  complaints.filter((c) => matcher(String(c.status || '').toLowerCase().replace(/[_-]/g, ' '))).length;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [myComplaints, notes] = await Promise.all([
          getMyComplaints(),
          getNotifications().catch(() => [])
        ]);
        if (!active) return;
        setComplaints(myComplaints);
        setNotifications(notes);
        setError('');
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const stats = [
    { label: 'My complaints', value: complaints.length, tone: 'info' },
    { label: 'Pending', value: countBy(complaints, (s) => s === 'reported' || s === 'pending' || s === 'open'), tone: 'warn' },
    { label: 'In progress', value: countBy(complaints, (s) => s === 'in progress' || s === 'assigned'), tone: 'info' },
    { label: 'Resolved', value: countBy(complaints, (s) => s === 'resolved' || s === 'closed'), tone: 'good' }
  ];

  return (
    <div className="container cg-page">
      <h1 className="cg-page-title">Welcome, {user?.name || 'student'}</h1>
      <p className="cg-page-sub">Here is what is happening with your reports.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          <Link to="/emergency" className="cg-emergency-button mb-4">
            <span className="cg-emergency-ring"><TriangleAlert size={26} /></span>
            <span>
              <span className="title">EMERGENCY</span>
              <span className="sub d-block">Alert the campus response team now</span>
            </span>
          </Link>

          <div className="row g-3 mb-4">
            {[
              { to: '/report-problem', label: 'Report a problem', icon: Wrench },
              { to: '/lost-found', label: 'Lost & found', icon: Search },
              { to: '/my-complaints', label: 'My complaints', icon: ClipboardList },
              { to: '/leave', label: 'Leave application', icon: CalendarDays }
            ].map(({ to, label, icon: Icon }) => (
              <div className="col-6 col-md-4" key={to}>
                <Link to={to} className="cg-card cg-card-link h-100">
                  <div className="cg-card-body text-center py-4">
                    <Icon size={22} style={{ color: 'var(--cg-deep)' }} />
                    <div className="fw-semibold mt-2 small">{label}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="row g-3 mb-4">
            {stats.map((s) => (
              <div className="col-6 col-lg-3" key={s.label}>
                <div className="cg-card h-100">
                  <div className="cg-stat">
                    <div className="value">{loading ? '—' : s.value}</div>
                    <div className="label">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 mb-0">Recent complaints</h2>
            <Link to="/my-complaints" className="small">See all</Link>
          </div>

          {loading ? (
            <Loading label="Loading your complaints..." rows={2} />
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No complaints yet"
              message="Something broken on campus? File it and follow it to closure."
              actionLabel="Report a problem"
              actionTo="/report-problem"
            />
          ) : (
            <div className="row g-3">
              {complaints.slice(0, 4).map((c) => (
                <div className="col-md-6" key={c._id || c.id}>
                  <ComplaintCard complaint={c} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="cg-card">
            <div className="cg-card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 mb-0 d-flex align-items-center gap-2"><Bell size={16} /> Notifications</h2>
                <Link to="/notifications" className="small">See all</Link>
              </div>
              {loading ? (
                <Loading label="Loading notifications..." compact />
              ) : notifications.length === 0 ? (
                <p className="small text-muted-cg mb-0">Nothing yet. Updates on your reports will show up here.</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n._id || n.id} className="border-bottom py-2">
                    <div className="small fw-semibold">{n.title || n.type || 'Update'}</div>
                    <div className="small text-muted-cg">{n.message || n.body}</div>
                    <div className="small text-muted-cg">{formatDate(n.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cg-card mt-3" style={{ borderLeft: '5px solid var(--cg-alert)' }}>
            <div className="cg-card-body small">
              <strong>In a life-threatening situation</strong>
              <p className="text-muted-cg mb-0 mt-1">
                Call your local emergency services first. Campus Guardian notifies the campus
                response team inside the app only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
