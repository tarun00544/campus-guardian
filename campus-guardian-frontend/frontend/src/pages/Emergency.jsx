import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Crosshair, TriangleAlert } from 'lucide-react';
import { createEmergency, getEmergencies } from '../services/emergencyService';
import { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';
import { LOCATIONS } from './ReportProblem';

const TYPES = ['Medical', 'Fire', 'Accident', 'Security', 'Harassment', 'Other'];

const Emergency = () => {
  const [form, setForm] = useState({ type: '', description: '', location: '' });
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const [mine, setMine] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);

  const loadMine = async () => {
    try {
      const list = await getEmergencies();
      setMine(list);
    } catch {
      setMine([]);
    } finally {
      setLoadingMine(false);
    }
  };

  useEffect(() => { loadMine(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This device cannot share a location. Type the location instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        });
        setLocating(false);
      },
      () => {
        setError('Location access was refused. Choose the campus location instead.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.type || !form.location.trim()) {
      setError('Choose the emergency type and where you are.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (coords.latitude && coords.longitude) {
        payload.latitude = Number(coords.latitude);
        payload.longitude = Number(coords.longitude);
      }
      const created = await createEmergency(payload);
      setSent(created || { type: form.type, status: 'active', createdAt: new Date().toISOString() });
      setForm({ type: '', description: '', location: '' });
      setCoords({ latitude: '', longitude: '' });
      loadMine();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 900 }}>
      <div className="cg-card mb-4" style={{ borderLeft: '6px solid var(--cg-alert)' }}>
        <div className="cg-card-body d-flex gap-3 align-items-start">
          <TriangleAlert size={26} style={{ color: 'var(--cg-alert)' }} className="flex-shrink-0" />
          <div>
            <h1 className="h5 mb-1">Emergency alert</h1>
            <p className="mb-2 small">
              This sends an alert to the campus response team inside Campus Guardian.
              It does not call the police, an ambulance or the fire service.
            </p>
            <p className="mb-0 small fw-semibold">
              If life is at risk, contact your local emergency services directly first, then raise this alert.
            </p>
          </div>
        </div>
      </div>

      {sent ? (
        <div className="cg-card mb-4">
          <div className="cg-card-body text-center py-5">
            <CheckCircle2 size={40} style={{ color: 'var(--cg-green)' }} className="mb-3" />
            <h2 className="h5">Emergency alert sent to campus response team.</h2>
            <p className="text-muted-cg">
              Stay where you are if it is safe. The response team can see your alert now.
            </p>
            <div className="d-flex justify-content-center gap-2 align-items-center mb-3">
              <StatusBadge status={sent.status || 'active'} />
              <span className="small text-muted-cg">{formatDate(sent.createdAt || new Date())}</span>
            </div>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {(sent._id || sent.id) && (
                <Link className="btn btn-guard" to={`/emergency/${sent._id || sent.id}`}>Track this alert</Link>
              )}
              <button type="button" className="btn btn-guard-outline" onClick={() => setSent(null)}>Raise another alert</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cg-card mb-4">
          <form className="cg-card-body" onSubmit={submit} noValidate>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <label className="form-label">What is happening?</label>
            <div className="row g-2 mb-3">
              {TYPES.map((t) => (
                <div className="col-6 col-md-4" key={t}>
                  <button
                    type="button"
                    className={`btn w-100 ${form.type === t ? 'btn-alert' : 'btn-guard-outline'}`}
                    onClick={() => setForm({ ...form, type: t })}
                    aria-pressed={form.type === t}
                  >
                    {t}
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="location">Where are you?</label>
              <input
                id="location" name="location" className="form-control" list="cg-locations"
                value={form.location} onChange={change}
                placeholder="Block B, second floor corridor" required
              />
              <datalist id="cg-locations">
                {LOCATIONS.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="description">Details (optional)</label>
              <textarea id="description" name="description" rows={3} className="form-control"
                value={form.description} onChange={change} placeholder="Who is involved, and what help is needed." />
            </div>

            <div className="row g-2 align-items-end mb-4">
              <div className="col-sm-4">
                <label className="form-label" htmlFor="lat">Latitude</label>
                <input id="lat" className="form-control" value={coords.latitude}
                  onChange={(e) => setCoords({ ...coords, latitude: e.target.value })} placeholder="Optional" />
              </div>
              <div className="col-sm-4">
                <label className="form-label" htmlFor="lng">Longitude</label>
                <input id="lng" className="form-control" value={coords.longitude}
                  onChange={(e) => setCoords({ ...coords, longitude: e.target.value })} placeholder="Optional" />
              </div>
              <div className="col-sm-4">
                <button type="button" className="btn btn-guard-outline w-100" onClick={useMyLocation} disabled={locating}>
                  <Crosshair size={15} className="me-2" />{locating ? 'Finding...' : 'Use my location'}
                </button>
              </div>
            </div>

            <button type="submit" className="cg-emergency-button" disabled={submitting}>
              <span className="cg-emergency-ring"><TriangleAlert size={26} /></span>
              <span>
                <span className="title">{submitting ? 'SENDING ALERT...' : 'SEND EMERGENCY ALERT'}</span>
                <span className="sub d-block">Goes to the campus response team right away</span>
              </span>
            </button>
          </form>
        </div>
      )}

      <h2 className="h6 mb-3">Campus alerts</h2>
      {loadingMine ? (
        <Loading label="Loading alerts..." rows={1} />
      ) : mine.length === 0 ? (
        <div className="cg-card"><div className="cg-card-body small text-muted-cg">No alerts to show.</div></div>
      ) : (
        <div className="cg-card cg-table-wrap">
          <table className="cg-table">
            <thead><tr><th>Type</th><th>Location</th><th>Raised</th><th>Status</th><th /></tr></thead>
            <tbody>
              {mine.slice(0, 8).map((e) => (
                <tr key={e._id || e.id}>
                  <td className="fw-semibold">{e.type}</td>
                  <td>{e.location || '—'}</td>
                  <td className="text-muted-cg">{formatDate(e.createdAt)}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td><Link className="small" to={`/emergency/${e._id || e.id}`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Emergency;
