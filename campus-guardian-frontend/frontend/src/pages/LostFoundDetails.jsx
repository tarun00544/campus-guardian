import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, ImageOff, MapPin, Sparkles } from 'lucide-react';
import { getLostFoundItem, getMatches, requestVerification } from '../services/lostFoundService';
import { fileUrl, getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import { formatDay } from '../utils/auth';

// Backends vary: a score may arrive as 0.87 or 87.
const toPercent = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return Math.round(n <= 1 ? n * 100 : n);
};

const LostFoundDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [verification, setVerification] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getLostFoundItem(id);
        if (active) { setItem(data); setError(''); }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const findMatches = async () => {
    setMatchLoading(true);
    setMatchError('');
    try {
      setMatches(await getMatches(id));
    } catch (err) {
      setMatchError(getErrorMessage(err));
    } finally {
      setMatchLoading(false);
    }
  };

  const askVerification = async () => {
    setVerifying(true);
    try {
      await requestVerification(id);
      setVerification('pending');
    } catch (err) {
      setVerification('');
      setMatchError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="container cg-page"><Loading label="Loading item..." /></div>;

  if (error || !item) {
    return (
      <div className="container cg-page" style={{ maxWidth: 560 }}>
        <div className="alert alert-danger">{error || 'This item is no longer available.'}</div>
        <Link to="/lost-found" className="btn btn-guard-outline"><ArrowLeft size={16} className="me-1" />Back to lost &amp; found</Link>
      </div>
    );
  }

  const image = item.image || item.imageUrl || item.photo;
  const type = String(item.type || '').toLowerCase();
  const reporter = item.reportedBy?.name || item.user?.name || item.reporter?.name;
  const alreadyPending = verification === 'pending'
    || String(item.verificationStatus || '').toLowerCase() === 'pending';

  return (
    <div className="container cg-page">
      <Link to="/lost-found" className="small d-inline-flex align-items-center gap-1 mb-3">
        <ArrowLeft size={15} /> Back to lost &amp; found
      </Link>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="cg-card">
            <div className="cg-card-body">
              {image ? (
                <img className="cg-detail-image mb-3" src={fileUrl(image)} alt={item.itemName || 'Item'} />
              ) : (
                <div className="cg-thumb-empty mb-3" style={{ borderRadius: 12 }}><ImageOff size={24} /></div>
              )}

              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <h1 className="h4 mb-0">{item.itemName || item.title || 'Item'}</h1>
                <span className={`cg-badge ${type === 'lost' ? 'warn' : 'info'}`}>{type === 'lost' ? 'Lost' : 'Found'}</span>
              </div>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {item.category && <span className="cg-badge neutral">{item.category}</span>}
                <StatusBadge status={item.status || 'open'} />
                {alreadyPending && <span className="cg-badge warn"><BadgeCheck size={12} /> Verification pending</span>}
              </div>

              <p>{item.description || 'No description was given.'}</p>

              <div className="row g-3 small">
                <div className="col-sm-4">
                  <div className="text-muted-cg">Location</div>
                  <div className="d-inline-flex align-items-center gap-1"><MapPin size={14} /> {item.location || 'Unknown'}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted-cg">Date</div>
                  <div>{formatDay(item.date || item.createdAt)}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted-cg">Posted by</div>
                  <div>{reporter || 'Campus member'}</div>
                </div>
              </div>

              <hr />

              {matchError && <div className="alert alert-warning py-2 small">{matchError}</div>}

              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-guard" onClick={findMatches} disabled={matchLoading}>
                  <Sparkles size={15} className="me-2" />{matchLoading ? 'Checking...' : 'Find possible matches'}
                </button>
                <button type="button" className="btn btn-guard-outline" onClick={askVerification} disabled={verifying || alreadyPending}>
                  {alreadyPending ? 'Verification pending' : verifying ? 'Sending...' : 'Request verification'}
                </button>
              </div>
              <div className="form-text">
                Contact details stay private. The campus team checks ownership before anything is handed over.
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="cg-card">
            <div className="cg-card-body">
              <h2 className="h6 d-flex align-items-center gap-2 mb-1"><Sparkles size={16} /> Smart Match</h2>
              <p className="small text-muted-cg">
                Smart Match compares category, wording, place and date across posted items and ranks the
                closest ones. It is a rule-based comparison, not a trained model, so always confirm in person.
              </p>

              {matchLoading && <Loading label="Comparing items..." compact />}

              {matches && matches.length === 0 && (
                <div className="small text-muted-cg">No close matches yet. Check again in a day or two.</div>
              )}

              {matches && matches.map((m, i) => {
                const candidate = m.item || m.match || m;
                const percent = toPercent(m.score ?? m.matchScore ?? m.percentage ?? m.confidence);
                const reasons = m.reasons || m.matchReasons || [];
                const cid = candidate._id || candidate.id;
                return (
                  <div className="cg-card mb-3" key={cid || i}>
                    <div className="cg-card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="fw-semibold">{candidate.itemName || candidate.title || 'Possible match'}</div>
                        {percent !== null && <span className="cg-badge good">{percent}% match</span>}
                      </div>
                      <div className="small text-muted-cg mb-2">
                        {candidate.category} &middot; {candidate.location} &middot; {formatDay(candidate.date || candidate.createdAt)}
                      </div>
                      {reasons.length > 0 && (
                        <ul className="small mb-2 ps-3">
                          {reasons.map((r, idx) => <li key={idx}>{typeof r === 'string' ? r : r.reason}</li>)}
                        </ul>
                      )}
                      {cid && <Link className="btn btn-sm btn-guard-outline" to={`/lost-found/${cid}`}>Open item</Link>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LostFoundDetails;
