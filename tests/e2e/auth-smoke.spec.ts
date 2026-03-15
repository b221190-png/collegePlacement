import { expect, test, type Page } from '@playwright/test';

const studentLoginResponse = {
  success: true,
  message: 'Login successful',
  data: {
    user: {
      id: 'student-user-1',
      name: 'Arjun Sharma',
      email: 'arjun.sharma@college.edu',
      role: 'student',
      isActive: true,
      profile: {
        _id: 'student-profile-1',
        userId: {
          _id: 'student-user-1',
          name: 'Arjun Sharma',
          email: 'arjun.sharma@college.edu',
          role: 'student',
          isActive: true,
        },
      },
    },
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
  },
};

const studentProfileResponse = {
  success: true,
  data: {
    student: {
      _id: 'student-profile-1',
      rollNumber: '21BCE001',
      branch: 'Computer Science',
      cgpa: 8.6,
      phone: '9876543210',
      skills: ['React', 'Node.js', 'JavaScript'],
      userId: {
        name: 'Arjun Sharma',
        email: 'arjun.sharma@college.edu',
      },
    },
  },
};

const activeCompaniesResponse = {
  success: true,
  data: {
    companies: [
      {
        _id: 'company-1',
        name: 'Google',
        description: 'Technology company hiring campus talent.',
        industry: 'Information Technology',
        location: 'Bengaluru',
        packageOffered: '32 LPA',
        applicationDeadline: '2026-12-31T00:00:00.000Z',
        status: 'active',
        totalPositions: 20,
        requirements: ['Strong DSA'],
        recruitmentProcess: [],
      },
    ],
  },
};

const emptyApplicationsResponse = {
  success: true,
  data: {
    applications: [],
  },
};

const emptyOffCampusResponse = {
  success: true,
  data: {
    opportunities: [],
  },
};

const mockStudentDashboardApis = async (page: Page) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(studentLoginResponse),
    });
  });

  await page.route('**/api/students/student-profile-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(studentProfileResponse),
    });
  });

  await page.route('**/api/companies/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(activeCompaniesResponse),
    });
  });

  await page.route('**/api/applications/student/student-profile-1**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptyApplicationsResponse),
    });
  });

  await page.route('**/api/off-campus-opportunities**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptyOffCampusResponse),
    });
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test('student login smoke flow redirects into the dashboard', async ({ page }) => {
  await mockStudentDashboardApis(page);

  await page.goto('/auth');
  await page
    .locator('button')
    .filter({ has: page.getByRole('heading', { name: 'Student' }) })
    .click();

  await expect(page.getByPlaceholder('you@college.edu')).toHaveValue(
    'arjun.sharma@college.edu'
  );
  await expect(page.getByPlaceholder('Enter your password')).toHaveValue('student123');

  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole('heading', { name: /welcome back, arjun/i })).toBeVisible();
  await expect(page.getByText('Google')).toBeVisible();
});

test('reset link query opens the reset password form', async ({ page }) => {
  await page.goto('/auth?mode=reset&token=reset-token-123');

  await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  await expect(page.getByPlaceholder('Paste reset token')).toHaveValue('reset-token-123');
});
