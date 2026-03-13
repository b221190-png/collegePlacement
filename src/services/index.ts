import {
  getApplicationsForCompany,
  getPlacementSnapshot,
  usePlacementStore,
} from '../store/placementStore';
export { dashboardService } from './dashboard.service';
export { companiesService } from './companies.service';

export const studentsService = {
  getStudents: async (params?: { email?: string; rollNumber?: string }) => {
    const snapshot = getPlacementSnapshot();
    let students = snapshot.students;

    if (params?.email) {
      students = students.filter((student) => student.email === params.email);
    }

    if (params?.rollNumber) {
      students = students.filter(
        (student) => student.rollNumber === params.rollNumber
      );
    }

    return { success: true, data: students };
  },

  getStudent: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: snapshot.students.find((student) => student.id === id) || null,
    };
  },

  createStudent: async () => {
    return {
      success: false,
      message: 'Use registration or bulk upload to create students in demo mode',
    };
  },

  updateStudent: async () => {
    return { success: false, message: 'Student editing is handled through profile updates' };
  },

  deleteStudent: async () => {
    return { success: false, message: 'Student deletion is disabled in demo mode' };
  },

  uploadResume: async (id: string, formData: FormData) => {
    const resumeName = formData.get('resume') instanceof File
      ? (formData.get('resume') as File).name
      : String(formData.get('resumeName') || '');
    const student = getPlacementSnapshot().students.find((entry) => entry.id === id);

    if (!student?.linkedUserId) {
      return { success: false, message: 'Student not found' };
    }

    const updatedUser = usePlacementStore
      .getState()
      .updateProfile(student.linkedUserId, { resumeName });

    return { success: true, data: updatedUser };
  },

  getEligibleStudents: async (companyId: string) => {
    const snapshot = getPlacementSnapshot();
    const company = snapshot.companies.find((entry) => entry.id === companyId);

    if (!company?.applicationWindow) {
      return { success: true, data: snapshot.students };
    }

    const eligible = snapshot.students.filter((student) => {
      const meetsCgpa =
        company.applicationWindow?.minCGPA === undefined ||
        student.cgpa >= company.applicationWindow.minCGPA;
      const meetsBranch =
        company.applicationWindow.branches.length === 0 ||
        company.applicationWindow.branches.includes(student.branch);
      return meetsCgpa && meetsBranch;
    });

    return { success: true, data: eligible };
  },

  bulkUpload: async () => {
    return {
      success: false,
      message: 'Use the bulk upload UI to import students in demo mode',
    };
  },
};

export const applicationsService = {
  getApplications: async (params?: { studentId?: string; companyId?: string }) => {
    const snapshot = getPlacementSnapshot();
    let applications = snapshot.applications;

    if (params?.studentId) {
      applications = applications.filter(
        (application) => application.studentId === params.studentId
      );
    }

    if (params?.companyId) {
      applications = applications.filter(
        (application) => application.companyId === params.companyId
      );
    }

    return { success: true, data: applications };
  },

  getApplication: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: snapshot.applications.find((application) => application.id === id) || null,
    };
  },

  submitApplication: async (applicationData: any) => {
    const application = usePlacementStore.getState().submitApplication(applicationData);
    return { success: true, data: application };
  },

  updateApplicationStatus: async (id: string, statusData: { status: any }) => {
    const application = usePlacementStore
      .getState()
      .updateApplicationStatus(id, statusData.status);
    return { success: true, data: application };
  },

  updateApplicationScore: async (id: string, scoreData: { score: number }) => {
    const application = usePlacementStore
      .getState()
      .updateApplicationScore(id, Number(scoreData.score));
    return { success: true, data: application };
  },

  bulkUpdateApplications: async (updateData: { applicationIds: string[]; status: any }) => {
    const applications = usePlacementStore
      .getState()
      .bulkUpdateApplications(updateData.applicationIds, updateData.status);
    return { success: true, data: applications };
  },

  getStudentApplications: async (studentId: string) => {
    const snapshot = getPlacementSnapshot();
    const applications = snapshot.applications
      .filter((application) => application.studentId === studentId)
      .map((application) => ({
        ...application,
        company:
          snapshot.companies.find((company) => company.id === application.companyId) ||
          null,
      }));

    return { success: true, data: applications };
  },

  getCompanyApplications: async (companyId: string) => {
    return {
      success: true,
      data: getApplicationsForCompany(getPlacementSnapshot(), companyId),
    };
  },

  getStats: async () => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: {
        total: snapshot.applications.length,
      },
    };
  },
};

