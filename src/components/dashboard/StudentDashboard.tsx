import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  LogOut,
  Search,
} from 'lucide-react';
import CompanyCard from '../CompanyCard';
import CompanyDetails from '../CompanyDetails';
import ApplicationForm from '../ApplicationForm';
import { useAuthStore } from '../../store/authStore';
import {
  applicationsService,
  companiesService,
  offCampusService,
  studentsService,
} from '../../services';
import { Company, OffCampusOpportunity } from '../../types';
import { handleApiError } from '../../utils/api';
import { API_ORIGIN } from '../../utils/apiConfig';

type Tab = 'companies' | 'applications' | 'offcampus' | 'profile';
type CompanyApplicationFilter = 'all' | 'applied' | 'not-applied';
type CompanySortOption = 'newest' | 'deadline' | 'package-high' | 'package-low';
type OpportunityRemoteFilter = 'all' | 'remote' | 'onsite';
type OpportunitySortOption = 'newest' | 'deadline' | 'company';

interface ApiStudentProfile {
  _id: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
  backlogs?: number;
  phone: string;
  skills?: string[];
  resumeUrl?: string | null;
  userId?: {
    name?: string;
    email?: string;
  };
}

interface StudentProfileView {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  backlogs: number;
  phone: string;
  skills: string[];
  resumeUrl?: string | null;
}

interface StudentApplicationView {
  id: string;
  companyId: string;
  companyName: string;
  companyIndustry: string;
  companyLocation: string;
  status: string;
  score: number | null;
  submittedAt: string;
  whyCompany: string;
}

const statusFromBackend = (status: string, deadline: string): Company['status'] => {
  if (status === 'completed') {
    return 'results';
  }
  if (status === 'inactive') {
    return 'closed';
  }
  if (new Date(deadline) < new Date()) {
    return 'closed';
  }
  return 'open';
};

const toCompanyView = (company: any): Company => ({
  id: String(company._id),
  name: String(company.name || 'Company'),
  logo: company.logoUrl
    ? String(company.logoUrl).startsWith('http')
      ? String(company.logoUrl)
      : `${API_ORIGIN}${String(company.logoUrl)}`
    : 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=100',
  description: String(company.description || 'No description available'),
  industry: String(company.industry || 'Other'),
  location: String(company.location || 'N/A'),
  packageOffered: String(company.packageOffered || 'N/A'),
  applicationDeadline: String(company.applicationDeadline),
  status: statusFromBackend(String(company.status || 'inactive'), String(company.applicationDeadline)),
  requirements: Array.isArray(company.requirements) ? company.requirements : [],
  rounds: Array.isArray(company.recruitmentProcess)
    ? company.recruitmentProcess.map((round: any, index: number) => ({
        id: `${company._id}-${index + 1}`,
        name: String(round.roundName || `Round ${index + 1}`),
        date: 'TBD',
        status: 'upcoming' as const,
        description: String(round.description || 'Round details will be shared by recruiter'),
        selectedStudents: [],
        totalApplied: 0,
      }))
    : [],
  totalPositions: Number(company.totalPositions || 0),
  createdAt: String(company.createdAt || company.updatedAt || company.applicationDeadline || ''),
  eligibilityCriteria: {
    minCGPA:
      typeof company.eligibilityCriteria?.minCGPA === 'number'
        ? Number(company.eligibilityCriteria.minCGPA)
        : undefined,
    minTenthPercentage:
      typeof company.eligibilityCriteria?.minTenthPercentage === 'number'
        ? Number(company.eligibilityCriteria.minTenthPercentage)
        : undefined,
    minTwelfthPercentage:
      typeof company.eligibilityCriteria?.minTwelfthPercentage === 'number'
        ? Number(company.eligibilityCriteria.minTwelfthPercentage)
        : undefined,
    backlogCriteria: company.eligibilityCriteria?.backlogCriteria || 'na',
  },
});

