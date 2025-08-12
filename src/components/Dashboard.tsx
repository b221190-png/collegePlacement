import React, { useState } from 'react';
import { TrendingUp, Building2, Users, Calendar, Search } from 'lucide-react';
import { Company } from '../types';
import { mockCompanies } from '../data/mockData';
import CompanyCard from './CompanyCard';

interface DashboardProps {
  onCompanySelect: (company: Company) => void;
  onApplyClick: (company: Company) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCompanySelect, onApplyClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCompanies: mockCompanies.length,
    openApplications: mockCompanies.filter(c => c.status === 'open').length,
    closedApplications: mockCompanies.filter(c => c.status === 'closed').length,
    resultsAvailable: mockCompanies.filter(c => c.status === 'results').length,
  };

  const groupedCompanies = {
    open: filteredCompanies.filter(c => c.status === 'open'),
    results: filteredCompanies.filter(c => c.status === 'results'),
    closed: filteredCompanies.filter(c => c.status === 'closed'),
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
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{stats.totalCompanies}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Companies</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{stats.openApplications}</div>
          <div className="text-xs md:text-sm text-gray-600">Applications Open</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-2">{stats.closedApplications}</div>
          <div className="text-xs md:text-sm text-gray-600">Applications Closed</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">{stats.resultsAvailable}</div>
          <div className="text-xs md:text-sm text-gray-600">Results Available</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies or industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="open">Applications Open</option>
          <option value="closed">Applications Closed</option>
          <option value="results">Results Available</option>
        </select>
      </div>

      {/* Companies Sections */}
      <div className="space-y-8">
        {/* Applications Open */}
        {groupedCompanies.open.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Applications Open</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedCompanies.open.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onViewDetails={onCompanySelect}
                  onApply={onApplyClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results Available */}
        {groupedCompanies.results.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Results Available</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedCompanies.results.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onViewDetails={onCompanySelect}
                  onApply={onApplyClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Applications Closed */}
        {groupedCompanies.closed.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Applications Closed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedCompanies.closed.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onViewDetails={onCompanySelect}
                  onApply={onApplyClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No companies found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;