export const applicationWindowsService = {
  getWindows: async () => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: snapshot.companies
        .filter((company) => company.applicationWindow)
        .map((company) => ({
          companyId: company.id,
          companyName: company.name,
          ...company.applicationWindow,
        })),
    };
  },

  getActiveWindows: async () => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data: snapshot.companies.filter((company) => company.status === 'open'),
    };
  },

  getUpcomingWindows: async () => {
    return { success: true, data: [] };
  },

  getWindow: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    const company = snapshot.companies.find((entry) => entry.id === id);
    return { success: true, data: company?.applicationWindow || null };
  },

  createWindow: async (windowData: any) => {
    const company = usePlacementStore
      .getState()
      .configureApplicationWindow(windowData);
    return { success: true, data: company };
  },

  updateWindow: async (id: string, windowData: any) => {
    return applicationWindowsService.createWindow({ ...windowData, companyId: id });
  },

  deleteWindow: async () => {
    return { success: false, message: 'Deleting windows is disabled in demo mode' };
  },

  deactivateWindow: async () => {
    return { success: false, message: 'Deactivation is not implemented in demo mode' };
  },
};

export const offCampusService = {
  getOpportunities: async () => {
    return {
      success: true,
      data: getPlacementSnapshot().offCampusOpportunities,
    };
  },

  getFeaturedOpportunities: async () => {
    return {
      success: true,
      data: getPlacementSnapshot().offCampusOpportunities.slice(0, 4),
    };
  },

  getOpportunity: async (id: string) => {
    const snapshot = getPlacementSnapshot();
    return {
      success: true,
      data:
        snapshot.offCampusOpportunities.find((opportunity) => opportunity.id === id) ||
        null,
    };
  },

  createOpportunity: async (opportunityData: any) => {
    const opportunity = usePlacementStore
      .getState()
      .createOffCampusOpportunity(opportunityData);
    return { success: true, data: opportunity };
  },

  updateOpportunity: async () => {
    return { success: false, message: 'Editing opportunities is not implemented yet' };
  },

  deleteOpportunity: async () => {
    return { success: false, message: 'Deleting opportunities is disabled in demo mode' };
  },

  trackApplication: async () => {
    return { success: true };
  },

  searchOpportunities: async () => {
    return offCampusService.getOpportunities();
  },

  getOpportunitiesBySkills: async () => {
    return offCampusService.getOpportunities();
  },

  getMyOpportunities: async () => {
    return offCampusService.getOpportunities();
  },
};

export const usersService = {
  getUsers: async () => ({ success: true, data: getPlacementSnapshot().users }),
  getUser: async (id: string) => ({
    success: true,
    data: getPlacementSnapshot().users.find((user) => user.id === id) || null,
  }),
  updateUser: async () => ({ success: false, message: 'Use auth profile updates in demo mode' }),
  deleteUser: async () => ({ success: false, message: 'Deleting users is disabled in demo mode' }),
  deactivateUser: async () => ({ success: false, message: 'User deactivation is disabled in demo mode' }),
  activateUser: async () => ({ success: false, message: 'User activation is disabled in demo mode' }),
  getStats: async () => ({
    success: true,
    data: {
      total: getPlacementSnapshot().users.length,
    },
  }),
};

export const reportsService = {
  getApplicationReport: async () => ({
    success: true,
    data: getPlacementSnapshot().applications,
  }),
  getStudentReport: async () => ({
    success: true,
    data: getPlacementSnapshot().students,
  }),
  getPlacementReport: async () => ({
    success: true,
    data: {
      applications: getPlacementSnapshot().applications.length,
      students: getPlacementSnapshot().students.length,
      companies: getPlacementSnapshot().companies.length,
    },
  }),
};

export const searchService = {
  globalSearch: async (query: string) => {
    const snapshot = getPlacementSnapshot();
    const lower = query.toLowerCase();

    return {
      success: true,
      data: {
        companies: snapshot.companies.filter((company) =>
          company.name.toLowerCase().includes(lower)
        ),
        students: snapshot.students.filter((student) =>
          student.name.toLowerCase().includes(lower)
        ),
      },
    };
  },
};

export const uploadsService = {
  uploadFile: async () => ({
    success: false,
    message: 'File uploads are handled inline in demo mode',
  }),
};

export const notificationsService = {
  getNotifications: async () => ({ success: true, data: [] }),
};
