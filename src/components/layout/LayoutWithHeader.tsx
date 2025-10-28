import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header';

interface LayoutWithHeaderProps {
  children: React.ReactNode;
}

export const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = ({ children }) => {
  const location = useLocation();

  // Determine the current view from the pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/admin') return 'admin-dashboard';
    if (path === '/student') return 'companies';
    if (path === '/recruiter') return 'recruiter-dashboard';
    return 'companies'; // default
  };

  // Determine user role from pathname
  const getUserRole = () => {
    const path = location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/recruiter') return 'recruiter';
    return 'student';
  };

  const handleViewChange = (view: string) => {
    // This would need to be connected to your existing view management
    // For now, we'll keep it simple since we're using React Router
    console.log('View change requested:', view);
  };

  return (
    <>
      <Header
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
        userRole={getUserRole()}
      />
      <main>
        {children}
      </main>
    </>
  );
};