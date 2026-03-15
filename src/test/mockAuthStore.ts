import { vi } from 'vitest';
import type { AuthStore } from '../store/authStore';

const createState = (): AuthStore => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  login: vi.fn().mockResolvedValue({ success: true, mustChangePassword: false }),
  register: vi.fn().mockResolvedValue(true),
  forgotPassword: vi.fn().mockResolvedValue({ success: true }),
  resetPassword: vi.fn().mockResolvedValue(true),
  changePassword: vi.fn().mockResolvedValue(true),
  completeExternalAuth: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(true),
  clearError: vi.fn(),
});

let authStoreState: AuthStore = createState();

export const resetMockAuthStore = () => {
  authStoreState = createState();
};

export const patchMockAuthStore = (overrides: Partial<AuthStore>) => {
  authStoreState = {
    ...authStoreState,
    ...overrides,
  };
};

export const mockUseAuthStore = <Selected,>(
  selector?: (state: AuthStore) => Selected
): Selected | AuthStore => {
  if (typeof selector === 'function') {
    return selector(authStoreState);
  }

  return authStoreState;
};
