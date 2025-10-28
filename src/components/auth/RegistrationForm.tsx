import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, GraduationCap, Shield, Building, Sparkles, Phone, Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'recruiter' | 'student';
  // Student specific fields
  rollNumber: string;
  branch: string;
  cgpa: string;
  phone: string;
  batch: string;
  skills: string;
}

interface RegistrationFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  defaultRole?: 'admin' | 'recruiter' | 'student';
  showRoleSelection?: boolean;
}

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics and Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Other'
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onClose,
  defaultRole = 'student',
  showRoleSelection = true
}) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    rollNumber: '',
    branch: '',
    cgpa: '',
    phone: '',
    batch: '',
    skills: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Student-specific validations
    if (formData.role === 'student') {
      if (!formData.rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required';
      }
      if (!formData.branch) {
        newErrors.branch = 'Branch is required';
      }
      if (!formData.cgpa) {
        newErrors.cgpa = 'CGPA is required';
      } else if (parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 10) {
        newErrors.cgpa = 'CGPA must be between 0 and 10';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9]{10}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!formData.batch) {
        newErrors.batch = 'Batch year is required';
      } else if (parseInt(formData.batch) < 2000 || parseInt(formData.batch) > 2030) {
        newErrors.batch = 'Please enter a valid batch year';
      }
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

    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    // Add student data if role is student
    if (formData.role === 'student') {
      (submitData as any).studentData = {
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        branch: formData.branch,
        cgpa: parseFloat(formData.cgpa),
        phone: formData.phone,
        batch: parseInt(formData.batch),
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [],
      };
    }

    await register(submitData);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof RegistrationFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      skills: value,
    }));

    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: undefined }));
    }
  };

  const getRoleConfig = () => {
    switch (formData.role) {
      case 'admin':
        return {
          icon: Shield,
          title: 'Administrator Registration',
          subtitle: 'Create administrative account',
          gradient: 'from-emerald-600 to-teal-700',
          bgGradient: 'from-emerald-50 via-teal-50 to-blue-50',
          accentColor: 'emerald'
        };
      case 'recruiter':
        return {
          icon: Building,
          title: 'Recruiter Registration',
          subtitle: 'Join as corporate recruiter',
          gradient: 'from-purple-600 to-indigo-700',
          bgGradient: 'from-purple-50 via-indigo-50 to-blue-50',
          accentColor: 'purple'
        };
      default:
        return {
          icon: GraduationCap,
          title: 'Student Registration',
          subtitle: 'Join the placement platform',
          gradient: 'from-blue-600 to-indigo-700',
          bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
          accentColor: 'blue'
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
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/15 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-2xl">
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 max-h-[90vh] overflow-y-auto relative">
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
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className={`w-12 h-1 bg-gradient-to-r ${config.gradient} rounded-full`}></div>
              <Sparkles className="w-4 h-4 text-gray-400" />
              <div className={`w-12 h-1 bg-gradient-to-l ${config.gradient} rounded-full`}></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-800">Registration Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            {showRoleSelection && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Account Type
                </label>
                <div className="relative group">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 appearance-none cursor-pointer"
                  >
                    <option value="student">🎓 Student</option>
                    <option value="recruiter">🏢 Corporate Recruiter</option>
                    <option value="admin">🛡️ Administrator</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your complete name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-600 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

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
                    className={`block w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your institutional email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-12 pr-12 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Create secure password"
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

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-12 pr-12 py-4 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                        errors.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Student-Specific Fields */}
            {formData.role === 'student' && (
              <div className="space-y-6 border-t border-gray-200/50 pt-6">
                <div className="flex items-center space-x-2 text-gray-700">
                  <GraduationCap className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Academic Information</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Roll Number */}
                  <div className="space-y-2">
                    <label htmlFor="rollNumber" className="block text-sm font-semibold text-gray-700">
                      Student Roll Number
                    </label>
                    <input
                      id="rollNumber"
                      name="rollNumber"
                      type="text"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      className={`block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                        errors.rollNumber 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="e.g., CS2024001"
                    />
                    {errors.rollNumber && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.rollNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <label htmlFor="branch" className="block text-sm font-semibold text-gray-700">
                      Academic Branch
                    </label>
                    <div className="relative group">
                      <select
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className={`block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 appearance-none cursor-pointer ${
                          errors.branch 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <option value="">Select your branch</option>
                        {branches.map(branch => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.branch && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.branch}</span>
                      </p>
                    )}
                  </div>

                  {/* CGPA */}
                  <div className="space-y-2">
                    <label htmlFor="cgpa" className="block text-sm font-semibold text-gray-700">
                      CGPA
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Award className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="cgpa"
                        name="cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formData.cgpa}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                          errors.cgpa 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="8.50"
                      />
                    </div>
                    {errors.cgpa && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.cgpa}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                          errors.phone 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Batch */}
                  <div className="space-y-2">
                    <label htmlFor="batch" className="block text-sm font-semibold text-gray-700">
                      Graduation Year
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="batch"
                        name="batch"
                        type="number"
                        min="2000"
                        max="2030"
                        value={formData.batch}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                          errors.batch 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="2024"
                      />
                    </div>
                    {errors.batch && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.batch}</span>
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="skills" className="block text-sm font-semibold text-gray-700">
                      Technical Skills
                      <span className="text-gray-500 font-normal text-xs ml-2">(comma-separated)</span>
                    </label>
                    <input
                      id="skills"
                      name="skills"
                      type="text"
                      value={formData.skills}
                      onChange={handleSkillsChange}
                      className={`block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/80 ${
                        errors.skills 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="JavaScript, React, Node.js, Python, SQL"
                    />
                    {errors.skills && (
                      <p className="text-red-600 text-sm flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.skills}</span>
                      </p>
                    )}
                    <p className="text-gray-500 text-xs">
                      Enter your technical skills separated by commas. This helps recruiters find you for relevant opportunities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r ${config.gradient} hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account Securely</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onClose}
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            🔒 Your information is secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
