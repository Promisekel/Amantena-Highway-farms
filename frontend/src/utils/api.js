import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  getStatus: () => api.get('/auth/status'),
  verifyInvite: (token) => api.get(`/auth/verify-invite/${token}`),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats/overview'),
};

// Products API
export const productsAPI = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateProductImage: (id, imageUrl) => api.patch(`/products/${id}/image`, { imageUrl }),
  getCategories: () => api.get('/products/meta/categories'),
  getLowStockProducts: () => api.get('/products/alerts/low-stock'),
  bulkUpdateQuantities: (updates) => api.patch('/products/bulk/quantities', { updates }),
};

// Sales API
export const salesAPI = {
  getSales: (params = {}) => api.get('/sales', { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  createSale: (data) => api.post('/sales', data),
  updateSale: (id, data) => api.put(`/sales/${id}`, data),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  getSalesReport: (params = {}) => api.get('/sales/reports/overview', { params }),
  getSalesTrends: (params = {}) => api.get('/sales/reports/trends', { params }),
};

// Invites API
export const invitesAPI = {
  getInvites: (params = {}) => api.get('/invites', { params }),
  sendInvite: (data) => api.post('/invites', data),
  resendInvite: (id) => api.post(`/invites/${id}/resend`),
  cancelInvite: (id) => api.delete(`/invites/${id}`),
  getInviteStats: () => api.get('/invites/stats/overview'),
  getRecentInvites: (limit = 5) => api.get(`/invites/recent?limit=${limit}`),
};

// Albums API
export const albumsAPI = {
  getAlbums: (params = {}) => api.get('/albums', { params }),
  getAlbum: (id, params = {}) => api.get(`/albums/${id}`, { params }),
  createAlbum: (data) => api.post('/albums', data),
  updateAlbum: (id, data) => api.put(`/albums/${id}`, data),
  deleteAlbum: (id) => api.delete(`/albums/${id}`),
  addImageToAlbum: (id, data) => api.post(`/albums/${id}/images`, data),
  updateImage: (albumId, imageId, data) => api.put(`/albums/${albumId}/images/${imageId}`, data),
  deleteImage: (albumId, imageId) => api.delete(`/albums/${albumId}/images/${imageId}`),
  getRecentImages: (limit = 10) => api.get(`/albums/images/recent?limit=${limit}`),
};

// Calendar API
export const calendarAPI = {
  getEvents: (params = {}) => api.get('/calendar', { params }),
  getEvent: (id) => api.get(`/calendar/${id}`),
  createEvent: (data) => api.post('/calendar', data),
  updateEvent: (id, data) => api.put(`/calendar/${id}`, data),
  deleteEvent: (id) => api.delete(`/calendar/${id}`),
  getUpcomingEvents: (params = {}) => api.get('/calendar/upcoming/list', { params }),
  getMonthEvents: (year, month) => api.get(`/calendar/month/${year}/${month}`),
  getEventTypes: () => api.get('/calendar/meta/types'),
};

// Projects API
export const projectsAPI = {
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getProjectTasks: (id, params = {}) => api.get(`/projects/${id}/tasks`, { params }),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (taskId, data) => api.put(`/projects/tasks/${taskId}`, data),
  deleteTask: (taskId) => api.delete(`/projects/tasks/${taskId}`),
  getProjectStats: () => api.get('/projects/stats/overview'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadImages: (files, folder = 'general') => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('folder', folder);
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (publicId) => api.delete(`/upload/image/${publicId}`),
  getImageInfo: (publicId) => api.get(`/upload/image/${publicId}/info`),
};

export default api;
