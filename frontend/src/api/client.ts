import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || process.env.BASE_URL;

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('dashly_token='));
  if (token) config.headers.Authorization = `Bearer ${decodeURIComponent(token.split('=')[1])}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function getCsrfToken() {
  return document.cookie.split('; ').find(row => row.startsWith('csrf_token=')).split('=')[1];
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
      const currentToken = document.cookie.split('; ').find(row => row.startsWith('dashly_token='));
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${decodeURIComponent(currentToken.split('=')[1])}`, 'X-CSRF-Token': getCsrfToken() } }
      );
      document.cookie = `dashly_token=${encodeURIComponent(data.token)}; HttpOnly; Path=/;`; 
      // Let AuthContext know via custom event
      window.dispatchEvent(new CustomEvent('dashly:token-refreshed', { detail: data }));
      processQueue(data.token);
      original.headers.Authorization = `Bearer ${data.token}`;
      return api(original);
    } catch {
      processQueue(null);
      document.cookie = 'dashly_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
      return Promise.reject(new Error('Token refresh failed'));
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;