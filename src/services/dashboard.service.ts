import {
  getAdminStats,
  getPlacementSnapshot,
  getRecruiterStats,
  getStudentStats,
} from '../store/placementStore';

export const dashboardService = {
  getAdminDashboard: async () => {
    const snapshot = getPlacementSnapshot();

    return {
      success: true,
      data: {
        stats: getAdminStats(snapshot),
      },
    };
  },

  getRecruiterDashboard: async (companyId: string) => {
    const snapshot = getPlacementSnapshot();

    return {
      success: true,
      data: {
        stats: getRecruiterStats(snapshot, companyId),
      },
    };
  },

  getStudentDashboard: async (studentId: string) => {
    const snapshot = getPlacementSnapshot();

    return {
      success: true,
      data: {
        stats: getStudentStats(snapshot, studentId),
      },
    };
  },

  getOverallAnalytics: async () => {
    const snapshot = getPlacementSnapshot();
    const adminStats = getAdminStats(snapshot);

    return {
      success: true,
      data: {
        ...adminStats,
        placedStudents: snapshot.applications.filter(
          (application) => application.status === 'selected'
        ).length,
      },
    };
  },
};
