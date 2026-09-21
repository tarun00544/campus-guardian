import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, QrCode, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createLeave, getLeaveQr, getMyLeaves } from '../services/leaveService';
import { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';
import LeaveQrCode from '../components/LeaveQrCode';

const LeaveApplication = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ destination: '', fromDate: '', toDate: '', purpose: '' });
  const [leaves, setLeaves] = useState([]);
  const [qr, setQr] = useState(null);
  const [qrLeave, setQrLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try { setLeaves(await getMyLeaves()); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setSending(true);
    try {
      await createLeave(form);
      setForm({ destination: '', fromDate: '', toDate: '', purpose: '' });
      setMessage('Leave request sent to admin successfully.');
      await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const showQr = async (leave) => {
    setError(''); setMessage(''); setQrLoading(true); setQrLeave(leave);
    try {
      const data = await getLeaveQr(leave._id);
      setQr(data);
    } catch (err) {
      setQr(null);
      setError(getErrorMessage(err));
    } finally { setQrLoading(false); }
  };

  if (String(user?.role || '').toLowerCase() !== 'student') {
    return <div className="container cg-page"><div className="alert alert-info">Leave applications are available for student accounts.</div></div>;
  }

  return (
    <div className="container cg-page" style={{ maxWidth: 900 }}>
      <h1 className="cg-page-title">Leave application</h1>
      <p className="cg-page-sub">Submit your leave request to admin. After approval, the QR can be scanned once while leaving and once while returning.</p>

      <div className="cg-card mb-4">
        <form className="cg-card-body" onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {message && <div className="alert alert-success py-2 small">{message}</div>}
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="destination"><MapPin size={15} className="me-1" /> Where are you going?</label>
              <input id="destination" name="destination" className="form-control" value={form.destination} onChange={change} placeholder="e.g. Home, Agra" required maxLength={200} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="fromDate"><CalendarDays size={15} className="me-1" /> From</label>
              <input id="fromDate" name="fromDate" type="datetime-local" className="form-control" value={form.fromDate} onChange={change} required />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="toDate"><Clock3 size={15} className="me-1" /> To</label>
              <input id="toDate" name="toDate" type="datetime-local" className="form-control" value={form.toDate} onChange={change} required />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="purpose">Why are you going? / Purpose</label>
              <textarea id="purpose" name="purpose" className="form-control" rows="4" value={form.purpose} onChange={change} placeholder="Explain the reason for your leave..." required maxLength={1000} />
            </div>
          </div>
          <button type="submit" className="btn btn-guard mt-3" disabled={sending}>
            <Send size={15} className="me-2" />{sending ? 'Sending...' : 'Send request to admin'}
          </button>
        </form>
      </div>

      <div className="cg-card">
        <div className="cg-card-body">
          <h2 className="h6 mb-3">My leave requests</h2>
          {loading ? <Loading label="Loading leave requests..." rows={2} /> : leaves.length === 0 ? (
            <p className="small text-muted-cg mb-0">No leave applications yet.</p>
          ) : (
            <div className="d-grid gap-3">
              {leaves.map((leave) => {
                const scanCount = leave.qrScanCount || 0;
                const now = new Date();
                // Approved students can open their QR before departure.
                // The backend scanner controls when OUT/IN scans are actually accepted.
                const qrAvailable = leave.status === 'Approved' && scanCount < 2 && now < new Date(leave.toDate);
                return (
                  <div key={leave._id} className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                      <div><strong>{leave.destination}</strong><div className="small text-muted-cg mt-1">{formatDate(leave.fromDate)} → {formatDate(leave.toDate)}</div></div>
                      <StatusBadge status={leave.status} />
                    </div>
                    <div className="small mt-2">{leave.purpose}</div>
                    {leave.adminNote && <div className="small text-muted-cg mt-2"><strong>Admin note:</strong> {leave.adminNote}</div>}
                    {leave.status === 'Approved' && (
                      <div className="mt-3">
                        {scanCount >= 2 ? (
                          <div className="alert alert-secondary py-2 small mb-0">QR expired after 2 scans: OUT + IN.</div>
                        ) : qrAvailable ? (
                          <button className="btn btn-sm btn-guard" type="button" onClick={() => showQr(leave)} disabled={qrLoading}>
                            <QrCode size={15} className="me-1" /> {qrLoading && qrLeave?._id === leave._id ? 'Opening QR...' : `Show QR (${scanCount === 0 ? 'OUT' : 'IN'})`}
                          </button>
                        ) : (
                          <div className="alert alert-secondary py-2 small mb-0">QR is available after admin approval until the approved return time. Scanning is allowed at the approved departure/return time.</div>
                        )}
                        <div className="small text-muted-cg mt-2">Scans used: {scanCount}/2</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LeaveQrCode
        open={Boolean(qr && qrLeave)}
        onClose={() => setQr(null)}
        token={qr?.token}
        nextScan={qr?.nextScan}
        destination={qrLeave?.destination}
        scanCount={qr?.scanCount || 0}
      />
    </div>
  );
};

export default LeaveApplication;
