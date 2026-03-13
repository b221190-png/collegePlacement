import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AuthenticatedUser,
  getPlacementSnapshot,
  usePlacementStore,
} from './placementStore';

export interface User extends AuthenticatedUser {}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
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
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
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
          const payload = usePlacementStore.getState().authenticate(email, password);
          syncLegacyTokenStorage(payload.accessToken, payload.refreshToken);

          set({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const payload = usePlacementStore.getState().registerUser(userData);
          syncLegacyTokenStorage(payload.accessToken, payload.refreshToken);

          set({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          return false;
        }
      },

      logout: () => {
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
        const { user, refreshToken } = get();

        if (!user || !refreshToken) {
          set({ error: 'No active session found' });
          return;
        }

        const accessToken = `mock-access-${user.id}-${Date.now()}`;
        syncLegacyTokenStorage(accessToken, refreshToken);
        set({ accessToken, error: null });
      },

      updateProfile: async (profileData) => {
        const { user } = get();

        if (!user) {
          set({ error: 'You must be logged in to update your profile' });
          return false;
        }

        try {
          const updatedUser = usePlacementStore
            .getState()
            .updateProfile(user.id, profileData);

          set({ user: updatedUser, error: null });
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
      name: 'mock-auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export const initializeAuth = async () => {
  const authState = useAuthStore.getState();
  const snapshot = getPlacementSnapshot();

  if (!authState.user) {
    syncLegacyTokenStorage(null, null);
    return;
  }

  const account = snapshot.users.find((user) => user.id === authState.user?.id);

  if (!account) {
    syncLegacyTokenStorage(null, null);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
    return;
  }

  const syncedUser: User = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    companyId: account.companyId,
    studentId: account.studentId,
    isActive: account.isActive,
    lastLogin: account.lastLogin,
  };

  syncLegacyTokenStorage(authState.accessToken, authState.refreshToken);
  useAuthStore.setState({ user: syncedUser });
};
