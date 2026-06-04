import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from './store';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mentorspace-backend-bo6p.onrender.com';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Avoid logout/redirect loops on auth endpoints
      if (!path.startsWith('/') || path !== '/') {
        useAuthStore.getState().logout();
        if (path !== '/') window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);
