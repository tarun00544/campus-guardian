import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { homeRouteFor } from '../utils/auth';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Use a password of at least 6 characters.');
      return;
    }
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) {
      setError('Enter a phone number the campus team can reach you on.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(homeRouteFor(user), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 470 }}>
      <div className="text-center mb-4">
        <span className="cg-brand-mark mx-auto mb-3"><ShieldCheck size={19} /></span>
        <h1 className="h4 mb-1">Create your account</h1>
        <p className="text-muted-cg mb-0">Report problems, raise alerts and track lost belongings.</p>
      </div>

      <div className="cg-card">
        <form className="cg-card-body" onSubmit={submit} noValidate>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <div className="mb-3">
            <label className="form-label" htmlFor="name">Full name</label>
            <input id="name" name="name" className="form-control" value={form.name} onChange={change} required autoComplete="name" />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="form-control" value={form.email} onChange={change} required autoComplete="email" />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" className="form-control" value={form.phone} onChange={change} required autoComplete="tel" placeholder="10-digit number" />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="form-control"
                value={form.password} onChange={change} required autoComplete="new-password" />
              <button type="button" className="btn btn-guard-outline" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="form-text">At least 6 characters.</div>
          </div>

          <button type="submit" className="btn btn-guard w-100" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center small text-muted-cg mt-3 mb-0">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
