import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Response interceptor: redirect to login on 401 (expired/invalid token)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      // Use window.location to force a full navigation to /login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
