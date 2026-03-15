import React, { useState } from 'react';
import { Building2, Plus, Trash2, X } from 'lucide-react';
import { CompanyOnboarding } from '../types';

const INDUSTRY_OPTIONS = [
  'Information Technology',
  'Software Development',
  'Consulting',
  'Banking and Finance',
  'Manufacturing',
  'Healthcare',
  'Education',
  'E-commerce',
  'Telecommunications',
  'Automotive',
  'Other',
];

const toDateTimeLocalValue = (date: Date) => {
  const next = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return next.toISOString().slice(0, 16);
};

interface CompanyOnboardingFormProps {
  onClose: () => void;
  onSubmit: (company: CompanyOnboarding) => Promise<void> | void;
}

const initialState: CompanyOnboarding = {
  name: '',
  logo: '',
  description: '',
  industry: '',
  location: '',
  packageOffered: '',
  totalPositions: 1,
  requirements: [''],
  applicationDeadline: '',
  rounds: [{ name: '', description: '', date: '' }],
  recruiterEmail: '',
  recruiterName: '',
  eligibilityCriteria: {
    minCGPA: '',
    minTenthPercentage: '',
    minTwelfthPercentage: '',
    backlogCriteria: 'na',
  },
};

const CompanyOnboardingForm: React.FC<CompanyOnboardingFormProps> = ({
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CompanyOnboarding>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minimumDeadline = toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'totalPositions' ? Number(value) : value,
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData((current) => ({
      ...current,
      requirements: current.requirements.map((entry, currentIndex) =>
        currentIndex === index ? value : entry
      ),
    }));
  };

  const updateRound = (index: number, field: string, value: string) => {
    setFormData((current) => ({
      ...current,
      rounds: current.rounds.map((round, currentIndex) =>
        currentIndex === index ? { ...round, [field]: value } : round
      ),
    }));
  };

  const updateEligibility = (
    field: keyof CompanyOnboarding['eligibilityCriteria'],
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      eligibilityCriteria: {
        ...current.eligibilityCriteria,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        requirements: formData.requirements.filter(Boolean),
        rounds: formData.rounds.filter((round) => round.name && round.date),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Onboard company</h2>
            <p className="text-sm text-slate-500">
              Create a company profile and assign recruiter ownership.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Company name" name="name" value={formData.name} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              required
            >
              <option value="">Select industry</option>
              {INDUSTRY_OPTIONS.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          <Field label="Location" name="location" value={formData.location} onChange={handleChange} required />
          <Field label="Package offered" name="packageOffered" value={formData.packageOffered} onChange={handleChange} required />
          <Field label="Total positions" name="totalPositions" type="number" value={String(formData.totalPositions)} onChange={handleChange} required />
          <Field
            label="Application deadline"
            name="applicationDeadline"
            type="datetime-local"
            value={formData.applicationDeadline}
            onChange={handleChange}
            required
            min={minimumDeadline}
          />
          <Field label="Recruiter name" name="recruiterName" value={formData.recruiterName} onChange={handleChange} required />
          <Field label="Recruiter email" name="recruiterEmail" type="email" value={formData.recruiterEmail} onChange={handleChange} required />
          <Field label="Logo URL" name="logo" value={formData.logo} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            required
          />
        </div>

        <section className="rounded-3xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900">Eligibility criteria</h3>
            <p className="text-sm text-slate-500 mt-1">
              Use NA when a company does not want to enforce a specific criterion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Minimum college CGPA"
              type="number"
              value={formData.eligibilityCriteria.minCGPA}
              onChange={(event) => updateEligibility('minCGPA', event.target.value)}
              placeholder="NA"
              step="0.01"
            />
            <Field
              label="Minimum 10th percentage"
              type="number"
              value={formData.eligibilityCriteria.minTenthPercentage}
              onChange={(event) => updateEligibility('minTenthPercentage', event.target.value)}
              placeholder="NA"
              step="0.01"
            />
            <Field
              label="Minimum 12th percentage"
              type="number"
              value={formData.eligibilityCriteria.minTwelfthPercentage}
              onChange={(event) => updateEligibility('minTwelfthPercentage', event.target.value)}
              placeholder="NA"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Backlogs
              </label>
              <select
                value={formData.eligibilityCriteria.backlogCriteria}
                onChange={(event) =>
                  updateEligibility(
                    'backlogCriteria',
                    event.target.value as CompanyOnboarding['eligibilityCriteria']['backlogCriteria']
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="na">NA</option>
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not allowed</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Requirements</h3>
              <p className="text-sm text-slate-500">Add screening requirements for the role.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  requirements: [...current.requirements, ''],
                }))
              }
              className="inline-flex items-center gap-2 text-sm text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex gap-3">
                <input
                  value={requirement}
                  onChange={(event) => updateRequirement(index, event.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Requirement"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        requirements: current.requirements.filter((_, currentIndex) => currentIndex !== index),
                      }))
                    }
                    className="w-11 h-11 rounded-2xl border border-red-200 text-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Recruitment rounds</h3>
              <p className="text-sm text-slate-500">Define the company hiring stages.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((current) => ({
                  ...current,
                  rounds: [...current.rounds, { name: '', description: '', date: '' }],
                }))
              }
              className="inline-flex items-center gap-2 text-sm text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-4">
            {formData.rounds.map((round, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Round {index + 1}</span>
                  {formData.rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          rounds: current.rounds.filter((_, currentIndex) => currentIndex !== index),
                        }))
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field
                    label="Round name"
                    value={round.name}
                    onChange={(event) => updateRound(index, 'name', event.target.value)}
                  />
                  <Field
                    label="Date"
                    type="date"
                    value={round.date}
                    onChange={(event) => updateRound(index, 'date', event.target.value)}
                  />
                </div>
                <textarea
                  value={round.description}
                  onChange={(event) => updateRound(index, 'description', event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Describe the round"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create company'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface FieldProps {
  label: string;
  name?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  min?: string;
  placeholder?: string;
  step?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  placeholder,
  step,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      min={min}
      placeholder={placeholder}
      step={step}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
      required={required}
    />
  </div>
);

export default CompanyOnboardingForm;
