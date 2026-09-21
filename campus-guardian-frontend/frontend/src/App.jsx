import { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ReportProblem from './pages/ReportProblem';
import MyComplaints from './pages/MyComplaints';
import ComplaintDetails from './pages/ComplaintDetails';
import Emergency from './pages/Emergency';
import EmergencyDetails from './pages/EmergencyDetails';
import LostFound from './pages/LostFound';
import CreateLostFound from './pages/CreateLostFound';
import LostFoundDetails from './pages/LostFoundDetails';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import LeaveApplication from './pages/LeaveApplication';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminEmergencies from './pages/admin/AdminEmergencies';
import AdminLostFound from './pages/admin/AdminLostFound';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminLeaves from './pages/admin/AdminLeaves';

// Public and student pages: navbar, content, footer.
const SiteLayout = ({ children }) => (
  <div className="cg-app">
    <Navbar />
    <main className="cg-main">{children}</main>
    <Footer />
  </div>
);

// Admin console: navbar plus a sidebar that collapses on small screens.
const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="cg-app">
      <Navbar showSidebarToggle onToggleSidebar={() => setOpen((v) => !v)} />
      <div className="cg-admin">
        <Sidebar open={open} onNavigate={() => setOpen(false)} />
        {open && <div className="cg-scrim d-lg-none" onClick={() => setOpen(false)} role="presentation" />}
        <main className="cg-admin-main">{children}</main>
      </div>
    </div>
  );
};

const NotFound = () => {
  const location = useLocation();
  return (
    <div className="container cg-page text-center" style={{ maxWidth: 520 }}>
      <h1 className="display-6">Page not found</h1>
      <p className="text-muted-cg">Nothing lives at {location.pathname}. Check the link, or start again from the dashboard.</p>
      <Link className="btn btn-guard" to="/">Go to the home page</Link>
    </div>
  );
};

const student = (element) => (
  <SiteLayout><ProtectedRoute>{element}</ProtectedRoute></SiteLayout>
);

const admin = (element) => (
  <AdminRoute><AdminLayout>{element}</AdminLayout></AdminRoute>
);

const App = () => (
  <Routes>
    <Route path="/" element={<SiteLayout><Landing /></SiteLayout>} />
    <Route path="/login" element={<SiteLayout><Login /></SiteLayout>} />
    <Route path="/register" element={<SiteLayout><Register /></SiteLayout>} />

    <Route path="/dashboard" element={student(<StudentDashboard />)} />
    <Route path="/report-problem" element={student(<ReportProblem />)} />
    <Route path="/my-complaints" element={student(<MyComplaints />)} />
    <Route path="/complaints/:id" element={student(<ComplaintDetails />)} />
    <Route path="/emergency" element={student(<Emergency />)} />
    <Route path="/emergency/:id" element={student(<EmergencyDetails />)} />
    <Route path="/lost-found" element={student(<LostFound />)} />
    <Route path="/lost-found/create" element={student(<CreateLostFound />)} />
    <Route path="/lost-found/:id" element={student(<LostFoundDetails />)} />
    <Route path="/notifications" element={student(<Notifications />)} />
    <Route path="/profile" element={student(<Profile />)} />
    <Route path="/change-password" element={student(<ChangePassword />)} />
    <Route path="/leave" element={student(<LeaveApplication />)} />

    <Route path="/admin/dashboard" element={admin(<AdminDashboard />)} />
    <Route path="/admin/complaints" element={admin(<AdminComplaints />)} />
    <Route path="/admin/emergencies" element={admin(<AdminEmergencies />)} />
    <Route path="/admin/lost-found" element={admin(<AdminLostFound />)} />
    <Route path="/admin/users" element={admin(<AdminUsers />)} />
    <Route path="/admin/analytics" element={admin(<AdminAnalytics />)} />
    <Route path="/admin/leaves" element={admin(<AdminLeaves />)} />

    <Route path="*" element={<SiteLayout><NotFound /></SiteLayout>} />
  </Routes>
);

export default App;
