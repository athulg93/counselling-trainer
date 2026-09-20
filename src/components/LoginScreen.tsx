import React, { useState } from 'react';
import { User, Mail, Award, ArrowRight, ShieldCheck, Brain, Lock, Check, Database, KeyRound, Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { UserProfile } from '../types';

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

  // Trainee check-in state
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Professional'>(
    currentUser?.level === 'Intermediate' ? 'Intermediate' : 'Beginner'
  );
  const [error, setError] = useState<string | null>(null);

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

  const handleTraineeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email ID.');
      return;
    }

    const updatedUser: UserProfile = {
      id: currentUser?.id || `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      level,
      registeredAt: currentUser?.registeredAt || new Date().toISOString(),
      isAdmin: false,
      role: 'trainee',
      isPremium: currentUser?.isPremium ?? false,
    };

    onLogin(updatedUser);
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
      // Pre-populate adminPassword in login form and transition
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

        {/* Portal Mode Tabs: Trainee Check-in vs Admin Portal */}
        <div className="flex rounded-xl bg-stone-200/70 p-1 mb-4 shadow-inner">
          <button
            type="button"
            id="tab-trainee-checkin"
            onClick={() => setActiveTab('trainee')}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'trainee'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4 text-teal-700" />
            <span>Trainee Practitioner Check-In</span>
          </button>
          <button
            type="button"
            id="tab-admin-portal"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'admin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Administrator & Research Hub</span>
          </button>
        </div>

        {/* Identification & Login Box */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
          {activeTab === 'trainee' ? (
            <>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Clinician Identification
                  </span>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Trainee & Practitioner Check-In
                  </h2>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Free Tier Default</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Session Logged</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTraineeSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Name Input */}
                <div>
                  <label htmlFor="user-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="user-name"
                      type="text"
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
                </div>

                {/* Email ID Input */}
                <div>
                  <label htmlFor="user-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Email ID *
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

                {/* Training Level Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Training Level *
                    </label>
                    <span className="text-[11px] text-stone-400">
                      Select your practice track
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Beginner */}
                    <button
                      type="button"
                      id="level-beginner-btn"
                      onClick={() => setLevel('Beginner')}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        level === 'Beginner'
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-sm text-stone-900">
                          Beginner
                        </span>
                        {level === 'Beginner' ? (
                          <div className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-300" />
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 leading-tight">
                        Easiest pacing • Novice scenarios (15 turns)
                      </span>
                    </button>

                    {/* Intermediate */}
                    <button
                      type="button"
                      id="level-intermediate-btn"
                      onClick={() => setLevel('Intermediate')}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        level === 'Intermediate'
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-sm text-stone-900">
                          Intermediate
                        </span>
                        {level === 'Intermediate' ? (
                          <div className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-300" />
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 leading-tight">
                        Standard pacing • Guarded resistance (30 turns)
                      </span>
                    </button>

                    {/* Professional (Locked) */}
                    <div
                      id="level-professional-locked"
                      className="relative flex flex-col items-start p-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 text-left opacity-60 cursor-not-allowed select-none"
                      title="Professional level is locked and coming soon"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium text-sm text-stone-500">
                          Professional
                        </span>
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <span className="text-[11px] text-stone-400 leading-tight">
                        Locked • High resistance & subtle referral cues
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    id="enter-portal-btn"
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-semibold text-sm shadow-sm transition-all group"
                  >
                    <span>Enter Simulation Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </form>
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
