import api from '../utils/api';

interface FrontendApplicationFormPayload {
  studentName?: string;
  email?: string;
  phone?: string;
  cgpa?: number;
  skills?: string;
  experience?: string;
  whyCompany?: string;
  resume?: File | null;
}

interface SubmitApplicationPayload {
  companyId: string;
  formData: FrontendApplicationFormPayload;
}

const mapApplicationPayload = (formData: FrontendApplicationFormPayload) => {
  const parsedSkills =
    typeof formData.skills === 'string'
      ? formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  const additionalInfo = [formData.experience, formData.whyCompany]
    .filter(Boolean)
    .join('\n\n');

  return {
    personalInfo: {
      name: formData.studentName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: '',
    },
    academicInfo: {
      graduationCGPA: Number(formData.cgpa || 0),
      currentBacklogs: 0,
    },
    skills: parsedSkills,
    projectDetails: [],
    experienceDetails: [],
    achievements: [],
    additionalInfo,
  };
};

// ============================================================================
// STUDENTS SERVICE
// ============================================================================
export const studentsService = {
  getStudents: async (params?: Record<string, unknown>) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  getStudent: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData: Record<string, unknown>) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  updateStudent: async (id: string, studentData: Record<string, unknown>) => {
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

  getEligibleStudents: async (companyId: string, params?: Record<string, unknown>) => {
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
  getApplications: async (params?: Record<string, unknown>) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getApplication: async (id: string) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  submitApplication: async (applicationData: SubmitApplicationPayload) => {
    const payload = new FormData();
    payload.append('companyId', applicationData.companyId);
    payload.append('formData', JSON.stringify(mapApplicationPayload(applicationData.formData)));
    if (applicationData.formData.resume instanceof File) {
      payload.append('resume', applicationData.formData.resume);
    }

    const response = await api.post('/applications', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateApplicationStatus: async (id: string, statusData: Record<string, unknown>) => {
    const response = await api.put(`/applications/${id}/status`, statusData);
    return response.data;
  },

  updateApplicationScore: async (id: string, scoreData: Record<string, unknown>) => {
    const response = await api.put(`/applications/${id}/score`, scoreData);
    return response.data;
  },

  bulkUpdateApplications: async (updateData: Record<string, unknown>) => {
    const response = await api.post('/applications/bulk-update', updateData);
    return response.data;
  },

  getStudentApplications: async (studentId: string, params?: Record<string, unknown>) => {
    const response = await api.get(`/applications/student/${studentId}`, { params });
    return response.data;
  },

  getCompanyApplications: async (companyId: string, params?: Record<string, unknown>) => {
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
  getWindows: async (params?: Record<string, unknown>) => {
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

  createWindow: async (windowData: Record<string, unknown>) => {
    const response = await api.post('/application-windows', windowData);
    return response.data;
  },

  updateWindow: async (id: string, windowData: Record<string, unknown>) => {
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
  getOpportunities: async (params?: Record<string, unknown>) => {
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

  createOpportunity: async (opportunityData: Record<string, unknown>) => {
    const response = await api.post('/off-campus-opportunities', opportunityData);
    return response.data;
  },

  updateOpportunity: async (id: string, opportunityData: Record<string, unknown>) => {
    const response = await api.put(`/off-campus-opportunities/${id}`, opportunityData);
    return response.data;
  },

  deleteOpportunity: async (id: string) => {
    const response = await api.delete(`/off-campus-opportunities/${id}`);
    return response.data;
  },

  trackApplication: async (id: string) => {
    try {
      const response = await api.post(`/off-campus-opportunities/${id}/track-application`);
      return response.data;
    } catch {
      return { success: true };
    }
  },

  searchOpportunities: async (params?: Record<string, unknown>) => {
    try {
      const response = await api.get('/off-campus-opportunities/search', { params });
      return response.data;
    } catch {
      return offCampusService.getOpportunities(params);
    }
  },

  getOpportunitiesBySkills: async (skills: string[]) => {
    try {
      const response = await api.get('/off-campus-opportunities/by-skills', {
        params: { skills: skills.join(',') },
      });
      return response.data;
    } catch {
      return offCampusService.getOpportunities({ skills: skills.join(',') });
    }
  },

  getMyOpportunities: async () => {
    try {
      const response = await api.get('/off-campus-opportunities/my-opportunities');
      return response.data;
    } catch {
      return offCampusService.getOpportunities();
    }
  },
};

// ============================================================================
// USERS SERVICE
// ============================================================================
export const usersService = {
  getUsers: async (params?: Record<string, unknown>) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: Record<string, unknown>) => {
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
  getApplicationReport: async (params?: Record<string, unknown>) => {
    const response = await api.get('/reports/applications', { params });
    return response.data;
  },

  getStudentReport: async (params?: Record<string, unknown>) => {
    const response = await api.get('/reports/students', { params });
    return response.data;
  },

  getPlacementReport: async (params?: Record<string, unknown>) => {
    const response = await api.get('/reports/placements', { params });
    return response.data;
  },

  getCompanyPerformance: async (params?: Record<string, unknown>) => {
    const response = await api.get('/reports/company-performance', { params });
    return response.data;
  },
};

// ============================================================================
// SEARCH SERVICE
// ============================================================================
export const searchService = {
  globalSearch: async (query: string, params?: Record<string, unknown>) => {
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

  advancedSearch: async (filters: Record<string, unknown>) => {
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
  uploadFile: async (formData: FormData) => {
    const response = await api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================
export const notificationsService = {
  getNotifications: async (params?: Record<string, unknown>) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
};

// Re-export services created in separate files
export { dashboardService } from './dashboard.service';
export { companiesService } from './companies.service';
