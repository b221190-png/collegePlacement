# Frontend Integration Guide

This guide will help you integrate the backend API with your frontend application.

## Base URL

The backend API is running at: `http://localhost:5000`

## Authentication Setup

### 1. Install Axios (recommended)

```bash
npm install axios
```

### 2. Create API Client

```javascript
// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3. Authentication Service

```javascript
// src/services/auth.js
import api from './utils/api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { accessToken, refreshToken, user } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  }
};
```

## API Services

### 1. Student Service

```javascript
// src/services/students.js
import api from './utils/api';

export const studentService = {
  getStudents: (params = {}) => {
    return api.get('/students', { params });
  },

  getStudent: (id) => {
    return api.get(`/students/${id}`);
  },

  createStudent: (studentData) => {
    return api.post('/students', studentData);
  },

  updateStudent: (id, studentData) => {
    return api.put(`/students/${id}`, studentData);
  },

  deleteStudent: (id) => {
    return api.delete(`/students/${id}`);
  },

  uploadResume: (id, formData) => {
    return api.post(`/students/${id}/upload-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getEligibleStudents: (companyId, params = {}) => {
    return api.get(`/students/eligible/${companyId}`, { params });
  }
};
```

### 2. Company Service

```javascript
// src/services/companies.js
import api from './utils/api';

export const companyService = {
  getCompanies: (params = {}) => {
    return api.get('/companies', { params });
  },

  getActiveCompanies: () => {
    return api.get('/companies/active');
  },

  getCompany: (id) => {
    return api.get(`/companies/${id}`);
  },

  createCompany: (companyData) => {
    return api.post('/companies', companyData);
  },

  updateCompany: (id, companyData) => {
    return api.put(`/companies/${id}`, companyData);
  },

  deleteCompany: (id) => {
    return api.delete(`/companies/${id}`);
  },

  searchCompanies: (params = {}) => {
    return api.get('/companies/search', { params });
  }
};
```

### 3. Application Service

```javascript
// src/services/applications.js
import api from './utils/api';

export const applicationService = {
  getApplications: (params = {}) => {
    return api.get('/applications', { params });
  },

  getApplication: (id) => {
    return api.get(`/applications/${id}`);
  },

  submitApplication: (applicationData) => {
    return api.post('/applications', applicationData);
  },

  updateApplicationStatus: (id, statusData) => {
    return api.put(`/applications/${id}/status`, statusData);
  },

  updateApplicationScore: (id, scoreData) => {
    return api.put(`/applications/${id}/score`, scoreData);
  },

  bulkUpdateApplications: (updateData) => {
    return api.post('/applications/bulk-update', updateData);
  },

  getStudentApplications: (studentId, params = {}) => {
    return api.get(`/applications/student/${studentId}`, { params });
  },

  getCompanyApplications: (companyId, params = {}) => {
    return api.get(`/applications/company/${companyId}`, { params });
  }
};
```

### 4. Dashboard Service

```javascript
// src/services/dashboard.js
import api from './utils/api';

export const dashboardService = {
  getAdminDashboard: () => {
    return api.get('/dashboard/admin');
  },

  getRecruiterDashboard: (companyId) => {
    return api.get(`/dashboard/recruiter/${companyId}`);
  },

  getStudentDashboard: (studentId) => {
    return api.get(`/dashboard/student/${studentId}`);
  },

  getOverallAnalytics: (params = {}) => {
    return api.get('/dashboard/analytics/overall', { params });
  }
};
```

## React Context for Authentication

```javascript
// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user },
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.login(email, password);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.user },
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.response?.data?.message || 'Login failed',
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.register(userData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.user },
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.response?.data?.message || 'Registration failed',
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Protected Routes

```javascript
// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

## Usage Examples

### Login Component

```javascript
// src/components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.email, formData.password);
      // Redirect handled by router
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default Login;
```

### Dashboard Component

```javascript
// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let response;
        if (user?.role === 'admin') {
          response = await dashboardService.getAdminDashboard();
        } else if (user?.role === 'recruiter') {
          response = await dashboardService.getRecruiterDashboard(user.companyId);
        } else if (user?.role === 'student') {
          // Need to get student ID first
          response = await dashboardService.getStudentDashboard(studentId);
        }

        setStats(response.data.stats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {stats && (
        <div>
          {/* Render dashboard based on user role and stats */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

## Error Handling

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data.message || 'An error occurred';
    if (error.response.data.errors) {
      // Validation errors
      return error.response.data.errors.join(', ');
    }
    return message;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something happened in setting up the request
    return 'An unexpected error occurred.';
  }
};
```

## File Uploads

```javascript
// src/utils/fileUpload.js
export const uploadFile = async (file, endpoint = '/uploads/single') => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response.json();
};
```

## CORS Configuration

The backend is configured to allow requests from `http://localhost:3000`. If your frontend runs on a different port, update the `FRONTEND_URL` in the backend `.env` file.

## Testing the Integration

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Test a simple API call:
```javascript
// Test health check
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

3. Test authentication:
```javascript
// Test login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

This integration guide provides a complete setup for connecting your frontend to the backend API. Adjust the code as needed for your specific frontend framework and requirements.