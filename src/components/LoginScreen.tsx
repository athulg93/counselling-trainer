import React, { useState } from 'react';
import {
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  Brain,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  Loader2,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getUserFromFirestore, saveUserToFirestore, resetUserPasswordInFirestore } from '../lib/firebase';

interface LoginScreenProps {
  currentUser?: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  sessionStats?: {
    totalSessions: number;
    uniqueUsersCount: number;
  };
  onAdminLoginSuccess?: (adminUser: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  currentUser,
  onLogin,
  onAdminLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'trainee' | 'admin'>('trainee');
  const [traineeStep, setTraineeStep] = useState<'credentials' | 'new_user_name' | 'forgot_password'>('credentials');

  // Trainee credentials
  const [email, setEmail] = useState(currentUser?.email || '');
  const [traineePassword, setTraineePassword] = useState(currentUser?.password || '');
  const [showTraineePassword, setShowTraineePassword] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password self-service state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPwd, setShowForgotNewPwd] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('athulgovind.1993@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // Admin change password state (for LoginScreen)
  const [isChangingPasswordMode, setIsChangingPasswordMode] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changePwdError, setChangePwdError] = useState<string | null>(null);
  const [changePwdSuccess, setChangePwdSuccess] = useState<string | null>(null);
  const [isChangingPwdLoading, setIsChangingPwdLoading] = useState(false);

