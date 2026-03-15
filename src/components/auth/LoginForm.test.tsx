import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockUseAuthStore,
  patchMockAuthStore,
  resetMockAuthStore,
} from '../../test/mockAuthStore';
import { renderWithRouter } from '../../test/test-utils';
import { LoginForm } from './LoginForm';

vi.mock('../../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    resetMockAuthStore();
  });

  it('submits forgot password requests and shows a confirmation message', async () => {
    const user = userEvent.setup();
    const forgotPassword = vi.fn().mockResolvedValue({
      success: true,
      message:
        'A temporary password has been sent to your email. Sign in with it and set a new password.',
    });

    patchMockAuthStore({
      forgotPassword,
      clearError: vi.fn(),
      error: null,
      isLoading: false,
    });

    renderWithRouter(
      <LoginForm
        role="student"
        prefillEmail="arjun.sharma@college.edu"
        prefillPassword="student123"
      />
    );

    await user.click(screen.getByRole('button', { name: /forgot password/i }));
    await user.click(screen.getByRole('button', { name: /send temporary password/i }));

    expect(forgotPassword).toHaveBeenCalledWith('arjun.sharma@college.edu');
    expect(
      await screen.findByText(/temporary password has been sent to your email/i)
    ).toBeInTheDocument();
  });

  it('submits reset password with the preloaded token', async () => {
    const user = userEvent.setup();
    const resetPassword = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();

    patchMockAuthStore({
      resetPassword,
      clearError: vi.fn(),
      error: null,
      isLoading: false,
    });

    renderWithRouter(
      <LoginForm
        role="student"
        initialView="reset"
        initialResetToken="reset-token-123"
        onSuccess={onSuccess}
      />
    );

    await user.type(screen.getByPlaceholderText('Minimum 6 characters'), 'newpass123');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(resetPassword).toHaveBeenCalledWith('reset-token-123', 'newpass123');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('forces a password change after login with a temporary password', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ success: true, mustChangePassword: true });
    const changePassword = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();

    patchMockAuthStore({
      login,
      changePassword,
      clearError: vi.fn(),
      error: null,
      isLoading: false,
    });

    renderWithRouter(
      <LoginForm
        role="student"
        prefillEmail="first.time@college.edu"
        prefillPassword="TempPass123"
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(login).toHaveBeenCalledWith('first.time@college.edu', 'TempPass123');
    expect(
      await screen.findByRole('heading', { name: /set a new password/i })
    ).toBeInTheDocument();

    const passwordInputs = screen.getAllByPlaceholderText('Minimum 6 characters');
    const confirmInputs = screen.getAllByPlaceholderText('Re-enter password');

    await user.type(passwordInputs[0], 'Permanent123');
    await user.type(confirmInputs[0], 'Permanent123');
    await user.click(screen.getByRole('button', { name: /set new password/i }));

    expect(changePassword).toHaveBeenCalledWith('Permanent123');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the Google sign in option on the login view', () => {
    renderWithRouter(<LoginForm role="recruiter" />);

    expect(
      screen.getByRole('button', { name: /continue with google/i })
    ).toBeInTheDocument();
  });
});
