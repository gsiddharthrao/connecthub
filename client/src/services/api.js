import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized (401) responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const url = error.config?.url || '';
        if (!url.includes('/auth/login') && !url.includes('/auth/demo')) {
          localStorage.removeItem('token');
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes API errors into user-friendly messages,
 * specifically handling network disconnected states and timeouts.
 */
export const formatApiError = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage;

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'ConnectHub server is unreachable. Please verify that the backend API is running on port 5000 (run `npm run dev` in the terminal).';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Connection timed out. Please check your network and try again.';
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    defaultMessage
  );
};

export default api;
