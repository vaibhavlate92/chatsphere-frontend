import axios from 'axios';

export const tokenStore = {
  get: () => localStorage.getItem('cs_token') || sessionStorage.getItem('cs_token'),
  set: (t, remember) => {
    localStorage.removeItem('cs_token'); sessionStorage.removeItem('cs_token');
    (remember ? localStorage : sessionStorage).setItem('cs_token', t);
  },
  clear: () => { localStorage.removeItem('cs_token'); sessionStorage.removeItem('cs_token'); },
};

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

http.interceptors.request.use((cfg) => {
  const t = tokenStore.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

http.interceptors.response.use((r) => r, (err) => {
  const url = err.config?.url || '';
  if (err.response?.status === 401 && !url.startsWith('/auth/')) {
    tokenStore.clear();
    window.dispatchEvent(new Event('cs:unauthorized'));
  }
  return Promise.reject(err);
});

export const errMsg = (e, fallback = 'Something went wrong. Please try again.') =>
  e?.response?.data?.message || fallback;

export default http;