const toStudentProfileView = (student: ApiStudentProfile): StudentProfileView => ({
  id: String(student._id),
  name: String(student.userId?.name || 'Student'),
  email: String(student.userId?.email || ''),
  rollNumber: String(student.rollNumber || ''),
  branch: String(student.branch || ''),
  cgpa: Number(student.cgpa || 0),
  tenthPercentage:
    typeof student.tenthPercentage === 'number' ? Number(student.tenthPercentage) : null,
  twelfthPercentage:
    typeof student.twelfthPercentage === 'number' ? Number(student.twelfthPercentage) : null,
  backlogs: Number(student.backlogs || 0),
  phone: String(student.phone || ''),
  skills: Array.isArray(student.skills) ? student.skills : [],
  resumeUrl: student.resumeUrl || null,
});

const extractWhyCompany = (formData: any) => {
  const additionalInfo = formData?.additionalInfo;
  if (typeof additionalInfo !== 'string') {
    return 'Not provided';
  }
  const sections = additionalInfo.split('\n\n').filter(Boolean);
  if (sections.length > 1) {
    return sections[1];
  }
  return sections[0] || 'Not provided';
};

const toApplicationView = (application: any, companyMap: Map<string, Company>): StudentApplicationView => {
  const companyIdRaw =
    typeof application.companyId === 'string'
      ? application.companyId
      : application.companyId?._id;
  const companyId = String(companyIdRaw || '');
  const mappedCompany = companyMap.get(companyId);

  return {
    id: String(application._id),
    companyId,
    companyName:
      mappedCompany?.name || String(application.companyId?.name || 'Company'),
    companyIndustry: mappedCompany?.industry || 'N/A',
    companyLocation:
      mappedCompany?.location || String(application.companyId?.location || 'N/A'),
    status: String(application.status || 'submitted'),
    score: typeof application.score === 'number' ? application.score : null,
    submittedAt: String(application.submittedAt),
    whyCompany: extractWhyCompany(application.formData),
  };
};

const toOffCampusView = (opportunity: any): OffCampusOpportunity => ({
  id: String(opportunity._id),
  title: String(opportunity.title || 'Opportunity'),
  company: String(opportunity.company || 'Company'),
  companyLogo:
    'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=100',
  type: (opportunity.type || 'full-time') as OffCampusOpportunity['type'],
  location: String(opportunity.location || 'N/A'),
  isRemote: Boolean(opportunity.isRemote),
  duration: opportunity.duration,
  stipend: opportunity.stipend,
  salary: opportunity.salary,
  description: String(opportunity.description || ''),
  requirements: Array.isArray(opportunity.requirements) ? opportunity.requirements : [],
  skills: Array.isArray(opportunity.skills) ? opportunity.skills : [],
  applicationDeadline: String(opportunity.applicationDeadline),
  postedDate: String(opportunity.createdAt || opportunity.postedDate || new Date().toISOString()),
  applicationLink: String(opportunity.applicationLink || '#'),
  industry: String(opportunity.industry || 'Other'),
  experience: (opportunity.experience || 'any') as OffCampusOpportunity['experience'],
});

const extractNumericValue = (value: string) => {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};

const getDayStart = (value: string) =>
  value ? new Date(`${value}T00:00:00`).getTime() : null;

const getDayEnd = (value: string) =>
  value ? new Date(`${value}T23:59:59.999`).getTime() : null;

const matchesDateRange = (dateValue: string, from: string, to: string) => {
  const timestamp = new Date(dateValue).getTime();
  const fromValue = getDayStart(from);
  const toValue = getDayEnd(to);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  if (fromValue !== null && timestamp < fromValue) {
    return false;
  }

  if (toValue !== null && timestamp > toValue) {
    return false;
  }

  return true;
};

