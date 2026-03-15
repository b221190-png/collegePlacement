import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Shield, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';

interface AuthWrapperProps {
  onSuccess?: () => void;
}

type Role = 'admin' | 'student' | 'recruiter';

const ROLE_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: { email: 'admin@collegeplacement.com', password: 'admin123' },
  student: { email: 'arjun.sharma@college.edu', password: 'student123' },
  recruiter: { email: 'recruiter@google.com', password: 'recruiter123' },
};

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ onSuccess }) => {
  const location = useLocation();
  const authUser = useAuthStore((state) => state.user);
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const queryMode = searchParams.get('mode');
  const resetTokenFromQuery = searchParams.get('token') || '';
  const googleError = searchParams.get('googleError') || '';
  const initialAuthView: 'login' | 'forgot' | 'reset' | 'force-reset' =
    authUser?.mustChangePassword
      ? 'force-reset'
      : (
    queryMode === 'forgot'
      ? 'forgot'
      : queryMode === 'reset'
        ? 'reset'
        : 'login'
        );

  useEffect(() => {
    if (authUser?.mustChangePassword) {
      setUserRole(authUser.role);
      setIsLogin(true);
      return;
    }

    if (initialAuthView !== 'login') {
      setUserRole((current) => current || 'student');
      setIsLogin(true);
    }
  }, [authUser?.mustChangePassword, authUser?.role, initialAuthView]);

  const roleCards = useMemo(
    () => [
      {
        id: 'student' as const,
        title: 'Student',
        description: 'Apply to companies, track statuses, and manage your profile.',
        icon: User,
        accent: 'bg-blue-100 text-blue-700',
      },
      {
        id: 'recruiter' as const,
        title: 'Recruiter',
        description: 'Review applicants, score candidates, and update hiring outcomes.',
        icon: Building2,
        accent: 'bg-slate-100 text-slate-700',
      },
      {
        id: 'admin' as const,
        title: 'Administrator',
        description: 'Manage companies, students, opportunities, and application windows.',
        icon: Shield,
        accent: 'bg-emerald-100 text-emerald-700',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <section className="p-8 lg:p-12 bg-slate-900 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">College Placement</p>
            <h1 className="text-3xl lg:text-4xl font-bold mt-3">Placement Management Portal</h1>
            <p className="text-slate-300 mt-4 leading-7">
              Sign in with your role-based account to manage hiring, applications, and campus opportunities.
            </p>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-10">
              {roleCards.map((card) => {
                const Icon = card.icon;
                const isSelected = userRole === card.id;

                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      setUserRole(card.id);
                      setIsLogin(true);
                    }}
                    className={`text-left rounded-2xl p-5 border transition-colors ${
                      isSelected
                        ? 'border-white/70 bg-white/15'
                        : 'border-white/15 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${card.accent} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{card.title}</h2>
                    <p className="text-sm text-slate-300 mt-2 leading-6">{card.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="p-6 md:p-8 lg:p-10 bg-white">
            {!userRole && (
              <div className="h-full flex flex-col justify-center">
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">Choose a role</h2>
                <p className="text-slate-600 leading-7">
                  Select your role from the left to continue to the appropriate sign-in experience.
                </p>
              </div>
            )}

            {userRole && (
              <>
                {!authUser?.mustChangePassword && (
                  <button
                    onClick={() => setUserRole(null)}
                    className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to roles
                  </button>
                )}

                {isLogin ? (
                  <LoginForm
                    key={`login-${userRole}`}
                    onSuccess={onSuccess}
                    onClose={() => setIsLogin(false)}
                    fixedEmail={userRole === 'admin' ? ROLE_CREDENTIALS.admin.email : undefined}
                    prefillEmail={ROLE_CREDENTIALS[userRole].email}
                    prefillPassword={ROLE_CREDENTIALS[userRole].password}
                    role={userRole}
                    initialView={initialAuthView}
                    initialResetToken={resetTokenFromQuery}
                    initialExternalError={googleError}
                  />
                ) : (
                  <RegistrationForm
                    onSuccess={onSuccess}
                    onClose={() => setIsLogin(true)}
                    defaultRole="student"
                    showRoleSelection={false}
                  />
                )}

                <div className="text-center mt-6 pt-6 border-t border-slate-200 text-sm text-slate-600">
                  {userRole === 'student' ? (
                    <>
                      Need a student account?{' '}
                      <button
                        onClick={() => setIsLogin((current) => !current)}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {isLogin ? 'Create account' : 'Back to login'}
                      </button>
                    </>
                  ) : (
                    <span>
                      {userRole === 'admin'
                        ? 'Administrator sign-in uses the official admin email.'
                        : 'Recruiter accounts are managed by administrators during company onboarding.'}
                    </span>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;
