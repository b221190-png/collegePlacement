import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  LogOut,
  Search,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { applicationsService, companiesService } from '../services';
import { handleApiError } from '../utils/api';

type Tab = 'applications' | 'analytics';

interface ApplicationViewModel {
  id: string;
  studentName: string;
  studentRollNumber: string;
  studentBranch: string;
  skills: string[];
  status: string;
  score: number | null;
}

const RECRUITER_APPLICATION_FETCH_LIMIT = 100;

const RecruiterDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [companyName, setCompanyName] = useState('Recruiter Portal');
  const [applications, setApplications] = useState<ApplicationViewModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const mapApplication = (application: any): ApplicationViewModel => {
    const rawSkills = application.formData?.skills;
    const normalizedSkills = Array.isArray(rawSkills)
      ? rawSkills
      : typeof rawSkills === 'string'
        ? rawSkills
            .split(',')
            .map((skill: string) => skill.trim())
            .filter(Boolean)
        : [];

    return {
      id: String(application._id),
      studentName: String(application.studentId?.userId?.name || 'Student'),
      studentRollNumber: String(application.studentId?.rollNumber || '-'),
      studentBranch: String(application.studentId?.branch || '-'),
      skills: normalizedSkills,
      status: String(application.status || 'submitted'),
      score: typeof application.score === 'number' ? application.score : null,
    };
  };

  const loadData = async () => {
    if (!user?.companyId) {
      return;
    }

    try {
      const [companyResponse, applicationsResponse] = await Promise.all([
        companiesService.getCompany(user.companyId),
        applicationsService.getApplications({
          limit: RECRUITER_APPLICATION_FETCH_LIMIT,
        }),
      ]);

      const company = companyResponse?.data?.company;
      setCompanyName(company?.name || 'Recruiter Portal');

      const list = (applicationsResponse?.data?.applications || []) as any[];
      setApplications(list.map(mapApplication));
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  useEffect(() => {
    void loadData();
  }, [user?.companyId]);

  const filteredApplications = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return applications.filter((application) => {
      const matchesSearch =
        application.studentName.toLowerCase().includes(search) ||
        application.studentRollNumber.toLowerCase().includes(search);
      const matchesStatus =
        statusFilter === 'all' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const applicationsInReview = applications.filter((app) =>
      ['submitted', 'under-review'].includes(app.status)
    ).length;
    const shortlistedApplications = applications.filter(
      (app) => app.status === 'shortlisted'
    ).length;
    const scored = applications.filter((app) => typeof app.score === 'number');
    const averageScore =
      scored.length > 0
        ? Number(
            (scored.reduce((sum, app) => sum + Number(app.score), 0) / scored.length).toFixed(1)
          )
        : 0;

    return {
      totalApplications,
      applicationsInReview,
      shortlistedApplications,
      averageScore,
    };
  }, [applications]);

  const analytics = useMemo(() => {
    const byBranch = filteredApplications.reduce<Record<string, number>>(
      (accumulator, application) => {
        const branch = application.studentBranch || 'Unknown';
        accumulator[branch] = (accumulator[branch] || 0) + 1;
        return accumulator;
      },
      {}
    );

    const byStatus = filteredApplications.reduce<Record<string, number>>(
      (accumulator, application) => {
        accumulator[application.status] = (accumulator[application.status] || 0) + 1;
        return accumulator;
      },
      {}
    );

    return { byBranch, byStatus };
  }, [filteredApplications]);

  const exportSelected = () => {
    const rows = filteredApplications.filter((application) =>
      selectedApplications.includes(application.id)
    );
    const csv = [
      ['Student', 'Roll Number', 'Status', 'Score'],
      ...rows.map((application) => [
        application.studentName,
        application.studentRollNumber,
        application.status,
        String(application.score ?? ''),
      ]),
    ]
      .map((row) => row.map((value) => `"${value}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${companyName || 'applications'}-export.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateScore = async (applicationId: string, score: number) => {
    try {
      await applicationsService.updateApplicationScore(applicationId, { score });
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, score } : application
        )
      );
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  const updateStatus = async (applicationId: string, status: string, studentName: string) => {
    try {
      await applicationsService.updateApplicationStatus(applicationId, { status });
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, status } : application
        )
      );
      setStatusMessage(`${studentName} is now ${status}.`);
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  const bulkUpdateStatus = async (status: 'shortlisted' | 'rejected') => {
    try {
      await applicationsService.bulkUpdateApplications({
        applicationIds: selectedApplications,
        status,
      });
      setApplications((current) =>
        current.map((application) =>
          selectedApplications.includes(application.id)
            ? { ...application, status }
            : application
        )
      );
      setSelectedApplications([]);
      setStatusMessage(
        status === 'shortlisted'
          ? 'Selected applications were shortlisted.'
          : 'Selected applications were rejected.'
      );
    } catch (error) {
      setStatusMessage(handleApiError(error));
    }
  };

  if (!user?.companyId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center max-w-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Recruiter company not found</h1>
          <p className="text-slate-600 mt-3">
            This recruiter account is not linked to a company.
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-200/70">
                Recruiter Portal
              </p>
              <h1 className="text-3xl font-bold mt-2">{companyName}</h1>
              <p className="text-slate-300 mt-2">
                Review applicants, score candidates, and update hiring outcomes.
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard value={stats.totalApplications} label="Applications" color="text-blue-600" />
            <StatCard value={stats.applicationsInReview} label="In review" color="text-orange-600" />
            <StatCard value={stats.shortlistedApplications} label="Shortlisted" color="text-emerald-600" />
            <StatCard value={stats.averageScore} label="Avg score" color="text-violet-600" />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {(
              [
                ['applications', 'Applications'],
                ['analytics', 'Analytics'],
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

        {activeTab === 'applications' && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name or roll number"
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                >
                  <option value="all">All statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="selected">Selected</option>
                </select>

                {selectedApplications.length > 0 && (
                  <>
                    <button
                      onClick={() => void bulkUpdateStatus('shortlisted')}
                      className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-medium"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => void bulkUpdateStatus('rejected')}
                      className="px-4 py-3 rounded-2xl bg-rose-600 text-white text-sm font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={exportSelected}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredApplications.length > 0 &&
                            selectedApplications.length === filteredApplications.length
                          }
                          onChange={(event) =>
                            setSelectedApplications(
                              event.target.checked
                                ? filteredApplications.map((application) => application.id)
                                : []
                            )
                          }
                        />
                      </th>
                      {['Student', 'Branch', 'Skills', 'Score', 'Status'].map((heading) => (
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
                    {filteredApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application.id)}
                            onChange={(event) =>
                              setSelectedApplications((current) =>
                                event.target.checked
                                  ? [...current, application.id]
                                  : current.filter((entry) => entry !== application.id)
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-slate-900">
                            {application.studentName}
                          </div>
                          <div className="text-slate-500">{application.studentRollNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {application.studentBranch}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {application.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={application.score ?? ''}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              void updateScore(application.id, value);
                            }}
                            className="w-24 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-900"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={application.status}
                            onChange={(event) => {
                              void updateStatus(
                                application.id,
                                event.target.value,
                                application.studentName
                              );
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-900"
                          >
                            {['submitted', 'under-review', 'shortlisted', 'selected', 'rejected'].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredApplications.length === 0 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="text-lg font-semibold text-slate-900 mt-4">
                  No applications match the current filters
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <AnalyticsCard
              title="Applications by branch"
              icon={<Users className="w-5 h-5" />}
              rows={analytics.byBranch}
            />
            <AnalyticsCard
              title="Pipeline status"
              icon={<BarChart3 className="w-5 h-5" />}
              rows={analytics.byStatus}
            />
            <div className="rounded-3xl bg-white border border-slate-200 p-6 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">Top candidates</div>
                  <div className="text-sm text-slate-500 mt-1">
                    Highest-scoring candidates currently in your pipeline.
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                {applications
                  .filter((application) => typeof application.score === 'number')
                  .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
                  .slice(0, 6)
                  .map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="font-semibold text-slate-900">
                        {application.studentName}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {application.studentRollNumber} · {application.studentBranch}
                      </div>
                      <div className="text-sm text-slate-700 mt-3">
                        Score {application.score}
                      </div>
                    </div>
                  ))}
              </div>
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
  <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-slate-300 mt-1">{label}</div>
  </div>
);

const AnalyticsCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  rows: Record<string, number>;
}> = ({ title, icon, rows }) => (
  <div className="rounded-3xl bg-white border border-slate-200 p-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-lg font-semibold text-slate-900">{title}</div>
    </div>

    <div className="space-y-3 mt-6">
      {Object.entries(rows).map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3"
        >
          <span className="text-sm text-slate-700 capitalize">{label}</span>
          <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RecruiterDashboard;
