import api, { asList, unwrap } from './api';
export const createEmergency = async (payload) => unwrap(await api.post('/emergencies', payload), 'emergency');
export const getEmergencies = async (params = {}) => asList(unwrap(await api.get('/emergencies', { params }), 'emergencies'));
export const getEmergency = async (id) => unwrap(await api.get(`/emergencies/${id}`), 'emergency');
export const updateEmergencyStatus = async (id, status) => unwrap(await api.put(`/emergencies/${id}/status`, { status }), 'emergency');
export const deleteEmergency = async (id) => unwrap(await api.delete(`/emergencies/${id}`));
