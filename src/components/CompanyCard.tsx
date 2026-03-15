import React from 'react';
import { Calendar, MapPin, Sparkles, Users } from 'lucide-react';
import { Company } from '../types';

interface CompanyCardProps {
  company: Company;
  onViewDetails: (company: Company) => void;
  onApply: (company: Company) => void;
  isApplied?: boolean;
  applicationStatus?: string;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onViewDetails,
  onApply,
  isApplied = false,
  applicationStatus,
}) => {
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
  const eligibilityHighlights = (() => {
    const criteria = company.eligibilityCriteria;
    if (!criteria) {
      return [];
    }

    const items: string[] = [];
    if (typeof criteria.minCGPA === 'number') {
      items.push(`CGPA ${criteria.minCGPA}+`);
    }
    if (typeof criteria.minTenthPercentage === 'number') {
      items.push(`10th ${criteria.minTenthPercentage}%+`);
    }
    if (typeof criteria.minTwelfthPercentage === 'number') {
      items.push(`12th ${criteria.minTwelfthPercentage}%+`);
    }
    if (criteria.backlogCriteria === 'not-allowed') {
      items.push('No backlogs');
    } else if (criteria.backlogCriteria === 'allowed') {
      items.push('Backlogs allowed');
    }

    return items;
  })();

  return (
    <div
      className={`rounded-[1.75rem] border overflow-hidden transition-all duration-300 ${
        isApplied
          ? 'bg-emerald-50/80 border-emerald-200 shadow-sm opacity-95'
          : 'bg-white border-slate-200 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center space-x-3">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover flex-shrink-0 transition-all ${
                isApplied ? 'blur-[1px] saturate-50' : ''
              }`}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">
                {company.name}
              </h3>
              <p className="text-slate-500 text-xs md:text-sm truncate">{company.industry}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{company.location}</span>
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(company.status)}`}>
            {getStatusText(company.status)}
          </span>
        </div>

        <p className="text-slate-700 mb-4 text-sm leading-6 line-clamp-3">{company.description}</p>

        {isApplied && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-xs md:text-sm text-emerald-800">
            Applied already{applicationStatus ? ` · ${applicationStatus}` : ''}
          </div>
        )}

        {eligibilityHighlights.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Eligibility
            </div>
            <div className="flex flex-wrap gap-2">
              {eligibilityHighlights.map((item) => (
                <span
                  key={item}
                  className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current round info for results available */}
        {currentRoundInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-blue-800 font-medium truncate">Current: {currentRoundInfo.name}</span>
              <span className="text-xs md:text-sm text-blue-600 whitespace-nowrap ml-2">{currentRoundInfo.selectedCount} selected</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Package</div>
            <div className="font-semibold text-slate-900 mt-1">{company.packageOffered}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Positions</div>
            <div className="font-semibold text-slate-900 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              {company.totalPositions}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 col-span-2">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Deadline</div>
            <div className="font-semibold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(company.applicationDeadline).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onViewDetails(company)}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-2xl transition-colors duration-200 font-medium text-sm"
          >
            View Details
          </button>
          {company.status === 'open' && !isApplied && (
            <button
              onClick={() => onApply(company)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl transition-colors duration-200 font-medium text-sm"
            >
              Apply Now
            </button>
          )}
          {company.status === 'open' && isApplied && (
            <button
              type="button"
              disabled
              className="flex-1 bg-emerald-100 text-emerald-700 py-3 px-4 rounded-2xl font-medium text-sm cursor-not-allowed"
            >
              Applied
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
