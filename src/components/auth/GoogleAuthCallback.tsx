import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface GoogleAuthPayload {
  user: {
    role: 'admin' | 'recruiter' | 'student';
  };
  accessToken: string;
  refreshToken: string;
}

const parseHashPayload = (hash: string) => {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalizedHash);
  const encodedPayload = params.get('auth');

  if (!encodedPayload) {
    return null;
  }

  try {
    const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload =
      normalizedPayload + '='.repeat((4 - (normalizedPayload.length % 4)) % 4);
    const decoded = atob(paddedPayload);
    return JSON.parse(decoded) as GoogleAuthPayload;
  } catch {
    return null;
  }
};

export const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const completeExternalAuth = useAuthStore((state) => state.completeExternalAuth);
  const [error, setError] = useState<string | null>(null);
  const payload = useMemo(() => parseHashPayload(window.location.hash), []);

  useEffect(() => {
    if (!payload) {
      setError('Google sign in payload is missing or invalid.');
      return;
    }

    completeExternalAuth(payload);
    navigate(`/${payload.user.role}`, { replace: true });
  }, [completeExternalAuth, navigate, payload]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          {error ? 'Google sign in failed' : 'Completing sign in'}
        </h1>
        <p className="mt-3 text-slate-600 leading-7">
          {error || 'Please wait while your Google account is being linked to the placement portal.'}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => navigate('/auth', { replace: true })}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
