import api from '../utils/api';

export const companiesService = {
  getCompanies: async (params?: Record<string, unknown>) => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  getActiveCompanies: async () => {
    const response = await api.get('/companies/active');
    return response.data;
  },

  getCompany: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  createCompany: async (companyData: unknown) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },

  updateCompany: async (id: string, companyData: unknown) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },

  deleteCompany: async (id: string) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },

  createRound: async (id: string, roundData: unknown) => {
    const response = await api.post(`/companies/${id}/rounds`, roundData);
    return response.data;
  },

  getRounds: async (id: string) => {
    const response = await api.get(`/companies/${id}/rounds`);
    return response.data;
  },

  searchCompanies: async (params?: Record<string, unknown>) => {
    const response = await api.get('/companies/search', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/companies/stats');
    return response.data;
  },
};
