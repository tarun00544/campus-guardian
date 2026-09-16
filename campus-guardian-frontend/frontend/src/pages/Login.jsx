import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { homeRouteFor } from '../utils/auth';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(params.get('expired') ? 'Your session has ended. Sign in again to continue.' : '');
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form);
      const from = location.state?.from;
      navigate(from && !from.startsWith('/login') ? from : homeRouteFor(user), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container cg-page" style={{ maxWidth: 440 }}>
      <div className="text-center mb-4">
        <span className="cg-brand-mark mx-auto mb-3"><ShieldCheck size={19} /></span>
        <h1 className="h4 mb-1">Sign in to Campus Guardian</h1>
        <p className="text-muted-cg mb-0">Use the email you registered with your campus account.</p>
      </div>

      <div className="cg-card">
        <form className="cg-card-body" onSubmit={submit} noValidate>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="form-control" value={form.email}
              onChange={change} required autoComplete="email" placeholder="you@campus.edu" />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="form-control"
                value={form.password} onChange={change} required autoComplete="current-password" />
              <button type="button" className="btn btn-guard-outline" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-guard w-100" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-center small text-muted-cg mt-3 mb-0">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;
