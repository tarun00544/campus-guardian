import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { changePassword } from '../services/profileService';
import { getErrorMessage } from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and re-entered password do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await changePassword(form);
      setSuccess(res?.message || 'Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, typeKey, placeholder) => {
    const visible = show[typeKey];
    return (
      <div className="mb-3">
        <label className="form-label" htmlFor={key}>{label}</label>
        <div className="input-group">
          <input
            id={key}
            type={visible ? 'text' : 'password'}
            className="form-control"
            value={form[key]}
            placeholder={placeholder}
            autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
            onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))}
            required
          />
          <button type="button" className="btn btn-guard-outline" onClick={() => setShow((v) => ({ ...v, [typeKey]: !v[typeKey] }))} aria-label={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 620 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to="/profile" className="btn btn-sm btn-guard-outline"><ArrowLeft size={15} /></Link>
        <div>
          <h1 className="cg-page-title mb-0">Change password</h1>
          <p className="cg-page-sub mb-0">Update your password securely from your account.</p>
        </div>
      </div>

      <div className="cg-card">
        <div className="cg-card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="cg-stat-icon" style={{ background: 'var(--cg-teal-soft)', color: 'var(--cg-deep)' }}><KeyRound size={18} /></span>
            <div>
              <strong>Security</strong>
              <div className="small text-muted-cg">The new password will be used on your next login.</div>
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={submit}>
            {field('currentPassword', 'Current password', 'current', 'Enter your current password')}
            {field('newPassword', 'New password', 'next', 'Minimum 6 characters')}
            {field('confirmPassword', 'Re-enter new password', 'confirm', 'Enter the new password again')}

            <div className="d-flex gap-2 flex-wrap mt-4">
              <button type="submit" className="btn btn-guard" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</button>
              <Link to="/profile" className="btn btn-guard-outline">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
