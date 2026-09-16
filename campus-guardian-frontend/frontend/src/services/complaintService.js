import api, { asList, unwrap } from './api';

export const createComplaint = async (data) => {
  const res = await api.post('/complaints', data);
  return unwrap(res, 'complaint');
};

export const getMyComplaints = async () => {
  const res = await api.get('/complaints/my');
  return asList(unwrap(res, 'complaints'));
};

export const getComplaints = async (params = {}) => {
  const res = await api.get('/complaints', { params });
  return asList(unwrap(res, 'complaints'));
};

export const getComplaint = async (id) => {
  const res = await api.get(`/complaints/${id}`);
  return unwrap(res, 'complaint');
};

export const upvoteComplaint = async (id) => {
  const res = await api.post(`/complaints/${id}/upvote`);
  return unwrap(res, 'complaint');
};

export const updateComplaintStatus = async (id, status) => {
  const res = await api.put(`/complaints/${id}/status`, { status });
  return unwrap(res, 'complaint');
};

export const assignComplaint = async (id, payload) => {
  const res = await api.put(`/complaints/${id}/assign`, payload);
  return unwrap(res, 'complaint');
};
