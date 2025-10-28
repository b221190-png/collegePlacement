import React, { useState } from 'react';
import { UserPlus, User, ArrowLeft } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';

interface AuthWrapperProps {
  onSuccess?: () => void;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);

  // Fixed admin email as requested
  const fixedAdminEmail = 'admin@collegeplacement.com';

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
  };

  const handleRoleChange = (role: 'admin' | 'student') => {
    setUserRole(role);
    setIsLogin(true); // Always start with login mode when switching roles
  };

  const handleBackToRoleSelection = () => {
    setIsLogin(true);
    setUserRole('student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Role Selection Header */}
        {!userRole && (
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome to College Placement Portal</h2>
            <p className="text-gray-600 mb-8">Please select your role to continue</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleChange('student')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Student</h3>
                  <p className="text-sm text-gray-600">Apply for placements and track opportunities</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleChange('admin')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrator</h3>
                  <p className="text-sm text-gray-600">Manage placements and student data</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Admin Login (Fixed Email) */}
        {userRole === 'admin' && isLogin && (
          <div>
            <div className="text-center mb-6">
              <button
                onClick={handleBackToRoleSelection}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Role Selection
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Administrator Login</h2>
              <p className="text-gray-600 mt-2">Sign in to admin dashboard</p>
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-700">
                  <strong>Admin Email:</strong> {fixedAdminEmail}
                </p>
                <p className="text-xs text-indigo-600 mt-1">Use your admin password to login</p>
              </div>
            </div>
            <LoginForm
              onSuccess={onSuccess}
              onClose={handleBackToRoleSelection}
              fixedEmail={fixedAdminEmail}
              role="admin"
            />
          </div>
        )}

        {/* Student Login */}
        {userRole === 'student' && isLogin && (
          <div>
            <div className="text-center mb-6">
              <button
                onClick={handleBackToRoleSelection}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Role Selection
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Student Login</h2>
              <p className="text-gray-600 mt-2">Sign in to your placement account</p>
            </div>
            <LoginForm
              onSuccess={onSuccess}
              onClose={handleBackToRoleSelection}
              role="student"
            />
          </div>
        )}

        {/* Student Registration */}
        {userRole === 'student' && !isLogin && (
          <div>
            <div className="text-center mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Student Registration</h2>
              <p className="text-gray-600 mt-2">Create your placement account</p>
            </div>
            <RegistrationForm
              onSuccess={onSuccess}
              onClose={() => setIsLogin(true)}
              defaultRole="student"
              showRoleSelection={false}
            />
          </div>
        )}

        {/* Role Switcher for Login Mode */}
        {userRole && isLogin && (
          <div className="text-center mt-6 pt-6 border-t">
            <div className="flex justify-center space-x-4 text-sm">
              <button
                onClick={() => handleRoleChange(userRole === 'admin' ? 'student' : 'admin')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Switch to {userRole === 'admin' ? 'Student' : 'Admin'} Login
              </button>
              {userRole === 'student' && (
                <>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={handleSwitchMode}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Create Student Account
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthWrapper;