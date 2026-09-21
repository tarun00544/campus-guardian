import api, { asList, unwrap } from './api';

export const getDashboard = async () => {
  const res = await api.get('/admin/dashboard');
  return unwrap(res, 'stats') || {};
};

export const getAllComplaints = async (params = {}) => {
  const res = await api.get('/admin/complaints', { params });
  return asList(unwrap(res, 'complaints'));
};

export const getUsers = async (params = {}) => {
  const res = await api.get('/admin/users', { params });
  return asList(unwrap(res, 'users'));
};

export const updateUserRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, { role });
  return unwrap(res, 'user');
};

export const updateUserStatus = async (id, isActive) => {
  const res = await api.put(`/admin/users/${id}/status`, {
    isActive,
    status: isActive ? 'active' : 'inactive'
  });
  return unwrap(res, 'user');
};

export const getAnalytics = async () => {
  const res = await api.get('/admin/analytics');
  return unwrap(res, 'analytics') || {};
};

export const getAssignableUsers = async () => {
  try {
    const res = await api.get('/admin/assignable-users');
    return asList(unwrap(res));
  } catch (error) {
    // Compatibility fallback for an older backend build that does not yet
    // expose /admin/assignable-users. The /admin/users endpoint is already
    // admin-protected, so the role filter remains server-authorized.
    const status = error?.response?.status;
    if (status !== 404) throw error;
    const users = await getUsers();
    return users.filter((user) =>
      user?.isActive !== false && ['staff', 'security'].includes(String(user?.role || '').toLowerCase())
    );
  }
};
