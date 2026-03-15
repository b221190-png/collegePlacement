import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  LogOut,
  Plus,
  Upload,
} from 'lucide-react';
import CompanyOnboardingForm from './CompanyOnboardingForm';
import StudentBulkUpload from './StudentBulkUpload';
import ApplicationWindow from './ApplicationWindow';
import { useAuthStore } from '../store/authStore';
import {
  applicationWindowsService,
  applicationsService,
  companiesService,
  offCampusService,
  studentsService,
} from '../services';
import { CompanyOnboarding } from '../types';
import { handleApiError } from '../utils/api';

type Tab = 'overview' | 'companies' | 'students' | 'applications' | 'offcampus';

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const NORMALIZED_API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
const API_ORIGIN = NORMALIZED_API_BASE_URL.endsWith('/api')
  ? NORMALIZED_API_BASE_URL.slice(0, -4)
  : NORMALIZED_API_BASE_URL;

interface ApiCompany {
  _id: string;
  name: string;
  industry: string;
  status: string;
  applicationDeadline: string;
  location: string;
  packageOffered: string;
  totalPositions: number;
  requirements?: string[];
  createdBy?: {
    name?: string;
  };
  contactEmail?: string;
  recruiter?: {
    name?: string;
    email?: string;
  } | null;
  eligibilityCriteria?: {
    minCGPA?: number;
    minTenthPercentage?: number;
    minTwelfthPercentage?: number;
    backlogCriteria?: 'na' | 'allowed' | 'not-allowed';
  };
}

interface ApiStudent {
  _id: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
  backlogs?: number;
  resumeUrl?: string | null;
  batch: number;
  skills?: string[];
  userId?: {
    name?: string;
    email?: string;
  };
}

interface ApiApplication {
  _id: string;
  status: string;
  score?: number | null;
  resumeUrl?: string | null;
  submittedAt: string;
  studentId?: {
    _id?: string;
    rollNumber?: string;
    branch?: string;
    cgpa?: number;
    tenthPercentage?: number | null;
    twelfthPercentage?: number | null;
    backlogs?: number;
    resumeUrl?: string | null;
    userId?: {
      name?: string;
      email?: string;
    };
  };
  companyId?: {
    _id?: string;
    name?: string;
  };
}

interface ApiOffCampus {
  _id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  description: string;
  skills?: string[];
  applicationDeadline: string;
  applicationLink: string;
}

interface CompanyViewModel {
  id: string;
  name: string;
  industry: string;
  status: string;
  applicationDeadline: string;
  location: string;
  packageOffered: string;
  totalPositions: number;
  requirements: string[];
  recruiterName: string;
  recruiterEmail: string;
  eligibilityCriteria: {
    minCGPA?: number;
    minTenthPercentage?: number;
    minTwelfthPercentage?: number;
    backlogCriteria: 'na' | 'allowed' | 'not-allowed';
  };
}

interface StudentViewModel {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  backlogs: number;
  resumeUrl?: string | null;
  batch: number;
  skills: string[];
}

interface ApplicationViewModel {
  id: string;
  studentId: string;
  companyId: string;
  studentName: string;
  studentEmail: string;
  studentRollNumber: string;
  studentBranch: string;
  studentCgpa: number | null;
  studentTenthPercentage: number | null;
  studentTwelfthPercentage: number | null;
  studentBacklogs: number;
  companyName: string;
  status: string;
  score: number | null;
  submittedAt: string;
  resumeUrl: string | null;
}

interface OffCampusViewModel {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string;
  description: string;
  skills: string[];
  applicationDeadline: string;
  applicationLink: string;
}

const toDateTimeLocalValue = (date: Date) => {
  const next = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return next.toISOString().slice(0, 16);
};

const INDUSTRIES = [
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
  'Marketing',
  'Design',
  'Other',
];

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics and Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Other',
];

const normalizeIndustry = (value: string) => {
  if (INDUSTRIES.includes(value)) {
    return value;
  }
  return 'Other';
};

const normalizeBranch = (value: string) => {
  if (BRANCHES.includes(value)) {
    return value;
  }
  return 'Other';
};

const toAssetUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return value.startsWith('http') ? value : `${API_ORIGIN}${value}`;
};

const formatScoreValue = (value: number | null) =>
  typeof value === 'number' ? value.toFixed(1) : '--';

const formatPercentageValue = (value: number | null) =>
  typeof value === 'number' ? `${value.toFixed(1)}%` : 'NA';

