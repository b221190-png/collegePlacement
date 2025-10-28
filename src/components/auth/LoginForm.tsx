import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  fixedEmail?: string;
  role?: 'admin' | 'student';
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose, fixedEmail, role }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    email: fixedEmail || '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    await login(formData.email, formData.password);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          title: 'Administrator Portal',
          subtitle: 'Access administrative dashboard',
          gradient: 'from-emerald-600 to-teal-700',
          bgGradient: 'from-emerald-50 via-teal-50 to-blue-50'
        };
      default:
        return {
          icon: GraduationCap,
          title: 'Student Portal',
          subtitle: 'Access your placement dashboard',
          gradient: 'from-blue-600 to-indigo-700',
          bgGradient: 'from-blue-50 via-indigo-50 to-purple-50'
        };
    }
  };

  const config = getRoleConfig();
  const IconComponent = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 relative">
          {/* Decorative Element */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl shadow-lg flex items-center justify-center transform rotate-45`}>
              <IconComponent className="w-8 h-8 text-white transform -rotate-45" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mt-6 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {config.title}
            </h1>
            <p className="text-gray-600 font-medium">{config.subtitle}</p>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800">Authentication Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!!fixedEmail}
                  disabled={!!fixedEmail}
                  className={`block w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${fixedEmail ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                  placeholder={fixedEmail ? "Administrator email (secured)" : "Enter your institutional email"}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </p>
              )}
              {fixedEmail && (
                <p className="text-blue-600 text-sm flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Administrator email is secured for your protection</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-12 pr-12 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter your secure password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="rememberMe" className="ml-3 block text-sm font-medium text-gray-700">
                  Keep me signed in
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r ${config.gradient} hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In Securely</span>
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-sm text-gray-600">
              {role === 'admin' ? (
                <span className="flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure administrator access only</span>
                </span>
              ) : (
                <>
                  New to the platform?{' '}
                  <button
                    onClick={onClose}
                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Create Student Account
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            🔒 Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
