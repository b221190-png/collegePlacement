import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockUseAuthStore,
  patchMockAuthStore,
  resetMockAuthStore,
} from '../../test/mockAuthStore';
import { AuthWrapper } from './AuthWrapper';
import { renderWithRouter } from '../../test/test-utils';

vi.mock('../../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

describe('AuthWrapper', () => {
  beforeEach(() => {
    resetMockAuthStore();
  });

  it('prefills credentials when a role is selected', async () => {
    const user = userEvent.setup();
    const clickRoleCard = async (label: 'Student' | 'Recruiter' | 'Administrator') => {
      const roleHeading = screen.getByRole('heading', { name: label });
      const roleButton = roleHeading.closest('button');

      expect(roleButton).not.toBeNull();
      await user.click(roleButton!);
    };

    renderWithRouter(
      <Routes>
        <Route path="/auth" element={<AuthWrapper />} />
      </Routes>,
      { route: '/auth' }
    );

    await clickRoleCard('Student');
    expect(screen.getByPlaceholderText('you@college.edu')).toHaveValue(
      'arjun.sharma@college.edu'
    );
    expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('student123');

    await user.click(screen.getByRole('button', { name: /back to roles/i }));
    await clickRoleCard('Recruiter');
    expect(screen.getByPlaceholderText('you@college.edu')).toHaveValue('recruiter@google.com');
    expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('recruiter123');

    await user.click(screen.getByRole('button', { name: /back to roles/i }));
    await clickRoleCard('Administrator');
    expect(screen.getByPlaceholderText('you@college.edu')).toHaveValue(
      'admin@collegeplacement.com'
    );
    expect(screen.getByPlaceholderText('you@college.edu')).toHaveAttribute('readonly');
    expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('admin123');
  });

  it('opens reset mode from query params and preloads the token', () => {
    renderWithRouter(
      <Routes>
        <Route path="/auth" element={<AuthWrapper />} />
      </Routes>,
      { route: '/auth?mode=reset&token=reset-token-123' }
    );

    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste reset token')).toHaveValue('reset-token-123');
  });

  it('opens the forced reset flow for users flagged to change their password', () => {
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

    renderWithRouter(
      <Routes>
        <Route path="/auth" element={<AuthWrapper />} />
      </Routes>,
      { route: '/auth' }
    );

    expect(screen.getByRole('heading', { name: /set a new password/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to roles/i })).not.toBeInTheDocument();
  });
});
