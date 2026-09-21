import api, { asList, unwrap } from './api';

export const createLeave = async (payload) => {
  const res = await api.post('/leaves', payload);
  return unwrap(res);
};

export const getMyLeaves = async () => {
  const res = await api.get('/leaves/my');
  return asList(unwrap(res));
};

export const getAllLeaves = async (params = {}) => {
  const res = await api.get('/leaves/admin', { params });
  return asList(unwrap(res));
};

export const reviewLeave = async (id, status, adminNote = '') => {
  const res = await api.put(`/leaves/admin/${id}`, { status, adminNote });
  return unwrap(res);
};

export const getLeaveQr = async (id) => {
  const res = await api.get(`/leaves/${id}/qr`);
  return unwrap(res);
};

export const scanLeaveQr = async (token) => {
  const res = await api.post('/leaves/scan', { token });
  return unwrap(res);
};