  // Handle Step 1: Email & Password verification / Auto-login
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = traineePassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setError('Please enter your password (minimum 4 characters).');
      return;
    }

    setIsCheckingAccount(true);

    try {
      // 1. Try fetching existing user profile from localStorage, state, Firestore, or backend
      let existingUser: UserProfile | null = null;

      // Check current state or localStorage first
      try {
        const savedLocal = localStorage.getItem('counseling_trainer_user');
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (parsed?.email?.toLowerCase() === cleanEmail && parsed?.name && parsed.name.trim().length > 0) {
            existingUser = parsed;
          }
        }
      } catch {}

      if (!existingUser && currentUser?.email?.toLowerCase() === cleanEmail && currentUser?.name) {
        existingUser = currentUser;
      }

      // Check Firestore
      if (!existingUser) {
        try {
          existingUser = await getUserFromFirestore(cleanEmail);
        } catch (dbErr) {
          console.warn('Firestore user fetch error:', dbErr);
        }
      }

      // Check backend server DB
      if (!existingUser) {
        try {
          const res = await fetch(`/api/users/profile?email=${encodeURIComponent(cleanEmail)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.user?.name && data.user.name.trim().length > 0) {
              existingUser = data.user;
            }
          }
        } catch (serverErr) {
          console.warn('Server user check error:', serverErr);
        }
      }

      // 2. If user exists with a registered full name:
      if (existingUser && existingUser.name && existingUser.name.trim().length > 0) {
        // Password validation if stored
        if (existingUser.password && existingUser.password.trim().length >= 4 && existingUser.password !== cleanPassword) {
          setError('Incorrect password for this account. Please verify your credentials.');
          setIsCheckingAccount(false);
          return;
        }

        const stableUser: UserProfile = {
          ...existingUser,
          isPremium: existingUser.isPremium !== false,
          email: cleanEmail,
          password: cleanPassword,
          lastActiveAt: new Date().toISOString(),
        };

        // Update in background
        saveUserToFirestore(stableUser).catch(() => {});
        setIsCheckingAccount(false);
        onLogin(stableUser);
        return;
      }

      // 3. New user (email not found in database):
      if (name.trim()) {
        // If user already typed their name in prefilled state
        const autoResolvedUser: UserProfile = {
          id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: name.trim(),
          email: cleanEmail,
          password: cleanPassword,
          level: 'Beginner',
          registeredAt: new Date().toISOString(),
          isAdmin: false,
          role: 'trainee',
          isPremium: true,
        };

        saveUserToFirestore(autoResolvedUser).catch(() => {});
        setIsCheckingAccount(false);
        onLogin(autoResolvedUser);
        return;
      }

      // User needs to provide their Full Name / Clinician Title
      setIsCheckingAccount(false);
      setTraineeStep('new_user_name');
    } catch (err: any) {
      console.error('Login check error:', err);
      setIsCheckingAccount(false);
      // If error occurs, let them proceed to name step
      setTraineeStep('new_user_name');
    }
  };

  // Handle Step 2: New user enters their Full Name
  const handleNewUserNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name or clinician title.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = traineePassword.trim();
    const stableId = currentUser?.id || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const newUser: UserProfile = {
      id: stableId,
      name: name.trim(),
      email: cleanEmail,
      password: cleanPassword,
      level: currentUser?.level || 'Beginner',
      registeredAt: currentUser?.registeredAt || new Date().toISOString(),
      isAdmin: false,
      role: 'trainee',
      isPremium: currentUser?.isPremium !== false,
    };

    saveUserToFirestore(newUser).catch(() => {});
    onLogin(newUser);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setIsAdminSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminError(data.error || 'Authentication failed. Please check credentials.');
        setIsAdminSubmitting(false);
        return;
      }

      const adminUser: UserProfile = data.admin;
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(adminUser);
      } else {
        onLogin(adminUser);
      }
    } catch (err: any) {
      setAdminError('Network or server error during admin sign in.');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleAdminChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwdError(null);
    setChangePwdSuccess(null);

    if (!currentPwd) {
      setChangePwdError('Please enter your current administrator password.');
      return;
    }

    if (!newPwd || newPwd.length < 6) {
      setChangePwdError('New password must be at least 6 characters long.');
      return;
    }

    if (newPwd !== confirmPwd) {
      setChangePwdError('New password and confirmation do not match.');
      return;
    }

    if (newPwd === currentPwd) {
      setChangePwdError('The new password cannot be the same as your current password.');
      return;
    }

    setIsChangingPwdLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          currentPassword: currentPwd,
          newPassword: newPwd,
          confirmPassword: confirmPwd,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update administrator password');
      }

      setChangePwdSuccess(data.message || 'Password successfully updated!');
      setAdminPassword(newPwd);
      setTimeout(() => {
        setIsChangingPasswordMode(false);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      }, 1500);
    } catch (err: any) {
      setChangePwdError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPwdLoading(false);
    }
  };

  // Handle Practitioner Self-Service Password Reset
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanPwd = forgotNewPassword.trim();
    const cleanConfirm = forgotConfirmPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }
    if (!cleanPwd || cleanPwd.length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }
    if (cleanPwd !== cleanConfirm) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          newPassword: cleanPwd,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Sync with Firestore
      resetUserPasswordInFirestore(cleanEmail, cleanPwd).catch(() => {});

      setForgotSuccess('Your password has been successfully reset! You can now sign in with your new credentials.');
      setEmail(cleanEmail);
      setTraineePassword(cleanPwd);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Ensure your email is registered.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8 bg-stone-50/50">
      <div className="w-full max-w-xl">
        {/* Top Header Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-700 text-white shadow-md shadow-teal-700/20 mb-3">
            <Brain className="w-7 h-7 text-teal-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Counseling Simulation Portal
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
            Deliberate practice environment with an in-character client agent and supervisory rubric evaluation.
          </p>
        </div>

        {/* Identification & Login Box */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
          {activeTab === 'trainee' ? (
            <>
              {traineeStep === 'credentials' ? (
                /* Step 1: Standard Email & Password Screen */
                <div>
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Practitioner Access
                      </span>
                      <h2 className="text-lg font-semibold text-stone-900">
                        Sign In to Your Workspace
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors flex items-center space-x-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin Access</span>
                    </button>
                  </div>

                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                        {error}
                      </div>
                    )}

                    {/* Email ID Input */}
                    <div>
                      <label htmlFor="user-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="user-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. alex.morgan@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all placeholder:text-stone-400"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="user-password" className="block text-xs font-semibold text-stone-700">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                            setForgotError(null);
                            setForgotSuccess(null);
                            setTraineeStep('forgot_password');
                          }}
                          className="text-xs text-teal-700 hover:text-teal-800 font-medium hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="user-password"
                          type={showTraineePassword ? 'text' : 'password'}
                          required
                          value={traineePassword}
                          onChange={(e) => {
                            setTraineePassword(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="Enter your account password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all placeholder:text-stone-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTraineePassword(!showTraineePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showTraineePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        id="enter-portal-btn"
                        type="submit"
                        disabled={isCheckingAccount}
                        className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60 font-semibold text-sm shadow-sm transition-all group cursor-pointer"
                      >
                        {isCheckingAccount ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Authenticating Workspace...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In / Continue</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-center text-stone-400 pt-1">
                      First time here? Enter your email and password above to create your profile.
                    </p>
                  </form>
                </div>
              ) : traineeStep === 'forgot_password' ? (
                /* Step 3: Self-Service Password Reset */
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTraineeStep('credentials');
                        setForgotError(null);
                        setForgotSuccess(null);
                      }}
                      className="text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                      Password Reset
                    </span>
                  </div>

                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-2.5 border border-amber-200">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">
                      Reset Your Password
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Enter your registered email address and choose a new password for your account.
                    </p>
                  </div>

                  {forgotSuccess ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium space-y-2">
                        <div className="font-bold flex items-center space-x-1.5">
                          <UserCheck className="w-4 h-4 text-teal-700" />
                          <span>Password Reset Successful</span>
                        </div>
                        <p>{forgotSuccess}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTraineeStep('credentials');
                          setForgotSuccess(null);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold text-xs transition-colors"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      {forgotError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                          {forgotError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Registered Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              if (forgotError) setForgotError(null);
                            }}
                            placeholder="e.g. alex.morgan@email.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showForgotNewPwd ? 'text' : 'password'}
                            required
                            value={forgotNewPassword}
                            onChange={(e) => {
                              setForgotNewPassword(e.target.value);
                              if (forgotError) setForgotError(null);
                            }}
                            placeholder="Minimum 4 characters"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPwd(!showForgotNewPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                          >
                            {showForgotNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showForgotNewPwd ? 'text' : 'password'}
                            required
                            value={forgotConfirmPassword}
                            onChange={(e) => {
                              setForgotConfirmPassword(e.target.value);
                              if (forgotError) setForgotError(null);
                            }}
                            placeholder="Re-enter your new password"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 font-semibold text-sm shadow-sm transition-all cursor-pointer"
                        >
                          {forgotLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating Password...</span>
                            </>
                          ) : (
                            <>
                              <span>Set New Password</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Step 2: New Practitioner Profile Name Setup */
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTraineeStep('credentials');
                        setError(null);
                      }}
                      className="text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                      New Clinician Setup
                    </span>
                  </div>

                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2.5 border border-teal-200">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">
                      Welcome! Tell us your name
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Setting up your practice record for{' '}
                      <span className="font-semibold text-stone-800">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleNewUserNameSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                        {error}
                      </div>
                    )}

                    {/* Name Input */}
                    <div>
                      <label htmlFor="user-full-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Full Name / Clinician Title *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="user-full-name"
                          type="text"
                          autoFocus
                          required
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. Dr. Alex Morgan or Sarah Chen"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all placeholder:text-stone-400"
                        />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">
                        This name will appear on your session transcripts and supervisory scorecards.
                      </p>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        id="save-profile-btn"
                        type="submit"
                        className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold text-sm shadow-sm transition-all group cursor-pointer"
                      >
                        <span>Complete Profile & Enter Dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            /* Admin Sign In Tab */
            <>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Administrator & Research Hub</span>
                  </span>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Product Owner & Executive Control
                  </h2>
                </div>
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Full Privileges</span>
                </div>
              </div>

              {currentUser?.isAdmin ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-7 h-7 text-amber-700" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">
                    Authenticated as {currentUser.name || 'Athul Govind'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Full administrator rights active for <span className="font-mono text-stone-700">{currentUser.email}</span>. You can inspect all clinician activity logs, manage premium tier privileges, and restore database backups.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      id="admin-enter-portal-btn"
                      onClick={() => onAdminLoginSuccess && onAdminLoginSuccess(currentUser)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Enter Admin Management Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('trainee')}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs sm:text-sm transition-colors"
                    >
                      Return to Trainee View
                    </button>
                  </div>
                </div>
              ) : isChangingPasswordMode ? (
                /* Change Password Form */
                <div className="animate-in fade-in duration-200">
                  <div className="p-3 mb-5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-2.5">
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Update Administrator Credentials</p>
                      <p className="text-amber-800 mt-0.5">
                        Verify your current credentials and create a new master password. The update takes effect immediately.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminChangePasswordSubmit} className="space-y-4">
                    {changePwdError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                        {changePwdError}
                      </div>
                    )}

                    {changePwdSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                        {changePwdSuccess} Redirecting to sign in...
                      </div>
                    )}

                    {/* Admin Email (read-only for clarity) */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          disabled
                          value={adminEmail}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 text-xs font-mono cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showCurrentPwd ? 'text' : 'password'}
                          required
                          value={currentPwd}
                          onChange={(e) => {
                            setCurrentPwd(e.target.value);
                            if (changePwdError) setChangePwdError(null);
                          }}
                          placeholder="Current administrator password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        New Password (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          required
                          value={newPwd}
                          onChange={(e) => {
                            setNewPwd(e.target.value);
                            if (changePwdError) setChangePwdError(null);
                          }}
                          placeholder="New secure password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          required
                          value={confirmPwd}
                          onChange={(e) => {
                            setConfirmPwd(e.target.value);
                            if (changePwdError) setChangePwdError(null);
                          }}
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        type="submit"
                        disabled={isChangingPwdLoading || !currentPwd || !newPwd || newPwd.length < 6}
                        className="flex-1 py-3 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isChangingPwdLoading ? 'Updating...' : 'Save New Password'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPasswordMode(false);
                          setChangePwdError(null);
                        }}
                        className="px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="p-3 mb-5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Administrator Privileges</p>
                      <p className="text-amber-800 mt-0.5">
                        Sign in to inspect all registered clinicians, manage Premium access tiers, view session transcripts, and upload/download database backups across version releases.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminSubmit} className="space-y-4">
                    {adminError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                        {adminError}
                      </div>
                    )}

                    {/* Admin Email Input */}
                    <div>
                      <label htmlFor="admin-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="admin-email"
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => {
                            setAdminEmail(e.target.value);
                            if (adminError) setAdminError(null);
                          }}
                          placeholder="athulgovind.1993@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Admin Password Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="admin-password" className="block text-xs font-semibold text-stone-700">
                          Admin Security Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPasswordMode(true);
                            setAdminError(null);
                          }}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="admin-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => {
                            setAdminPassword(e.target.value);
                            if (adminError) setAdminError(null);
                          }}
                          placeholder="Enter administrator password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Admin Login */}
                    <div className="pt-2">
                      <button
                        id="submit-admin-login-btn"
                        type="submit"
                        disabled={isAdminSubmitting}
                        className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{isAdminSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('trainee')}
                        className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors"
                      >
                        Return to Trainee Practitioner Check-In
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
