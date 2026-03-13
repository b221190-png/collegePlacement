import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockCompanies, mockStudents } from '../data/mockData';
import { mockOffCampusOpportunities } from '../data/offCampusData';
import {
  Application,
  ApplicationForm,
  Company,
  CompanyOnboarding,
  OffCampusOpportunity,
  Student,
} from '../types';

export type UserRole = 'admin' | 'recruiter' | 'student';

export interface DemoUserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  companyId?: string;
  studentId?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface StudentRecord extends Student {
  batch: number;
  linkedUserId?: string;
  resumeName?: string;
  trackedOffCampusIds: string[];
}

export interface CompanyRecord extends Company {
  recruiterEmail: string;
  recruiterName: string;
  recruiterUserId?: string;
  applicationWindow?: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minCGPA?: number;
    branches: string[];
    maxBacklogs?: number;
  };
}

export interface StoredApplicationForm
  extends Omit<ApplicationForm, 'resume'> {
  resumeName: string | null;
}

export interface ApplicationRecord
  extends Omit<Application, 'formData'> {
  formData: StoredApplicationForm;
  updatedAt: string;
}

export interface OffCampusRecord extends OffCampusOpportunity {
  createdAt: string;
  createdBy?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  studentId?: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthPayload {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

interface PlacementState {
  users: DemoUserAccount[];
  students: StudentRecord[];
  companies: CompanyRecord[];
  applications: ApplicationRecord[];
  offCampusOpportunities: OffCampusRecord[];
  resetDemoData: () => void;
  authenticate: (email: string, password: string) => AuthPayload;
  registerUser: (userData: any) => AuthPayload;
  updateProfile: (userId: string, profileData: Record<string, unknown>) => AuthenticatedUser;
  createCompany: (companyData: CompanyOnboarding) => {
    company: CompanyRecord;
    recruiter: Pick<DemoUserAccount, 'email' | 'password' | 'name'>;
  };
  configureApplicationWindow: (payload: {
    companyId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    minCGPA?: number;
    branches: string[];
    maxBacklogs?: number;
  }) => CompanyRecord;
  bulkImportStudents: (students: Array<{
    name: string;
    rollNumber: string;
    email: string;
    phone: string;
    branch: string;
    cgpa: number;
    skills: string[];
    batch?: number;
  }>) => { addedCount: number; skippedCount: number };
  submitApplication: (payload: {
    studentId: string;
    companyId: string;
    formData: ApplicationForm;
  }) => ApplicationRecord;
  updateApplicationStatus: (applicationId: string, status: Application['status']) => ApplicationRecord;
  updateApplicationScore: (applicationId: string, score: number) => ApplicationRecord;
  bulkUpdateApplications: (applicationIds: string[], status: Application['status']) => ApplicationRecord[];
  toggleOffCampusTracking: (studentId: string, opportunityId: string) => StudentRecord;
  createOffCampusOpportunity: (opportunity: Partial<OffCampusOpportunity>, createdBy?: string) => OffCampusRecord;
}

export interface PlacementSnapshot {
  users: DemoUserAccount[];
  students: StudentRecord[];
  companies: CompanyRecord[];
  applications: ApplicationRecord[];
  offCampusOpportunities: OffCampusRecord[];
}

const COMPANY_RECRUITER_MAP: Record<string, { name: string; email: string }> = {
  '1': { name: 'Riya Mehta', email: 'recruiter@juspay.com' },
  '2': { name: 'Maya Rao', email: 'recruiter@google.com' },
  '3': { name: 'Nikhil Arora', email: 'recruiter@microsoft.com' },
  '4': { name: 'Aditi Kapoor', email: 'recruiter@amazon.com' },
  '5': { name: 'Vivek Menon', email: 'recruiter@tcs.com' },
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const makeId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const buildRelativeCompanies = (): CompanyRecord[] => {
  const deadlineOffsets: Record<string, number> = {
    results: -12,
    closed: -4,
    open: 12,
  };

  return mockCompanies.map((company, companyIndex) => {
    const recruiter = COMPANY_RECRUITER_MAP[company.id] || {
      name: `${company.name} Recruiter`,
      email: `recruiter+${company.id}@collegeplacement.com`,
    };

    return {
      ...company,
      applicationDeadline: addDays(
        deadlineOffsets[company.status] + companyIndex * 3
      ),
      rounds: company.rounds.map((round, roundIndex) => ({
        ...round,
        date: addDays(
          company.status === 'results'
            ? -18 + roundIndex * 5
            : 7 + companyIndex * 2 + roundIndex * 4
        ),
      })),
      recruiterEmail: recruiter.email,
      recruiterName: recruiter.name,
    };
  });
};

const buildUsers = (
  students: StudentRecord[],
  companies: CompanyRecord[]
): DemoUserAccount[] => {
  const now = new Date().toISOString();
  const studentLogin = students[0];
  const recruiterCompany = companies.find((company) => company.id === '2') || companies[0];

  const baseUsers: DemoUserAccount[] = [
    {
      id: 'user-admin-1',
      name: 'Placement Admin',
      email: 'admin@collegeplacement.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'user-student-1',
      name: studentLogin.name,
      email: studentLogin.email,
      password: 'student123',
      role: 'student',
      isActive: true,
      studentId: studentLogin.id,
      createdAt: now,
    },
    {
      id: 'user-recruiter-1',
      name: recruiterCompany.recruiterName,
      email: recruiterCompany.recruiterEmail,
      password: 'recruiter123',
      role: 'recruiter',
      isActive: true,
      companyId: recruiterCompany.id,
      createdAt: now,
    },
  ];

  return baseUsers;
};

const buildStudents = (): StudentRecord[] =>
  mockStudents.map((student, index) => ({
    ...student,
    batch: 2025 + (index % 2),
    trackedOffCampusIds: index === 0 ? ['1', '4'] : [],
  }));

const serializeFormData = (
  formData: ApplicationForm
): StoredApplicationForm => {
  const { resume, ...rest } = formData;

  return {
    ...rest,
    cgpa: Number(formData.cgpa),
    resumeName: resume?.name ?? null,
  };
};

const buildApplications = (
  students: StudentRecord[],
  companies: CompanyRecord[]
): ApplicationRecord[] => {
  const now = new Date().toISOString();
  const google = companies.find((company) => company.name === 'Google') || companies[0];
  const microsoft =
    companies.find((company) => company.name === 'Microsoft') || companies[1];
  const tcs = companies.find((company) => company.name === 'TCS') || companies[0];

  const createForm = (student: StudentRecord, whyCompany: string): StoredApplicationForm => ({
    studentName: student.name,
    rollNumber: student.rollNumber,
    email: student.email,
    phone: student.phone,
    branch: student.branch,
    cgpa: student.cgpa,
    skills: student.skills.join(', '),
    experience: 'Built academic and personal projects aligned with the role.',
    whyCompany,
    resumeName: `${student.rollNumber}-resume.pdf`,
  });

  return [
    {
      id: 'app-1',
      studentId: students[0].id,
      companyId: google.id,
      status: 'under-review',
      submittedAt: addDays(-6),
      updatedAt: now,
      score: 82,
      formData: createForm(students[0], 'The engineering culture and scale fit my goals.'),
    },
    {
      id: 'app-2',
      studentId: students[1].id,
      companyId: google.id,
      status: 'shortlisted',
      submittedAt: addDays(-5),
      updatedAt: now,
      score: 91,
      formData: createForm(students[1], 'I want to work on products used globally.'),
    },
    {
      id: 'app-3',
      studentId: students[2].id,
      companyId: google.id,
      status: 'submitted',
      submittedAt: addDays(-4),
      updatedAt: now,
      formData: createForm(students[2], 'The role matches my backend strengths.'),
    },
    {
      id: 'app-4',
      studentId: students[0].id,
      companyId: microsoft.id,
      status: 'submitted',
      submittedAt: addDays(-3),
      updatedAt: now,
      formData: createForm(students[0], 'I want to grow in cloud and platform engineering.'),
    },
    {
      id: 'app-5',
      studentId: students[0].id,
      companyId: tcs.id,
      status: 'shortlisted',
      submittedAt: addDays(-8),
      updatedAt: now,
      score: 88,
      formData: createForm(students[0], 'The training and client exposure are attractive.'),
    },
  ];
};

const buildOffCampusOpportunities = (): OffCampusRecord[] =>
  mockOffCampusOpportunities.map((opportunity, index) => ({
    ...opportunity,
    postedDate: addDays(-12 + index),
    applicationDeadline: addDays(10 + index * 2),
    createdAt: new Date().toISOString(),
  }));

const toAuthenticatedUser = (account: DemoUserAccount): AuthenticatedUser => ({
  id: account.id,
  name: account.name,
  email: account.email,
  role: account.role,
  companyId: account.companyId,
  studentId: account.studentId,
  isActive: account.isActive,
  lastLogin: account.lastLogin,
});

const buildInitialState = (): PlacementSnapshot => {
  const students = buildStudents();
  const companies = buildRelativeCompanies();
  const users = buildUsers(students, companies);
  const applications = buildApplications(students, companies);
  const offCampusOpportunities = buildOffCampusOpportunities();

  return {
    users,
    students: students.map((student) =>
      student.id === users[1].studentId
        ? { ...student, linkedUserId: users[1].id }
        : student
    ),
    companies: companies.map((company) => {
      const recruiter = users.find((user) => user.companyId === company.id);
      return recruiter
        ? { ...company, recruiterUserId: recruiter.id }
        : company;
    }),
    applications,
    offCampusOpportunities,
  };
};

export const getPlacementSnapshot = (): PlacementSnapshot => {
  const state = usePlacementStore.getState();

  return {
    users: state.users,
    students: state.students,
    companies: state.companies,
    applications: state.applications,
    offCampusOpportunities: state.offCampusOpportunities,
  };
};

export const getStudentByUser = (
  state: PlacementSnapshot,
  user?: AuthenticatedUser | null
) =>
  user?.studentId
    ? state.students.find((student) => student.id === user.studentId) || null
    : null;

export const getCompanyByUser = (
  state: PlacementSnapshot,
  user?: AuthenticatedUser | null
) =>
  user?.companyId
    ? state.companies.find((company) => company.id === user.companyId) || null
    : null;

export const getApplicationsForStudent = (
  state: PlacementSnapshot,
  studentId: string
) =>
  state.applications.filter((application) => application.studentId === studentId);

export const getApplicationsForCompany = (
  state: PlacementSnapshot,
  companyId: string
) =>
  state.applications
    .filter((application) => application.companyId === companyId)
    .map((application) => ({
      ...application,
      student:
        state.students.find((student) => student.id === application.studentId) ||
        null,
      company:
        state.companies.find((company) => company.id === application.companyId) ||
        null,
    }))
    .filter((application) => application.student);

export const getAdminStats = (state: PlacementSnapshot) => ({
  totalCompanies: state.companies.length,
  activeCompanies: state.companies.filter((company) => company.status === 'open').length,
  totalStudents: state.students.length,
  totalApplications: state.applications.length,
  pendingApplications: state.applications.filter(
    (application) => application.status === 'submitted'
  ).length,
});

export const getRecruiterStats = (
  state: PlacementSnapshot,
  companyId: string
) => {
  const applications = state.applications.filter(
    (application) => application.companyId === companyId
  );
  const scored = applications.filter(
    (application) => typeof application.score === 'number'
  );

  return {
    totalApplications: applications.length,
    applicationsInReview: applications.filter(
      (application) => application.status === 'under-review'
    ).length,
    shortlistedApplications: applications.filter(
      (application) => application.status === 'shortlisted'
    ).length,
    averageScore:
      scored.length > 0
        ? Number(
            (
              scored.reduce(
                (total, application) => total + Number(application.score || 0),
                0
              ) / scored.length
            ).toFixed(1)
          )
        : 0,
  };
};

export const getStudentStats = (
  state: PlacementSnapshot,
  studentId: string
) => {
  const applications = getApplicationsForStudent(state, studentId);
  const companiesApplied = new Set(
    applications.map((application) => application.companyId)
  ).size;

  return {
    totalApplications: applications.length,
    companiesApplied,
    applicationsInReview: applications.filter((application) =>
      ['submitted', 'under-review'].includes(application.status)
    ).length,
  };
};

export const usePlacementStore = create<PlacementState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      resetDemoData: () => {
        set(buildInitialState());
      },

      authenticate: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (account) => account.email.toLowerCase() === normalizedEmail
        );

        if (!user || user.password !== password) {
          throw new Error('Invalid email or password');
        }

        const lastLogin = new Date().toISOString();

        set((state) => ({
          users: state.users.map((account) =>
            account.id === user.id ? { ...account, lastLogin } : account
          ),
        }));

        return {
          user: toAuthenticatedUser({ ...user, lastLogin }),
          accessToken: `mock-access-${user.id}`,
          refreshToken: `mock-refresh-${user.id}`,
        };
      },