const mapCompany = (company: ApiCompany): CompanyViewModel => ({
  id: company._id,
  name: company.name,
  industry: company.industry,
  status: company.status,
  applicationDeadline: company.applicationDeadline,
  location: company.location,
  packageOffered: company.packageOffered,
  totalPositions: company.totalPositions,
  requirements: company.requirements || [],
  recruiterName: company.recruiter?.name || 'Not assigned',
  recruiterEmail: company.recruiter?.email || company.contactEmail || 'Not provided',
  eligibilityCriteria: {
    minCGPA: company.eligibilityCriteria?.minCGPA,
    minTenthPercentage: company.eligibilityCriteria?.minTenthPercentage,
    minTwelfthPercentage: company.eligibilityCriteria?.minTwelfthPercentage,
    backlogCriteria: company.eligibilityCriteria?.backlogCriteria || 'na',
  },
});

const mapStudent = (student: ApiStudent): StudentViewModel => ({
  id: student._id,
  name: student.userId?.name || 'Student',
  email: student.userId?.email || '-',
  rollNumber: student.rollNumber,
  branch: student.branch,
  cgpa: Number(student.cgpa || 0),
  tenthPercentage:
    typeof student.tenthPercentage === 'number' ? Number(student.tenthPercentage) : null,
  twelfthPercentage:
    typeof student.twelfthPercentage === 'number' ? Number(student.twelfthPercentage) : null,
  backlogs: Number(student.backlogs || 0),
  resumeUrl: toAssetUrl(student.resumeUrl),
  batch: Number(student.batch || 0),
  skills: student.skills || [],
});

const mapApplication = (application: ApiApplication): ApplicationViewModel => ({
  id: application._id,
  studentId: application.studentId?._id || '',
  companyId: application.companyId?._id || '',
  studentName: application.studentId?.userId?.name || 'Student',
  studentEmail: application.studentId?.userId?.email || '-',
  studentRollNumber: application.studentId?.rollNumber || '-',
  studentBranch: application.studentId?.branch || '-',
  studentCgpa:
    typeof application.studentId?.cgpa === 'number' ? Number(application.studentId.cgpa) : null,
  studentTenthPercentage:
    typeof application.studentId?.tenthPercentage === 'number'
      ? Number(application.studentId.tenthPercentage)
      : null,
  studentTwelfthPercentage:
    typeof application.studentId?.twelfthPercentage === 'number'
      ? Number(application.studentId.twelfthPercentage)
      : null,
  studentBacklogs: Number(application.studentId?.backlogs || 0),
  companyName: application.companyId?.name || '-',
  status: application.status,
  score: typeof application.score === 'number' ? application.score : null,
  submittedAt: application.submittedAt,
  resumeUrl: toAssetUrl(application.resumeUrl || application.studentId?.resumeUrl),
});

const mapOffCampus = (opportunity: ApiOffCampus): OffCampusViewModel => ({
  id: opportunity._id,
  title: opportunity.title,
  company: opportunity.company,
  type: opportunity.type,
  location: opportunity.location,
  description: opportunity.description,
  skills: opportunity.skills || [],
  applicationDeadline: opportunity.applicationDeadline,
  applicationLink: opportunity.applicationLink,
});

const DASHBOARD_FETCH_LIMIT = 100;

