import { useEffect, useMemo, useState } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { getLostFound } from '../../services/lostFoundService';
import { getErrorMessage } from '../../services/api';
import LostFoundCard from '../../components/LostFoundCard';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';

const TABS = ['All', 'Lost', 'Found'];

const AdminLostFound = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getLostFound();
        if (active) { setItems(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tab !== 'All' && String(item.type || '').toLowerCase() !== tab.toLowerCase()) return false;
      if (!q) return true;
      return [item.itemName, item.title, item.category, item.location].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [items, tab, query]);

  const counts = {
    lost: items.filter((i) => String(i.type).toLowerCase() === 'lost').length,
    found: items.filter((i) => String(i.type).toLowerCase() === 'found').length,
    closed: items.filter((i) => ['matched', 'returned', 'claimed', 'resolved'].includes(String(i.status).toLowerCase())).length
  };

  return (
    <>
      <h1 className="cg-page-title">Lost &amp; found</h1>
      <p className="cg-page-sub">Everything posted by students, with what has been returned.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="row g-3 mb-3">
        {[
          { label: 'Lost items', value: counts.lost },
          { label: 'Found items', value: counts.found },
          { label: 'Returned or matched', value: counts.closed }
        ].map((s) => (
          <div className="col-md-4" key={s.label}>
            <div className="cg-card h-100"><div className="cg-stat">
              <div className="value">{s.value}</div>
              <div className="label">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" className={`btn btn-sm ${tab === t ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="input-group" style={{ maxWidth: 300 }}>
          <span className="input-group-text bg-white"><Search size={15} /></span>
          <input className="form-control" placeholder="Search items" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search items" />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading items..." rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No items match" message="Change the tab or clear the search." />
      ) : (
        <div className="row g-3">
          {visible.map((item) => (
            <div className="col-6 col-lg-4 col-xxl-3" key={item._id || item.id}>
              <LostFoundCard item={item} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminLostFound;
