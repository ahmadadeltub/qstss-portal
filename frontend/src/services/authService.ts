import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

console.log('🔧 AuthService: API_BASE_URL =', API_BASE_URL);
console.log('🔧 AuthService: REACT_APP_API_URL =', process.env.REACT_APP_API_URL);

// Enhanced axios instance with professional configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for authentication and request logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and response logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Log errors
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
      
      return Promise.reject(error);
    }
    
    // Handle network errors with retry logic
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      if (originalRequest._retryCount <= 3) {
        console.log(`🔄 Retrying request (${originalRequest._retryCount}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retryCount));
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced error handling utility
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new Error(data.message || 'Invalid request data');
      case 401:
        throw new Error('Authentication failed. Please login again.');
      case 403:
        throw new Error('You don\'t have permission to perform this action');
      case 404:
        throw new Error('The requested resource was not found');
      case 409:
        throw new Error(data.message || 'Conflict: Resource already exists');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(data.message || `Server error (${status})`);
    }
  } else if (error.request) {
    // Network error - no response received
    console.error('❌ Network Error:', error.message);
    throw new Error('Network error. Please check your internet connection.');
  } else {
    // Something else happened
    console.error('❌ Unknown Error:', error.message);
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Network connectivity check
const checkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      timeout: 5000
    } as any);
    return response.ok;
  } catch (error) {
    console.warn('❌ Connectivity check failed:', error);
    return false;
  }
};

export const authService = {
  async login(email: string, password: string) {
    try {
      console.log('🔐 AuthService.login: Starting login for', email);
      console.log('🔐 AuthService.login: API URL =', API_BASE_URL);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('✅ AuthService.login: Response received', response.status, response.data);
      
      // Store user data
      if (response.data.token && response.data.teacher) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.teacher));
        console.log('✅ AuthService.login: Token and user stored');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ AuthService.login: Error occurred', error);
      handleApiError(error);
      throw error; // Re-throw the error so the calling code can handle it
    }
  },

  async register(userData: any) {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Store user data
      if (response.data.token && response.data.teacher) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.teacher));
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error; // Re-throw the error so the calling code can handle it
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async updateProfile(profileData: any) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update stored user data
      if (response.data.teacher) {
        localStorage.setItem('user', JSON.stringify(response.data.teacher));
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout error (ignored):', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  }
};
