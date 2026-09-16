import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { CheckCircle2, Clock, Package, TriangleAlert, Users, Wrench } from 'lucide-react';
import { getDashboard } from '../../services/adminService';
import { getEmergencies } from '../../services/emergencyService';
import { getErrorMessage } from '../../services/api';
import EmergencyCard from '../../components/EmergencyCard';
import Loading from '../../components/Loading';

// The backend may name these fields slightly differently; take the first that exists.
const pick = (obj, keys, fallback = 0) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
    if (typeof value === 'number') return value;
  }
  return fallback;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, alerts] = await Promise.all([getDashboard(), getEmergencies().catch(() => [])]);
        if (!active) return;
        setStats(data || {});
        setEmergencies(alerts);
        setError('');
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const cards = [
    { label: 'Total users', value: pick(stats, ['totalUsers', 'users', 'userCount']), icon: Users },
    { label: 'Total complaints', value: pick(stats, ['totalComplaints', 'complaints', 'complaintCount']), icon: Wrench },
    { label: 'Pending', value: pick(stats, ['pendingComplaints', 'pending', 'complaintsByStatus.reported']), icon: Clock },
    { label: 'In progress', value: pick(stats, ['inProgressComplaints', 'inProgress', 'complaintsByStatus.inProgress']), icon: Clock },
    { label: 'Resolved', value: pick(stats, ['resolvedComplaints', 'resolved', 'complaintsByStatus.resolved']), icon: CheckCircle2 },
    { label: 'Active emergencies', value: pick(stats, ['activeEmergencies', 'emergenciesActive', 'activeAlerts']), icon: TriangleAlert },
    { label: 'Lost items', value: pick(stats, ['lostItems', 'totalLost', 'lostCount']), icon: Package },
    { label: 'Found items', value: pick(stats, ['foundItems', 'totalFound', 'foundCount']), icon: Package },
    { label: 'Matched items', value: pick(stats, ['matchedItems', 'matched', 'matchedCount']), icon: CheckCircle2 }
  ];

  const complaintChart = [
    { name: 'Pending', value: cards[2].value, fill: '#e08c1e' },
    { name: 'In progress', value: cards[3].value, fill: '#0e5c73' },
    { name: 'Resolved', value: cards[4].value, fill: '#1f7a4d' }
  ];

  const active = emergencies.filter((e) => String(e.status || '').toLowerCase() === 'active');

  if (loading) return <Loading label="Loading campus overview..." rows={3} />;

  return (
    <>
      <h1 className="cg-page-title">Campus overview</h1>
      <p className="cg-page-sub">Live numbers across complaints, emergencies and lost &amp; found.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {active.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="cg-live-dot" />
            <h2 className="h6 mb-0">{active.length} active {active.length === 1 ? 'emergency' : 'emergencies'}</h2>
            <Link to="/admin/emergencies" className="small ms-auto">Open response desk</Link>
          </div>
          <div className="row g-3">
            {active.slice(0, 2).map((e) => (
              <div className="col-md-6" key={e._id || e.id}><EmergencyCard emergency={e} /></div>
            ))}
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="col-6 col-md-4 col-xl-3" key={label}>
            <div className="cg-card h-100">
              <div className="cg-stat d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="value">{value}</div>
                  <div className="label">{label}</div>
                </div>
                <span className="cg-stat-icon" style={{ background: 'var(--cg-teal-soft)', color: 'var(--cg-deep)' }}>
                  <Icon size={18} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cg-card">
        <div className="cg-card-body">
          <h2 className="h6 mb-3">Complaints by status</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={complaintChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eef0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {complaintChart.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
