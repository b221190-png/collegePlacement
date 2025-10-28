import api from '../utils/api';

// ============================================================================
// STUDENTS SERVICE
// ============================================================================
export const studentsService = {
  getStudents: async (params?: any) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  getStudent: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData: any) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  updateStudent: async (id: string, studentData: any) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  uploadResume: async (id: string, formData: FormData) => {
    const response = await api.post(`/students/${id}/upload-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getEligibleStudents: async (companyId: string, params?: any) => {
    const response = await api.get(`/students/eligible/${companyId}`, { params });
    return response.data;
  },

  bulkUpload: async (formData: FormData) => {
    const response = await api.post('/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ============================================================================
// APPLICATIONS SERVICE
// ============================================================================
export const applicationsService = {
  getApplications: async (params?: any) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getApplication: async (id: string) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  submitApplication: async (applicationData: any) => {
    const response = await api.post('/applications', applicationData);
    return response.data;
  },

  updateApplicationStatus: async (id: string, statusData: any) => {
    const response = await api.put(`/applications/${id}/status`, statusData);
    return response.data;
  },

  updateApplicationScore: async (id: string, scoreData: any) => {
    const response = await api.put(`/applications/${id}/score`, scoreData);
    return response.data;
  },

  bulkUpdateApplications: async (updateData: any) => {
    const response = await api.post('/applications/bulk-update', updateData);
    return response.data;
  },

  getStudentApplications: async (studentId: string, params?: any) => {
    const response = await api.get(`/applications/student/${studentId}`, { params });
    return response.data;
  },

  getCompanyApplications: async (companyId: string, params?: any) => {
    const response = await api.get(`/applications/company/${companyId}`, { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/applications/stats');
    return response.data;
  },
};

// ============================================================================
// APPLICATION WINDOWS SERVICE
// ============================================================================
export const applicationWindowsService = {
  getWindows: async (params?: any) => {
    const response = await api.get('/application-windows', { params });
    return response.data;
  },

  getActiveWindows: async () => {
    const response = await api.get('/application-windows/active');
    return response.data;
  },

  getUpcomingWindows: async () => {
    const response = await api.get('/application-windows/upcoming');
    return response.data;
  },

  getWindow: async (id: string) => {
    const response = await api.get(`/application-windows/${id}`);
    return response.data;
  },

  createWindow: async (windowData: any) => {
    const response = await api.post('/application-windows', windowData);
    return response.data;
  },

  updateWindow: async (id: string, windowData: any) => {
    const response = await api.put(`/application-windows/${id}`, windowData);
    return response.data;
  },

  deleteWindow: async (id: string) => {
    const response = await api.delete(`/application-windows/${id}`);
    return response.data;
  },

  deactivateWindow: async (id: string) => {
    const response = await api.post(`/application-windows/${id}/deactivate`);
    return response.data;
  },
};

// ============================================================================
// OFF-CAMPUS OPPORTUNITIES SERVICE
// ============================================================================
export const offCampusService = {
  getOpportunities: async (params?: any) => {
    const response = await api.get('/off-campus-opportunities', { params });
    return response.data;
  },

  getFeaturedOpportunities: async () => {
    const response = await api.get('/off-campus-opportunities/featured');
    return response.data;
  },

  getOpportunity: async (id: string) => {
    const response = await api.get(`/off-campus-opportunities/${id}`);
    return response.data;
  },

  createOpportunity: async (opportunityData: any) => {
    const response = await api.post('/off-campus-opportunities', opportunityData);
    return response.data;
  },

  updateOpportunity: async (id: string, opportunityData: any) => {
    const response = await api.put(`/off-campus-opportunities/${id}`, opportunityData);
    return response.data;
  },

  deleteOpportunity: async (id: string) => {
    const response = await api.delete(`/off-campus-opportunities/${id}`);
    return response.data;
  },

  trackApplication: async (id: string) => {
    const response = await api.post(`/off-campus-opportunities/${id}/track-application`);
    return response.data;
  },

  searchOpportunities: async (params?: any) => {
    const response = await api.get('/off-campus-opportunities/search', { params });
    return response.data;
  },

  getOpportunitiesBySkills: async (skills: string[]) => {
    const response = await api.get('/off-campus-opportunities/by-skills', {
      params: { skills: skills.join(',') },
    });
    return response.data;
  },

  getMyOpportunities: async () => {
    const response = await api.get('/off-campus-opportunities/my-opportunities');
    return response.data;
  },
};

// ============================================================================
// USERS SERVICE
// ============================================================================
export const usersService = {
  getUsers: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await api.post(`/users/${id}/deactivate`);
    return response.data;
  },

  activateUser: async (id: string) => {
    const response = await api.post(`/users/${id}/activate`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

// ============================================================================
// REPORTS SERVICE
// ============================================================================
export const reportsService = {
  getApplicationReport: async (params?: any) => {
    const response = await api.get('/reports/applications', { params });
    return response.data;
  },

  getStudentReport: async (params?: any) => {
    const response = await api.get('/reports/students', { params });
    return response.data;
  },

  getPlacementReport: async (params?: any) => {
    const response = await api.get('/reports/placements', { params });
    return response.data;
  },

  getCompanyPerformance: async (params?: any) => {
    const response = await api.get('/reports/company-performance', { params });
    return response.data;
  },
};

// ============================================================================
// SEARCH SERVICE
// ============================================================================
export const searchService = {
  globalSearch: async (query: string, params?: any) => {
    const response = await api.get('/search/global', {
      params: { query, ...params },
    });
    return response.data;
  },

  getSuggestions: async (query: string) => {
    const response = await api.get('/search/suggestions', {
      params: { query },
    });
    return response.data;
  },

  advancedSearch: async (filters: any) => {
    const response = await api.get('/search/advanced', {
      params: filters,
    });
    return response.data;
  },
};

// ============================================================================
// UPLOADS SERVICE
// ============================================================================
export const uploadsService = {
  uploadSingle: async (formData: FormData) => {
    const response = await api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadMultiple: async (formData: FormData) => {
    const response = await api.post('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getFile: async (filename: string) => {
    const response = await api.get(`/uploads/file/${filename}`);
    return response.data;
  },

  deleteFile: async (filename: string) => {
    const response = await api.delete(`/uploads/file/${filename}`);
    return response.data;
  },

  listFiles: async () => {
    const response = await api.get('/uploads/list');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/uploads/stats');
    return response.data;
  },
};

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================
export const notificationsService = {
  getNotifications: async (params?: any) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// Re-export services created in separate files
export { dashboardService } from './dashboard.service';
export { companiesService } from './companies.service';
