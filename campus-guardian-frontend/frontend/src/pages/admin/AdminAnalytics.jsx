import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { getAnalytics } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';

const COLORS = ['#0e5c73', '#e08c1e', '#1f7a4d', '#c62234', '#4c6b7a', '#7cb3c4', '#a8742a', '#57937a'];

// Accepts [{_id,count}], [{name,value}], or { key: number } and returns chart rows.
const toSeries = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((row) => ({
        name: String(row.name ?? row._id ?? row.label ?? row.key ?? 'Unknown'),
        value: Number(row.value ?? row.count ?? row.total ?? 0)
      }))
      .filter((row) => Number.isFinite(row.value));
  }
  if (typeof input === 'object') {
    return Object.entries(input)
      .filter(([, v]) => typeof v === 'number')
      .map(([name, value]) => ({ name, value }));
  }
  return [];
};

const ChartCard = ({ title, data, type = 'bar' }) => (
  <div className="cg-card h-100">
    <div className="cg-card-body">
      <h2 className="h6 mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="small text-muted-cg mb-0">No data for this yet.</p>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            {type === 'pie' ? (
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
                  {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={data} margin={{ left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eef0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={54} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </div>
);

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAnalytics();
        if (active) { setAnalytics(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <Loading label="Loading analytics..." rows={3} />;

  if (error) {
    return (
      <>
        <h1 className="cg-page-title">Analytics</h1>
        <div className="alert alert-danger py-2 small">{error}</div>
      </>
    );
  }

  const a = analytics || {};
  const byCategory = toSeries(a.complaintsByCategory || a.categories || a.byCategory);
  const byLocation = toSeries(a.complaintsByLocation || a.locations || a.byLocation);
  const byStatus = toSeries(a.complaintsByStatus || a.statuses || a.byStatus);
  const emergencyTypes = toSeries(a.emergenciesByType || a.emergencyTypes || a.byEmergencyType);
  const lostFound = toSeries(a.lostFound || a.lostFoundStats || a.lostAndFound);

  const everythingEmpty = [byCategory, byLocation, byStatus, emergencyTypes, lostFound]
    .every((s) => s.length === 0);

  return (
    <>
      <h1 className="cg-page-title">Analytics</h1>
      <p className="cg-page-sub">Where problems cluster, and how the campus responds.</p>

      {everythingEmpty ? (
        <EmptyState title="Nothing to chart yet" message="Once reports come in, the breakdowns appear here." />
      ) : (
        <div className="row g-3">
          <div className="col-xl-6"><ChartCard title="Complaints by category" data={byCategory} /></div>
          <div className="col-xl-6"><ChartCard title="Complaints by location" data={byLocation} /></div>
          <div className="col-xl-6"><ChartCard title="Complaints by status" data={byStatus} type="pie" /></div>
          <div className="col-xl-6"><ChartCard title="Emergencies by type" data={emergencyTypes} /></div>
          <div className="col-12"><ChartCard title="Lost &amp; found" data={lostFound} /></div>
        </div>
      )}
    </>
  );
};

export default AdminAnalytics;
