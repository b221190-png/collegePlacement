import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  GraduationCap,
  LogOut,
  Search,
  Sparkles,
} from 'lucide-react';
import CompanyCard from '../CompanyCard';
import CompanyDetails from '../CompanyDetails';
import ApplicationForm from '../ApplicationForm';
import { useAuthStore } from '../../store/authStore';
import {
  CompanyRecord,
  OffCampusRecord,
  StudentRecord,
  getApplicationsForStudent,
  getPlacementSnapshot,
  getStudentByUser,
  getStudentStats,
  usePlacementStore,
} from '../../store/placementStore';

type Tab = 'companies' | 'applications' | 'offcampus' | 'profile';

export const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const companies = usePlacementStore((state) => state.companies);
  const applications = usePlacementStore((state) => state.applications);
  const students = usePlacementStore((state) => state.students);
  const offCampusOpportunities = usePlacementStore(
    (state) => state.offCampusOpportunities
  );
  const submitApplication = usePlacementStore((state) => state.submitApplication);
  const toggleOffCampusTracking = usePlacementStore(
    (state) => state.toggleOffCampusTracking
  );

  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [applicationCompany, setApplicationCompany] = useState<CompanyRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    branch: '',
    cgpa: '',
    skills: '',
    resumeName: '',
  });

  const snapshot = useMemo(() => getPlacementSnapshot(), [applications, companies, offCampusOpportunities, students]);
  const student = useMemo(() => getStudentByUser(snapshot, user), [snapshot, user]);
  const studentApplications = useMemo(
    () => (student ? getApplicationsForStudent(snapshot, student.id) : []),
    [snapshot, student]
  );
  const studentStats = useMemo(
    () =>
      student
        ? getStudentStats(snapshot, student.id)
        : { totalApplications: 0, companiesApplied: 0, applicationsInReview: 0 },
    [snapshot, student]
  );

  useEffect(() => {
    if (!student) {
      return;
    }

    setProfileForm({
      name: student.name,
      phone: student.phone,
      branch: student.branch,
      cgpa: String(student.cgpa),
      skills: student.skills.join(', '),
      resumeName: student.resumeName || '',
    });
  }, [student]);

  const applicationByCompany = useMemo(
    () =>
      new Map(studentApplications.map((application) => [application.companyId, application])),
    [studentApplications]
  );

  const filteredCompanies = useMemo(() => {
    const search = companySearch.toLowerCase();
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(search) ||
        company.industry.toLowerCase().includes(search)
    );
  }, [companies, companySearch]);

  const filteredOpportunities = useMemo(() => {
    const search = opportunitySearch.toLowerCase();
    return offCampusOpportunities.filter(
      (opportunity) =>
        opportunity.title.toLowerCase().includes(search) ||
        opportunity.company.toLowerCase().includes(search) ||
        opportunity.skills.join(' ').toLowerCase().includes(search)
    );
  }, [offCampusOpportunities, opportunitySearch]);

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center max-w-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Student profile not found</h1>
          <p className="text-slate-600 mt-3">
            This account does not have a linked student profile. Contact your administrator to activate a student profile.
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
                Manage your applications, track opportunities, and keep your profile up to date.
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
            <StatCard
              value={student.trackedOffCampusIds.length}
              label="Tracked off-campus"
              color="text-violet-600"
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
              experience: currentApplication?.formData.experience || '',
            }}
            onBack={() => setApplicationCompany(null)}
            onSubmit={(formData) => {
              submitApplication({
                studentId: student.id,
                companyId: applicationCompany.id,
                formData,
              });
              setStatusMessage(`Application submitted to ${applicationCompany.name}.`);
              setApplicationCompany(null);
              setSelectedCompany(null);
              setActiveTab('applications');
            }}
          />
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'companies' && (
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Browse open drives, check details, and apply without any backend dependency.
                </p>
              </div>
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={companySearch}
                  onChange={(event) => setCompanySearch(event.target.value)}
                  placeholder="Search companies or industries"
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="space-y-3">
                  <CompanyCard
                    company={company}
                    onViewDetails={(nextCompany) => setSelectedCompany(nextCompany as CompanyRecord)}
                    onApply={(nextCompany) => {
                      if (applicationByCompany.has(nextCompany.id)) {
                        setStatusMessage(`You already applied to ${nextCompany.name}.`);
                        setActiveTab('applications');
                        return;
                      }

                      setApplicationCompany(nextCompany as CompanyRecord);
                    }}
                  />
                  {applicationByCompany.has(company.id) && (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                      Applied already · {applicationByCompany.get(company.id)?.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'applications' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">My applications</h2>
              <p className="text-sm text-slate-500 mt-1">
                Recruiter updates and scores appear here immediately because they share the same local store.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {studentApplications.map((application) => {
                const company = companies.find((entry) => entry.id === application.companyId);
                return (
                  <div key={application.id} className="rounded-3xl bg-white border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{company?.name}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {company?.industry} · {company?.location}
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
                        {application.formData.whyCompany}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {studentApplications.length === 0 && (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title="No applications yet"
                description="Open the companies tab and submit your first local application."
              />
            )}
          </section>
        )}

        {!selectedCompany && !applicationCompany && activeTab === 'offcampus' && (
          <section className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Off-campus opportunities</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Save roles you want to track. The saved state persists in your student record.
                </p>
              </div>
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={opportunitySearch}
                  onChange={(event) => setOpportunitySearch(event.target.value)}
                  placeholder="Search off-campus roles"
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOpportunities.map((opportunity) => {
                const isTracked = student.trackedOffCampusIds.includes(opportunity.id);
                return (
                  <OffCampusCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    isTracked={isTracked}
                    onToggle={() => {
                      toggleOffCampusTracking(student.id, opportunity.id);
                      setStatusMessage(
                        isTracked
                          ? `Removed ${opportunity.title} from your tracked list.`
                          : `Saved ${opportunity.title} to your tracked opportunities.`
                      );
                    }}
                  />
                );
              })}
            </div>
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
              <div className="mt-6 flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <span key={skill} className="text-xs px-3 py-1 rounded-full bg-white/10">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const success = await updateProfile({
                  name: profileForm.name,
                  phone: profileForm.phone,
                  branch: profileForm.branch,
                  cgpa: Number(profileForm.cgpa),
                  skills: profileForm.skills,
                  resumeName: profileForm.resumeName,
                });

                if (success) {
                  setStatusMessage('Profile updated in the local store.');
                }
              }}
              className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Changes made here persist across refreshes in this browser.
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
                  label="Branch"
                  value={profileForm.branch}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, branch: value }))
                  }
                />
                <Input
                  label="CGPA"
                  type="number"
                  value={profileForm.cgpa}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, cgpa: value }))
                  }
                />
                <Input
                  label="Skills"
                  value={profileForm.skills}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, skills: value }))
                  }
                  helper="Comma-separated"
                />
                <Input
                  label="Resume file name"
                  value={profileForm.resumeName}
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      resumeName: value,
                    }))
                  }
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

const OffCampusCard: React.FC<{
  opportunity: OffCampusRecord;
  isTracked: boolean;
  onToggle: () => void;
}> = ({ opportunity, isTracked, onToggle }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-5">
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
    <div className="flex items-center justify-between mt-5">
      <a
        href={opportunity.applicationLink}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Open link
      </a>
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${
          isTracked
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-900 text-white'
        }`}
      >
        {isTracked ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Tracked
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Save
          </>
        )}
      </button>
    </div>
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  type?: string;
}> = ({ label, value, onChange, helper, type = 'text' }) => (
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

export default StudentDashboard;
