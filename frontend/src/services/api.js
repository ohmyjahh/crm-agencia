import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  getMe: () => 
    api.get('/auth/me'),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Client endpoints
export const clientAPI = {
  getClients: (params = {}) => 
    api.get('/clients', { params }),
  
  getClientById: (id) => 
    api.get(`/clients/${id}`),
  
  createClient: (clientData) => 
    api.post('/clients', clientData),
  
  updateClient: (id, clientData) => 
    api.put(`/clients/${id}`, clientData),
  
  deleteClient: (id) => 
    api.delete(`/clients/${id}`),
  
  activateClient: (id) => 
    api.patch(`/clients/${id}/activate`)
};

// Health check
export const healthCheck = () => 
  api.get('/health');

export default api;