const AdminDashboard: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const minimumOpportunityDeadline = toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApplicationCompanyId, setSelectedApplicationCompanyId] = useState<'all' | string>('all');

  const [companies, setCompanies] = useState<CompanyViewModel[]>([]);
  const [students, setStudents] = useState<StudentViewModel[]>([]);
  const [applications, setApplications] = useState<ApplicationViewModel[]>([]);
  const [offCampusOpportunities, setOffCampusOpportunities] = useState<OffCampusViewModel[]>([]);

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
    industry: 'Information Technology',
    experience: 'any',
    isRemote: false,
  });

  const stats = useMemo(() => {
    const openCompanies = companies.filter((company) => company.status === 'active').length;
    const pendingApplications = applications.filter((application) =>
      ['submitted', 'under-review'].includes(application.status)
    ).length;

    return {
      totalCompanies: companies.length,
      activeCompanies: openCompanies,
      totalStudents: students.length,
      totalApplications: applications.length,
      pendingApplications,
    };
  }, [applications, companies, students]);

  const applicationsByCompany = useMemo(
    () =>
      companies.map((company) => ({
        company,
        applicationCount: applications.filter((application) => application.companyId === company.id).length,
      })),
    [applications, companies]
  );

  const visibleApplications = useMemo(() => {
    if (selectedApplicationCompanyId === 'all') {
      return applications;
    }

    return applications.filter((application) => application.companyId === selectedApplicationCompanyId);
  }, [applications, selectedApplicationCompanyId]);

  const loadCompanies = async () => {
    const response = await companiesService.getCompanies({ limit: DASHBOARD_FETCH_LIMIT });
    const companyList = (response?.data?.companies || []) as ApiCompany[];
    setCompanies(companyList.map(mapCompany));
  };

  const loadStudents = async () => {
    const response = await studentsService.getStudents({ limit: DASHBOARD_FETCH_LIMIT });
    const studentList = (response?.data?.students || []) as ApiStudent[];
    setStudents(studentList.map(mapStudent));
  };

  const loadApplications = async () => {
    const response = await applicationsService.getApplications({ limit: DASHBOARD_FETCH_LIMIT });
    const applicationList = (response?.data?.applications || []) as ApiApplication[];
    setApplications(applicationList.map(mapApplication));
  };

  const loadOffCampus = async () => {
    const response = await offCampusService.getOpportunities({ limit: DASHBOARD_FETCH_LIMIT });
    const opportunities = (response?.data?.opportunities || []) as ApiOffCampus[];
    setOffCampusOpportunities(opportunities.map(mapOffCampus));
  };

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadCompanies(),
        loadStudents(),
        loadApplications(),
        loadOffCampus(),
      ]);
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleExportStudents = () => {
    const header = [
      'Name',
      'Roll Number',
      'Email',
      'Phone',
      'Branch',
      'CGPA',
      '10th Percentage',
      '12th Percentage',
      'Backlogs',
      'Batch',
      'Skills',
    ];
    const rows = students.map((student) => [
      student.name,
      student.rollNumber,
      student.email,
      '-',
      student.branch,
      String(student.cgpa),
      student.tenthPercentage ?? '',
      student.twelfthPercentage ?? '',
      String(student.backlogs),
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

  const handleCompanyCreate = async (companyData: CompanyOnboarding) => {
    try {
      const payload = {
        name: companyData.name,
        description: companyData.description,
        industry: normalizeIndustry(companyData.industry),
        location: companyData.location,
        packageOffered: companyData.packageOffered,
        totalPositions: Number(companyData.totalPositions || 1),
        applicationDeadline: companyData.applicationDeadline,
        requirements: companyData.requirements.filter(Boolean),
        skills: companyData.requirements.filter(Boolean).slice(0, 6),
        recruitmentProcess: companyData.rounds
          .filter((round) => round.name)
          .map((round) => ({
            roundName: round.name,
            description: round.description,
            duration: 'TBD',
          })),
        eligibilityCriteria: {
          minCGPA: companyData.eligibilityCriteria.minCGPA
            ? Number(companyData.eligibilityCriteria.minCGPA)
            : undefined,
          minTenthPercentage: companyData.eligibilityCriteria.minTenthPercentage
            ? Number(companyData.eligibilityCriteria.minTenthPercentage)
            : undefined,
          minTwelfthPercentage: companyData.eligibilityCriteria.minTwelfthPercentage
            ? Number(companyData.eligibilityCriteria.minTwelfthPercentage)
            : undefined,
          backlogCriteria: companyData.eligibilityCriteria.backlogCriteria,
        },
        contactEmail: companyData.recruiterEmail,
        recruiterName: companyData.recruiterName,
        recruiterEmail: companyData.recruiterEmail,
      };

      const response = await companiesService.createCompany(payload);
      const recruiter = response?.data?.recruiter;
      const temporaryPassword = response?.data?.temporaryPassword;

      setStatusMessage(
        recruiter?.isNew && temporaryPassword
          ? `Company added successfully. Recruiter login: ${recruiter.email} / ${temporaryPassword}`
          : 'Company added successfully.'
      );
      setShowCompanyForm(false);
      await loadCompanies();
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  const handleStudentImport = async (rows: Array<{
    name: string;
    rollNumber: string;
    email: string;
    phone: string;
    branch: string;
    cgpa: number;
    tenthPercentage?: number;
    twelfthPercentage?: number;
    backlogs?: number;
    skills: string[];
    batch?: number;
  }>) => {
    let addedCount = 0;
    let skippedCount = 0;

    await Promise.all(
      rows.map(async (row) => {
        try {
          await studentsService.createStudent({
            name: row.name,
            email: row.email,
            password: 'student123',
            rollNumber: row.rollNumber,
            branch: normalizeBranch(row.branch),
            cgpa: Number(row.cgpa),
            tenthPercentage:
              row.tenthPercentage !== undefined ? Number(row.tenthPercentage) : undefined,
            twelfthPercentage:
              row.twelfthPercentage !== undefined ? Number(row.twelfthPercentage) : undefined,
            backlogs: row.backlogs !== undefined ? Number(row.backlogs) : 0,
            phone: row.phone,
            batch: Number(row.batch || new Date().getFullYear()),
            skills: row.skills || [],
          });
          addedCount += 1;
        } catch {
          skippedCount += 1;
        }
      })
    );

    await loadStudents();
    return { addedCount, skippedCount };
  };

  const handleWindowCreate = async (payload: {
    companyId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minCGPA?: number;
    branches: string[];
    maxBacklogs?: number;
  }) => {
    try {
      await applicationWindowsService.createWindow({
        companyId: payload.companyId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        minCGPA: payload.minCGPA,
        maxBacklogs: payload.maxBacklogs,
        eligibleBranches: payload.branches,
      });
      setStatusMessage('Application window created successfully.');
      setShowWindowForm(false);
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  const handleCreateOpportunity = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await offCampusService.createOpportunity({
        title: opportunityForm.title,
        company: opportunityForm.company,
        type: opportunityForm.type,
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
        industry: normalizeIndustry(opportunityForm.industry),
        experience: opportunityForm.experience,
        salary: opportunityForm.salary || undefined,
      });

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
        industry: 'Information Technology',
        experience: 'any',
        isRemote: false,
      });
      await loadOffCampus();
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
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
                Manage companies, students, applications, and opportunities.
              </p>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-slate-900 text-sm font-medium self-start"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
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
              <h2 className="text-xl font-semibold text-slate-900">Operations</h2>
              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <FeatureCard
                  icon={<Building2 className="w-5 h-5" />}
                  title="Company onboarding"
                  description="Create companies and set hiring process details."
                />
                <FeatureCard
                  icon={<Upload className="w-5 h-5" />}
                  title="Student imports"
                  description="Bulk create student accounts from CSV uploads."
                />
                <FeatureCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Application windows"
                  description="Configure eligibility and drive timeline."
                />
                <FeatureCard
                  icon={<FileText className="w-5 h-5" />}
                  title="Application tracking"
                  description="View status and score updates across all applications."
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
                        <div className="text-sm text-slate-500">{company.recruiterName}</div>
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
                  Manage company records using backend APIs.
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
                onSubmit={handleCompanyCreate}
              />
            )}

            {showWindowForm && (
              <ApplicationWindow
                companies={companies.map((company) => ({
                  id: company.id,
                  name: company.name,
                }))}
                onClose={() => setShowWindowForm(false)}
                onSubmit={handleWindowCreate}
              />
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((company) => (
                <CompanyAdminCard
                  key={company.id}
                  company={company}
                  applicationCount={
                    applications.filter((application) => application.companyId === company.id).length
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
                  Import students and manage records from backend data.
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
                  const result = await handleStudentImport(rows);
                  setStatusMessage(
                    `Imported ${result.addedCount} students. ${result.skippedCount} rows were skipped.`
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
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Application ledger</h2>
              <p className="text-sm text-slate-500 mt-1">
                Pick a company to review only that company&apos;s application pipeline.
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setSelectedApplicationCompanyId('all')}
                className={`rounded-3xl border p-5 text-left transition-colors ${
                  selectedApplicationCompanyId === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                }`}
              >
                <div className="text-sm uppercase tracking-[0.2em] opacity-70">Applications</div>
                <div className="text-2xl font-semibold mt-3">All companies</div>
                <div className="text-sm mt-2 opacity-80">{applications.length} total records</div>
              </button>

              {applicationsByCompany.map(({ company, applicationCount }) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedApplicationCompanyId(company.id)}
                  className={`rounded-3xl border p-5 text-left transition-colors ${
                    selectedApplicationCompanyId === company.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{company.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{company.industry}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {applicationCount}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-4">
                    Deadline {new Date(company.applicationDeadline).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedApplicationCompanyId === 'all'
                      ? 'All applications'
                      : companies.find((company) => company.id === selectedApplicationCompanyId)?.name || 'Applications'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {visibleApplications.length} applications shown
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Student', 'Academics', 'Company', 'Resume', 'Status', 'Score', 'Submitted'].map((heading) => (
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
                    {visibleApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-slate-900">{application.studentName}</div>
                          <div className="text-slate-500">{application.studentRollNumber}</div>
                          <div className="text-slate-500">{application.studentEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div>{application.studentBranch}</div>
                          <div className="text-slate-500 mt-1">
                            CGPA {formatScoreValue(application.studentCgpa)}
                          </div>
                          <div className="text-slate-500">
                            10th {formatPercentageValue(application.studentTenthPercentage)} · 12th {formatPercentageValue(application.studentTwelfthPercentage)}
                          </div>
                          <div className="text-slate-500">
                            Backlogs {application.studentBacklogs}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{application.companyName}</td>
                        <td className="px-6 py-4 text-sm">
                          {application.resumeUrl ? (
                            <a
                              href={application.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="w-4 h-4" />
                              View resume
                            </a>
                          ) : (
                            <span className="text-slate-400">No resume</span>
                          )}
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

            {visibleApplications.length === 0 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-lg font-semibold text-slate-900 mt-4">
                  No applications for this company yet
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'offcampus' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Off-campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Publish and track off-campus opportunities.
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
                  type="datetime-local"
                  value={opportunityForm.applicationDeadline}
                  min={minimumOpportunityDeadline}
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

const getEligibilitySummary = (criteria: CompanyViewModel['eligibilityCriteria']) => {
  const items: string[] = [];

  if (typeof criteria.minCGPA === 'number') {
    items.push(`CGPA ${criteria.minCGPA}+`);
  }
  if (typeof criteria.minTenthPercentage === 'number') {
    items.push(`10th ${criteria.minTenthPercentage}%+`);
  }
  if (typeof criteria.minTwelfthPercentage === 'number') {
    items.push(`12th ${criteria.minTwelfthPercentage}%+`);
  }
  if (criteria.backlogCriteria === 'not-allowed') {
    items.push('No backlogs');
  } else if (criteria.backlogCriteria === 'allowed') {
    items.push('Backlogs allowed');
  }

  return items.length > 0 ? items : ['No fixed criteria'];
};

const CompanyAdminCard: React.FC<{
  company: CompanyViewModel;
  applicationCount: number;
}> = ({ company, applicationCount }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-slate-900 text-lg">{company.name}</div>
        <div className="text-sm text-slate-500 mt-1">{company.industry} · {company.location}</div>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
        {company.status}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-slate-400 text-xs uppercase tracking-[0.16em]">Applications</div>
        <div className="font-semibold text-slate-900 mt-1">{applicationCount}</div>
      </div>
      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-slate-400 text-xs uppercase tracking-[0.16em]">Deadline</div>
        <div className="font-semibold text-slate-900 mt-1">
          {new Date(company.applicationDeadline).toLocaleDateString()}
        </div>
      </div>
    </div>

    <div className="mt-5 space-y-2 text-sm text-slate-600">
      <div>Recruiter: {company.recruiterName}</div>
      <div>Contact: {company.recruiterEmail}</div>
      <div>Package: {company.packageOffered}</div>
    </div>

    <div className="mt-5">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Eligibility</div>
      <div className="flex flex-wrap gap-2 mt-3">
        {getEligibilitySummary(company.eligibilityCriteria).map((item) => (
          <span
            key={item}
            className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const StudentCard: React.FC<{ student: StudentViewModel }> = ({ student }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900">{student.name}</div>
        <div className="text-sm text-slate-500">{student.rollNumber}</div>
        <div className="text-sm text-slate-600 mt-3">{student.branch}</div>
        <div className="text-sm text-slate-600">
          CGPA {student.cgpa.toFixed(1)} · Batch {student.batch}
        </div>
        <div className="text-sm text-slate-600">
          10th {formatPercentageValue(student.tenthPercentage)} · 12th {formatPercentageValue(student.twelfthPercentage)}
        </div>
        <div className="text-sm text-slate-600">
          Backlogs {student.backlogs}
        </div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
      {student.skills.slice(0, 4).map((skill) => (
        <span key={skill} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {skill}
        </span>
      ))}
    </div>
    {student.resumeUrl && (
      <a
        href={student.resumeUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700"
      >
        <FileText className="w-4 h-4" />
        View resume
      </a>
    )}
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
  min?: string;
}> = ({ label, value, onChange, type = 'text', helper, min }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
    />
    {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
  </div>
);

export default AdminDashboard;
