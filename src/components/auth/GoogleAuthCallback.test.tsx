import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { mockUseAuthStore, patchMockAuthStore } from '../../test/mockAuthStore';
import { renderWithRouter } from '../../test/test-utils';
import GoogleAuthCallback from './GoogleAuthCallback';

vi.mock('../../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

describe('GoogleAuthCallback', () => {
  it('hydrates the auth store from the callback hash and redirects by role', async () => {
    const completeExternalAuth = vi.fn();
    patchMockAuthStore({ completeExternalAuth });

    const payload = {
      user: {
        id: 'student-user-1',
        name: 'Arjun Sharma',
        email: 'arjun.sharma@college.edu',
        role: 'student' as const,
        isActive: true,
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    window.location.hash = `auth=${btoa(JSON.stringify(payload))}`;

    renderWithRouter(
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/student" element={<div>Student Dashboard</div>} />
      </Routes>,
      { route: '/auth/google/callback' }
    );

    await waitFor(() => {
      expect(completeExternalAuth).toHaveBeenCalledWith(payload);
    });

    expect(await screen.findByText('Student Dashboard')).toBeInTheDocument();
  });
});
