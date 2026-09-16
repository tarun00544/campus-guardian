import api, { asList, unwrap } from './api';

export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return asList(unwrap(res, 'notifications'));
};

export const markRead = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return unwrap(res, 'notification');
};

export const markAllRead = async () => {
  const res = await api.put('/notifications/read-all');
  return unwrap(res);
};