const getSortTimestamp = (value?: string) => {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isValidNumberInRange = (value: string, min: number, max: number) => {
  const parsedValue = Number(value);
  return value.trim() !== '' && !Number.isNaN(parsedValue) && parsedValue >= min && parsedValue <= max;
};

const formatPercentageValue = (value: number | null) =>
  typeof value === 'number' ? `${value.toFixed(1)}%` : 'NA';

const getCompanyEligibilitySummary = (company: Company) => {
  const criteria = company.eligibilityCriteria;
  if (!criteria) {
    return [];
  }

  const entries: string[] = [];
  if (typeof criteria.minCGPA === 'number') {
    entries.push(`CGPA ${criteria.minCGPA}+`);
  }
  if (typeof criteria.minTenthPercentage === 'number') {
    entries.push(`10th ${criteria.minTenthPercentage}%+`);
  }
  if (typeof criteria.minTwelfthPercentage === 'number') {
    entries.push(`12th ${criteria.minTwelfthPercentage}%+`);
  }
  if (criteria.backlogCriteria === 'not-allowed') {
    entries.push('No backlogs');
  } else if (criteria.backlogCriteria === 'allowed') {
    entries.push('Backlogs allowed');
  }

  return entries;
};

const isStudentEligibleForCompany = (student: StudentProfileView | null, company: Company) => {
  if (!student) {
    return false;
  }

  const criteria = company.eligibilityCriteria;
  if (!criteria) {
    return true;
  }

  if (typeof criteria.minCGPA === 'number' && student.cgpa < criteria.minCGPA) {
    return false;
  }

  if (
    typeof criteria.minTenthPercentage === 'number' &&
    (typeof student.tenthPercentage !== 'number' || student.tenthPercentage < criteria.minTenthPercentage)
  ) {
    return false;
  }

  if (
    typeof criteria.minTwelfthPercentage === 'number' &&
    (typeof student.twelfthPercentage !== 'number' || student.twelfthPercentage < criteria.minTwelfthPercentage)
  ) {
    return false;
  }

  if (criteria.backlogCriteria === 'not-allowed' && student.backlogs > 0) {
    return false;
  }

  return true;
};

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [applicationCompany, setApplicationCompany] = useState<Company | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState<'all' | Company['status']>('all');
  const [companyApplicationFilter, setCompanyApplicationFilter] =
    useState<CompanyApplicationFilter>('all');
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState('all');
  const [companyLocationFilter, setCompanyLocationFilter] = useState('all');
  const [companyMinPackageFilter, setCompanyMinPackageFilter] = useState('');
  const [companyDeadlineFrom, setCompanyDeadlineFrom] = useState('');
  const [companyDeadlineTo, setCompanyDeadlineTo] = useState('');
  const [companySort, setCompanySort] = useState<CompanySortOption>('newest');
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [opportunityTypeFilter, setOpportunityTypeFilter] =
    useState<'all' | OffCampusOpportunity['type']>('all');
  const [opportunityExperienceFilter, setOpportunityExperienceFilter] =
    useState<'all' | OffCampusOpportunity['experience']>('all');
  const [opportunityLocationFilter, setOpportunityLocationFilter] = useState('all');
  const [opportunityRemoteFilter, setOpportunityRemoteFilter] =
    useState<OpportunityRemoteFilter>('all');
  const [opportunityDeadlineFrom, setOpportunityDeadlineFrom] = useState('');
  const [opportunityDeadlineTo, setOpportunityDeadlineTo] = useState('');
  const [opportunitySort, setOpportunitySort] = useState<OpportunitySortOption>('newest');

  const [student, setStudent] = useState<StudentProfileView | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [studentApplications, setStudentApplications] = useState<StudentApplicationView[]>([]);
  const [offCampusOpportunities, setOffCampusOpportunities] = useState<OffCampusOpportunity[]>([]);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    backlogs: '0',
    skills: '',
  });

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  );

  const studentId =
    (user?.profile as { _id?: string } | undefined)?._id || null;

  const loadData = async () => {
    if (!studentId) {
      setStatusMessage('Student profile not found in current session.');
      return;
    }

    try {
      const [studentResponse, activeCompaniesResponse, studentAppsResponse, offCampusResponse] =
        await Promise.all([
          studentsService.getStudent(studentId),
          companiesService.getActiveCompanies(),
          applicationsService.getStudentApplications(studentId, { limit: 200 }),
          offCampusService.getOpportunities({ limit: 100 }),
        ]);

      const studentData = studentResponse?.data?.student as ApiStudentProfile | undefined;
      if (studentData) {
        const nextStudent = toStudentProfileView(studentData);
        setStudent(nextStudent);
        setProfileForm({
          name: nextStudent.name,
          phone: nextStudent.phone,
          tenthPercentage:
            typeof nextStudent.tenthPercentage === 'number'
              ? String(nextStudent.tenthPercentage)
              : '',
          twelfthPercentage:
            typeof nextStudent.twelfthPercentage === 'number'
              ? String(nextStudent.twelfthPercentage)
              : '',
          backlogs: String(nextStudent.backlogs),
          skills: nextStudent.skills.join(', '),
        });
      }

      const companyList = ((activeCompaniesResponse?.data?.companies || []) as any[]).map(
        toCompanyView
      );
      setCompanies(companyList);

      const mappedCompanyMap = new Map(companyList.map((company) => [company.id, company]));
      const applicationsList = (studentAppsResponse?.data?.applications || []) as any[];
      setStudentApplications(
        applicationsList.map((application) => toApplicationView(application, mappedCompanyMap))
      );

      const opportunities = ((offCampusResponse?.data?.opportunities || []) as any[]).map(
        toOffCampusView
      );
      setOffCampusOpportunities(opportunities);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to load student dashboard'
      );
    }
  };

  useEffect(() => {
    void loadData();
  }, [studentId]);

  const applicationByCompany = useMemo(
    () => new Map(studentApplications.map((application) => [application.companyId, application])),
    [studentApplications]
  );

  const companyIndustries = useMemo(
    () => Array.from(new Set(companies.map((company) => company.industry))).sort(),
    [companies]
  );

  const companyLocations = useMemo(
    () => Array.from(new Set(companies.map((company) => company.location))).sort(),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    const search = companySearch.toLowerCase();
    const minPackage = companyMinPackageFilter ? Number(companyMinPackageFilter) : null;

    const nextCompanies = companies.filter((company) => {
      const hasApplication = applicationByCompany.has(company.id);
      const isEligible = isStudentEligibleForCompany(student, company);
      const matchesSearch =
        company.name.toLowerCase().includes(search) ||
        company.industry.toLowerCase().includes(search) ||
        company.location.toLowerCase().includes(search) ||
        company.requirements.join(' ').toLowerCase().includes(search);
      const matchesStatus =
        companyStatusFilter === 'all' || company.status === companyStatusFilter;
      const matchesApplication =
        companyApplicationFilter === 'all' ||
        (companyApplicationFilter === 'applied' ? hasApplication : !hasApplication);
      const matchesIndustry =
        companyIndustryFilter === 'all' || company.industry === companyIndustryFilter;
      const matchesLocation =
        companyLocationFilter === 'all' || company.location === companyLocationFilter;
      const matchesPackage =
        minPackage === null || extractNumericValue(company.packageOffered) >= minPackage;
      const matchesDeadline = matchesDateRange(
        company.applicationDeadline,
        companyDeadlineFrom,
        companyDeadlineTo
      );

      return (
        (isEligible || hasApplication) &&
        matchesSearch &&
        matchesStatus &&
        matchesApplication &&
        matchesIndustry &&
        matchesLocation &&
        matchesPackage &&
        matchesDeadline
      );
    });

    return nextCompanies.sort((left, right) => {
      switch (companySort) {
        case 'deadline':
          return (
            getSortTimestamp(left.applicationDeadline) -
            getSortTimestamp(right.applicationDeadline)
          );
        case 'package-high':
          return (
            extractNumericValue(right.packageOffered) -
            extractNumericValue(left.packageOffered)
          );
        case 'package-low':
          return (
            extractNumericValue(left.packageOffered) -
            extractNumericValue(right.packageOffered)
          );
        case 'newest':
        default:
          return (
            getSortTimestamp(right.createdAt || right.applicationDeadline) -
            getSortTimestamp(left.createdAt || left.applicationDeadline)
          );
      }
    });
  }, [
    applicationByCompany,
    companies,
    companyApplicationFilter,
    companyDeadlineFrom,
    companyDeadlineTo,
    companyIndustryFilter,
    companyLocationFilter,
    companyMinPackageFilter,
    companySearch,
    companySort,
    companyStatusFilter,
    student,
  ]);

  const opportunityLocations = useMemo(
    () => Array.from(new Set(offCampusOpportunities.map((opportunity) => opportunity.location))).sort(),
    [offCampusOpportunities]
  );

  const filteredOpportunities = useMemo(() => {
    const search = opportunitySearch.toLowerCase();
    const nextOpportunities = offCampusOpportunities.filter((opportunity) => {
      const matchesSearch =
        opportunity.title.toLowerCase().includes(search) ||
        opportunity.company.toLowerCase().includes(search) ||
        opportunity.industry.toLowerCase().includes(search) ||
        opportunity.location.toLowerCase().includes(search) ||
        opportunity.skills.join(' ').toLowerCase().includes(search);
      const matchesType =
        opportunityTypeFilter === 'all' || opportunity.type === opportunityTypeFilter;
      const matchesExperience =
        opportunityExperienceFilter === 'all' ||
        opportunity.experience === opportunityExperienceFilter;
      const matchesLocation =
        opportunityLocationFilter === 'all' ||
        opportunity.location === opportunityLocationFilter;
      const matchesRemote =
        opportunityRemoteFilter === 'all' ||
        (opportunityRemoteFilter === 'remote'
          ? opportunity.isRemote
          : !opportunity.isRemote);
      const matchesDeadline = matchesDateRange(
        opportunity.applicationDeadline,
        opportunityDeadlineFrom,
        opportunityDeadlineTo
      );

      return (
        matchesSearch &&
        matchesType &&
        matchesExperience &&
        matchesLocation &&
        matchesRemote &&
        matchesDeadline
      );
    });

    return nextOpportunities.sort((left, right) => {
      switch (opportunitySort) {
        case 'deadline':
          return (
            getSortTimestamp(left.applicationDeadline) -
            getSortTimestamp(right.applicationDeadline)
          );
        case 'company':
          return left.company.localeCompare(right.company);
        case 'newest':
        default:
          return getSortTimestamp(right.postedDate) - getSortTimestamp(left.postedDate);
      }
    });
  }, [
    offCampusOpportunities,
    opportunityDeadlineFrom,
    opportunityDeadlineTo,
    opportunityExperienceFilter,
    opportunityLocationFilter,
    opportunityRemoteFilter,
    opportunitySearch,
    opportunitySort,
    opportunityTypeFilter,
  ]);

  const resetCompanyFilters = () => {
    setCompanySearch('');
    setCompanyStatusFilter('all');
    setCompanyApplicationFilter('all');
    setCompanyIndustryFilter('all');
    setCompanyLocationFilter('all');
    setCompanyMinPackageFilter('');
    setCompanyDeadlineFrom('');
    setCompanyDeadlineTo('');
    setCompanySort('newest');
  };

  const resetOpportunityFilters = () => {
    setOpportunitySearch('');
    setOpportunityTypeFilter('all');
    setOpportunityExperienceFilter('all');
    setOpportunityLocationFilter('all');
    setOpportunityRemoteFilter('all');
    setOpportunityDeadlineFrom('');
    setOpportunityDeadlineTo('');
    setOpportunitySort('newest');
  };

  const studentStats = useMemo(() => {
    const companiesApplied = new Set(studentApplications.map((application) => application.companyId)).size;
    const applicationsInReview = studentApplications.filter((application) =>
      ['submitted', 'under-review'].includes(application.status)
    ).length;

    return {
      totalApplications: studentApplications.length,
      companiesApplied,
      applicationsInReview,
    };
  }, [studentApplications]);

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center max-w-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Student profile not found</h1>
          <p className="text-slate-600 mt-3">
            This account does not have a linked student profile.
          </p>
          <button
            onClick={logout}
            className="mt-6 px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const currentApplication = applicationCompany
    ? applicationByCompany.get(applicationCompany.id)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-blue-600">Student Portal</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-2">
                Welcome back, {student.name.split(' ')[0]}
              </h1>
              <p className="text-slate-600 mt-2">
                Manage applications and keep your profile updated.
              </p>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-medium self-start"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <StatCard
              value={studentStats.totalApplications}
              label="Applications"
              color="text-blue-600"
            />
            <StatCard
              value={studentStats.companiesApplied}
              label="Companies"
              color="text-emerald-600"
            />
            <StatCard
              value={studentStats.applicationsInReview}
              label="In review"
              color="text-orange-600"
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {(
              [
                ['companies', 'Companies'],
                ['applications', 'My applications'],
                ['offcampus', 'Off-campus'],
                ['profile', 'Profile'],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {statusMessage && (
          <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        {selectedCompany && !applicationCompany && (
          <CompanyDetails company={selectedCompany} onBack={() => setSelectedCompany(null)} />
        )}

        {applicationCompany && (
          <ApplicationForm
            company={applicationCompany}
            initialData={{
              studentName: student.name,
              rollNumber: student.rollNumber,
              email: student.email,
              phone: student.phone,
              branch: student.branch,
              cgpa: student.cgpa,
              skills: student.skills.join(', '),
              experience: '',
            }}
            onBack={() => setApplicationCompany(null)}
            onSubmit={async (formData) => {
              try {
                await applicationsService.submitApplication({
                  companyId: applicationCompany.id,
                  formData,
                });
                setStatusMessage(`Application submitted to ${applicationCompany.name}.`);
                setApplicationCompany(null);
                setSelectedCompany(null);
                setActiveTab('applications');
                await loadData();
              } catch (error) {
                setStatusMessage(handleApiError(error));
              }
            }}
          />
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'companies' && (
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Browse open drives, filter by deadline and status, and apply directly.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                {filteredCompanies.length} companies shown · newest first
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="relative xl:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={companySearch}
                    onChange={(event) => setCompanySearch(event.target.value)}
                    placeholder="Search companies, industries, locations, or requirements"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <select
                  value={companyStatusFilter}
                  onChange={(event) =>
                    setCompanyStatusFilter(event.target.value as 'all' | Company['status'])
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="results">Results</option>
                </select>

                <select
                  value={companyApplicationFilter}
                  onChange={(event) =>
                    setCompanyApplicationFilter(event.target.value as CompanyApplicationFilter)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All companies</option>
                  <option value="not-applied">Not applied</option>
                  <option value="applied">Applied</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                <select
                  value={companyIndustryFilter}
                  onChange={(event) => setCompanyIndustryFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All industries</option>
                  {companyIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>

                <select
                  value={companyLocationFilter}
                  onChange={(event) => setCompanyLocationFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All locations</option>
                  {companyLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={companyMinPackageFilter}
                  onChange={(event) => setCompanyMinPackageFilter(event.target.value)}
                  placeholder="Min package"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                />

                <select
                  value={companySort}
                  onChange={(event) =>
                    setCompanySort(event.target.value as CompanySortOption)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="newest">Newest first</option>
                  <option value="deadline">Deadline first</option>
                  <option value="package-high">Package high to low</option>
                  <option value="package-low">Package low to high</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] gap-3">
                <input
                  type="date"
                  value={companyDeadlineFrom}
                  onChange={(event) => setCompanyDeadlineFrom(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                />
                <input
                  type="date"
                  value={companyDeadlineTo}
                  onChange={(event) => setCompanyDeadlineTo(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={resetCompanyFilters}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isApplied={applicationByCompany.has(company.id)}
                  applicationStatus={applicationByCompany.get(company.id)?.status}
                  onViewDetails={(nextCompany) => setSelectedCompany(nextCompany)}
                  onApply={(nextCompany) => {
                    if (applicationByCompany.has(nextCompany.id)) {
                      setStatusMessage(`You already applied to ${nextCompany.name}.`);
                      setActiveTab('applications');
                      return;
                    }
                    setApplicationCompany(nextCompany);
                  }}
                />
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No companies match these filters"
                description="Try widening your filters or update your academic profile if new company criteria are hiding opportunities."
              />
            )}
          </section>
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'applications' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">My applications</h2>
              <p className="text-sm text-slate-500 mt-1">
                Track live status updates from recruiter review.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {studentApplications.map((application) => (
                <div key={application.id} className="rounded-3xl bg-white border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{application.companyName}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {application.companyIndustry} · {application.companyLocation}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {application.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-5 text-sm text-slate-600">
                    <div>
                      <div className="text-slate-400">Submitted</div>
                      <div className="font-medium text-slate-800 mt-1">
                        {new Date(application.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Score</div>
                      <div className="font-medium text-slate-800 mt-1">
                        {application.score ?? '--'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Why this company
                    </div>
                    <p className="text-sm text-slate-700 mt-2 leading-6">
                      {application.whyCompany}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {studentApplications.length === 0 && (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No applications yet"
                description="Open the companies tab and submit your first application."
              />
            )}
          </section>
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'offcampus' && (
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Off-campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Explore additional roles outside campus drives.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                {filteredOpportunities.length} opportunities shown
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="relative xl:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={opportunitySearch}
                    onChange={(event) => setOpportunitySearch(event.target.value)}
                    placeholder="Search roles, companies, skills, or industries"
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>

                <select
                  value={opportunityTypeFilter}
                  onChange={(event) =>
                    setOpportunityTypeFilter(
                      event.target.value as 'all' | OffCampusOpportunity['type']
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All types</option>
                  <option value="full-time">Full-time</option>
                  <option value="internship">Internship</option>
                  <option value="part-time">Part-time</option>
                  <option value="remote">Remote</option>
                  <option value="freelance">Freelance</option>
                </select>

                <select
                  value={opportunityExperienceFilter}
                  onChange={(event) =>
                    setOpportunityExperienceFilter(
                      event.target.value as 'all' | OffCampusOpportunity['experience']
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All experience levels</option>
                  <option value="fresher">Fresher</option>
                  <option value="experienced">Experienced</option>
                  <option value="any">Any</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                <select
                  value={opportunityLocationFilter}
                  onChange={(event) => setOpportunityLocationFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All locations</option>
                  {opportunityLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                <select
                  value={opportunityRemoteFilter}
                  onChange={(event) =>
                    setOpportunityRemoteFilter(
                      event.target.value as OpportunityRemoteFilter
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All work modes</option>
                  <option value="remote">Remote only</option>
                  <option value="onsite">On-site / hybrid</option>
                </select>

                <input
                  type="date"
                  value={opportunityDeadlineFrom}
                  onChange={(event) => setOpportunityDeadlineFrom(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                />

                <input
                  type="date"
                  value={opportunityDeadlineTo}
                  onChange={(event) => setOpportunityDeadlineTo(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid md:grid-cols-[1fr_auto] gap-3">
                <select
                  value={opportunitySort}
                  onChange={(event) =>
                    setOpportunitySort(event.target.value as OpportunitySortOption)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="newest">Newest first</option>
                  <option value="deadline">Deadline first</option>
                  <option value="company">Company A-Z</option>
                </select>

                <button
                  type="button"
                  onClick={resetOpportunityFilters}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-3xl bg-white border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{opportunity.title}</div>
                      <div className="text-sm text-slate-500 mt-1">{opportunity.company}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {opportunity.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-4 leading-6 line-clamp-3">
                    {opportunity.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {opportunity.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    {opportunity.location} · deadline{' '}
                    {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                  </div>
                  <div className="mt-5">
                    <a
                      href={opportunity.applicationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Open link
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {filteredOpportunities.length === 0 && (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No off-campus roles match these filters"
                description="Try resetting the deadline or work-mode filters."
              />
            )}
          </section>
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'profile' && (
          <section className="grid lg:grid-cols-[0.7fr_1.3fr] gap-6">
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-5">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="text-2xl font-semibold">{student.name}</div>
              <div className="text-slate-300 mt-2">{student.rollNumber}</div>
              <div className="text-slate-300 mt-4">{student.branch}</div>
              <div className="text-slate-300 mt-1">CGPA {student.cgpa.toFixed(2)}</div>
              <div className="text-slate-300 mt-1">
                10th {formatPercentageValue(student.tenthPercentage)} · 12th {formatPercentageValue(student.twelfthPercentage)}
              </div>
              <div className="text-slate-300 mt-1">Backlogs {student.backlogs}</div>
              <div className="mt-6 flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <span key={skill} className="text-xs px-3 py-1 rounded-full bg-white/10">
                    {skill}
                  </span>
                ))}
              </div>
              {student.resumeUrl && (
                <a
                  href={student.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm text-blue-200 hover:text-white"
                >
                  <Briefcase className="w-4 h-4" />
                  View current resume
                </a>
              )}
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!student) {
                  return;
                }

                if (!profileForm.tenthPercentage.trim()) {
                  setStatusMessage('10th percentage is required.');
                  return;
                }

                if (!isValidNumberInRange(profileForm.tenthPercentage, 0, 100)) {
                  setStatusMessage('10th percentage must be between 0 and 100.');
                  return;
                }

                if (!profileForm.twelfthPercentage.trim()) {
                  setStatusMessage('12th percentage is required.');
                  return;
                }

                if (!isValidNumberInRange(profileForm.twelfthPercentage, 0, 100)) {
                  setStatusMessage('12th percentage must be between 0 and 100.');
                  return;
                }

                if (profileForm.backlogs.trim() === '') {
                  setStatusMessage('Backlogs are required.');
                  return;
                }

                if (
                  !Number.isInteger(Number(profileForm.backlogs)) ||
                  Number(profileForm.backlogs) < 0
                ) {
                  setStatusMessage('Backlogs must be a non-negative whole number.');
                  return;
                }

                try {
                  await studentsService.updateStudent(student.id, {
                    name: profileForm.name,
                    phone: profileForm.phone,
                    tenthPercentage: profileForm.tenthPercentage
                      ? Number(profileForm.tenthPercentage)
                      : undefined,
                    twelfthPercentage: profileForm.twelfthPercentage
                      ? Number(profileForm.twelfthPercentage)
                      : undefined,
                    backlogs: Number(profileForm.backlogs || 0),
                    skills: profileForm.skills
                      .split(',')
                      .map((skill) => skill.trim())
                      .filter(Boolean),
                  });
                  setStatusMessage('Profile updated successfully.');
                  await loadData();
                } catch (error) {
                  setStatusMessage(
                    error instanceof Error ? error.message : 'Failed to update profile'
                  );
                }
              }}
              className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Update your personal details and skills.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full name"
                  value={profileForm.name}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, name: value }))
                  }
                />
                <Input
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, phone: value }))
                  }
                />
                <Input
                  label="10th percentage"
                  value={profileForm.tenthPercentage}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, tenthPercentage: value }))
                  }
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <Input
                  label="12th percentage"
                  value={profileForm.twelfthPercentage}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, twelfthPercentage: value }))
                  }
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <Input
                  label="Current backlogs"
                  value={profileForm.backlogs}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, backlogs: value }))
                  }
                  type="number"
                  min="0"
                  step="1"
                />
                <Input
                  label="Skills"
                  value={profileForm.skills}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, skills: value }))
                  }
                  helper="Comma-separated"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold"
              >
                Save profile
              </button>
            </form>
          </section>
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
  <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </div>
);

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center">
    <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
      {icon}
    </div>
    <div className="text-lg font-semibold text-slate-900 mt-5">{title}</div>
    <p className="text-sm text-slate-500 mt-2">{description}</p>
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}> = ({ label, value, onChange, helper, type = 'text', min, max, step }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      min={min}
      max={max}
      step={step}
      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
    />
    {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
  </div>
);

export default StudentDashboard;
