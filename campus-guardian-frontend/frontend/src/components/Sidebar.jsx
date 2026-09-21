import { NavLink } from 'react-router-dom';
import {
  BarChart3, LayoutDashboard, Search, TriangleAlert, Users, Wrench, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/admin/complaints', label: 'Complaints', icon: Wrench, roles: ['admin', 'staff', 'security'] },
  { to: '/admin/emergencies', label: 'Emergencies', icon: TriangleAlert, roles: ['admin', 'security'] },
  { to: '/admin/lost-found', label: 'Lost & found', icon: Search, roles: ['admin', 'security'] },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] }
];

const Sidebar = ({ open, onNavigate }) => {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const links = ADMIN_LINKS.filter((l) => l.roles.includes(role));

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
