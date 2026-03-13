import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  LogOut,
  Search,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  getApplicationsForCompany,
  getCompanyByUser,
  getPlacementSnapshot,
  getRecruiterStats,
  usePlacementStore,
} from '../store/placementStore';

type Tab = 'applications' | 'analytics';

const RecruiterDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const applications = usePlacementStore((state) => state.applications);
  const students = usePlacementStore((state) => state.students);
  const companies = usePlacementStore((state) => state.companies);
  const updateApplicationStatus = usePlacementStore(
    (state) => state.updateApplicationStatus
  );
  const updateApplicationScore = usePlacementStore(
    (state) => state.updateApplicationScore
  );
  const bulkUpdateApplications = usePlacementStore(
    (state) => state.bulkUpdateApplications
  );

  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const snapshot = useMemo(
    () => getPlacementSnapshot(),
    [applications, companies, students]
  );
  const company = useMemo(() => getCompanyByUser(snapshot, user), [snapshot, user]);
  const companyApplications = useMemo(
    () => (company ? getApplicationsForCompany(snapshot, company.id) : []),
    [snapshot, company]
  );
  const stats = useMemo(
    () => (company ? getRecruiterStats(snapshot, company.id) : null),
    [snapshot, company]
  );

  const filteredApplications = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return companyApplications.filter((application) => {
      const matchesSearch =
        application.student?.name.toLowerCase().includes(search) ||
        application.student?.rollNumber.toLowerCase().includes(search);
      const matchesStatus =
        statusFilter === 'all' || application.status === statusFilter;
      return Boolean(matchesSearch) && matchesStatus;
    });
  }, [companyApplications, searchTerm, statusFilter]);

  const analytics = useMemo(() => {
    const byBranch = filteredApplications.reduce<Record<string, number>>(
      (accumulator, application) => {
        const branch = application.student?.branch || 'Unknown';
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
        application.student?.name || '',
        application.student?.rollNumber || '',
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
    anchor.download = `${company?.name || 'applications'}-export.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!company || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center max-w-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Recruiter company not found</h1>
          <p className="text-slate-600 mt-3">
            This recruiter account is not linked to a company. Contact an administrator to complete account setup.
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
              <h1 className="text-3xl font-bold mt-2">{company.name}</h1>
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
                      onClick={() => {
                        bulkUpdateApplications(selectedApplications, 'shortlisted');
                        setStatusMessage('Selected applications were shortlisted.');
                        setSelectedApplications([]);
                      }}
                      className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-medium"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => {
                        bulkUpdateApplications(selectedApplications, 'rejected');
                        setStatusMessage('Selected applications were rejected.');
                        setSelectedApplications([]);
                      }}
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
                            {application.student?.name}
                          </div>
                          <div className="text-slate-500">{application.student?.rollNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {application.student?.branch}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {application.student?.skills.slice(0, 3).map((skill) => (
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
                              updateApplicationScore(application.id, value);
                            }}
                            className="w-24 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-900"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={application.status}
                            onChange={(event) => {
                              updateApplicationStatus(
                                application.id,
                                event.target.value as typeof application.status
                              );
                              setStatusMessage(
                                `${application.student?.name} is now ${event.target.value}.`
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
                    Highest-scoring candidates currently in your local pipeline.
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                {companyApplications
                  .filter((application) => typeof application.score === 'number')
                  .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
                  .slice(0, 6)
                  .map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="font-semibold text-slate-900">
                        {application.student?.name}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {application.student?.rollNumber} · {application.student?.branch}
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
