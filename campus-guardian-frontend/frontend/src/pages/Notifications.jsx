import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Package, TriangleAlert, Wrench } from 'lucide-react';
import { getNotifications, markAllRead, markRead } from '../services/notificationService';
import { getErrorMessage } from '../services/api';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import { formatDate } from '../utils/auth';

const ICONS = {
  complaint: Wrench,
  emergency: TriangleAlert,
  'lost-found': Package,
  lostfound: Package,
  system: Bell
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const load = async () => {
    try {
      const data = await getNotifications();
      setItems(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isRead = (n) => Boolean(n.isRead ?? n.read);
  const unread = items.filter((n) => !isRead(n)).length;

  const readOne = async (n) => {
    const id = n._id || n.id;
    if (!id || isRead(n)) return;
    setItems((prev) => prev.map((x) => ((x._id || x.id) === id ? { ...x, isRead: true, read: true } : x)));
    try {
      await markRead(id);
    } catch {
      load();
    }
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true, read: true })));
    try {
      await markAllRead();
    } catch {
      load();
    }
  };

  const types = ['All', 'Complaint', 'Emergency', 'Lost & Found', 'System'];
  const visible = items.filter((n) => {
    if (filter === 'All') return true;
    const t = String(n.type || '').toLowerCase().replace(/[^a-z]/g, '');
    return t === filter.toLowerCase().replace(/[^a-z]/g, '');
  });

  return (
    <div className="container cg-page" style={{ maxWidth: 780 }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 className="cg-page-title">Notifications</h1>
          <p className="cg-page-sub">{unread > 0 ? `${unread} unread` : 'You are all caught up.'}</p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn btn-guard-outline" onClick={readAll}>
            <CheckCheck size={16} className="me-2" />Mark all as read
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {types.map((t) => (
          <button key={t} type="button" className={`btn btn-sm ${filter === t ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading notifications..." rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing here" message="Updates on your complaints, alerts and items will appear here." />
      ) : (
        <div className="cg-card">
          {visible.map((n) => {
            const key = String(n.type || 'system').toLowerCase().replace(/[^a-z]/g, '');
            const Icon = ICONS[key] || Bell;
            return (
              <button
                key={n._id || n.id}
                type="button"
                onClick={() => readOne(n)}
                className={`cg-dropdown-item w-100 text-start border-0 ${isRead(n) ? 'bg-transparent' : 'unread'}`}
              >
                <div className="d-flex gap-3">
                  <Icon size={18} className="flex-shrink-0 mt-1" style={{ color: 'var(--cg-deep)' }} />
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{n.title || n.type || 'Update'}</div>
                    <div className="small text-muted-cg">{n.message || n.body}</div>
                    <div className="small text-muted-cg mt-1">{formatDate(n.createdAt)}</div>
                  </div>
                  {!isRead(n) && <span className="cg-badge info align-self-start">New</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
