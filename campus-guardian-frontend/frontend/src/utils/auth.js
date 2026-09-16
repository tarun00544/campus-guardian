const TOKEN_KEY = 'cg_token';
const USER_KEY = 'cg_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAdmin = (user) => ['admin', 'superadmin'].includes((user?.role || '').toLowerCase());

export const isStaff = (user) => ['staff', 'security', 'responder'].includes((user?.role || '').toLowerCase());

// Where a user lands after signing in, based on their role.
export const homeRouteFor = (user) => {
  if (isAdmin(user)) return '/admin/dashboard';
  if (isStaff(user)) return '/admin/emergencies';
  return '/dashboard';
};

export const formatDate = (value) => {
  if (!value) return '\u2014';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '\u2014';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const formatDay = (value) => {
  if (!value) return '\u2014';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
