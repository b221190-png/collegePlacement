import { getPlacementSnapshot, usePlacementStore } from '../store/placementStore';

export const companiesService = {
  getCompanies: async (params?: { status?: string; search?: string }) => {
    const snapshot = getPlacementSnapshot();
    let companies = snapshot.companies;

    if (params?.status && params.status !== 'all') {
      companies = companies.filter((company) => company.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      companies = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(search) ||
          company.industry.toLowerCase().includes(search)
      );
    }

    return { success: true, data: companies };
  },

  getActiveCompanies: async () => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: snapshot.companies.filter((company) => company.status === 'open'),
    };
  },

  getCompany: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    const company = snapshot.companies.find((entry) => entry.id === id);
    return { success: Boolean(company), data: company };
  },

  createCompany: async (companyData: any) => {
    const result = usePlacementStore.getState().createCompany(companyData);
    return { success: true, data: result.company, meta: { recruiter: result.recruiter } };
  },

  updateCompany: async () => {
    return { success: false, message: 'Inline company editing is not implemented yet' };
  },

  deleteCompany: async () => {
    return { success: false, message: 'Company deletion is not available in demo mode' };
  },

  createRound: async () => {
    return { success: false, message: 'Round creation is managed inside company onboarding' };
  },

  getRounds: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    const company = snapshot.companies.find((entry) => entry.id === id);
    return { success: true, data: company?.rounds || [] };
  },

  searchCompanies: async (params?: { q?: string }) => {
    return companiesService.getCompanies({ search: params?.q });
  },

  getStats: async () => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: {
        total: snapshot.companies.length,
        active: snapshot.companies.filter((company) => company.status === 'open').length,
      },
    };
  },
};
