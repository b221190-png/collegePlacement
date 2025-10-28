import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function for API requests with timeout and better error handling
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
    }
    
    throw error;
  }
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'student';
  companyId?: string;
  isActive: boolean;
  lastLogin?: string;
  profile?: any;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'Login failed';
            console.error('Login error:', errorMessage);
            throw new Error(errorMessage);
          }

          const data = await response.json();
          
          // Validate response structure
          if (!data.success || !data.data) {
            throw new Error('Invalid response from server');
          }

          const { user, accessToken, refreshToken } = data.data;

          // Validate required fields
          if (!user || !accessToken || !refreshToken) {
            throw new Error('Missing required authentication data');
          }

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });

          // Store tokens in localStorage for persistence
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          console.log('Login successful for user:', user.email);
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRequest('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'Registration failed';
            console.error('Registration error:', errorMessage);
            throw new Error(errorMessage);
          }

          const data = await response.json();
          
          // Validate response structure
          if (!data.success || !data.data) {
            throw new Error('Invalid response from server');
          }

          const { user, accessToken, refreshToken } = data.data;

          // Validate required fields
          if (!user || !accessToken || !refreshToken) {
            throw new Error('Missing required authentication data');
          }

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null,
          });

          // Store tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          console.log('Registration successful for user:', user.email);
        } catch (error) {
          console.error('Registration error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
        }
      },

      logout: () => {
        // Clear auth state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        });

        // Clear tokens from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          set({ error: 'No refresh token available' });
          return;
        }

        try {
          const response = await apiRequest('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          const { accessToken } = data.data;

          set({ accessToken });
          localStorage.setItem('accessToken', accessToken);
        } catch (error) {
          set({ error: 'Token refresh failed' });
          // If refresh fails, log out the user
          get().logout();
        }
      },

      updateProfile: async (profileData: any) => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ error: 'No access token available' });
          return;
        }

        try {
          const response = await apiRequest('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(profileData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Profile update failed');
          }

          const data = await response.json();
          const { user } = data.data;

          set({ user });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Profile update failed' });
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

// Initialize auth state from localStorage if available
if (typeof window !== 'undefined') {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (accessToken && refreshToken) {
    useAuthStore.setState({
      accessToken,
      refreshToken,
    });
  }
}

// Add a function to validate tokens and restore user session
export const initializeAuth = async () => {
  if (typeof window === 'undefined') return;
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (accessToken && refreshToken) {
    try {
      // Verify the current access token by fetching user profile
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const { user } = data.data;
        useAuthStore.setState({
          user,
          accessToken,
          refreshToken,
        });
      } else {
        // Token is invalid, try to refresh
        const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const { accessToken: newAccessToken } = refreshData.data;
          
          localStorage.setItem('accessToken', newAccessToken);
          
          // Try again with new token
          const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`,
            },
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const { user } = profileData.data;
            useAuthStore.setState({
              user,
              accessToken: newAccessToken,
              refreshToken,
            });
          }
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          useAuthStore.setState({
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    }
  }
};