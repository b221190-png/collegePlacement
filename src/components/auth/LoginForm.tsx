import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  fixedEmail?: string;
  prefillEmail?: string;
  prefillPassword?: string;
  role?: 'admin' | 'student' | 'recruiter';
}

const ROLE_CONFIG = {
  admin: {
    icon: Shield,
    title: 'Admin sign in',
    subtitle: 'Access administrative controls for the placement management system.',
    accent: 'from-emerald-600 to-teal-700',
  },
  student: {
    icon: GraduationCap,
    title: 'Student sign in',
    subtitle: 'Browse companies, submit applications, and track your progress.',
    accent: 'from-blue-600 to-indigo-700',
  },
  recruiter: {
    icon: Building2,
    title: 'Recruiter sign in',
    subtitle: 'Review applications, score candidates, and update hiring statuses.',
    accent: 'from-slate-700 to-slate-900',
  },
} as const;

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onClose,
  fixedEmail,
  prefillEmail,
  prefillPassword,
  role = 'student',
}) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    email: fixedEmail || prefillEmail || '',
    password: prefillPassword || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const validateForm = () => {
    const nextErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      onSuccess?.();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.accent} flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{config.title}</h2>
          <p className="text-sm text-slate-600">{config.subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              readOnly={Boolean(fixedEmail)}
              className={`w-full rounded-2xl border bg-white pl-11 pr-4 py-3 outline-none transition-colors ${
                errors.email
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-slate-200 focus:border-slate-900'
              } ${fixedEmail ? 'text-slate-500 bg-slate-50' : ''}`}
              placeholder="you@college.edu"
            />
          </div>
          {errors.email && <p className="text-sm text-red-600 mt-2">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className={`w-full rounded-2xl border bg-white pl-11 pr-11 py-3 outline-none transition-colors ${
                errors.password
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-slate-200 focus:border-slate-900'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-2">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-2xl bg-gradient-to-r ${config.accent} text-white font-semibold py-3 shadow-lg disabled:opacity-60`}
        >
          {isLoading ? 'Signing in...' : 'Continue'}
        </button>
      </form>

      {role === 'student' && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Create a student account
        </button>
      )}
    </div>
  );
};

export default LoginForm;
