import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { ApplicationForm as ApplicationFormType, Company } from '../types';

interface ApplicationFormProps {
  company: Company;
  onBack: () => void;
  onSubmit: (formData: ApplicationFormType) => void;
  initialData?: Partial<ApplicationFormType>;
}

const EMPTY_FORM: ApplicationFormType = {
  studentName: '',
  rollNumber: '',
  email: '',
  phone: '',
  branch: '',
  cgpa: 0,
  skills: '',
  experience: '',
  whyCompany: '',
  resume: null,
};

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  company,
  onBack,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<ApplicationFormType>({
    ...EMPTY_FORM,
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormType, string>>>({});

  const updateField = (field: keyof ApplicationFormType, value: string | File | null) => {
    setFormData((current) => ({
      ...current,
      [field]: field === 'cgpa' ? Number(value) : value,
    }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ApplicationFormType, string>> = {};

    if (!formData.studentName.trim()) nextErrors.studentName = 'Name is required';
    if (!formData.rollNumber.trim()) nextErrors.rollNumber = 'Roll number is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';
    if (!formData.branch.trim()) nextErrors.branch = 'Branch is required';
    if (!formData.skills.trim()) nextErrors.skills = 'Skills are required';
    if (!formData.whyCompany.trim()) nextErrors.whyCompany = 'Tell the recruiter why you are interested';
    if (!formData.cgpa || formData.cgpa <= 0) nextErrors.cgpa = 'CGPA is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to company details
      </button>

      <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8">
          <div className="flex items-center gap-4">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="w-16 h-16 rounded-2xl object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">Apply to {company.name}</h1>
              <p className="text-emerald-100 mt-1">
                {company.industry} · {company.location}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Full name"
              value={formData.studentName}
              onChange={(value) => updateField('studentName', value)}
              error={errors.studentName}
            />
            <Field
              label="Roll number"
              value={formData.rollNumber}
              onChange={(value) => updateField('rollNumber', value)}
              error={errors.rollNumber}
            />
            <Field
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              error={errors.email}
            />
            <Field
              label="Phone"
              value={formData.phone}
              onChange={(value) => updateField('phone', value)}
              error={errors.phone}
            />
            <Field
              label="Branch"
              value={formData.branch}
              onChange={(value) => updateField('branch', value)}
              error={errors.branch}
            />
            <Field
              label="CGPA"
              type="number"
              value={String(formData.cgpa || '')}
              onChange={(value) => updateField('cgpa', value)}
              error={errors.cgpa}
            />
          </div>

          <TextArea
            label="Skills"
            value={formData.skills}
            onChange={(value) => updateField('skills', value)}
            error={errors.skills}
            rows={3}
          />

          <TextArea
            label="Projects and experience"
            value={formData.experience}
            onChange={(value) => updateField('experience', value)}
            rows={4}
          />

          <TextArea
            label={`Why ${company.name}?`}
            value={formData.whyCompany}
            onChange={(value) => updateField('whyCompany', value)}
            error={errors.whyCompany}
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resume</label>
            <label className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-4 cursor-pointer hover:border-slate-500 transition-colors">
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                {formData.resume ? formData.resume.name : 'Upload resume file'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(event) => updateField('resume', event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold"
            >
              Submit application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}> = ({ label, value, onChange, type = 'text', error }) => (
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
  </div>
);

const TextArea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
}> = ({ label, value, onChange, rows = 4, error }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className={`w-full rounded-2xl border px-4 py-3 outline-none transition-colors ${
        error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'
      }`}
    />
    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
  </div>
);

export default ApplicationForm;
