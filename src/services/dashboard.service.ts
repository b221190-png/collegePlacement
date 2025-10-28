import api from '../utils/api';

export const dashboardService = {
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  getRecruiterDashboard: async (companyId: string) => {
    const response = await api.get(`/dashboard/recruiter/${companyId}`);
    return response.data;
  },

  getStudentDashboard: async (studentId: string) => {
    const response = await api.get(`/dashboard/student/${studentId}`);
    return response.data;
  },

  getOverallAnalytics: async (params?: any) => {
    const response = await api.get('/dashboard/analytics/overall', { params });
    return response.data;
  },
};
