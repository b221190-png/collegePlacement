import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Globe,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../utils/apiConfig';

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
  initialView?: 'login' | 'forgot' | 'reset' | 'force-reset';
  initialResetToken?: string;
  initialExternalError?: string;
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
  initialView = 'login',
  initialResetToken = '',
  initialExternalError = '',
}) => {
  const {
    user,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    isLoading,
    error,
    clearError,
  } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    email: fixedEmail || prefillEmail || '',
    password: prefillPassword || '',
  });
  const [forgotEmail, setForgotEmail] = useState(fixedEmail || prefillEmail || '');
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [view, setView] = useState<'login' | 'forgot' | 'reset' | 'force-reset'>(initialView);
  const [successMessage, setSuccessMessage] = useState('');
  const [externalError, setExternalError] = useState(initialExternalError);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [temporaryPasswordHint, setTemporaryPasswordHint] = useState('');

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  useEffect(() => {
    if (!user?.mustChangePassword) {
      setView(initialView);
    }
  }, [initialView, user?.mustChangePassword]);

  useEffect(() => {
    setResetToken(initialResetToken);
  }, [initialResetToken]);

  useEffect(() => {
    setExternalError(initialExternalError);
  }, [initialExternalError]);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setView('force-reset');
      setSuccessMessage('Temporary password verified. Set a new password to continue.');
      setTemporaryPasswordHint('');
      setFormData((current) => ({
        ...current,
        email: user.email || current.email,
      }));
    }
  }, [user]);

  const handleGoogleSignIn = () => {
    clearError();
    setSuccessMessage('');
    setExternalError('');

    const googleStartUrl = new URL(`${API_BASE_URL}/auth/google/start`);
    googleStartUrl.searchParams.set('role', role);
    googleStartUrl.searchParams.set('frontendOrigin', window.location.origin);
    window.location.assign(googleStartUrl.toString());
  };

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
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      if (result.mustChangePassword) {
        setNewPassword('');
        setConfirmNewPassword('');
        setView('force-reset');
        setSuccessMessage('Temporary password verified. Set a new password to continue.');
        return;
      }
      onSuccess?.();
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!forgotEmail.trim()) {
      setSuccessMessage('Email is required');
      return;
    }

    const result = await forgotPassword(forgotEmail.trim());
    if (result.success) {
      setSuccessMessage(
        result.message ||
          'A temporary password has been sent to your email. Sign in with it and then set a new password.'
      );
      setTemporaryPasswordHint(
        result.temporaryPassword
          ? `Temporary password: ${result.temporaryPassword}${
              result.previewUrl ? ` · Preview: ${result.previewUrl}` : ''
            }${result.emailError ? ` · Email issue: ${result.emailError}` : ''}`
          : result.previewUrl
            ? `Email preview: ${result.previewUrl}`
            : ''
      );
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!resetToken.trim()) {
      setSuccessMessage('Reset token is required');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      setSuccessMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSuccessMessage('Passwords do not match');
      return;
    }

    const success = await resetPassword(resetToken.trim(), newPassword);
    if (success) {
      setSuccessMessage('Password reset successful. You can now continue.');
      onSuccess?.();
    }
  };

  const handleForcedPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!newPassword.trim() || newPassword.length < 6) {
      setSuccessMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSuccessMessage('Passwords do not match');
      return;
    }

    const success = await changePassword(newPassword);
    if (success) {
      setSuccessMessage('Password updated successfully. Redirecting to your portal.');
      onSuccess?.();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.accent} flex items-center justify-center text-white`}>
          {view === 'reset' ? <KeyRound className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {view === 'login'
              ? config.title
              : view === 'forgot'
                ? 'Forgot password'
                : view === 'reset'
                  ? 'Reset password'
                  : 'Set a new password'}
          </h2>
          <p className="text-sm text-slate-600">
            {view === 'login'
              ? config.subtitle
              : view === 'forgot'
                ? 'Enter your account email to receive a temporary password on email.'
                : view === 'reset'
                  ? 'Use reset token and set your new password.'
                  : 'Use your temporary password once, then create a permanent password to continue.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {externalError && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{externalError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {temporaryPasswordHint && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 break-words">
          {temporaryPasswordHint}
        </div>
      )}

      {view === 'login' && (
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
            type="button"
            onClick={() => {
              clearError();
              setSuccessMessage('');
              setTemporaryPasswordHint('');
              setForgotEmail(formData.email || fixedEmail || prefillEmail || '');
              setView('forgot');
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl bg-gradient-to-r ${config.accent} text-white font-semibold py-3 shadow-lg disabled:opacity-60`}
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-800 shadow-sm disabled:opacity-60 flex items-center justify-center gap-3"
          >
            <Globe className="w-4 h-4" />
            Continue with Google
          </button>
        </form>
      )}

      {view === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                placeholder="you@college.edu"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl bg-gradient-to-r ${config.accent} text-white font-semibold py-3 shadow-lg disabled:opacity-60`}
          >
            {isLoading ? 'Sending...' : 'Send temporary password'}
          </button>

          <div className="flex items-center text-sm">
            <button
              type="button"
              onClick={() => {
                clearError();
                setSuccessMessage('');
                setTemporaryPasswordHint('');
                setView('login');
              }}
              className="text-slate-600 hover:text-slate-900"
            >
              Back to login
            </button>
          </div>
        </form>
      )}

      {view === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reset token
            </label>
            <input
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Paste reset token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl bg-gradient-to-r ${config.accent} text-white font-semibold py-3 shadow-lg disabled:opacity-60`}
          >
            {isLoading ? 'Updating...' : 'Reset password'}
          </button>

          <button
            type="button"
            onClick={() => {
              clearError();
              setSuccessMessage('');
              setTemporaryPasswordHint('');
              setView('forgot');
            }}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back
          </button>
        </form>
      )}

      {view === 'force-reset' && (
        <form onSubmit={handleForcedPasswordChange} className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This account is using a temporary password. Set a new password before continuing.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl bg-gradient-to-r ${config.accent} text-white font-semibold py-3 shadow-lg disabled:opacity-60`}
          >
            {isLoading ? 'Saving...' : 'Set new password'}
          </button>
        </form>
      )}

      {view !== 'force-reset' && role === 'student' && onClose && (
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
