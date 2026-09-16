import api, { asList, unwrap } from './api';

export const createEmergency = async (payload) => {
  const res = await api.post('/emergencies', payload);
  return unwrap(res, 'emergency');
};

export const getEmergencies = async (params = {}) => {
  const res = await api.get('/emergencies', { params });
  return asList(unwrap(res, 'emergencies'));
};

export const getEmergency = async (id) => {
  const res = await api.get(`/emergencies/${id}`);
  return unwrap(res, 'emergency');
};

export const updateEmergencyStatus = async (id, status) => {
  const res = await api.put(`/emergencies/${id}/status`, { status });
  return unwrap(res, 'emergency');
};
