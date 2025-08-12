import React, { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, DollarSign, Users, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Company } from '../types';
import { StudentModal } from './StudentModal';

interface CompanyDetailsProps {
  company: Company;
  onBack: () => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ company, onBack }) => {
  const [selectedRound, setSelectedRound] = useState<any>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ongoing':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'upcoming':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Companies</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <div className="flex items-center space-x-4">
            <img 
              src={company.logo} 
              alt={`${company.name} logo`}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-blue-100">{company.industry}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Company Overview</h2>
              <p className="text-gray-700 mb-4">{company.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{company.location}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{company.packageOffered}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{company.totalPositions} positions available</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Deadline: {new Date(company.applicationDeadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {company.requirements.map((req, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-6">Recruitment Process</h2>
            <div className="space-y-6">
              {company.rounds.map((round, index) => (
                <div key={round.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{round.name}</h3>
                        <p className="text-sm text-gray-600">{round.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(round.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(round.status)}`}>
                        {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{round.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Applied: {round.totalApplied}</span>
                      <span>Selected: {round.selectedStudents.length}</span>
                      {round.totalApplied > 0 && (
                        <span>Success Rate: {((round.selectedStudents.length / round.totalApplied) * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>

                  {round.selectedStudents.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Selected Students</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {round.selectedStudents.slice(0, 6).map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {getInitials(student.name)}
                            </div>
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-gray-600">{student.rollNumber}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {round.selectedStudents.length > 6 && (
                        <button
                          onClick={() => setSelectedRound(round)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          View all {round.selectedStudents.length} students →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StudentModal
        isOpen={!!selectedRound}
        onClose={() => setSelectedRound(null)}
        round={selectedRound}
        companyName={company.name}
      />
    </div>
  );
};

export default CompanyDetails;