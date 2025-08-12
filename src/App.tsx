import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MyApplications from './components/MyApplications';
import OffCampusOpportunities from './components/OffCampusOpportunities';
import CompanyDetails from './components/CompanyDetails';
import ApplicationForm from './components/ApplicationForm';
import AdminDashboard from './components/AdminDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import { Company, ApplicationForm as ApplicationFormType, User } from './types';

type View = 'companies' | 'off-campus' | 'my-applications' | 'profile' | 'company-details' | 'application-form' | 'admin-dashboard' | 'recruiter-dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Mock user - in real app this would come from authentication
  const [currentUser] = useState<User>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@college.edu',
    role: 'admin', // Change to 'admin' or 'recruiter' to test different roles
  });

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('company-details');
  };

  const handleApplyClick = (company: Company) => {
    setSelectedCompany(company);
    setCurrentView('application-form');
  };

  const handleBackToDashboard = () => {
    setCurrentView('companies');
    setSelectedCompany(null);
  };

  const handleBackToCompanyDetails = () => {
    setCurrentView('company-details');
  };

  const handleApplicationSubmit = (formData: ApplicationFormType) => {
    // Here you would typically submit the form data to your backend
    console.log('Application submitted:', formData);
    alert('Application submitted successfully!');
    setCurrentView('companies');
    setSelectedCompany(null);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as View);
    setSelectedCompany(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={handleViewChange}
        userRole={currentUser.role}
      />
      
      <main className="py-8">
        {/* Student Views */}
        {currentView === 'companies' && (
          <Dashboard
            onCompanySelect={handleCompanySelect}
            onApplyClick={handleApplyClick}
          />
        )}

        {currentView === 'off-campus' && (
          <OffCampusOpportunities />
        )}

        {currentView === 'my-applications' && (
          <MyApplications />
        )}

        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
              <p className="text-gray-600">Profile page coming soon...</p>
            </div>
          </div>
        )}
        
        {currentView === 'company-details' && selectedCompany && (
          <CompanyDetails
            company={selectedCompany}
            onBack={handleBackToDashboard}
          />
        )}
        
        {currentView === 'application-form' && selectedCompany && (
          <ApplicationForm
            company={selectedCompany}
            onBack={handleBackToCompanyDetails}
            onSubmit={handleApplicationSubmit}
          />
        )}

        {/* Admin Views */}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard />
        )}

        {/* Recruiter Views */}
        {currentView === 'recruiter-dashboard' && (
          <RecruiterDashboard />
        )}
      </main>
    </div>
  );
}

export default App;