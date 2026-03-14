import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5001/api';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_MD_PATH = path.resolve(__dirname, '../reports/frontend-api-audit.md');
const REPORT_JSON_PATH = path.resolve(__dirname, '../reports/frontend-api-audit.json');

const now = new Date();
const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const shortStamp = String(Date.now()).slice(-6);

const tempStudent = {
  name: `Frontend Audit Student ${shortStamp}`,
  email: `frontend.audit.student.${shortStamp}@college.edu`,
  password: 'Audit123',
  newPassword: 'Audit456',
  role: 'student',
  studentData: {
    rollNumber: `AUD${shortStamp}`,
    branch: 'Computer Science',
    cgpa: 8.4,
    phone: '9876543211',
    batch: 2026,
    skills: ['React', 'Node.js', 'TypeScript'],
  },
};

const tempRecruiter = {
  name: `Frontend Audit Recruiter ${shortStamp}`,
  email: `frontend.audit.recruiter.${shortStamp}@company.com`,
};

const tempCompany = {
  name: `Frontend Audit Company ${shortStamp}`,
  description:
    'Temporary company created by the frontend API audit script to validate onboarding and application flows.',
  industry: 'Information Technology',
  location: 'Jaipur',
  packageOffered: '18 LPA',
  totalPositions: 3,
  applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  requirements: ['React', 'Node.js', 'REST APIs'],
  skills: ['React', 'Node.js', 'REST APIs'],
  recruitmentProcess: [
    {
      roundName: 'Online Assessment',
      description: 'Aptitude and coding test',
      duration: 'TBD',
    },
    {
      roundName: 'Technical Interview',
      description: 'Core engineering interview',
      duration: 'TBD',
    },
  ],
  contactEmail: tempRecruiter.email,
  recruiterName: tempRecruiter.name,
  recruiterEmail: tempRecruiter.email,
};

const tempWindow = {
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  startTime: '00:00',
  endTime: '23:59',
  minCGPA: 7,
  maxBacklogs: 0,
  eligibleBranches: ['Computer Science'],
};

const tempOpportunity = {
  title: `Frontend Audit Opportunity ${shortStamp}`,
  company: tempCompany.name,
  type: 'full-time',
  location: 'Remote',
  isRemote: true,
  description:
    'Temporary off-campus role used by the audit script to validate the admin opportunity form and student listing.',
  skills: ['React', 'TypeScript'],
  requirements: [
    'Working knowledge of React',
    'Working knowledge of TypeScript',
  ],
  applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  applicationLink: 'https://example.com/apply',
  industry: 'Information Technology',
  experience: 'fresher',
  salary: '12 LPA',
};

const tempImportedStudent = {
  name: `Bulk Audit Student ${shortStamp}`,
  email: `frontend.audit.bulk.${shortStamp}@college.edu`,
  password: 'student123',
  rollNumber: `BLK${shortStamp}`,
  branch: 'Computer Science',
  cgpa: 7.9,
  phone: '9876543212',
  batch: 2026,
  skills: ['JavaScript', 'SQL'],
};

