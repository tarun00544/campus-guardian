import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, CalendarDays, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, TriangleAlert, User, Wrench, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markRead } from '../services/notificationService';
import { formatDate } from '../utils/auth';

const Navbar = ({ onToggleSidebar, showSidebarToggle = false }) => {
  const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return undefined;
    }
    let active = true;
    const load = async () => {
      try {
        const list = await getNotifications();
        if (active) setNotifications(list);
      } catch {
        // A failed notification poll should never interrupt the page.
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [isAuthenticated]);

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = notifications.filter((n) => !(n.isRead ?? n.read ?? false));

  const openNotification = async (item) => {
    setBellOpen(false);
    const id = item._id || item.id;
    if (id && !(item.isRead ?? item.read)) {
      try {
        await markRead(id);
        setNotifications((prev) => prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true, read: true } : n)));
      } catch {
        // Ignore: the notifications page can retry.
      }
    }
    navigate('/notifications');
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const links = isAuthenticated
    ? [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/report-problem', label: 'Report a problem', icon: Wrench },
      { to: '/lost-found', label: 'Lost & found', icon: Search },
      ...(user?.role === 'student' ? [{ to: '/leave', label: 'Leave', icon: CalendarDays }] : [])
    ]
    : [];

  return (
    <nav className="cg-nav">
      <div className="container-fluid px-3 px-lg-4">
        <div className="d-flex align-items-center justify-content-between" style={{ height: 56 }}>
          <div className="d-flex align-items-center gap-2">
            {showSidebarToggle && (
              <button type="button" className="btn btn-sm btn-guard-outline cg-sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
                <Menu size={18} />
              </button>
            )}
            <Link className="cg-brand" to="/">
              <span className="cg-brand-mark"><ShieldCheck size={19} /></span>
              <span>
                Campus Guardian
                <small>Report. Respond. Recover.</small>
              </span>
            </Link>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `cg-nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            {(isAdmin || isStaff) && (
              <NavLink to={isAdmin ? '/admin/dashboard' : '/admin/emergencies'} className="cg-nav-link">
                <ShieldCheck size={16} /> Admin
              </NavLink>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {isAuthenticated && (
              <Link to="/emergency" className="btn btn-alert btn-sm d-flex align-items-center gap-2">
                <TriangleAlert size={16} /> <span className="d-none d-sm-inline">Emergency</span>
              </Link>
            )}

            {isAuthenticated && (
              <div className="position-relative" ref={bellRef}>
                <button type="button" className="cg-bell" onClick={() => setBellOpen((v) => !v)} aria-label={`Notifications, ${unread.length} unread`}>
                  <Bell size={19} />
                  {unread.length > 0 && <span className="cg-bell-count">{unread.length > 9 ? '9+' : unread.length}</span>}
                </button>
                {bellOpen && (
                  <div className="cg-dropdown">
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                      <strong className="small">Notifications</strong>
                      <Link to="/notifications" className="small" onClick={() => setBellOpen(false)}>See all</Link>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-center text-muted-cg small">Nothing yet. Updates on your reports will show up here.</div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n._id || n.id}
                          type="button"
                          className={`cg-dropdown-item w-100 text-start border-0 bg-transparent ${(n.isRead ?? n.read) ? '' : 'unread'}`}
                          onClick={() => openNotification(n)}
                        >
                          <div className="small fw-semibold">{n.title || n.type || 'Update'}</div>
                          <div className="small text-muted-cg">{n.message || n.body}</div>
                          <div className="small text-muted-cg mt-1">{formatDate(n.createdAt)}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="d-none d-lg-flex align-items-center gap-2">
                <Link to="/profile" className="cg-nav-link"><User size={16} /> {user?.name?.split(' ')[0] || 'Profile'}</Link>
                <button type="button" className="btn btn-sm btn-guard-outline" onClick={handleLogout}>
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="d-none d-sm-flex gap-2">
                <Link to="/login" className="btn btn-sm btn-guard-outline">Sign in</Link>
                <Link to="/register" className="btn btn-sm btn-guard">Create account</Link>
              </div>
            )}

            <button type="button" className="btn btn-sm btn-guard-outline d-lg-none" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="d-lg-none pb-3">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="cg-nav-link d-block mb-1" onClick={() => setMenuOpen(false)}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink to="/my-complaints" className="cg-nav-link d-block mb-1" onClick={() => setMenuOpen(false)}>My complaints</NavLink>
                <NavLink to="/notifications" className="cg-nav-link d-block mb-1" onClick={() => setMenuOpen(false)}>Notifications</NavLink>
                <NavLink to="/profile" className="cg-nav-link d-block mb-1" onClick={() => setMenuOpen(false)}>Profile</NavLink>
                {(isAdmin || isStaff) && (
                  <NavLink to={isAdmin ? '/admin/dashboard' : '/admin/emergencies'} className="cg-nav-link d-block mb-1" onClick={() => setMenuOpen(false)}>
                    Admin console
                  </NavLink>
                )}
                <button type="button" className="btn btn-guard-outline w-100 mt-2" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <div className="d-grid gap-2 mt-2">
                <Link to="/login" className="btn btn-guard-outline" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn btn-guard" onClick={() => setMenuOpen(false)}>Create account</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
