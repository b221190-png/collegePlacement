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
  tenthPercentage: string;
  twelfthPercentage: string;
  backlogs: string;
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

const hasAtMostTwoDecimals = (value: string) => {
  const [, decimalPart = ''] = value.split('.');
  return decimalPart.length <= 2;
};

const isValidNumberInRange = (value: string, min: number, max: number) => {
  const parsedValue = Number(value);
  return value.trim() !== '' && !Number.isNaN(parsedValue) && parsedValue >= min && parsedValue <= max;
};

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
    tenthPercentage: '',
    twelfthPercentage: '',
    backlogs: '0',
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
      if (!formData.cgpa.trim()) {
        nextErrors.cgpa = 'CGPA is required';
      } else if (!isValidNumberInRange(formData.cgpa, 0, 10)) {
        nextErrors.cgpa = 'CGPA must be between 0 and 10';
      } else if (!hasAtMostTwoDecimals(formData.cgpa)) {
        nextErrors.cgpa = 'CGPA can have at most 2 decimal places';
      }

      if (!formData.tenthPercentage.trim()) {
        nextErrors.tenthPercentage = '10th percentage is required';
      } else if (!isValidNumberInRange(formData.tenthPercentage, 0, 100)) {
        nextErrors.tenthPercentage = '10th percentage must be between 0 and 100';
      }

      if (!formData.twelfthPercentage.trim()) {
        nextErrors.twelfthPercentage = '12th percentage is required';
      } else if (!isValidNumberInRange(formData.twelfthPercentage, 0, 100)) {
        nextErrors.twelfthPercentage = '12th percentage must be between 0 and 100';
      }

      if (formData.backlogs.trim() === '') {
        nextErrors.backlogs = 'Backlogs are required';
      } else if (!Number.isInteger(Number(formData.backlogs)) || Number(formData.backlogs) < 0) {
        nextErrors.backlogs = 'Backlogs must be a non-negative whole number';
      }

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
        tenthPercentage: Number(formData.tenthPercentage),
        twelfthPercentage: Number(formData.twelfthPercentage),
        backlogs: Number(formData.backlogs || 0),
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
            Create your student account to access placement opportunities.
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
                min="0"
                max="10"
                step="0.01"
                helper="Enter a value from 0 to 10 with up to 2 decimals"
              />
              <Field
                label="10th percentage"
                type="number"
                value={formData.tenthPercentage}
                onChange={(value) => updateField('tenthPercentage', value)}
                error={errors.tenthPercentage}
                min="0"
                max="100"
                step="0.01"
              />
              <Field
                label="12th percentage"
                type="number"
                value={formData.twelfthPercentage}
                onChange={(value) => updateField('twelfthPercentage', value)}
                error={errors.twelfthPercentage}
                min="0"
                max="100"
                step="0.01"
              />
              <Field
                label="Current backlogs"
                type="number"
                value={formData.backlogs}
                onChange={(value) => updateField('backlogs', value)}
                error={errors.backlogs}
                min="0"
                step="1"
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
  min?: string;
  max?: string;
  step?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  error,
  helper,
  type = 'text',
  min,
  max,
  step,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
      max={max}
      step={step}
      className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${
        error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'
      }`}
    />
    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    {!error && helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
  </div>
);

export default RegistrationForm;
