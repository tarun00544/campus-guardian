import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Trash2 } from 'lucide-react';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/auth';

const ROLES = ['student', 'staff', 'security', 'admin'];

const isActiveUser = (u) => {
  if (typeof u.isActive === 'boolean') return u.isActive;
  const s = String(u.status || 'active').toLowerCase();
  return s !== 'inactive' && s !== 'blocked' && s !== 'disabled';
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [target, setTarget] = useState(null);
  const [role, setRole] = useState('student');
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'All' && String(u.role || '').toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [users, query, roleFilter]);

  const saveRole = async () => {
    if (!target) return;
    setWorking(true);
    setActionError('');
    try {
      await updateUserRole(target._id || target.id, role);
      setTarget(null);
      await load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const toggleStatus = async (user) => {
    setError('');
    try {
      await updateUserStatus(user._id || user.id, !isActiveUser(user));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeUser = async (user) => {
    const id = user._id || user.id;
    if (!id) return;

    const confirmed = window.confirm(
      `Delete ${user.name || 'this user'} permanently? This action cannot be undone.`
    );
    if (!confirmed) return;

    setError('');
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <h1 className="cg-page-title">Users</h1>
      <p className="cg-page-sub">Who is on the platform, and what they can do.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="cg-card mb-3">
        <div className="cg-card-body">
          <div className="row g-2 align-items-end">
            <div className="col-lg-8">
              <label className="form-label" htmlFor="uq">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><Search size={15} /></span>
                <input id="uq" className="form-control" placeholder="Name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-4">
              <label className="form-label" htmlFor="rf">Role</label>
              <select id="rf" className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option>All</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading users..." rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title="No users match" message="Try a different search or role." />
      ) : (
        <div className="cg-card cg-table-wrap">
          <table className="cg-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u._id || u.id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><StatusBadge status={u.role || 'student'} /></td>
                  <td><StatusBadge status={isActiveUser(u) ? 'active' : 'inactive'} /></td>
                  <td className="text-muted-cg">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-guard-outline"
                        onClick={() => { setTarget(u); setRole(String(u.role || 'student').toLowerCase()); setActionError(''); }}>
                        Change role
                      </button>
                      <button type="button" className="btn btn-sm btn-guard-outline" onClick={() => toggleStatus(u)}>
                        {isActiveUser(u) ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeUser(u)}
                        title="Delete user"
                      >
                        <Trash2 size={15} className="me-1" />Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(target)}
        title="Change role"
        onClose={() => setTarget(null)}
        footer={(
          <>
            <button type="button" className="btn btn-guard-outline" onClick={() => setTarget(null)}>Cancel</button>
            <button type="button" className="btn btn-guard" onClick={saveRole} disabled={working}>
              {working ? 'Saving...' : 'Save role'}
            </button>
          </>
        )}
      >
        {actionError && <div className="alert alert-danger py-2 small">{actionError}</div>}
        <p className="small text-muted-cg">{target?.name} &middot; {target?.email}</p>
        <label className="form-label" htmlFor="newRole">Role</label>
        <select id="newRole" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="form-text">Staff and security get the response desk. Admins get the full console.</div>
      </Modal>
    </>
  );
};

export default AdminUsers;
