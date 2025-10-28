import React from 'react';
import { useAuthStore } from '../../store/authStore';

export const TestAuth: React.FC = () => {
  const { user, accessToken, isLoading, error, login, logout } = useAuthStore();

  const handleTestLogin = async () => {
    try {
      await login('test@test.com', 'password123');
    } catch (err) {
      console.error('Test login failed:', err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Auth Debug Info</h2>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        <div>
          <strong>User:</strong> {user ? JSON.stringify(user) : 'Not logged in'}
        </div>
        <div>
          <strong>Token:</strong> {accessToken ? 'Present' : 'None'}
        </div>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={handleTestLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Login
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};