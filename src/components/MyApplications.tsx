import React, { useState } from 'react';
import { Building2, Calendar, Users, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { mockCompanies } from '../data/mockData';

interface Application {
  id: string;
  companyName: string;
  companyLogo: string;
  industry: string;
  status: 'applied' | 'in-progress' | 'selected' | 'rejected';
  appliedDate: string;
  currentRound: string;
  totalRounds: number;
  deadline: string;
  description: string;
  packageOffered: string;
}

const MyApplications: React.FC = () => {
  // Mock applications data - in real app this would come from user's actual applications
  const mockApplications: Application[] = [
    {
      id: '1',
      companyName: 'Juspay',
      companyLogo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100',
      industry: 'Fintech',
      status: 'selected',
      appliedDate: '2025-01-10',
      currentRound: 'Technical Interview',
      totalRounds: 3,
      deadline: '2025-02-15',
      description: 'Leading fintech company specializing in payment solutions',
      packageOffered: '₹18-25 LPA',
    },
    {
      id: '2',
      companyName: 'Google',
      companyLogo: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=100',
      industry: 'Technology',
      status: 'in-progress',
      appliedDate: '2025-01-15',
      currentRound: 'Online Assessment',
      totalRounds: 4,
      deadline: '2025-03-01',
      description: 'Global technology company focusing on search and cloud computing',
      packageOffered: '₹35-50 LPA',
    },
    {
      id: '3',
      companyName: 'Microsoft',
      companyLogo: 'https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=100',
      industry: 'Technology',
      status: 'applied',
      appliedDate: '2025-01-20',
      currentRound: 'Application Review',
      totalRounds: 3,
      deadline: '2025-02-28',
      description: 'Leading software company providing cloud computing solutions',
      packageOffered: '₹28-40 LPA',
    },
    {
      id: '4',
      companyName: 'Amazon',
      companyLogo: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=100',
      industry: 'E-commerce & Cloud',
      status: 'rejected',
      appliedDate: '2025-01-05',
      currentRound: 'Online Assessment',
      totalRounds: 3,
      deadline: '2025-02-20',
      description: 'E-commerce and cloud computing giant',
      packageOffered: '₹22-35 LPA',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'selected':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Application Submitted';
      case 'in-progress':
        return 'In Progress';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Unknown';
    }
  };

  const stats = {
    total: mockApplications.length,
    inProgress: mockApplications.filter(app => app.status === 'in-progress').length,
    selected: mockApplications.filter(app => app.status === 'selected').length,
    applied: mockApplications.filter(app => app.status === 'applied').length,
  };

  const groupedApplications = {
    'in-progress': mockApplications.filter(app => app.status === 'in-progress'),
    'selected': mockApplications.filter(app => app.status === 'selected'),
    'applied': mockApplications.filter(app => app.status === 'applied'),
    'rejected': mockApplications.filter(app => app.status === 'rejected'),
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">College Recruitment Portal</h1>
        <p className="text-gray-600">Apply to top companies visiting our campus. Track your applications and view selection results all in one place.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{stats.inProgress}</div>
          <div className="text-xs md:text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-2">{stats.selected}</div>
          <div className="text-xs md:text-sm text-gray-600">Selected</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">{stats.applied}</div>
          <div className="text-xs md:text-sm text-gray-600">Under Review</div>
        </div>
      </div>

      {/* Applications Sections */}
      <div className="space-y-8">
        {/* In Progress Applications */}
        {groupedApplications['in-progress'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Applications In Progress</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedApplications['in-progress'].map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </div>
        )}

        {/* Selected Applications */}
        {groupedApplications['selected'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Selected Applications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedApplications['selected'].map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </div>
        )}

        {/* Applied Applications */}
        {groupedApplications['applied'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Applications Under Review</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedApplications['applied'].map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </div>
        )}

        {/* Rejected Applications */}
        {groupedApplications['rejected'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Not Selected</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedApplications['rejected'].map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </div>
        )}
      </div>

      {mockApplications.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No applications yet</p>
          <p className="text-gray-400">Start applying to companies to see your applications here</p>
        </div>
      )}
    </div>
  );
};

interface ApplicationCardProps {
  application: Application;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Application Submitted';
      case 'in-progress':
        return 'In Progress';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img 
            src={application.companyLogo} 
            alt={`${application.companyName} logo`}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{application.companyName}</h3>
            <p className="text-sm text-gray-600">{application.industry}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
          {getStatusText(application.status)}
        </span>
      </div>

      <p className="text-gray-700 text-sm mb-4">{application.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Current:</span>
          <span className="font-medium text-gray-900">{application.currentRound}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Package:</span>
          <span className="font-medium text-gray-900">{application.packageOffered}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Deadline:</span>
          <span className="font-medium text-gray-900">{new Date(application.deadline).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Rounds:</span>
          <span className="font-medium text-gray-900">{application.totalRounds} rounds</span>
        </div>
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2">
        <Eye className="h-4 w-4" />
        <span>View Details</span>
      </button>
    </div>
  );
};

export default MyApplications;