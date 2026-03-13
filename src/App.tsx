import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import RecruiterDashboard from './components/RecruiterDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TestAuth } from './components/test/TestAuth';
import { initializeAuth, useAuthStore } from './store/authStore';

function App() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void initializeAuth();
  }, []);

  const defaultRoute = user ? `/${user.role}` : '/auth';

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={
            <ProtectedRoute requireAuth={false}>
              <AuthWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/test-auth" element={<TestAuth />} />
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
