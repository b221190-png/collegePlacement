import React from 'react';
import { Building2, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
  onViewDetails: (company: Company) => void;
  onApply: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onViewDetails, onApply }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'results':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Applications Open';
      case 'closed':
        return 'Applications Closed';
      case 'results':
        return 'Results Available';
      default:
        return 'Unknown';
    }
  };

  // Get current round info for results available companies
  const getCurrentRoundInfo = () => {
    if (company.status === 'results' && company.rounds.length > 0) {
      const currentRound = company.rounds.find(round => round.status === 'ongoing') || 
                          company.rounds[company.rounds.length - 1];
      return {
        name: currentRound.name,
        selectedCount: currentRound.selectedStudents.length
      };
    }
    return null;
  };

  const currentRoundInfo = getCurrentRoundInfo();

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={company.logo} 
              alt={`${company.name} logo`}
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
              <p className="text-gray-600 text-xs md:text-sm truncate">{company.industry}</p>
            </div>
          </div>
          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(company.status)}`}>
            {getStatusText(company.status)}
          </span>
        </div>

        <p className="text-gray-700 mb-4 text-xs md:text-sm line-clamp-2">{company.description}</p>

        {/* Current round info for results available */}
        {currentRoundInfo && (
          <div className="mb-4 p-2 md:p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-blue-800 font-medium truncate">Current: {currentRoundInfo.name}</span>
              <span className="text-xs md:text-sm text-blue-600 whitespace-nowrap ml-2">{currentRoundInfo.selectedCount} selected</span>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">Package:</span>
            <span className="font-medium text-gray-900 text-right">{company.packageOffered}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">Positions:</span>
            <span className="font-medium text-gray-900">{company.totalPositions}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">Deadline:</span>
            <span className="font-medium text-gray-900 text-right">{new Date(company.applicationDeadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600">Rounds:</span>
            <span className="font-medium text-gray-900">{company.rounds.length} rounds</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => onViewDetails(company)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            View Details
          </button>
          {company.status === 'open' && (
            <button
              onClick={() => onApply(company)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;