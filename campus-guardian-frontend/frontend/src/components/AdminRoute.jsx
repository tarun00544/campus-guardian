import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

// Admins get everything. Staff and security get the response desk only.
const STAFF_ALLOWED = ['/admin/complaints'];
const SECURITY_ALLOWED = ['/admin/emergencies', '/admin/complaints', '/admin/lost-found', '/admin/leave-scan'];

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isStaff, isSecurity, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container cg-page"><Loading label="Checking your access..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isAdmin) return children;
  if (isStaff && STAFF_ALLOWED.some((p) => location.pathname.startsWith(p))) return children;
  if (isSecurity && SECURITY_ALLOWED.some((p) => location.pathname.startsWith(p))) return children;

  return (
    <div className="container cg-page" style={{ maxWidth: 560 }}>
      <div className="cg-card">
        <div className="cg-empty">
          <div className="cg-empty-icon"><ShieldAlert size={26} /></div>
          <h1 className="h5">You do not have access to this area</h1>
          <p className="text-muted-cg mb-3">Your account does not have access to the admin console.</p>
          <a className="btn btn-guard" href="/dashboard">Go to my dashboard</a>
        </div>
      </div>
    </div>
  );
};

export default AdminRoute;
