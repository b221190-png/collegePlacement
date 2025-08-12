import React, { useState } from 'react';
import { Search, Filter, Star, Download, Eye, CheckCircle, X, Users, FileText, TrendingUp } from 'lucide-react';
import { Application, Student } from '../types';

const RecruiterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'rounds' | 'analytics'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    branch: 'all',
    cgpa: 'all',
    status: 'all',
  });
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  // Mock applications data
  const mockApplications: (Application & { student: Student })[] = [
    {
      id: '1',
      studentId: '1',
      companyId: '1',
      status: 'submitted',
      submittedAt: '2025-01-20T10:30:00Z',
      score: 85,
      formData: {
        studentName: 'Arjun Sharma',
        rollNumber: '21BCE101',
        email: 'arjun.sharma@college.edu',
        phone: '+91 98765 43210',
        branch: 'Computer Science',
        cgpa: 9.2,
        skills: 'React, Node.js, Python, MongoDB',
        experience: '2 internships, 3 projects',
        whyCompany: 'Passionate about fintech innovation...',
        resume: null,
      },
      student: {
        id: '1',
        name: 'Arjun Sharma',
        rollNumber: '21BCE101',
        branch: 'Computer Science',
        email: 'arjun.sharma@college.edu',
        cgpa: 9.2,
        phone: '+91 98765 43210',
        skills: ['React', 'Node.js', 'Python', 'MongoDB'],
      },
    },
    {
      id: '2',
      studentId: '2',
      companyId: '1',
      status: 'under-review',
      submittedAt: '2025-01-19T14:15:00Z',
      score: 92,
      formData: {
        studentName: 'Priya Patel',
        rollNumber: '21BCE102',
        email: 'priya.patel@college.edu',
        phone: '+91 98765 43211',
        branch: 'Computer Science',
        cgpa: 9.5,
        skills: 'Java, Spring Boot, MySQL, AWS',
        experience: '1 internship, 5 projects',
        whyCompany: 'Excited about payment technology...',
        resume: null,
      },
      student: {
        id: '2',
        name: 'Priya Patel',
        rollNumber: '21BCE102',
        branch: 'Computer Science',
        email: 'priya.patel@college.edu',
        cgpa: 9.5,
        phone: '+91 98765 43211',
        skills: ['Java', 'Spring Boot', 'MySQL', 'AWS'],
      },
    },
  ];

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = app.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = filterCriteria.branch === 'all' || app.student.branch === filterCriteria.branch;
    const matchesCGPA = filterCriteria.cgpa === 'all' || 
                       (filterCriteria.cgpa === 'high' && app.student.cgpa >= 9.0) ||
                       (filterCriteria.cgpa === 'medium' && app.student.cgpa >= 7.5 && app.student.cgpa < 9.0);
    const matchesStatus = filterCriteria.status === 'all' || app.status === filterCriteria.status;
    
    return matchesSearch && matchesBranch && matchesCGPA && matchesStatus;
  });

  const handleScoreChange = (applicationId: string, score: number) => {
    console.log(`Updating score for application ${applicationId}: ${score}`);
  };

  const handleStatusChange = (applicationId: string, status: string) => {
    console.log(`Updating status for application ${applicationId}: ${status}`);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action ${action} for applications:`, selectedApplications);
  };

  const stats = {
    totalApplications: mockApplications.length,
    underReview: mockApplications.filter(app => app.status === 'under-review').length,
    shortlisted: mockApplications.filter(app => app.status === 'shortlisted').length,
    avgScore: mockApplications.reduce((sum, app) => sum + (app.score || 0), 0) / mockApplications.length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
        <p className="text-gray-600">Manage applications and recruitment process for Juspay</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-xl md:text-2xl font-bold text-blue-600 mb-2">{stats.totalApplications}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-xl md:text-2xl font-bold text-yellow-600 mb-2">{stats.underReview}</div>
          <div className="text-xs md:text-sm text-gray-600">Under Review</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-xl md:text-2xl font-bold text-green-600 mb-2">{stats.shortlisted}</div>
          <div className="text-xs md:text-sm text-gray-600">Shortlisted</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-xl md:text-2xl font-bold text-purple-600 mb-2">{stats.avgScore.toFixed(1)}</div>
          <div className="text-xs md:text-sm text-gray-600">Average Score</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto">
            {[
              { id: 'applications', label: 'Applications', icon: FileText },
              { id: 'rounds', label: 'Rounds', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
          {activeTab === 'applications' && (
            <ApplicationsTab
              applications={filteredApplications}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterCriteria={filterCriteria}
              setFilterCriteria={setFilterCriteria}
              selectedApplications={selectedApplications}
              setSelectedApplications={setSelectedApplications}
              onScoreChange={handleScoreChange}
              onStatusChange={handleStatusChange}
              onBulkAction={handleBulkAction}
            />
          )}
          {activeTab === 'rounds' && <RoundsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
};

interface ApplicationsTabProps {
  applications: (Application & { student: Student })[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCriteria: any;
  setFilterCriteria: (criteria: any) => void;
  selectedApplications: string[];
  setSelectedApplications: (ids: string[]) => void;
  onScoreChange: (id: string, score: number) => void;
  onStatusChange: (id: string, status: string) => void;
  onBulkAction: (action: string) => void;
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applications,
  searchTerm,
  setSearchTerm,
  filterCriteria,
  setFilterCriteria,
  selectedApplications,
  setSelectedApplications,
  onScoreChange,
  onStatusChange,
  onBulkAction,
}) => {
  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app.id));
    }
  };

  const handleSelectApplication = (id: string) => {
    setSelectedApplications(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterCriteria.branch}
          onChange={(e) => setFilterCriteria(prev => ({ ...prev, branch: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Branches</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electronics">Electronics</option>
        </select>

        <select
          value={filterCriteria.cgpa}
          onChange={(e) => setFilterCriteria(prev => ({ ...prev, cgpa: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All CGPA</option>
          <option value="high">9.0+ CGPA</option>
          <option value="medium">7.5-9.0 CGPA</option>
        </select>

        <select
          value={filterCriteria.status}
          onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under-review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium text-sm md:text-base">
              {selectedApplications.length} application(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onBulkAction('shortlist')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Shortlist
              </button>
              <button
                onClick={() => onBulkAction('reject')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onBulkAction('export')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedApplications.length === applications.length && applications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-3 md:px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application.id)}
                    onChange={() => handleSelectApplication(application.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-xs md:text-sm font-medium text-gray-900">{application.student.name}</div>
                    <div className="text-xs text-gray-500">{application.student.rollNumber} • {application.student.branch}</div>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{application.student.cgpa}</span>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {application.student.skills.slice(0, 2).map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {application.student.skills.length > 2 && (
                      <span className="text-gray-500 text-xs">+{application.student.skills.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={application.score || ''}
                    onChange={(e) => onScoreChange(application.id, parseInt(e.target.value))}
                    className="w-16 p-1 border border-gray-300 rounded text-sm"
                    placeholder="0-100"
                  />
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <select
                    value={application.status}
                    onChange={(e) => onStatusChange(application.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under-review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RoundsTab: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">Round management interface</p>
      <p className="text-gray-400">Manage recruitment rounds and move candidates through the process</p>
    </div>
  );
};

const AnalyticsTab: React.FC = () => {
  return (
    <div className="text-center py-8">
      <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">Analytics dashboard</p>
      <p className="text-gray-400">View recruitment metrics, conversion rates, and performance insights</p>
    </div>
  );
};

export default RecruiterDashboard;