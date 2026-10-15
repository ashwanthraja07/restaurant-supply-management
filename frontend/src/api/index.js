import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Inject stored token into every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token so user is redirected to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sf_token');
      delete api.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

export default api;
