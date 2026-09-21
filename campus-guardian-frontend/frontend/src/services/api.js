import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Uploaded files are served from the server root, not from /api
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

// Turns whatever the backend stores (filename, "uploads/x.jpg", or a full URL)
// into a URL the browser can load.
export const fileUrl = (path) => {
  if (!path) return '';
  const value = String(path).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const clean = value.replace(/^\.?\//, '');
  return clean.startsWith('uploads/')
    ? `${SERVER_URL}/${clean}`
    : `${SERVER_URL}/uploads/${clean}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      clearAuth();
      window.location.replace('/login?expired=1');
    }
    return Promise.reject(error);
  }
);

// One place that turns any failure into something safe to show a user.
export const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Try again.';
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'Cannot reach the server. Check that the backend is running, then try again.';
  }
  const { status, data } = error.response;
  const fromServer = data?.message || data?.error || (Array.isArray(data?.errors) ? data.errors[0]?.msg : null);
  if (typeof fromServer === 'string' && fromServer.length > 0 && fromServer.length < 200) return fromServer;
  if (status === 401) return 'Your session has ended. Sign in again to continue.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return 'We could not find what you asked for.';
  if (status === 400 || status === 422) return 'Some details are missing or invalid. Check the form and try again.';
  if (status >= 500) return 'The server had a problem handling this. Try again in a moment.';
  return 'Something went wrong. Try again.';
};

// Backends differ: some return the object, some wrap it in { data }, { result }.
export const unwrap = (response, key) => {
  const body = response?.data;
  if (body === undefined || body === null) return null;
  if (Array.isArray(body)) return body;
  if (key && body[key] !== undefined) return body[key];
  if (body.data !== undefined) return body.data;
  if (body.result !== undefined) return body.result;
  return body;
};

export const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const arrayKey = Object.keys(value).find((k) => Array.isArray(value[k]));
  return arrayKey ? value[arrayKey] : [];
};

export default api;
