import axios from 'axios';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Base API configuration - use 127.0.0.1 to match backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set multipart boundaries for file uploads.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't redirect on 401 for public routes
    const status = error?.response?.status;
    const config = error?.config || {};

    if (status === 429 && !config.__retried429) {
      config.__retried429 = true;
      const retryAfterHeader = Number(error?.response?.headers?.['retry-after']);
      const retryDelayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1200;
      await wait(retryDelayMs);
      return api.request(config);
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