      registerUser: (userData) => {
        const normalizedEmail = String(userData.email).trim().toLowerCase();
        const existingUser = get().users.find(
          (account) => account.email.toLowerCase() === normalizedEmail
        );

        if (existingUser) {
          throw new Error('An account with this email already exists');
        }

        const now = new Date().toISOString();
        const role = (userData.role || 'student') as UserRole;
        const newUser: DemoUserAccount = {
          id: makeId('user'),
          name: String(userData.name).trim(),
          email: normalizedEmail,
          password: String(userData.password),
          role,
          isActive: true,
          createdAt: now,
          lastLogin: now,
        };

        let newStudent: StudentRecord | null = null;
        if (role === 'student') {
          const studentData = userData.studentData || {};
          const rollNumber = String(studentData.rollNumber || '').trim().toUpperCase();

          if (
            get().students.some(
              (student) => student.rollNumber.toUpperCase() === rollNumber
            )
          ) {
            throw new Error('A student with this roll number already exists');
          }

          newStudent = {
            id: makeId('student'),
            name: newUser.name,
            rollNumber,
            branch: String(studentData.branch || 'Computer Science'),
            email: normalizedEmail,
            cgpa: Number(studentData.cgpa || 0),
            phone: String(studentData.phone || ''),
            skills: Array.isArray(studentData.skills) ? studentData.skills : [],
            batch: Number(studentData.batch || new Date().getFullYear()),
            linkedUserId: newUser.id,
            trackedOffCampusIds: [],
          };
          newUser.studentId = newStudent.id;
        }

        set((state) => ({
          users: [...state.users, newUser],
          students: newStudent ? [...state.students, newStudent] : state.students,
        }));

        return {
          user: toAuthenticatedUser(newUser),
          accessToken: `mock-access-${newUser.id}`,
          refreshToken: `mock-refresh-${newUser.id}`,
        };
      },

