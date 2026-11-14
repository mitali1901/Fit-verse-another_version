import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitverse_token') || sessionStorage.getItem('fitverse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all stored authentication tokens & cached profiles
      localStorage.removeItem('fitverse_token');
      localStorage.removeItem('fitverse_user');
      sessionStorage.removeItem('fitverse_token');
      sessionStorage.removeItem('fitverse_user');

      // Check current path
      const currentPath = window.location.pathname;
      const isPublicAuthRoute =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/verify-email' ||
        currentPath === '/forgot-password' ||
        currentPath === '/reset-password';

      // Redirect immediately to login if unauthorized on private routes
      if (!isPublicAuthRoute) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
