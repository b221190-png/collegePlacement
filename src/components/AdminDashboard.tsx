import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  LogOut,
  Plus,
  RotateCcw,
  Upload,
} from 'lucide-react';
import CompanyOnboardingForm from './CompanyOnboardingForm';
import StudentBulkUpload from './StudentBulkUpload';
import ApplicationWindow from './ApplicationWindow';
import { useAuthStore } from '../store/authStore';
import {
  ApplicationRecord,
  CompanyRecord,
  OffCampusRecord,
  StudentRecord,
  getAdminStats,
  usePlacementStore,
} from '../store/placementStore';

type Tab = 'overview' | 'companies' | 'students' | 'applications' | 'offcampus';

const AdminDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const companies = usePlacementStore((state) => state.companies);
  const students = usePlacementStore((state) => state.students);
  const applications = usePlacementStore((state) => state.applications);
  const offCampusOpportunities = usePlacementStore(
    (state) => state.offCampusOpportunities
  );
  const createCompany = usePlacementStore((state) => state.createCompany);
  const configureApplicationWindow = usePlacementStore(
    (state) => state.configureApplicationWindow
  );
  const bulkImportStudents = usePlacementStore((state) => state.bulkImportStudents);
  const createOffCampusOpportunity = usePlacementStore(
    (state) => state.createOffCampusOpportunity
  );
  const resetDemoData = usePlacementStore((state) => state.resetDemoData);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [recruiterCredentials, setRecruiterCredentials] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    description: '',
    skills: '',
    applicationDeadline: '',
    salary: '',
    applicationLink: 'https://example.com/apply',
    industry: 'Technology',
    experience: 'any',
    isRemote: false,
  });

  const stats = useMemo(
    () =>
      getAdminStats({
        users: [],
        students,
        companies,
        applications,
        offCampusOpportunities,
      }),
    [applications, companies, offCampusOpportunities, students]
  );

  const applicationRows = useMemo(
    () =>
      applications.map((application) => ({
        ...application,
        student: students.find((student) => student.id === application.studentId) || null,
        company: companies.find((company) => company.id === application.companyId) || null,
      })),
    [applications, companies, students]
  );

  const handleReset = () => {
    resetDemoData();
    setRecruiterCredentials(null);
    setStatusMessage('Demo data reset to the original local seed.');
  };

  const handleExportStudents = () => {
    const header = [
      'Name',
      'Roll Number',
      'Email',
      'Phone',
      'Branch',
      'CGPA',
      'Batch',
      'Skills',
    ];
    const rows = students.map((student) => [
      student.name,
      student.rollNumber,
      student.email,
      student.phone,
      student.branch,
      String(student.cgpa),
      String(student.batch),
      student.skills.join(' | '),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'students-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateOpportunity = async (event: React.FormEvent) => {
    event.preventDefault();
    createOffCampusOpportunity({
      title: opportunityForm.title,
      company: opportunityForm.company,
      companyLogo:
        'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=100',
      type: opportunityForm.type as OffCampusRecord['type'],
      location: opportunityForm.location,
      isRemote: opportunityForm.isRemote,
      description: opportunityForm.description,
      skills: opportunityForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      requirements: opportunityForm.skills
        .split(',')
        .map((skill) => `Working knowledge of ${skill.trim()}`)
        .filter((value) => value !== 'Working knowledge of '),
      applicationDeadline: opportunityForm.applicationDeadline,
      applicationLink: opportunityForm.applicationLink,
      industry: opportunityForm.industry,
      experience: opportunityForm.experience as OffCampusRecord['experience'],
      salary: opportunityForm.salary || undefined,
    }, user?.id);
    setStatusMessage('Off-campus opportunity created successfully.');
    setShowOpportunityForm(false);
    setOpportunityForm({
      title: '',
      company: '',
      location: '',
      type: 'full-time',
      description: '',
      skills: '',
      applicationDeadline: '',
      salary: '',
      applicationLink: 'https://example.com/apply',
      industry: 'Technology',
      experience: 'any',
      isRemote: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-200/70">
                Admin Workspace
              </p>
              <h1 className="text-3xl font-bold mt-2">College placement control room</h1>
              <p className="text-slate-300 mt-2">
                Create companies, import students, and manage placement operations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset data
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-slate-900 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {(
              [
                ['overview', 'Overview'],
                ['companies', 'Companies'],
                ['students', 'Students'],
                ['applications', 'Applications'],
                ['offcampus', 'Off-campus'],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-slate-950'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {statusMessage && (
          <div className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        {recruiterCredentials && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="font-semibold text-emerald-900">Recruiter account created</div>
            <div className="text-sm text-emerald-800 mt-1">
              {recruiterCredentials.name}: {recruiterCredentials.email} /{' '}
              {recruiterCredentials.password}
            </div>
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard value={stats.totalCompanies} label="Companies" color="text-blue-600" />
          <StatCard value={stats.activeCompanies} label="Open roles" color="text-emerald-600" />
          <StatCard value={stats.totalStudents} label="Students" color="text-violet-600" />
          <StatCard value={stats.totalApplications} label="Applications" color="text-orange-600" />
          <StatCard value={stats.pendingApplications} label="Pending review" color="text-rose-600" />
        </section>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">What works offline</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <FeatureCard
                  icon={<Building2 className="w-5 h-5" />}
                  title="Company onboarding"
                  description="New companies create persistent recruiter accounts with stored credentials."
                />
                <FeatureCard
                  icon={<Upload className="w-5 h-5" />}
                  title="Student imports"
                  description="CSV imports create local student accounts that survive refreshes."
                />
                <FeatureCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Application windows"
                  description="Eligibility rules and windows are stored against each company."
                />
                <FeatureCard
                  icon={<FileText className="w-5 h-5" />}
                  title="Recruiter reviews"
                  description="Scores and status changes update instantly for student and recruiter views."
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Recent companies</h2>
              <div className="space-y-4 mt-5">
                {companies.slice(0, 4).map((company) => (
                  <div key={company.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{company.name}</div>
                        <div className="text-sm text-slate-500">{company.recruiterEmail}</div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                        {company.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Company management</h2>
                <p className="text-sm text-slate-500 mt-1">
                  All company and recruiter records live entirely in the browser.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowWindowForm((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  Set window
                </button>
                <button
                  onClick={() => setShowCompanyForm((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-3 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add company
                </button>
              </div>
            </div>

            {showCompanyForm && (
              <CompanyOnboardingForm
                onClose={() => setShowCompanyForm(false)}
                onSubmit={async (companyData) => {
                  const result = createCompany(companyData);
                  setRecruiterCredentials(result.recruiter);
                  setStatusMessage(`${result.company.name} was added to the local company list.`);
                  setShowCompanyForm(false);
                }}
              />
            )}

            {showWindowForm && (
              <ApplicationWindow
                companies={companies.map((company) => ({
                  id: company.id,
                  name: company.name,
                }))}
                onClose={() => setShowWindowForm(false)}
                onSubmit={async (payload) => {
                  const company = configureApplicationWindow(payload);
                  setStatusMessage(`Application window updated for ${company.name}.`);
                  setShowWindowForm(false);
                }}
              />
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((company) => (
                <CompanyAdminCard
                  key={company.id}
                  company={company}
                  applicationCount={
                    applications.filter((application) => application.companyId === company.id)
                      .length
                  }
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Student registry</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Imported students automatically get local login access with `student123`.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportStudents}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowBulkUpload((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-green-600 text-white px-4 py-3 text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Bulk upload
                </button>
              </div>
            </div>

            {showBulkUpload && (
              <StudentBulkUpload
                onClose={() => setShowBulkUpload(false)}
                onUpload={async (rows) => {
                  const result = bulkImportStudents(rows);
                  setStatusMessage(
                    `Imported ${result.addedCount} students. ${result.skippedCount} duplicates were skipped.`
                  );
                  return result;
                }}
              />
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Application ledger</h2>
              <p className="text-sm text-slate-500 mt-1">
                Students create these records locally, recruiters update them locally, and admins can audit the full flow.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student', 'Company', 'Status', 'Score', 'Submitted'].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {applicationRows.map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-slate-900">{application.student?.name}</div>
                        <div className="text-slate-500">{application.student?.rollNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {application.company?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 capitalize">
                        {application.status}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {application.score ?? '--'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {new Date(application.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'offcampus' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Off-campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Students can track these locally from their dashboard.
                </p>
              </div>
              <button
                onClick={() => setShowOpportunityForm((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add opportunity
              </button>
            </div>

            {showOpportunityForm && (
              <form
                onSubmit={handleCreateOpportunity}
                className="rounded-3xl bg-white border border-slate-200 p-6 grid md:grid-cols-2 gap-4"
              >
                <Input
                  label="Role title"
                  value={opportunityForm.title}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({ ...current, title: value }))
                  }
                />
                <Input
                  label="Company"
                  value={opportunityForm.company}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({ ...current, company: value }))
                  }
                />
                <Input
                  label="Location"
                  value={opportunityForm.location}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({ ...current, location: value }))
                  }
                />
                <Input
                  label="Salary/Stipend"
                  value={opportunityForm.salary}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({ ...current, salary: value }))
                  }
                />
                <Input
                  label="Skills"
                  value={opportunityForm.skills}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({ ...current, skills: value }))
                  }
                  helper="Comma-separated"
                />
                <Input
                  label="Deadline"
                  type="date"
                  value={opportunityForm.applicationDeadline}
                  onChange={(value) =>
                    setOpportunityForm((current) => ({
                      ...current,
                      applicationDeadline: value,
                    }))
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={opportunityForm.type}
                    onChange={(event) =>
                      setOpportunityForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    {['internship', 'full-time', 'remote', 'part-time', 'freelance'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Experience</label>
                  <select
                    value={opportunityForm.experience}
                    onChange={(event) =>
                      setOpportunityForm((current) => ({
                        ...current,
                        experience: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    {['fresher', 'experienced', 'any'].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-8">
                  <input
                    type="checkbox"
                    checked={opportunityForm.isRemote}
                    onChange={(event) =>
                      setOpportunityForm((current) => ({
                        ...current,
                        isRemote: event.target.checked,
                      }))
                    }
                  />
                  Remote friendly
                </label>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={opportunityForm.description}
                    onChange={(event) =>
                      setOpportunityForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOpportunityForm(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold"
                  >
                    Create opportunity
                  </button>
                </div>
              </form>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {offCampusOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="rounded-3xl bg-white border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{opportunity.title}</div>
                      <div className="text-sm text-slate-500 mt-1">{opportunity.company}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {opportunity.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-4 line-clamp-3">
                    {opportunity.description}
                  </p>
                  <div className="mt-4 text-sm text-slate-500">
                    {opportunity.location} · deadline{' '}
                    {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard: React.FC<{ value: number; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-slate-500 mt-2">{label}</div>
  </div>
);

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="rounded-3xl border border-slate-200 p-5">
    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
      {icon}
    </div>
    <div className="font-semibold text-slate-900 mt-4">{title}</div>
    <p className="text-sm text-slate-500 mt-2 leading-6">{description}</p>
  </div>
);

const CompanyAdminCard: React.FC<{
  company: CompanyRecord;
  applicationCount: number;
}> = ({ company, applicationCount }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900">{company.name}</div>
        <div className="text-sm text-slate-500 mt-1">{company.industry}</div>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
        {company.status}
      </span>
    </div>
    <div className="mt-4 space-y-2 text-sm text-slate-600">
      <div>Recruiter: {company.recruiterName}</div>
      <div>Email: {company.recruiterEmail}</div>
      <div>Applications: {applicationCount}</div>
      <div>Deadline: {new Date(company.applicationDeadline).toLocaleDateString()}</div>
    </div>
  </div>
);

const StudentCard: React.FC<{ student: StudentRecord }> = ({ student }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900">{student.name}</div>
        <div className="text-sm text-slate-500">{student.rollNumber}</div>
        <div className="text-sm text-slate-600 mt-3">{student.branch}</div>
        <div className="text-sm text-slate-600">CGPA {student.cgpa.toFixed(1)} · Batch {student.batch}</div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
      {student.skills.slice(0, 4).map((skill) => (
        <span key={skill} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {skill}
        </span>
      ))}
    </div>
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
}> = ({ label, value, onChange, type = 'text', helper }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
    />
    {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
  </div>
);

export default AdminDashboard;
