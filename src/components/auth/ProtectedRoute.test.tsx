import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockUseAuthStore,
  patchMockAuthStore,
  resetMockAuthStore,
} from '../../test/mockAuthStore';
import { renderRoutes } from '../../test/test-utils';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    resetMockAuthStore();
  });

  it('redirects unauthenticated users to auth routes', async () => {
    renderRoutes(
      [
        {
          path: '/auth',
          element: <div>Auth Page</div>,
        },
        {
          path: '/student',
          element: (
            <ProtectedRoute requiredRole="student">
              <div>Student Dashboard</div>
            </ProtectedRoute>
          ),
        },
      ],
      '/student'
    );

    expect(await screen.findByText('Auth Page')).toBeInTheDocument();
  });

  it('redirects authenticated users away from the auth page', async () => {
    patchMockAuthStore({
      user: {
        id: 'student-user-1',
        name: 'Arjun Sharma',
        email: 'arjun.sharma@college.edu',
        role: 'student',
        isActive: true,
      },
    });

    renderRoutes(
      [
        {
          path: '/auth',
          element: (
            <ProtectedRoute requireAuth={false}>
              <div>Auth Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: '/student',
          element: <div>Student Dashboard</div>,
        },
      ],
      '/auth'
    );

    expect(await screen.findByText('Student Dashboard')).toBeInTheDocument();
  });

  it('redirects users to the dashboard matching their own role', async () => {
    patchMockAuthStore({
      user: {
        id: 'admin-user-1',
        name: 'System Administrator',
        email: 'admin@collegeplacement.com',
        role: 'admin',
        isActive: true,
      },
    });

    renderRoutes(
      [
        {
          path: '/student',
          element: (
            <ProtectedRoute requiredRole="student">
              <div>Student Dashboard</div>
            </ProtectedRoute>
          ),
        },
        {
          path: '/admin',
          element: <div>Admin Dashboard</div>,
        },
      ],
      '/student'
    );

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('keeps temporary-password users on auth until they reset their password', async () => {
    patchMockAuthStore({
      user: {
        id: 'student-user-1',
        name: 'Arjun Sharma',
        email: 'arjun.sharma@college.edu',
        role: 'student',
        isActive: true,
        mustChangePassword: true,
      },
    });

    renderRoutes(
      [
        {
          path: '/auth',
          element: (
            <ProtectedRoute requireAuth={false}>
              <div>Auth Page</div>
            </ProtectedRoute>
          ),
        },
      ],
      '/auth'
    );

    expect(await screen.findByText('Auth Page')).toBeInTheDocument();
  });

  it('redirects temporary-password users from protected routes to auth', async () => {
    patchMockAuthStore({
      user: {
        id: 'student-user-1',
        name: 'Arjun Sharma',
        email: 'arjun.sharma@college.edu',
        role: 'student',
        isActive: true,
        mustChangePassword: true,
      },
    });

    renderRoutes(
      [
        {
          path: '/auth',
          element: <div>Auth Page</div>,
        },
        {
          path: '/student',
          element: (
            <ProtectedRoute requiredRole="student">
              <div>Student Dashboard</div>
            </ProtectedRoute>
          ),
        },
      ],
      '/student'
    );

    expect(await screen.findByText('Auth Page')).toBeInTheDocument();
  });
});
