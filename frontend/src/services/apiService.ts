import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Generic HTTP methods
  async get(url: string, params?: any) {
    const response = await api.get(url, { params });
    return response.data;
  },

  async post(url: string, data?: any) {
    const response = await api.post(url, data);
    return response.data;
  },

  async put(url: string, data?: any) {
    const response = await api.put(url, data);
    return response.data;
  },

  async delete(url: string) {
    const response = await api.delete(url);
    return response.data;
  },

  // Students
  async getStudents(params?: any) {
    const response = await api.get('/students', { params });
    // Return the students array from the response.data structure
    return response.data.data || response.data;
  },

  async getStudentsWithPagination(params?: any) {
    const response = await api.get('/students', { params });
    // Return full response structure for Students page (data + pagination)
    return response.data;
  },

  async getStudent(id: string) {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async getStudentClasses() {
    const response = await api.get('/students/meta/filters');
    return response.data;
  },

  // Competitions
  async getCompetitions(params?: any) {
    const response = await api.get('/competitions', { params });
    // Handle different response structures from backend
    return response.data.competitions || response.data.data || response.data;
  },

  async getCompetition(id: string) {
    const response = await api.get(`/competitions/${id}`);
    return response.data;
  },

  async createCompetition(data: any) {
    const response = await api.post('/competitions', data);
    return response.data;
  },

  async updateCompetition(id: string, data: any) {
    const response = await api.put(`/competitions/${id}`, data);
    return response.data;
  },

  async deleteCompetition(id: string) {
    const response = await api.delete(`/competitions/${id}`);
    return response.data;
  },

  // Registrations
  async getMyRegistrations() {
    const response = await api.get('/registrations/my');
    return response.data;
  },

  async getRegistrationsByCompetition(competitionId: string) {
    const response = await api.get(`/registrations/competition/${competitionId}`);
    return response.data;
  },

  async checkStudentAvailability(competitionId: string, studentIds: string[]) {
    const response = await api.post('/registrations/check-availability', {
      competitionId,
      studentIds,
    });
    return response.data;
  },

  async checkCrossCompetitionConflicts(competitionId: string, studentIds: string[]) {
    const response = await api.post('/registrations/check-cross-competition-conflicts', {
      competitionId,
      studentIds,
    });
    return response.data;
  },

  async registerStudents(competitionId: string, studentIds: string[], teamName?: string, notes?: string) {
    const response = await api.post('/registrations', {
      competitionId,
      studentIds,
      teamName,
      notes,
    });
    
    // Extract notification data if present
    const result = response.data;
    if (result.notification) {
      // Trigger notification in the app
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: { 
          type: 'registration', 
          data: result.notification 
        } 
      }));
    }
    
    return result;
  },

  async deleteRegistration(registrationId: string) {
    const response = await api.delete(`/registrations/${registrationId}`);
    
    // Extract notification data if present
    const result = response.data;
    if (result.notification) {
      // Trigger notification in the app
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: { 
          type: 'withdrawal', 
          data: result.notification 
        } 
      }));
    }
    
    return result;
  },

  async removeStudentFromRegistration(registrationId: string, studentId: string) {
    const response = await api.delete(`/registrations/${registrationId}/students/${studentId}`);
    
    // Extract notification data if present
    const result = response.data;
    if (result.notification) {
      // Trigger notification in the app
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: { 
          type: 'student_removal', 
          data: result.notification 
        } 
      }));
    }
    
    return result;
  },

  async addStudentsToRegistration(registrationId: string, studentIds: string[]) {
    const response = await api.post(`/registrations/${registrationId}/students`, {
      studentIds
    });
    
    // Extract notification data if present
    const result = response.data;
    if (result.notification) {
      // Trigger notification in the app
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: { 
          type: 'registration', 
          data: result.notification 
        } 
      }));
    }
    
    return result;
  },

  // Reports
  async getDashboardStats() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  async getReports() {
    const response = await api.get('/reports');
    return response.data;
  },

  async getTeachers() {
    const response = await api.get('/teachers');
    return response.data.teachers || response.data;
  },
};
