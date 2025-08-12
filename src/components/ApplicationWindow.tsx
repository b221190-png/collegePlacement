import React, { useState } from 'react';
import { X, Calendar, Clock, Building2, Users } from 'lucide-react';

interface ApplicationWindowProps {
  onClose: () => void;
}

const ApplicationWindow: React.FC<ApplicationWindowProps> = ({ onClose }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState({
    minCGPA: '',
    branches: [] as string[],
    maxBacklogs: '',
  });

  const companies = [
    { id: '1', name: 'Google' },
    { id: '2', name: 'Microsoft' },
    { id: '3', name: 'Amazon' },
    { id: '4', name: 'Juspay' },
  ];

  const branches = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
  ];

  const handleBranchChange = (branch: string) => {
    setEligibilityCriteria(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Application window settings:', {
      selectedCompany,
      startDate,
      endDate,
      startTime,
      endTime,
      eligibilityCriteria,
    });
    alert('Application window configured successfully!');
    onClose();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Set Application Window</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Company Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Company *</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Choose a company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>

        {/* Date and Time Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Criteria</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={eligibilityCriteria.minCGPA}
                onChange={(e) => setEligibilityCriteria(prev => ({ ...prev, minCGPA: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 7.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Backlogs</label>
              <input
                type="number"
                min="0"
                value={eligibilityCriteria.maxBacklogs}
                onChange={(e) => setEligibilityCriteria(prev => ({ ...prev, maxBacklogs: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Branches</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {branches.map(branch => (
                <label key={branch} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={eligibilityCriteria.branches.includes(branch)}
                    onChange={() => handleBranchChange(branch)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{branch}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        {selectedCompany && startDate && endDate && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Preview</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <div>Company: {companies.find(c => c.id === selectedCompany)?.name}</div>
              <div>Period: {startDate} to {endDate}</div>
              <div>Time: {startTime} to {endTime}</div>
              {eligibilityCriteria.minCGPA && <div>Min CGPA: {eligibilityCriteria.minCGPA}</div>}
              {eligibilityCriteria.branches.length > 0 && (
                <div>Branches: {eligibilityCriteria.branches.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Set Application Window
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationWindow;