import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import { getLostFound } from '../services/lostFoundService';
import { getErrorMessage } from '../services/api';
import LostFoundCard from '../components/LostFoundCard';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';

const TABS = ['All', 'Lost', 'Found'];

const LostFound = () => {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const type = String(item.type || '').toLowerCase();
      if (tab !== 'All' && type !== tab.toLowerCase()) return false;
      if (!q) return true;
      return [item.itemName, item.title, item.category, item.location, item.description]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [items, tab, query]);

  return (
    <div className="container cg-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 className="cg-page-title">Lost &amp; found</h1>
          <p className="cg-page-sub">Post what you lost, or what you picked up, and let Smart Match pair them.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/lost-found/create?type=lost" className="btn btn-guard">Report lost item</Link>
          <Link to="/lost-found/create?type=found" className="btn btn-guard-outline">Report found item</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          {TABS.map((t) => (
            <button key={t} type="button" className={`btn btn-sm ${tab === t ? 'btn-guard' : 'btn-guard-outline'}`} onClick={() => setTab(t)}>
              {t}
            </button>
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
        <EmptyState
          icon={PackageSearch}
          title={query ? 'No items match that search' : 'Nothing here yet'}
          message={query ? 'Try a shorter search, or a different tab.' : 'Be the first to post a lost or found item.'}
          actionLabel={query ? undefined : 'Report an item'}
          actionTo={query ? undefined : '/lost-found/create'}
        />
      ) : (
        <div className="row g-3">
          {visible.map((item) => (
            <div className="col-6 col-lg-4 col-xl-3" key={item._id || item.id}>
              <LostFoundCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LostFound;
