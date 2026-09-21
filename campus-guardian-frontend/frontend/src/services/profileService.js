import api, { unwrap } from './api';

export const getProfile = async () => {
  const res = await api.get('/profile');
  return unwrap(res, 'data') || unwrap(res, 'user') || res.data || res;
};

export const updateProfile = async ({ name, mobile }) => {
  const res = await api.put('/profile', { name, mobile });
  return unwrap(res, 'data') || unwrap(res, 'user') || res.data || res;
};

export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const res = await api.put('/profile/password', { currentPassword, newPassword, confirmPassword });
  return res;
};
