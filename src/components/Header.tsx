import React from 'react';
import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userRole?: 'student' | 'admin' | 'recruiter';
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, userRole = 'student' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'admin-dashboard', label: 'Dashboard' },
          { id: 'companies', label: 'Companies' },
          { id: 'off-campus', label: 'Off-Campus' },
          { id: 'my-applications', label: 'Applications' },
        ];
      case 'recruiter':
        return [
          { id: 'recruiter-dashboard', label: 'Dashboard' },
          { id: 'companies', label: 'Companies' },
          { id: 'my-applications', label: 'Applications' },
        ];
      default: // student
        return [
          { id: 'companies', label: 'Companies' },
          { id: 'off-campus', label: 'Off-Campus' },
          { id: 'my-applications', label: 'My Applications' },
          { id: 'profile', label: 'Profile' },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900">
                College Recruitment
                {userRole === 'admin' && <span className="text-sm text-blue-600 ml-2">(Admin)</span>}
                {userRole === 'recruiter' && <span className="text-sm text-green-600 ml-2">(Recruiter)</span>}
              </h1>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-semibold text-gray-900">CR Portal</h1>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden sm:flex space-x-8">
            {navigationItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    onViewChange(id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                    currentView === id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;