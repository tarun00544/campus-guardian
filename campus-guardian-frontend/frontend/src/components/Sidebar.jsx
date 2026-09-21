import { NavLink } from 'react-router-dom';
import {
  BarChart3, CalendarDays, LayoutDashboard, Search, TriangleAlert, Users, Wrench, ArrowLeft, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { to: '/admin/complaints', label: 'Complaints', icon: Wrench, adminOnly: false },
  { to: '/admin/emergencies', label: 'Emergencies', icon: TriangleAlert, adminOnly: false },
  { to: '/admin/lost-found', label: 'Lost & found', icon: Search, adminOnly: true },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/admin/leaves', label: 'Leave applications', icon: ClipboardList, adminOnly: true }
];

const Sidebar = ({ open, onNavigate }) => {
  const { isAdmin } = useAuth();
  const links = ADMIN_LINKS.filter((l) => isAdmin || !l.adminOnly);

  return (
    <aside className={`cg-sidebar ${open ? 'open' : ''}`}>
      <div className="cg-sidebar-title">Campus operations</div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) => `cg-sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={17} /> {label}
        </NavLink>
      ))}
      <div className="cg-sidebar-title">Student view</div>
      <NavLink to="/dashboard" onClick={onNavigate} className="cg-sidebar-link">
        <ArrowLeft size={17} /> My dashboard
      </NavLink>
    </aside>
  );
};

export default Sidebar;
