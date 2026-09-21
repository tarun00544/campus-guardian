import api, { asList, unwrap } from './api';

export const createLostFound = async (data) => {
  const res = await api.post('/lost-found', data);
  return unwrap(res, 'item');
};

export const getLostFound = async (params = {}) => {
  const res = await api.get('/lost-found', { params });
  return asList(unwrap(res, 'items'));
};

export const getLostFoundItem = async (id) => {
  const res = await api.get(`/lost-found/${id}`);
  return unwrap(res, 'item');
};

export const getMatches = async (id) => {
  const res = await api.get(`/lost-found/${id}/matches`);
  return asList(unwrap(res, 'matches'));
};

export const requestVerification = async (id) => {
  const res = await api.post(`/lost-found/${id}/request-verification`);
  return unwrap(res, 'item');
};

export const updateLostFoundStatus = async (id, status) => {
  const res = await api.put(`/lost-found/${id}/status`, { status });
  return unwrap(res, 'item');
};

export const verifyRecovery = async (id) => {
  const res = await api.put(`/lost-found/${id}/verify`);
  return unwrap(res, 'item');
};
