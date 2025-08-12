import React, { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Briefcase, Globe, Filter, ExternalLink } from 'lucide-react';
import { OffCampusOpportunity } from '../types';
import { mockOffCampusOpportunities } from '../data/offCampusData';

const OffCampusOpportunities: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const filteredOpportunities = mockOffCampusOpportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || opportunity.type === filterType;
    const matchesExperience = filterExperience === 'all' || opportunity.experience === filterExperience;
    const matchesLocation = filterLocation === 'all' || 
                           (filterLocation === 'remote' && opportunity.isRemote) ||
                           opportunity.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesExperience && matchesLocation;
  });

  const stats = {
    total: mockOffCampusOpportunities.length,
    internships: mockOffCampusOpportunities.filter(o => o.type === 'internship').length,
    remote: mockOffCampusOpportunities.filter(o => o.isRemote).length,
    fullTime: mockOffCampusOpportunities.filter(o => o.type === 'full-time').length,
  };

  const groupedOpportunities = {
    internship: filteredOpportunities.filter(o => o.type === 'internship'),
    'full-time': filteredOpportunities.filter(o => o.type === 'full-time'),
    remote: filteredOpportunities.filter(o => o.type === 'remote'),
    freelance: filteredOpportunities.filter(o => o.type === 'freelance'),
    'part-time': filteredOpportunities.filter(o => o.type === 'part-time'),
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Off-Campus Opportunities</h1>
        <p className="text-gray-600">Discover internships, remote jobs, freelance projects, and other career opportunities beyond campus recruitment.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Opportunities</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">{stats.internships}</div>
          <div className="text-xs md:text-sm text-gray-600">Internships</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">{stats.remote}</div>
          <div className="text-xs md:text-sm text-gray-600">Remote Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">{stats.fullTime}</div>
          <div className="text-xs md:text-sm text-gray-600">Full-time Roles</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="internship">Internships</option>
            <option value="full-time">Full-time</option>
            <option value="remote">Remote</option>
            <option value="freelance">Freelance</option>
            <option value="part-time">Part-time</option>
          </select>

          <select
            value={filterExperience}
            onChange={(e) => setFilterExperience(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Experience</option>
            <option value="fresher">Fresher</option>
            <option value="experienced">Experienced</option>
            <option value="any">Any</option>
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            <option value="remote">Remote</option>
            <option value="bangalore">Bangalore</option>
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="hyderabad">Hyderabad</option>
            <option value="pune">Pune</option>
            <option value="chennai">Chennai</option>
          </select>
        </div>
      </div>

      {/* Opportunities Sections */}
      <div className="space-y-8">
        {/* Internships */}
        {groupedOpportunities.internship.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Internships</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOpportunities.internship.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}

        {/* Full-time Jobs */}
        {groupedOpportunities['full-time'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Full-time Positions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOpportunities['full-time'].map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}

        {/* Remote Jobs */}
        {groupedOpportunities.remote.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Remote Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOpportunities.remote.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}

        {/* Freelance Projects */}
        {groupedOpportunities.freelance.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Freelance Projects</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOpportunities.freelance.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}

        {/* Part-time Jobs */}
        {groupedOpportunities['part-time'].length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Part-time Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedOpportunities['part-time'].map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No opportunities found matching your criteria</p>
          <p className="text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

interface OpportunityCardProps {
  opportunity: OffCampusOpportunity;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internship':
        return 'bg-green-100 text-green-800';
      case 'full-time':
        return 'bg-blue-100 text-blue-800';
      case 'remote':
        return 'bg-purple-100 text-purple-800';
      case 'freelance':
        return 'bg-orange-100 text-orange-800';
      case 'part-time':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'internship':
        return 'Internship';
      case 'full-time':
        return 'Full-time';
      case 'remote':
        return 'Remote';
      case 'freelance':
        return 'Freelance';
      case 'part-time':
        return 'Part-time';
      default:
        return type;
    }
  };

  const handleApply = () => {
    window.open(opportunity.applicationLink, '_blank');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={opportunity.companyLogo} 
              alt={`${opportunity.company} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
              <p className="text-gray-600 text-sm">{opportunity.company}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(opportunity.type)}`}>
            {getTypeText(opportunity.type)}
          </span>
        </div>

        <p className="text-gray-700 mb-4 text-sm line-clamp-2">{opportunity.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{opportunity.location}</span>
            {opportunity.isRemote && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Remote</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>{opportunity.salary || opportunity.stipend}</span>
          </div>

          {opportunity.duration && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{opportunity.duration}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Briefcase className="h-4 w-4" />
            <span>{opportunity.industry}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {opportunity.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {skill}
              </span>
            ))}
            {opportunity.skills.length > 3 && (
              <span className="text-gray-500 text-xs">+{opportunity.skills.length - 3} more</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Posted: {new Date(opportunity.postedDate).toLocaleDateString()}</span>
          <span>Deadline: {new Date(opportunity.applicationDeadline).toLocaleDateString()}</span>
        </div>

        <button
          onClick={handleApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Apply Now</span>
        </button>
      </div>
    </div>
  );
};

export default OffCampusOpportunities;