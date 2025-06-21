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

// Task endpoints
export const taskAPI = {
  getTasks: (params = {}) => 
    api.get('/tasks', { params }),
  
  getTaskById: (id) => 
    api.get(`/tasks/${id}`),
  
  createTask: (taskData) => 
    api.post('/tasks', taskData),
  
  updateTask: (id, taskData) => 
    api.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id) => 
    api.delete(`/tasks/${id}`),
  
  getUsers: () => 
    api.get('/tasks/users'),
  
  getTaskStats: () => 
    api.get('/tasks/stats')
};

// Finance endpoints
export const financeAPI = {
  getTransactions: (params = {}) => 
    api.get('/finance/transactions', { params }),
  
  getTransactionById: (id) => 
    api.get(`/finance/transactions/${id}`),
  
  createTransaction: (transactionData) => 
    api.post('/finance/transactions', transactionData),
  
  updateTransaction: (id, transactionData) => 
    api.put(`/finance/transactions/${id}`, transactionData),
  
  deleteTransaction: (id) => 
    api.delete(`/finance/transactions/${id}`),
  
  getCategories: (type = null) => 
    api.get('/finance/categories', { params: type ? { type } : {} }),
  
  createCategory: (categoryData) => 
    api.post('/finance/categories', categoryData),
    
  getPaymentMethods: () => 
    api.get('/finance/payment-methods'),
  
  createPaymentMethod: (paymentMethodData) => 
    api.post('/finance/payment-methods', paymentMethodData),
  
  getFinanceStats: (params = {}) => 
    api.get('/finance/transactions/stats', { params }),
  
  // DRE com IA
  uploadDREFile: (formData) => 
    api.post('/finance/dre/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  processDREWithAI: (fileId) => 
    api.post(`/finance/dre/process/${fileId}`),
  
  getDREUploads: (params = {}) => 
    api.get('/finance/dre/uploads', { params })
};

// Health check
export const healthCheck = () => 
  api.get('/health');

export default api;