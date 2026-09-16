import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { getErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/auth';

const Profile = () => {
  const { user, logout, applyUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      applyUser({ ...user, ...(updated || form) });
      setMessage('Profile saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 680 }}>
      <h1 className="cg-page-title">Profile</h1>
      <p className="cg-page-sub">Keep your contact details current so the campus team can reach you.</p>

      <div className="cg-card mb-3">
        <div className="cg-card-body d-flex flex-wrap gap-3 align-items-center">
          <span className="cg-brand-mark" style={{ width: 48, height: 48 }}><User size={22} /></span>
          <div className="flex-grow-1">
            <div className="h5 mb-1">{user?.name}</div>
            <div className="small text-muted-cg d-flex flex-wrap gap-3">
              <span className="d-inline-flex align-items-center gap-1"><Mail size={13} /> {user?.email}</span>
              {user?.phone && <span className="d-inline-flex align-items-center gap-1"><Phone size={13} /> {user.phone}</span>}
            </div>
          </div>
          <div className="d-flex flex-column gap-2 align-items-end">
            <StatusBadge status={user?.role || 'student'} />
            {user?.createdAt && <span className="small text-muted-cg">Joined {formatDate(user.createdAt)}</span>}
          </div>
        </div>
      </div>

      <div className="cg-card">
        <form className="cg-card-body" onSubmit={save} noValidate>
          <h2 className="h6 mb-3">Edit details</h2>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {message && <div className="alert alert-success py-2 small">{message}</div>}

          <div className="mb-3">
            <label className="form-label" htmlFor="pname">Full name</label>
            <input id="pname" name="name" className="form-control" value={form.name} onChange={change} required />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="pphone">Phone</label>
            <input id="pphone" name="phone" className="form-control" value={form.phone} onChange={change} />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="pemail">Email</label>
            <input id="pemail" className="form-control" value={user?.email || ''} disabled />
            <div className="form-text">Your campus email cannot be changed here.</div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button type="submit" className="btn btn-guard" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            <button type="button" className="btn btn-guard-outline" onClick={signOut}><LogOut size={15} className="me-2" />Sign out</button>
          </div>
        </form>
      </div>

      <div className="cg-card mt-3">
        <div className="cg-card-body d-flex gap-3 small text-muted-cg">
          <ShieldCheck size={18} style={{ color: 'var(--cg-deep)' }} className="flex-shrink-0" />
          <span>Your phone number is shared only with campus staff handling your report, never on public listings.</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
