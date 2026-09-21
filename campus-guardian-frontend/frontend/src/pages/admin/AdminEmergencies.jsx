import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { getEmergencies, updateEmergencyStatus, deleteEmergency } from '../../services/emergencyService';
import { getErrorMessage } from '../../services/api';
import EmergencyCard from '../../components/EmergencyCard';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['Active', 'Responding', 'Resolved', 'Cancelled'];
const FILTERS = ['All', ...STATUSES];

const AdminEmergencies = () => {
  const { isAdmin } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [workingId, setWorkingId] = useState('');

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setEmergencies(await getEmergencies()); setError(''); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const timer = setInterval(() => load(true), 30000); return () => clearInterval(timer); }, []);

  const setStatus = async (item, status) => {
    const id = item._id || item.id; setWorkingId(id);
    try { await updateEmergencyStatus(id, status); await load(true); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setWorkingId(''); }
  };

  const remove = async (item) => {
    if (!isAdmin) return;
    const id = item._id || item.id;
    if (!window.confirm(`Delete this ${item.type || ''} emergency permanently?`)) return;
    setWorkingId(id);
    try { await deleteEmergency(id); await load(true); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setWorkingId(''); }
  };

  const visible = useMemo(() => filter === 'All' ? emergencies : emergencies.filter((e) => String(e.status || '').toLowerCase() === filter.toLowerCase()), [emergencies, filter]);
  const active = emergencies.filter((e) => String(e.status || '').toLowerCase() === 'active');

  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
      <div><h1 className="cg-page-title">Emergency response desk</h1><p className="cg-page-sub">Alerts refresh every 30 seconds. Only admin can permanently delete an emergency.</p></div>
      <button type="button" className="btn btn-guard-outline" onClick={() => load()}><RefreshCw size={15} className="me-2" />Refresh</button>
    </div>
    {error && <div className="alert alert-danger py-2 small">{error}</div>}
    {active.length > 0 && <div className="cg-live-banner mb-3 d-flex align-items-center gap-2"><span className="cg-live-dot" /><TriangleAlert size={18} style={{ color: 'var(--cg-alert)' }} /><strong>{active.length} active {active.length === 1 ? 'alert needs' : 'alerts need'} a responder</strong></div>}
    <div className="d-flex flex-wrap gap-2 mb-3">{FILTERS.map((f) => <button key={f} type="button" className={`btn btn-sm ${filter === f ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
    {loading ? <Loading label="Loading emergency alerts..." rows={3} /> : visible.length === 0 ? <EmptyState icon={TriangleAlert} title="No alerts here" message="Nothing matches this filter right now." /> : <div className="row g-3">
      {visible.map((e) => { const id = e._id || e.id; const current = String(e.status || '').toLowerCase(); return <div className="col-lg-6" key={id}><EmergencyCard emergency={e} actions={<>
        {STATUSES.filter((s) => s.toLowerCase() !== current).map((s) => <button key={s} type="button" className={`btn btn-sm ${s === 'Responding' ? 'btn-alert' : 'btn-guard-outline'}`} onClick={() => setStatus(e, s)} disabled={workingId === id}>{s === 'Responding' ? 'Take this' : `Mark ${s.toLowerCase()}`}</button>)}
        {isAdmin && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(e)} disabled={workingId === id}><Trash2 size={14} className="me-1" />Delete</button>}
      </>} /></div>; })}
    </div>}
  </>;
};
export default AdminEmergencies;
