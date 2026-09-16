import api, { unwrap } from './api';

const pickToken = (body) => body?.token || body?.accessToken || body?.data?.token || null;
const pickUser = (body) => body?.user || body?.data?.user || body?.data || body;

export const register = async (payload) => {
  const res = await api.post('/auth/register', payload);
  return { token: pickToken(res.data), user: pickUser(res.data) };
};

export const login = async (payload) => {
  const res = await api.post('/auth/login', payload);
  return { token: pickToken(res.data), user: pickUser(res.data) };
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return unwrap(res, 'user');
};

export const updateProfile = async (payload) => {
  const res = await api.put('/auth/me', payload);
  return unwrap(res, 'user');
};