const frontendOnlyFeatures = [
  {
    feature: 'Auth role selection',
    trigger: 'Role card click in AuthWrapper',
    endpoint: 'N/A',
    notes:
      'Changes the selected role and pre-fills credentials locally in the login form. No backend request.',
  },
  {
    feature: 'Student auth mode toggle',
    trigger: '"Create account" / "Back to login" button',
    endpoint: 'N/A',
    notes:
      'Switches between LoginForm and RegistrationForm locally. No API call until submit.',
  },
  {
    feature: 'Forgot/reset view switching',
    trigger: 'Forgot password / Back buttons / close buttons',
    endpoint: 'N/A',
    notes:
      'Only changes the rendered auth sub-view. Backend is touched only on form submit.',
  },
  {
    feature: 'Student company search',
    trigger: 'Search input in StudentDashboard companies tab',
    endpoint: 'N/A',
    notes: 'Client-side filter over the already loaded companies array.',
  },
  {
    feature: 'Student off-campus search',
    trigger: 'Search input in StudentDashboard off-campus tab',
    endpoint: 'N/A',
    notes: 'Client-side filter over the already loaded opportunities array.',
  },
  {
    feature: 'Recruiter filters and selection',
    trigger: 'Search box, status dropdown, row checkboxes',
    endpoint: 'N/A',
    notes:
      'All filtering and selection state stays in React state. API is touched only for score/status/bulk actions.',
  },
  {
    feature: 'CSV export actions',
    trigger: 'Export selected applications / Export students buttons',
    endpoint: 'N/A',
    notes:
      'Builds CSV in the browser and downloads it with Blob + object URL. No backend export API is used here.',
  },
  {
    feature: 'Student CSV template + preview',
    trigger: 'Download template / Upload CSV / Back buttons in StudentBulkUpload',
    endpoint: 'N/A',
    notes:
      'Template generation and CSV parsing happen entirely in the browser. Import starts API calls only after clicking "Import students".',
  },
  {
    feature: 'Dashboard tab navigation',
    trigger: 'Overview/Companies/Students/etc. tab buttons',
    endpoint: 'N/A',
    notes:
      'Switches active tab in component state. No new backend request is fired by the tab switch itself.',
  },
  {
    feature: 'Off-campus external apply link',
    trigger: '"Open link" anchor in StudentDashboard',
    endpoint: 'External URL',
    notes:
      'Navigates to the third-party applicationLink value. It does not call this backend.',
  },
];

const unwiredClientServiceMethods = [
  'studentsService.deleteStudent',
  'studentsService.uploadResume',
  'studentsService.getEligibleStudents',
  'studentsService.bulkUpload',
  'applicationsService.getApplication',
  'applicationsService.getCompanyApplications',
  'applicationsService.getStats',
  'applicationWindowsService.getWindows',
  'applicationWindowsService.getActiveWindows',
  'applicationWindowsService.getUpcomingWindows',
  'applicationWindowsService.getWindow',
  'applicationWindowsService.updateWindow',
  'applicationWindowsService.deleteWindow',
  'applicationWindowsService.deactivateWindow',
  'offCampusService.getFeaturedOpportunities',
  'offCampusService.getOpportunity',
  'offCampusService.updateOpportunity',
  'offCampusService.deleteOpportunity',
  'offCampusService.trackApplication',
  'companiesService.updateCompany',
  'companiesService.deleteCompany',
  'companiesService.createRound',
  'companiesService.getRounds',
  'companiesService.searchCompanies',
  'companiesService.getStats',
  'dashboardService.getAdminDashboard',
  'dashboardService.getRecruiterDashboard',
  'dashboardService.getStudentDashboard',
  'dashboardService.getOverallAnalytics',
];

const results = [];

const studentApplicationPayload = (studentProfile, companyId) => {
  const raw = {
    studentName: tempStudent.name,
    email: tempStudent.email,
    phone: tempStudent.studentData.phone,
    cgpa: tempStudent.studentData.cgpa,
    skills: tempStudent.studentData.skills.join(', '),
    experience: 'Built full-stack student projects and internship assignments.',
    whyCompany: 'The role aligns with my frontend and API integration experience.',
    resume: null,
  };

  const mapped = {
    personalInfo: {
      name: raw.studentName,
      email: raw.email,
      phone: raw.phone,
      address: '',
    },
    academicInfo: {
      graduationCGPA: Number(raw.cgpa),
      currentBacklogs: 0,
    },
    skills: raw.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    projectDetails: [],
    experienceDetails: [],
    achievements: [],
    additionalInfo: [raw.experience, raw.whyCompany].filter(Boolean).join('\n\n'),
  };

  const form = new FormData();
  form.append('companyId', companyId);
  form.append('formData', JSON.stringify(mapped));

  return {
    form,
    reportPayload: {
      companyId,
      formData: mapped,
      resume: null,
      sourceStudentProfileId: studentProfile?._id || 'unknown',
    },
  };
};