      updateProfile: (userId, profileData) => {
        const currentState = get();
        const user = currentState.users.find((account) => account.id === userId);

        if (!user) {
          throw new Error('User not found');
        }

        const updatedUser: DemoUserAccount = {
          ...user,
          name: String(profileData.name || user.name),
        };

        set((state) => ({
          users: state.users.map((account) =>
            account.id === userId ? updatedUser : account
          ),
          students: state.students.map((student) =>
            user.studentId && student.id === user.studentId
              ? {
                  ...student,
                  name: String(profileData.name || student.name),
                  phone: String(profileData.phone || student.phone),
                  branch: String(profileData.branch || student.branch),
                  cgpa:
                    profileData.cgpa !== undefined
                      ? Number(profileData.cgpa)
                      : student.cgpa,
                  skills: Array.isArray(profileData.skills)
                    ? profileData.skills
                    : typeof profileData.skills === 'string'
                      ? String(profileData.skills)
                          .split(',')
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                      : student.skills,
                  resumeName: String(profileData.resumeName || student.resumeName || ''),
                }
              : student
          ),
        }));

        return toAuthenticatedUser(updatedUser);
      },

      createCompany: (companyData) => {
        const normalizedRecruiterEmail = companyData.recruiterEmail
          .trim()
          .toLowerCase();
        const state = get();

        if (
          state.users.some(
            (user) => user.email.toLowerCase() === normalizedRecruiterEmail
          )
        ) {
          throw new Error('Recruiter email already exists');
        }

        const companyId = makeId('company');
        const recruiterUserId = makeId('user');
        const recruiterPassword = 'recruiter123';
        const status =
          new Date(companyData.applicationDeadline) >= new Date()
            ? 'open'
            : 'closed';

        const company: CompanyRecord = {
          id: companyId,
          name: companyData.name,
          logo:
            companyData.logo ||
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=100',
          description: companyData.description,
          industry: companyData.industry,
          location: companyData.location,
          packageOffered: companyData.packageOffered,
          applicationDeadline: companyData.applicationDeadline,
          status,
          requirements: companyData.requirements.filter(Boolean),
          totalPositions: Number(companyData.totalPositions),
          rounds: companyData.rounds
            .filter((round) => round.name && round.date)
            .map((round) => ({
              id: makeId('round'),
              name: round.name,
              description: round.description,
              date: round.date,
              status:
                new Date(round.date) > new Date() ? 'upcoming' : 'completed',
              selectedStudents: [],
              totalApplied: 0,
            })),
          recruiterEmail: normalizedRecruiterEmail,
          recruiterName: companyData.recruiterName,
          recruiterUserId,
        };

        const recruiter: DemoUserAccount = {
          id: recruiterUserId,
          name: companyData.recruiterName,
          email: normalizedRecruiterEmail,
          password: recruiterPassword,
          role: 'recruiter',
          isActive: true,
          companyId,
          createdAt: new Date().toISOString(),
        };

        set((current) => ({
          companies: [company, ...current.companies],
          users: [recruiter, ...current.users],
        }));

        return {
          company,
          recruiter: {
            email: recruiter.email,
            password: recruiter.password,
            name: recruiter.name,
          },
        };
      },

