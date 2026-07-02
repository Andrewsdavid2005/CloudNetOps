import axios from 'axios';

// Base URL points to the same origin; Vite dev server proxies to backend if needed.
const api = axios.create({
  baseURL: '/api/v1',
});

// Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