function maskHeaders(headers) {
  const masked = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === 'authorization') {
      masked[key] = 'Bearer <token>';
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function safeStringify(value) {
  if (value === undefined) {
    return 'None';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function summarizeResponse(response, body) {
  if (typeof body === 'string') {
    return `${response.status} ${response.statusText}: ${body}`;
  }

  const message = body?.message ? `message=${body.message}` : null;
  const errors = Array.isArray(body?.errors)
    ? body.errors
        .map((entry) => entry?.msg || entry?.message || String(entry))
        .filter(Boolean)
        .join('; ')
    : null;
  const keys = body?.data && typeof body.data === 'object'
    ? `dataKeys=${Object.keys(body.data).join(',')}`
    : null;

  return [response.status, response.statusText, message, errors, keys]
    .filter(Boolean)
    .join(' | ');
}

function shorten(value, max = 180) {
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
}

function escapeCell(value) {
  return shorten(value ?? 'None').replace(/\|/g, '\\|');
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function executeCheck({
  feature,
  trigger,
  endpoint,
  method = 'GET',
  token,
  json,
  formData,
  reportHeaders,
  reportPayload,
  expected = (response) => response.ok,
  notes = '',
  redirect = 'follow',
}) {
  const headers = {};

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : formData,
    redirect,
  });

  const body = await parseBody(response);
  const passed = expected(response, body);

  const result = {
    feature,
    trigger,
    endpoint: `${API_BASE}${endpoint}`,
    method,
    headers: reportHeaders || maskHeaders(headers),
    payload:
      reportPayload !== undefined
        ? reportPayload
        : json !== undefined
          ? json
          : formData
            ? 'multipart/form-data'
            : undefined,
    backendResponse: {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    },
    status: passed ? 'Pass' : 'Fail',
    notes,
  };

  results.push(result);
  return { response, body, passed, result };
}

function extractUserProfileId(body) {
  return (
    body?.data?.user?.profile?._id ||
    body?.data?.user?.profile?.student?._id ||
    body?.data?.user?.profile?.id ||
    null
  );
}

async function main() {
  const context = {
    admin: null,
    student: null,
    recruiter: null,
    companyId: null,
    applicationId: null,
    studentProfileId: null,
  };

  await executeCheck({
    feature: 'Google sign-in entry point',
    trigger: '"Continue with Google" button in LoginForm',
    endpoint:
      '/auth/google/start?role=student&frontendOrigin=http%3A%2F%2Flocalhost%3A5173',
    method: 'GET',
    expected: (response) =>
      response.status === 302 &&
      (response.headers.get('location') || '').includes(
        'accounts.google.com/o/oauth2/v2/auth'
      ),
    notes:
      'Happy-path Google callback cannot be completed without a real OAuth code, but the frontend trigger reaches the expected redirect endpoint.',
    redirect: 'manual',
  });

  const adminLogin = await executeCheck({
    feature: 'Admin sign-in',
    trigger: 'LoginForm submit on Administrator role',
    endpoint: '/auth/login',
    method: 'POST',
    json: {
      email: 'admin@collegeplacement.com',
      password: 'admin123',
    },
    notes:
      'Same login endpoint is shared by all roles; this checks the admin path specifically.',
  });

  context.admin = adminLogin.body?.data;

  await executeCheck({
    feature: 'Student registration',
    trigger: 'RegistrationForm submit',
    endpoint: '/auth/register',
    method: 'POST',
    json: {
      name: tempStudent.name,
      email: tempStudent.email,
      password: tempStudent.password,
      role: tempStudent.role,
      studentData: tempStudent.studentData,
    },
    notes:
      'The registration UI is only exposed for students. It posts the nested studentData payload shown here.',
  });

  const forgotPassword = await executeCheck({
    feature: 'Forgot password request',
    trigger: 'Forgot password form submit in LoginForm',
    endpoint: '/auth/forgot-password',
    method: 'POST',
    json: {
      email: tempStudent.email,
    },
    notes:
      'In development the backend includes resetToken/resetUrl in the response, which the frontend can use directly for local testing.',
  });

  const resetToken = forgotPassword.body?.data?.resetToken;

  const resetPasswordPayload = {
    token: resetToken,
    password: tempStudent.newPassword,
  };

  await executeCheck({
    feature: 'Password reset',
    trigger: 'Reset password form submit in LoginForm',
    endpoint: '/auth/reset-password',
    method: 'POST',
    json: resetPasswordPayload,
    expected: (response, body) =>
      response.ok && Boolean(body?.data?.accessToken && body?.data?.refreshToken),
    notes:
      'Uses the reset token returned by the previous forgot-password request.',
  });

  const studentLogin = await executeCheck({
    feature: 'Student sign-in',
    trigger: 'LoginForm submit on Student role',
    endpoint: '/auth/login',
    method: 'POST',
    json: {
      email: tempStudent.email,
      password: tempStudent.newPassword,
    },
  });

  context.student = studentLogin.body?.data;

  const studentToken = context.student?.accessToken;
  const studentRefreshToken = context.student?.refreshToken;

  const profileCheck = await executeCheck({
    feature: 'Session restore profile fetch',
    trigger: 'App initializeAuth() page load',
    endpoint: '/auth/profile',
    method: 'GET',
    token: studentToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    notes:
      'This is the first request the app makes when it finds persisted tokens in local storage.',
  });

  context.studentProfileId = extractUserProfileId(profileCheck.body);

  await executeCheck({
    feature: 'Access token refresh',
    trigger: 'Axios/authStore refresh flow after 401 or stale session',
    endpoint: '/auth/refresh',
    method: 'POST',
    json: {
      refreshToken: studentRefreshToken,
    },
    expected: (response, body) => response.ok && Boolean(body?.data?.accessToken),
  });

  const companyCreate = await executeCheck({
    feature: 'Admin company onboarding',
    trigger: 'CompanyOnboardingForm submit',
    endpoint: '/companies',
    method: 'POST',
    token: context.admin?.accessToken,
    json: tempCompany,
    notes:
      'The admin form also provisions or attaches a recruiter when recruiterEmail is present.',
  });

  context.companyId = companyCreate.body?.data?.company?._id;

  await executeCheck({
    feature: 'Admin application window creation',
    trigger: 'ApplicationWindow form submit',
    endpoint: '/application-windows',
    method: 'POST',
    token: context.admin?.accessToken,
    json: {
      companyId: context.companyId,
      ...tempWindow,
    },
  });

  await executeCheck({
    feature: 'Admin off-campus opportunity creation',
    trigger: 'Off-campus opportunity form submit',
    endpoint: '/off-campus-opportunities',
    method: 'POST',
    token: context.admin?.accessToken,
    json: tempOpportunity,
    notes:
      'Uses the same JSON payload assembled in AdminDashboard before calling offCampusService.createOpportunity().',
  });

  await executeCheck({
    feature: 'Student dashboard load: profile card',
    trigger: 'StudentDashboard page load',
    endpoint: `/students/${context.studentProfileId}`,
    method: 'GET',
    token: studentToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
  });

  await executeCheck({
    feature: 'Student dashboard load: active companies',
    trigger: 'StudentDashboard page load',
    endpoint: '/companies/active',
    method: 'GET',
    token: studentToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
  });

  await executeCheck({
    feature: 'Student dashboard load: my applications',
    trigger: 'StudentDashboard page load',
    endpoint: `/applications/student/${context.studentProfileId}?limit=200`,
    method: 'GET',
    token: studentToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
  });

  await executeCheck({
    feature: 'Student dashboard load: off-campus listing',
    trigger: 'StudentDashboard page load',
    endpoint: '/off-campus-opportunities?limit=100',
    method: 'GET',
    token: studentToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
  });

  const applicationPayload = studentApplicationPayload(
    profileCheck.body?.data?.user?.profile,
    context.companyId
  );

  const applicationSubmit = await executeCheck({
    feature: 'Student application submission',
    trigger: '"Submit application" button in ApplicationForm',
    endpoint: '/applications',
    method: 'POST',
    token: studentToken,
    formData: applicationPayload.form,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'multipart/form-data (browser-generated boundary)',
    },
    reportPayload: applicationPayload.reportPayload,
    expected: (response, body) =>
      response.status === 201 && Boolean(body?.data?.application?._id),
  });

  context.applicationId = applicationSubmit.body?.data?.application?._id;

  await executeCheck({
    feature: 'Student profile save',
    trigger: '"Save profile" button in StudentDashboard',
    endpoint: `/students/${context.studentProfileId}`,
    method: 'PUT',
    token: studentToken,
    json: {
      name: `${tempStudent.name} Updated`,
      phone: '9876543213',
      skills: ['React', 'Node.js', 'REST'],
    },
  });

  await executeCheck({
    feature: 'Admin dashboard load: companies',
    trigger: 'AdminDashboard page load',
    endpoint: '/companies?limit=100',
    method: 'GET',
    token: context.admin?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    expected: (response) => response.ok,
    notes:
      'This row verifies the exact query string currently hardcoded in AdminDashboard.',
  });

  await executeCheck({
    feature: 'Admin dashboard load: students',
    trigger: 'AdminDashboard page load',
    endpoint: '/students?limit=100',
    method: 'GET',
    token: context.admin?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    expected: (response) => response.ok,
    notes:
      'This row verifies the exact query string currently hardcoded in AdminDashboard.',
  });

  await executeCheck({
    feature: 'Admin dashboard load: applications',
    trigger: 'AdminDashboard page load',
    endpoint: '/applications?limit=100',
    method: 'GET',
    token: context.admin?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    expected: (response) => response.ok,
    notes:
      'This row verifies the exact query string currently hardcoded in AdminDashboard.',
  });

  await executeCheck({
    feature: 'Admin dashboard load: off-campus opportunities',
    trigger: 'AdminDashboard page load',
    endpoint: '/off-campus-opportunities?limit=100',
    method: 'GET',
    token: context.admin?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    expected: (response) => response.ok,
    notes:
      'This row verifies the exact query string currently hardcoded in AdminDashboard.',
  });

  await executeCheck({
    feature: 'Admin bulk student import (per row request)',
    trigger: '"Import students" button in StudentBulkUpload',
    endpoint: '/students',
    method: 'POST',
    token: context.admin?.accessToken,
    json: tempImportedStudent,
    notes:
      'The visible bulk-upload UI does not call /students/bulk-upload. It loops over rows and posts each one to /students.',
  });

  const recruiterLogin = await executeCheck({
    feature: 'Recruiter sign-in after onboarding',
    trigger: 'LoginForm submit for recruiter account created during company onboarding',
    endpoint: '/auth/login',
    method: 'POST',
    json: {
      email: tempRecruiter.email,
      password: companyCreate.body?.data?.temporaryPassword || 'recruiter123',
    },
  });

  context.recruiter = recruiterLogin.body?.data;

  await executeCheck({
    feature: 'Recruiter dashboard load: company metadata',
    trigger: 'RecruiterDashboard page load',
    endpoint: `/companies/${context.recruiter?.user?.companyId || context.companyId}`,
    method: 'GET',
    token: context.recruiter?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
  });

  await executeCheck({
    feature: 'Recruiter dashboard load: applications list',
    trigger: 'RecruiterDashboard page load',
    endpoint: '/applications?limit=100',
    method: 'GET',
    token: context.recruiter?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    expected: (response) => response.ok,
    notes:
      'This row verifies the exact query string currently hardcoded in RecruiterDashboard.',
  });

  await executeCheck({
    feature: 'Recruiter score update',
    trigger: 'Score dropdown change in RecruiterDashboard',
    endpoint: `/applications/${context.applicationId}/score`,
    method: 'PUT',
    token: context.recruiter?.accessToken,
    json: {
      score: 88,
    },
  });

  await executeCheck({
    feature: 'Recruiter status update',
    trigger: 'Status dropdown change in RecruiterDashboard',
    endpoint: `/applications/${context.applicationId}/status`,
    method: 'PUT',
    token: context.recruiter?.accessToken,
    json: {
      status: 'under-review',
    },
  });

  await executeCheck({
    feature: 'Recruiter bulk status update',
    trigger: '"Shortlist selected" / "Reject selected" buttons in RecruiterDashboard',
    endpoint: '/applications/bulk-update',
    method: 'POST',
    token: context.recruiter?.accessToken,
    json: {
      applicationIds: [context.applicationId],
      status: 'shortlisted',
    },
  });

  await executeCheck({
    feature: 'Dashboard logout',
    trigger: 'Logout button in AdminDashboard / StudentDashboard / RecruiterDashboard',
    endpoint: '/auth/logout',
    method: 'POST',
    token: context.recruiter?.accessToken,
    reportHeaders: {
      Authorization: 'Bearer <token>',
      'Content-Type': 'application/json',
    },
    reportPayload: undefined,
    notes:
      'The frontend also clears local storage immediately; the backend endpoint simply acknowledges logout in this stateless JWT setup.',
  });

  const passCount = results.filter((entry) => entry.status === 'Pass').length;
  const failCount = results.length - passCount;

  const markdown = [
    '# Frontend API Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `API base: ${API_BASE}`,
    '',
    `Pass: ${passCount}`,
    `Fail: ${failCount}`,
    '',
    '## API-backed frontend features',
    '',
    '| Feature / Functionality | Frontend trigger | API endpoint | Method | Payload | Backend response | Status | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...results.map((entry) => {
      return `| ${escapeCell(entry.feature)} | ${escapeCell(entry.trigger)} | ${escapeCell(entry.endpoint)} | ${escapeCell(entry.method)} | ${escapeCell(safeStringify(entry.payload))} | ${escapeCell(summarizeResponse({ status: entry.backendResponse.status, statusText: entry.backendResponse.statusText }, entry.backendResponse.body))} | ${escapeCell(entry.status)} | ${escapeCell(entry.notes)} |`;
    }),
    '',
    '## Frontend-only interactions',
    '',
    '| Feature / Functionality | Frontend trigger | API endpoint | Notes |',
    '| --- | --- | --- | --- |',
    ...frontendOnlyFeatures.map((entry) => {
      return `| ${escapeCell(entry.feature)} | ${escapeCell(entry.trigger)} | ${escapeCell(entry.endpoint)} | ${escapeCell(entry.notes)} |`;
    }),
    '',
    '## Client service methods currently not wired to visible UI actions',
    '',
    ...unwiredClientServiceMethods.map((name) => `- \`${name}\``),
    '',
  ].join('\n');

  const jsonReport = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    summary: {
      pass: passCount,
      fail: failCount,
    },
    artifacts: {
      runStamp: stamp,
    },
    results,
    frontendOnlyFeatures,
    unwiredClientServiceMethods,
  };

  await fs.writeFile(REPORT_MD_PATH, markdown, 'utf8');
  await fs.writeFile(REPORT_JSON_PATH, JSON.stringify(jsonReport, null, 2), 'utf8');

  console.log(JSON.stringify({
    reportMarkdown: REPORT_MD_PATH,
    reportJson: REPORT_JSON_PATH,
    pass: passCount,
    fail: failCount,
    companyId: context.companyId,
    applicationId: context.applicationId,
    studentProfileId: context.studentProfileId,
  }, null, 2));
}

main().catch(async (error) => {
  const failurePayload = {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    partialResults: results,
  };
  await fs.writeFile(REPORT_JSON_PATH, JSON.stringify(failurePayload, null, 2), 'utf8');
  console.error(error);
  process.exitCode = 1;
});
