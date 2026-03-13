import React, { useState } from 'react';
import { AlertCircle, GraduationCap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface RegistrationFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'recruiter' | 'student';
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

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics and Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onClose,
  defaultRole = 'student',
  showRoleSelection = true,
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
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const validateForm = () => {
    const nextErrors: Partial<RegistrationFormData> = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (!formData.password.trim()) nextErrors.password = 'Password is required';
    if (formData.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'student') {
      if (!formData.rollNumber.trim()) nextErrors.rollNumber = 'Roll number is required';
      if (!formData.branch) nextErrors.branch = 'Branch is required';
      if (!formData.cgpa) nextErrors.cgpa = 'CGPA is required';
      if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
      if (!formData.batch.trim()) nextErrors.batch = 'Batch year is required';
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

    const payload: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === 'student') {
      payload.studentData = {
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        branch: formData.branch,
        cgpa: Number(formData.cgpa),
        phone: formData.phone.trim(),
        batch: Number(formData.batch),
        skills: formData.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      };
    }

    const success = await register(payload);
    if (success) {
      onSuccess?.();
    }
  };

  const updateField = (name: keyof RegistrationFormData, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Create student account</h2>
          <p className="text-sm text-slate-600">
            New accounts are stored locally and become available across refreshes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {showRoleSelection && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account type
            </label>
            <select
              value={formData.role}
              onChange={(event) => updateField('role', event.target.value as RegistrationFormData['role'])}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="student">Student</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Full name"
            value={formData.name}
            onChange={(value) => updateField('name', value)}
            error={errors.name}
          />
          <Field
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateField('email', value)}
            error={errors.email}
          />
          <Field
            label="Password"
            type="password"
            value={formData.password}
            onChange={(value) => updateField('password', value)}
            error={errors.password}
          />
          <Field
            label="Confirm password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) => updateField('confirmPassword', value)}
            error={errors.confirmPassword}
          />
        </div>

        {formData.role === 'student' && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Academic profile</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Roll number"
                value={formData.rollNumber}
                onChange={(value) => updateField('rollNumber', value)}
                error={errors.rollNumber}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Branch
                </label>
                <select
                  value={formData.branch}
                  onChange={(event) => updateField('branch', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                {errors.branch && <p className="text-sm text-red-600 mt-2">{errors.branch}</p>}
              </div>
              <Field
                label="CGPA"
                type="number"
                value={formData.cgpa}
                onChange={(value) => updateField('cgpa', value)}
                error={errors.cgpa}
              />
              <Field
                label="Phone"
                value={formData.phone}
                onChange={(value) => updateField('phone', value)}
                error={errors.phone}
              />
              <Field
                label="Batch year"
                value={formData.batch}
                onChange={(value) => updateField('batch', value)}
                error={errors.batch}
              />
              <Field
                label="Skills"
                value={formData.skills}
                onChange={(value) => updateField('skills', value)}
                helper="Comma-separated"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 shadow-lg disabled:opacity-60"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to login
        </button>
      )}
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  type?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  error,
  helper,
  type = 'text',
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${
        error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'
      }`}
    />
    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    {!error && helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
  </div>
);

export default RegistrationForm;
