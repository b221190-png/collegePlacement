import React, { useEffect, useState } from 'react';
import { User, Building2, FileText, LogOut, Search, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { dashboardService, applicationsService, studentsService } from '../../services';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({
    totalApplications: 0,
    companiesApplied: 0,
    underReview: 0,
    cgpa: 0,
  });
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Get student profile to find studentId
      const profileResponse = await studentsService.getStudents({ email: user?.email });
      if (profileResponse.success && profileResponse.data?.length > 0) {
        const student = profileResponse.data[0];
        setStudentProfile(student);
        
        // Fetch dashboard data
        const dashboardResponse = await dashboardService.getStudentDashboard(student._id);
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboardStats = dashboardResponse.data.stats;
          setStats({
            totalApplications: dashboardStats.totalApplications || 0,
            companiesApplied: dashboardStats.companiesApplied || 0,
            underReview: dashboardStats.applicationsInReview || 0,
            cgpa: student.academics?.cgpa || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-700">{user?.name}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Student
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="text-gray-600">Track your placement journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Companies Applied</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.companiesApplied}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Search className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.underReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">CGPA</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.cgpa.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Building2 className="w-5 h-5 text-gray-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Browse Companies</p>
                <p className="text-sm text-gray-600">Explore available opportunities</p>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <FileText className="w-5 h-5 text-gray-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">My Applications</p>
                <p className="text-sm text-gray-600">Track application status</p>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Search className="w-5 h-5 text-gray-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Off-Campus Jobs</p>
                <p className="text-sm text-gray-600">External opportunities</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No recent activity</p>
              <p className="text-sm text-gray-400">Start applying to companies to see your activity here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
