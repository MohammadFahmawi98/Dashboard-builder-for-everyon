import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dashly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;

    // Skip retry for refresh calls or already-retried requests
    if (
      err.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(err);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) { reject(err); return; }
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const currentToken = localStorage.getItem('dashly_token');
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      localStorage.setItem('dashly_token', data.token);
      // Let AuthContext know via custom event
      window.dispatchEvent(new CustomEvent('dashly:token-refreshed', { detail: data }));
      processQueue(data.token);
      original.headers.Authorization = `Bearer ${data.token}`;
      return api(original);
    } catch {
      processQueue(null);
      localStorage.removeItem('dashly_token');
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
