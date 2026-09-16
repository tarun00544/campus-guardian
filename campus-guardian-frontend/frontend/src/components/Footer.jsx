import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Footer = () => (
  <footer className="cg-footer">
    <div className="container">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="cg-brand-mark"><ShieldCheck size={18} /></span>
            <strong className="text-white">Campus Guardian</strong>
          </div>
          <p className="mb-2" style={{ maxWidth: '46ch' }}>
            One place to report campus problems, raise an emergency alert to the campus response team,
            and get lost belongings back to their owners.
          </p>
          <p className="small mb-0">
            For life-threatening situations, contact local emergency services directly.
            Campus Guardian alerts the campus response team only.
          </p>
        </div>
        <div className="col-6 col-lg-3">
          <h6>Students</h6>
          <ul className="list-unstyled small mb-0">
            <li className="mb-2"><Link to="/report-problem">Report a problem</Link></li>
            <li className="mb-2"><Link to="/emergency">Emergency help</Link></li>
            <li className="mb-2"><Link to="/lost-found">Lost &amp; found</Link></li>
            <li><Link to="/my-complaints">My complaints</Link></li>
          </ul>
        </div>
        <div className="col-6 col-lg-4">
          <h6>Account</h6>
          <ul className="list-unstyled small mb-0">
            <li className="mb-2"><Link to="/login">Sign in</Link></li>
            <li className="mb-2"><Link to="/register">Create an account</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
      </div>
      <hr className="mt-4" style={{ borderColor: 'rgba(255,255,255,.14)' }} />
      <div className="small">Campus Guardian &middot; Report. Respond. Recover.</div>
    </div>
  </footer>
);

export default Footer;
