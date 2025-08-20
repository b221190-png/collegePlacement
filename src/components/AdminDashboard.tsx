import React, { useState } from 'react';
import { Plus, Upload, Users, Building2, Calendar, Settings, FileText, Download } from 'lucide-react';
import CompanyOnboardingForm from './CompanyOnboardingForm';
import StudentBulkUpload from './StudentBulkUpload';
import ApplicationWindow from './ApplicationWindow';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'students' | 'applications'>('overview');

  const stats = {
    totalCompanies: 6,
    activeRecruitments: 3,
    totalStudents: 450,
    totalApplications: 1250,
    pendingApprovals: 2,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage companies, students, and recruitment processes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">{stats.totalCompanies}</div>
          <div className="text-xs sm:text-sm md:text-sm text-gray-600">Total Companies</div>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1 sm:mb-2">{stats.activeRecruitments}</div>
          <div className="text-xs sm:text-sm md:text-sm text-gray-600">Active Recruitments</div>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-1 sm:mb-2">{stats.totalStudents}</div>
          <div className="text-xs sm:text-sm md:text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-1 sm:mb-2">{stats.totalApplications}</div>
          <div className="text-xs sm:text-sm md:text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-1 sm:mb-2">{stats.pendingApprovals}</div>
          <div className="text-xs sm:text-sm md:text-sm text-gray-600">Pending Approvals</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'companies', label: 'Companies', icon: Building2 },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'applications', label: 'Applications', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'companies' && <CompaniesTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'applications' && <ApplicationsTab />}
        </div>
      </div>
    </div>
  );
};

const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm md:text-base">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Onboard New Company</span>
              <span className="sm:hidden">Add Company</span>
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm md:text-base">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Upload Students</span>
              <span className="sm:hidden">Upload Students</span>
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 sm:py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm md:text-base">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Set Application Windows</span>
              <span className="sm:hidden">Set Windows</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0">
              <span className="text-gray-600">Google applications opened</span>
              <span className="text-gray-500 text-xs">2 hours ago</span>
            </div>
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0">
              <span className="text-gray-600">Microsoft recruiter added</span>
              <span className="text-gray-500 text-xs">1 day ago</span>
            </div>
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0">
              <span className="text-gray-600">45 students uploaded</span>
              <span className="text-gray-500 text-xs">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompaniesTab: React.FC = () => {
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Company Management</h3>
        <button
          onClick={() => setShowOnboardingForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Onboard Company</span>
          <span className="sm:hidden">Add Company</span>
        </button>
      </div>

      {showOnboardingForm ? (
        <CompanyOnboardingForm onClose={() => setShowOnboardingForm(false)} />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Google</div>
                        <div className="text-sm text-gray-500">Technology</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">156</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mar 1, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Google</div>
                    <div className="text-xs text-gray-500">Technology</div>
                  </div>
                </div>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Applications:</span>
                  <span className="ml-1 font-medium">156</span>
                </div>
                <div>
                  <span className="text-gray-500">Deadline:</span>
                  <span className="ml-1 font-medium">Mar 1, 2025</span>
                </div>
              </div>
              <div className="flex space-x-3 mt-3 pt-3 border-t border-gray-100">
                <button className="text-blue-600 hover:text-blue-900 text-xs font-medium">Edit</button>
                <button className="text-red-600 hover:text-red-900 text-xs font-medium">Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentsTab: React.FC = () => {
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Student Management</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {showBulkUpload ? (
        <StudentBulkUpload onClose={() => setShowBulkUpload(false)} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">Student management interface</p>
            <p className="text-gray-400 text-sm sm:text-base">Upload student lists, manage profiles, and track eligibility</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ApplicationsTab: React.FC = () => {
  const [showApplicationWindow, setShowApplicationWindow] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Application Management</h3>
        <button
          onClick={() => setShowApplicationWindow(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Set Application Window</span>
          <span className="sm:hidden">Set Window</span>
        </button>
      </div>

      {showApplicationWindow ? (
        <ApplicationWindow onClose={() => setShowApplicationWindow(false)} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">Application window management</p>
            <p className="text-gray-400 text-sm sm:text-base">Set deadlines, manage application periods, and control access</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
