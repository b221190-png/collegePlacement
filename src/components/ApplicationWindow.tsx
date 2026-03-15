import React, { useMemo, useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface CompanyOption {
  id: string;
  name: string;
}

interface ApplicationWindowProps {
  onClose: () => void;
  companies: CompanyOption[];
  onSubmit: (payload: {
    companyId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minCGPA?: number;
    branches: string[];
    maxBacklogs?: number;
  }) => Promise<void> | void;
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

const toDateInputValue = (date: Date) => {
  const next = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return next.toISOString().slice(0, 10);
};

const ApplicationWindow: React.FC<ApplicationWindowProps> = ({
  onClose,
  companies,
  onSubmit,
}) => {
  const minimumStartDate = toDateInputValue(new Date());
  const [selectedCompany, setSelectedCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [minCGPA, setMinCGPA] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCompanyName = useMemo(
    () => companies.find((company) => company.id === selectedCompany)?.name,
    [companies, selectedCompany]
  );

  const toggleBranch = (branch: string) => {
    setBranches((current) =>
      current.includes(branch)
        ? current.filter((entry) => entry !== branch)
        : [...current, branch]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        companyId: selectedCompany,
        startDate,
        endDate,
        startTime,
        endTime,
        minCGPA: minCGPA ? Number(minCGPA) : undefined,
        branches,
        maxBacklogs: maxBacklogs ? Number(maxBacklogs) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Application window</h2>
            <p className="text-sm text-slate-500">
              Configure company application dates and eligibility criteria.
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            required
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Start date"
            type="date"
            value={startDate}
            onChange={setStartDate}
            min={minimumStartDate}
            required
          />
          <Field
            label="End date"
            type="date"
            value={endDate}
            onChange={setEndDate}
            min={startDate || minimumStartDate}
            required
          />
          <Field label="Start time" type="time" value={startTime} onChange={setStartTime} required />
          <Field label="End time" type="time" value={endTime} onChange={setEndTime} required />
          <Field label="Minimum CGPA" type="number" value={minCGPA} onChange={setMinCGPA} />
          <Field label="Maximum backlogs" type="number" value={maxBacklogs} onChange={setMaxBacklogs} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Eligible branches
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BRANCHES.map((branch) => (
              <label
                key={branch}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={branches.includes(branch)}
                  onChange={() => toggleBranch(branch)}
                  className="rounded border-slate-300"
                />
                <span>{branch}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedCompanyName && startDate && endDate && (
          <div className="rounded-3xl bg-purple-50 border border-purple-200 p-4 text-sm text-purple-800">
            <div className="font-medium">{selectedCompanyName}</div>
            <div className="mt-1">
              {startDate} {startTime} to {endDate} {endTime}
            </div>
            {minCGPA && <div className="mt-1">Minimum CGPA: {minCGPA}</div>}
          </div>
        )}

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
            className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save window'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  min,
  required = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
      required={required}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
    />
  </div>
);

export default ApplicationWindow;