      configureApplicationWindow: (payload) => {
        let updatedCompany: CompanyRecord | null = null;

        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== payload.companyId) {
              return company;
            }

            updatedCompany = {
              ...company,
              applicationDeadline: payload.endDate,
              status: new Date(payload.endDate) >= new Date() ? 'open' : 'closed',
              applicationWindow: {
                startDate: payload.startDate,
                endDate: payload.endDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
                minCGPA: payload.minCGPA,
                branches: payload.branches,
                maxBacklogs: payload.maxBacklogs,
              },
            };

            return updatedCompany;
          }),
        }));

        if (!updatedCompany) {
          throw new Error('Company not found');
        }

        return updatedCompany;
      },

      bulkImportStudents: (studentsToImport) => {
        const state = get();
        const existingEmails = new Set(
          state.users.map((user) => user.email.toLowerCase())
        );
        const existingRollNumbers = new Set(
          state.students.map((student) => student.rollNumber.toUpperCase())
        );
        const nextUsers: DemoUserAccount[] = [];
        const nextStudents: StudentRecord[] = [];

        studentsToImport.forEach((studentRow) => {
          const email = studentRow.email.trim().toLowerCase();
          const rollNumber = studentRow.rollNumber.trim().toUpperCase();

          if (existingEmails.has(email) || existingRollNumbers.has(rollNumber)) {
            return;
          }

          const userId = makeId('user');
          const studentId = makeId('student');

          nextUsers.push({
            id: userId,
            name: studentRow.name.trim(),
            email,
            password: 'student123',
            role: 'student',
            isActive: true,
            studentId,
            createdAt: new Date().toISOString(),
          });

          nextStudents.push({
            id: studentId,
            name: studentRow.name.trim(),
            rollNumber,
            branch: studentRow.branch.trim(),
            email,
            cgpa: Number(studentRow.cgpa),
            phone: studentRow.phone.trim(),
            skills: studentRow.skills,
            batch: Number(studentRow.batch || new Date().getFullYear()),
            linkedUserId: userId,
            trackedOffCampusIds: [],
          });

          existingEmails.add(email);
          existingRollNumbers.add(rollNumber);
        });

        if (nextStudents.length > 0) {
          set((current) => ({
            users: [...current.users, ...nextUsers],
            students: [...current.students, ...nextStudents],
          }));
        }

        return {
          addedCount: nextStudents.length,
          skippedCount: studentsToImport.length - nextStudents.length,
        };
      },

      submitApplication: ({ studentId, companyId, formData }) => {
        const state = get();
        const existingApplication = state.applications.find(
          (application) =>
            application.studentId === studentId &&
            application.companyId === companyId
        );

        if (existingApplication) {
          throw new Error('You have already applied to this company');
        }

        const company = state.companies.find((entry) => entry.id === companyId);
        if (!company) {
          throw new Error('Company not found');
        }

        const serializedForm = serializeFormData(formData);
        const application: ApplicationRecord = {
          id: makeId('application'),
          studentId,
          companyId,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          formData: serializedForm,
        };

        set((current) => ({
          applications: [application, ...current.applications],
          companies: current.companies.map((entry) =>
            entry.id === companyId
              ? {
                  ...entry,
                  rounds: entry.rounds.map((round, index) =>
                    index === 0
                      ? { ...round, totalApplied: round.totalApplied + 1 }
                      : round
                  ),
                }
              : entry
          ),
        }));

        return application;
      },

      updateApplicationStatus: (applicationId, status) => {
        let updatedApplication: ApplicationRecord | null = null;

        set((state) => ({
          applications: state.applications.map((application) => {
            if (application.id !== applicationId) {
              return application;
            }

            updatedApplication = {
              ...application,
              status,
              updatedAt: new Date().toISOString(),
            };
            return updatedApplication;
          }),
        }));

        if (!updatedApplication) {
          throw new Error('Application not found');
        }

        return updatedApplication;
      },

      updateApplicationScore: (applicationId, score) => {
        let updatedApplication: ApplicationRecord | null = null;

        set((state) => ({
          applications: state.applications.map((application) => {
            if (application.id !== applicationId) {
              return application;
            }

            updatedApplication = {
              ...application,
              score: Number.isFinite(score) ? score : undefined,
              updatedAt: new Date().toISOString(),
            };
            return updatedApplication;
          }),
        }));

        if (!updatedApplication) {
          throw new Error('Application not found');
        }

        return updatedApplication;
      },

      bulkUpdateApplications: (applicationIds, status) => {
        const updated: ApplicationRecord[] = [];

        set((state) => ({
          applications: state.applications.map((application) => {
            if (!applicationIds.includes(application.id)) {
              return application;
            }

            const updatedApplication = {
              ...application,
              status,
              updatedAt: new Date().toISOString(),
            };
            updated.push(updatedApplication);
            return updatedApplication;
          }),
        }));

        return updated;
      },

      toggleOffCampusTracking: (studentId, opportunityId) => {
        let updatedStudent: StudentRecord | null = null;

        set((state) => ({
          students: state.students.map((student) => {
            if (student.id !== studentId) {
              return student;
            }

            const trackedOffCampusIds = student.trackedOffCampusIds.includes(
              opportunityId
            )
              ? student.trackedOffCampusIds.filter((id) => id !== opportunityId)
              : [...student.trackedOffCampusIds, opportunityId];

            updatedStudent = {
              ...student,
              trackedOffCampusIds,
            };

            return updatedStudent;
          }),
        }));

        if (!updatedStudent) {
          throw new Error('Student not found');
        }

        return updatedStudent;
      },

      createOffCampusOpportunity: (opportunity, createdBy) => {
        const nextOpportunity: OffCampusRecord = {
          id: makeId('off-campus'),
          title: String(opportunity.title || 'Untitled opportunity'),
          company: String(opportunity.company || 'Unknown company'),
          companyLogo:
            String(opportunity.companyLogo || '') ||
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=100',
          type: (opportunity.type || 'full-time') as OffCampusOpportunity['type'],
          location: String(opportunity.location || 'Remote'),
          isRemote: Boolean(opportunity.isRemote),
          duration: opportunity.duration,
          stipend: opportunity.stipend,
          salary: opportunity.salary,
          description: String(opportunity.description || ''),
          requirements: Array.isArray(opportunity.requirements)
            ? opportunity.requirements
            : [],
          skills: Array.isArray(opportunity.skills) ? opportunity.skills : [],
          applicationDeadline: String(opportunity.applicationDeadline || addDays(14)),
          postedDate: new Date().toISOString().slice(0, 10),
          applicationLink: String(opportunity.applicationLink || 'https://example.com/apply'),
          industry: String(opportunity.industry || 'General'),
          experience: (opportunity.experience || 'any') as OffCampusOpportunity['experience'],
          createdAt: new Date().toISOString(),
          createdBy,
        };

        set((state) => ({
          offCampusOpportunities: [nextOpportunity, ...state.offCampusOpportunities],
        }));

        return nextOpportunity;
      },
    }),
    {
      name: 'placement-demo-store-v1',
      version: 1,
    }
  )
);
