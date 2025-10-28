import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LayoutWithHeader } from './components/layout/LayoutWithHeader';
import AdminDashboard from './components/AdminDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TestAuth } from './components/test/TestAuth';
import { useAuthStore } from './store/authStore';
import { initializeAuth } from './store/authStore';

function App() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth();
  }, []);

  const handleAuthSuccess = () => {
    // This will be handled by the ProtectedRoute component
    // The user state will be updated in the store
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Authentication Route */}
          <Route
            path="/auth"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthWrapper onSuccess={handleAuthSuccess} />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <LayoutWithHeader>
                  <AdminDashboard />
                </LayoutWithHeader>
              </ProtectedRoute>
            }
          />

          {/* Student Dashboard Route */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <LayoutWithHeader>
                  <StudentDashboard />
                </LayoutWithHeader>
              </ProtectedRoute>
            }
          />

          {/* Recruiter Dashboard Route (placeholder for future) */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute requiredRole="recruiter">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Recruiter Dashboard</h1>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Test Route */}
          <Route path="/test-auth" element={<TestAuth />} />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              <Navigate to={user ? `/${user.role}` : '/auth'} replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
