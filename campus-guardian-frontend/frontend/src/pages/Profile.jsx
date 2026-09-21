import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { getProfile, updateProfile } from '../services/profileService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getProfile();
        if (!active) return;
        setProfile(data);
        setForm({ name: data?.name || user?.name || '', mobile: data?.mobile ?? data?.phone ?? user?.mobile ?? user?.phone ?? '' });
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
          setForm({ name: user?.name || '', mobile: user?.mobile ?? user?.phone ?? '' });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setForm({ name: updated?.name || form.name, mobile: updated?.mobile ?? updated?.phone ?? form.mobile });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading profile..." rows={3} />;

  const role = String(profile?.role || user?.role || 'user').replace(/^./, (c) => c.toUpperCase());
  const email = profile?.email || user?.email || '';

  return (
    <div className="container cg-page" style={{ maxWidth: 760 }}>
      <h1 className="cg-page-title">My profile</h1>
      <p className="cg-page-sub">Update your account details and security settings.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {success && <div className="alert alert-success py-2 small">{success}</div>}

      <div className="cg-card mb-3">
        <div className="cg-card-body">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="cg-brand-mark" style={{ width: 48, height: 48 }}><UserRound size={23} /></div>
            <div>
              <h2 className="h5 mb-1">{form.name || 'Account'}</h2>
              <div className="small text-muted-cg">{email}</div>
              <span className="badge text-bg-light mt-1">{role}</span>
            </div>
          </div>

          <form onSubmit={save}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="profileName">Full name</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><UserRound size={15} /></span>
                  <input id="profileName" className="form-control" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profileMobile">Mobile number</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><Phone size={15} /></span>
                  <input id="profileMobile" className="form-control" value={form.mobile} onChange={(e) => setForm((v) => ({ ...v, mobile: e.target.value }))} placeholder="Enter mobile number" inputMode="tel" />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="profileEmail">Email</label>
                <input id="profileEmail" className="form-control" value={email} disabled />
                <div className="form-text">Email is kept unchanged from your login account.</div>
              </div>
            </div>
            <button type="submit" className="btn btn-guard mt-4" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
          </form>
        </div>
      </div>

      <div className="cg-card">
        <div className="cg-card-body d-flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <span className="cg-stat-icon" style={{ background: 'var(--cg-teal-soft)', color: 'var(--cg-deep)' }}><ShieldCheck size={18} /></span>
            <div>
              <strong>Account security</strong>
              <div className="small text-muted-cg">Change your password whenever you need to.</div>
            </div>
          </div>
          <Link to="/change-password" className="btn btn-guard-outline"><KeyRound size={15} /> Change / Forgot Password</Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
