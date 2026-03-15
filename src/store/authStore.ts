import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../utils/apiConfig';

interface ApiErrorItem {
  msg?: string;
  message?: string;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorItem[];
}

interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  success: boolean;
  mustChangePassword?: boolean;
}

interface ForgotPasswordResult {
  success: boolean;
  message?: string;
  temporaryPassword?: string;
  previewUrl?: string | null;
  emailError?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'student';
  companyId?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
  profile?: unknown;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: unknown) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<boolean>;
  completeExternalAuth: (payload: AuthPayload) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (profileData: Record<string, unknown>) => Promise<boolean>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

const syncLegacyTokenStorage = (accessToken: string | null, refreshToken: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (accessToken && refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return;
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const safeJsonParse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
};

const extractErrorMessage = (payload: ApiResponse<unknown>, fallback: string) => {
  if (payload.message) {
    return payload.message;
  }
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors
      .map((error) => error.msg || error.message)
      .filter(Boolean)
      .join(', ');
  }
  return fallback;
};

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = await safeJsonParse<T>(response);
  return { response, payload };
};

const normalizeSkillsPayload = (value: unknown) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  return value;
};

const applyAuthPayload = (set: (partial: Partial<AuthStore>) => void, payload: AuthPayload) => {
  syncLegacyTokenStorage(payload.accessToken, payload.refreshToken);
  set({
    user: payload.user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    isLoading: false,
    error: null,
  });
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const { response, payload } = await request<AuthPayload>('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok || !payload.data) {
            throw new Error(extractErrorMessage(payload, 'Login failed'));
          }

          applyAuthPayload(set, payload.data);
          return {
            success: true,
            mustChangePassword: Boolean(payload.data.user.mustChangePassword),
          };
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          return { success: false };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const { response, payload } = await request<AuthPayload>('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok || !payload.data) {
            throw new Error(extractErrorMessage(payload, 'Registration failed'));
          }

          applyAuthPayload(set, payload.data);
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          return false;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          const { response, payload } = await request('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error(extractErrorMessage(payload, 'Unable to process forgot password request'));
          }

          set({ isLoading: false, error: null });
          return {
            success: true,
            message: payload.message,
            temporaryPassword:
              (payload.data as { temporaryPassword?: string } | undefined)?.temporaryPassword,
            previewUrl:
              (payload.data as { previewUrl?: string | null } | undefined)?.previewUrl ?? null,
            emailError:
              (payload.data as { emailError?: string | null } | undefined)?.emailError ?? null,
          };
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Forgot password failed',
          });
          return { success: false };
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });

        try {
          const { response, payload } = await request<AuthPayload>('/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: newPassword }),
          });

          if (!response.ok) {
            throw new Error(extractErrorMessage(payload, 'Unable to reset password'));
          }

          const data = payload.data;
          if (data?.accessToken && data?.refreshToken && data.user) {
            applyAuthPayload(set, data);
            return true;
          }

          set({ isLoading: false, error: null });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Reset password failed',
          });
          return false;
        }
      },

      completeExternalAuth: (payload) => {
        applyAuthPayload(set, payload);
      },

      changePassword: async (newPassword, currentPassword) => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ error: 'No active session found' });
          return false;
        }

        try {
          const { response, payload } = await request<{ user: User }>('/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });

          if (!response.ok || !payload.data?.user) {
            throw new Error(extractErrorMessage(payload, 'Unable to update password'));
          }

          set((state) => ({
            user: state.user ? { ...state.user, ...payload.data?.user } : payload.data?.user ?? null,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Change password failed',
          });
          return false;
        }
      },

      logout: () => {
        const token = get().accessToken;
        if (token) {
          void request('/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => undefined);
        }

        syncLegacyTokenStorage(null, null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          set({ error: 'No refresh token available' });
          return;
        }

        try {
          const { response, payload } = await request<{ accessToken: string }>('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok || !payload.data?.accessToken) {
            throw new Error(extractErrorMessage(payload, 'Failed to refresh session'));
          }

          syncLegacyTokenStorage(payload.data.accessToken, refreshToken);
          set({ accessToken: payload.data.accessToken, error: null });
        } catch {
          get().logout();
          set({ error: 'Session expired. Please log in again.' });
        }
      },

      updateProfile: async (profileData) => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ error: 'No active session found' });
          return false;
        }

        const payloadToSend: Record<string, unknown> = { ...profileData };
        payloadToSend.skills = normalizeSkillsPayload(profileData.skills);

        try {
          const { response, payload } = await request<{ user: Partial<User> }>('/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payloadToSend),
          });

          if (!response.ok || !payload.data?.user) {
            throw new Error(extractErrorMessage(payload, 'Profile update failed'));
          }

          set((state) => ({
            user: state.user ? { ...state.user, ...payload.data?.user } : (payload.data?.user as User),
            error: null,
          }));
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Profile update failed',
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export const initializeAuth = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const authState = useAuthStore.getState();
  const storedAccessToken = authState.accessToken || localStorage.getItem('accessToken');
  const storedRefreshToken = authState.refreshToken || localStorage.getItem('refreshToken');

  if (!storedAccessToken || !storedRefreshToken) {
    syncLegacyTokenStorage(null, null);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
    return;
  }

  const fetchProfile = async (token: string) =>
    request<{ user: User }>('/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

  const hydrateSession = (user: User, accessToken: string, refreshToken: string) => {
    syncLegacyTokenStorage(accessToken, refreshToken);
    useAuthStore.setState({
      user,
      accessToken,
      refreshToken,
      error: null,
    });
  };

  try {
    const profileResult = await fetchProfile(storedAccessToken);
    if (profileResult.response.ok && profileResult.payload.data?.user) {
      hydrateSession(profileResult.payload.data.user, storedAccessToken, storedRefreshToken);
      return;
    }

    const refreshResult = await request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!refreshResult.response.ok || !refreshResult.payload.data?.accessToken) {
      throw new Error('Unable to refresh access token');
    }

    const newAccessToken = refreshResult.payload.data.accessToken;
    const refreshedProfileResult = await fetchProfile(newAccessToken);

    if (!refreshedProfileResult.response.ok || !refreshedProfileResult.payload.data?.user) {
      throw new Error('Unable to restore profile');
    }

    hydrateSession(
      refreshedProfileResult.payload.data.user,
      newAccessToken,
      storedRefreshToken
    );
  } catch {
    syncLegacyTokenStorage(null, null);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  }
};
