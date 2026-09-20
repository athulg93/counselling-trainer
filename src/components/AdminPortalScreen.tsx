import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Award,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Database,
  ArrowRight,
  UserCheck,
  UserPlus,
  Crown,
  History,
  Activity,
  Layers,
  FileCheck,
  Server,
  Play,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { UserProfile, AdminUserSummary, StoredSessionRecord, UserTransactionEvent } from '../types';
import { CaseManagerTab } from './CaseManagerTab';
import {
  deleteUserFromFirestore,
  resetUserPasswordInFirestore,
  saveUserToFirestore,
  updateUserAdminRoleInFirestore,
} from '../lib/firebase';

interface AdminPortalScreenProps {
  currentUser: UserProfile | null;
  onNavigateToSimulation: () => void;
  onLogout?: () => void;
  onCasesUpdated?: () => void;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({
  currentUser,
  onNavigateToSimulation,
  onLogout,
  onCasesUpdated,
}) => {
  const [usersData, setUsersData] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'cases' | 'backup' | 'security'>('users');
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'premium' | 'standard'>('all');
  
  // Expanded user transactions
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [activeInspectionSession, setActiveInspectionSession] = useState<StoredSessionRecord | null>(null);

  // Status feedback toast
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [togglingPremiumEmail, setTogglingPremiumEmail] = useState<string | null>(null);

  // Backup & Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  // Password & Security State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<{
    email: string;
    hasCustomPassword: boolean;
    lastUpdatedAt: string | null;
  } | null>(null);

  // Multi-Admin Management State
  const [adminList, setAdminList] = useState<any[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState<boolean>(false);
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [newAdminDepartment, setNewAdminDepartment] = useState<string>('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState<boolean>(false);
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);
  const [togglingAdminEmail, setTogglingAdminEmail] = useState<string | null>(null);

  // Admin User Action Modals: Reset Password & Delete User
  const [userToResetPassword, setUserToResetPassword] = useState<UserProfile | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState<string>('');
  const [isResettingUserPwd, setIsResettingUserPwd] = useState<boolean>(false);
  const [resetUserPwdError, setResetUserPwdError] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  // Fetch full users and transaction history from server
  const fetchUsersWithHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users-with-history');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setUsersData(data.users || []);
    } catch (err: any) {
      console.error('Error loading admin users data:', err);
      setError(err.message || 'Failed to retrieve registered users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminList = async () => {
    try {
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdminList(data.admins || []);
      }
    } catch (err) {
      console.error('Error fetching admin list:', err);
    }
  };

  const fetchCredentialStatus = async () => {
    try {
      const res = await fetch('/api/admin/credentials/status');
      if (res.ok) {
        const data = await res.json();
        setCredentialStatus(data);
      }
    } catch (err) {
      console.error('Error fetching credential status:', err);
    }
  };

  useEffect(() => {
    fetchUsersWithHistory();
    fetchCredentialStatus();
    fetchAdminList();
  }, []);

  // Create new Administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError(null);
    const cleanName = newAdminName.trim();
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    const cleanPassword = newAdminPassword.trim();
    const cleanInst = newAdminDepartment.trim() || 'Executive Administration';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setCreateAdminError('Name, email, and password are required.');
      return;
    }
    if (cleanPassword.length < 4) {
      setCreateAdminError('Password must be at least 4 characters long.');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          institution: cleanInst,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create administrator.');
      }

      // Sync Firestore
      saveUserToFirestore({
        id: `admin_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        institution: cleanInst,
        isAdmin: true,
        role: 'admin',
        isPremium: true,
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }).catch(() => {});

      triggerFeedback('success', `Administrator ${cleanName} (${cleanEmail}) successfully created!`);
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminDepartment('');

      await fetchAdminList();
      await fetchUsersWithHistory();
    } catch (err: any) {
      setCreateAdminError(err.message || 'Failed to create administrator.');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Toggle Admin Role on existing user
  const handleToggleAdminRole = async (userEmail: string, currentIsAdmin: boolean) => {
    const newIsAdmin = !currentIsAdmin;
    setTogglingAdminEmail(userEmail);
    try {
      const res = await fetch('/api/admin/toggle-admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, isAdmin: newIsAdmin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle admin role');
      }

      // Sync Firestore
      updateUserAdminRoleInFirestore(userEmail, newIsAdmin).catch(() => {});

      // Update local usersData state
      setUsersData((prev) =>
        prev.map((item) => {
          if (item.user.email.toLowerCase() === userEmail.toLowerCase()) {
            const updatedUser: UserProfile = { ...item.user, isAdmin: newIsAdmin, role: (newIsAdmin ? 'admin' : 'trainee') as UserProfile['role'] };
            const newHistoryEvent: UserTransactionEvent = {
              id: `event_${Date.now()}`,
              type: 'audit_event',
              timestamp: new Date().toISOString(),
              title: newIsAdmin ? 'Promoted to Administrator' : 'Administrator Role Revoked',
              details: `Admin role updated by ${currentUser?.name || 'Athul Govind'}`,
            };
            return {
              ...item,
              user: updatedUser,
              history: [newHistoryEvent, ...item.history],
            };
          }
          return item;
        })
      );

      await fetchAdminList();
      triggerFeedback(
        'success',
        newIsAdmin
          ? `Promoted ${userEmail} to Administrator with full administrative access.`
          : `Revoked Administrator privileges for ${userEmail}.`
      );
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Failed to update administrator role.');
    } finally {
      setTogglingAdminEmail(null);
    }
  };

  // Delete secondary admin account
  const handleDeleteAdminAccount = async (adminEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove administrator permissions for ${adminEmail}?`)) return;
    try {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(adminEmail)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin');

      updateUserAdminRoleInFirestore(adminEmail, false).catch(() => {});
      triggerFeedback('success', `Administrator ${adminEmail} removed successfully.`);
      await fetchAdminList();
      await fetchUsersWithHistory();
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Failed to delete administrator.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current administrator password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('The new password cannot be the same as your current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email || 'athulgovind.1993@gmail.com',
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(data.message || 'Password successfully updated!');
      triggerFeedback('success', 'Administrator password updated successfully!');
      
      // Reset input fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh credential status and audit log
      await fetchCredentialStatus();
      await fetchUsersWithHistory();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update administrator password.');
      triggerFeedback('error', err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Show transient toast
  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  // Toggle user premium access
  const handleTogglePremium = async (userEmail: string, currentPremium: boolean) => {
    const newPremium = !currentPremium;
    setTogglingPremiumEmail(userEmail);
    try {
      const res = await fetch('/api/admin/users/toggle-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, isPremium: newPremium }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update premium status');
      }

      // Update local state immediately
      setUsersData((prev) =>
        prev.map((item) => {
          if (item.user.email.toLowerCase() === userEmail.toLowerCase()) {
            const updatedUser = { ...item.user, isPremium: newPremium };
            const newHistoryEvent: UserTransactionEvent = {
              id: `event_${Date.now()}`,
              type: newPremium ? 'premium_granted' : 'premium_revoked',
              timestamp: new Date().toISOString(),
              title: newPremium ? 'Premium Tier Access Granted' : 'Premium Tier Access Revoked',
              details: `Action executed by Administrator Athul Govind`,
            };
            return {
              ...item,
              user: updatedUser,
              history: [newHistoryEvent, ...item.history],
            };
          }
          return item;
        })
      );

      triggerFeedback(
        'success',
        newPremium
          ? `Granted Premium privileges to ${userEmail}. Phase 2 rubric analysis & advanced cases are now unlocked!`
          : `Revoked Premium privileges for ${userEmail}.`
      );
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Could not update premium status.');
    } finally {
      setTogglingPremiumEmail(null);
    }
  };

  // Reset a User's Password (Admin Action)
  const handleConfirmResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPassword) return;
    setResetUserPwdError(null);

    const cleanPwd = newPasswordForUser.trim();
    if (cleanPwd.length < 4) {
      setResetUserPwdError('Password must be at least 4 characters long.');
      return;
    }

    setIsResettingUserPwd(true);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userToResetPassword.email,
          newPassword: cleanPwd,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Also update Firestore
      resetUserPasswordInFirestore(userToResetPassword.email, cleanPwd).catch(() => {});

      // Update local state and history event
      setUsersData((prev) =>
        prev.map((item) => {
          if (item.user.email.toLowerCase() === userToResetPassword.email.toLowerCase()) {
            const newHistoryEvent: UserTransactionEvent = {
              id: `event_${Date.now()}`,
              type: 'audit_event',
              timestamp: new Date().toISOString(),
              title: 'Password Reset by Administrator',
              details: `Password updated by Athul Govind`,
            };
            return {
              ...item,
              user: { ...item.user, password: cleanPwd },
              history: [newHistoryEvent, ...item.history],
            };
          }
          return item;
        })
      );

      triggerFeedback('success', `Password for ${userToResetPassword.email} successfully updated.`);
      setUserToResetPassword(null);
      setNewPasswordForUser('');
    } catch (err: any) {
      setResetUserPwdError(err.message || 'Failed to reset password.');
    } finally {
      setIsResettingUserPwd(false);
    }
  };

  // Delete User and All Data (Admin Action)
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userToDelete.email)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Delete from Firestore
      deleteUserFromFirestore(userToDelete.email).catch(() => {});

      // Remove from local state
      setUsersData((prev) =>
        prev.filter((item) => item.user.email.toLowerCase() !== userToDelete.email.toLowerCase())
      );

      triggerFeedback(
        'success',
        `User ${userToDelete.email} and all associated simulation transcripts were permanently deleted.`
      );
      setUserToDelete(null);
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Delete a session record
  const handleDeleteSession = async (sessionId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete session ${sessionId}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');

      // Update local state
      setUsersData((prev) =>
        prev.map((item) => {
          if (item.user.email.toLowerCase() === userEmail.toLowerCase()) {
            const remainingSessions = item.sessions.filter((s) => s.id !== sessionId);
            const remainingHistory = item.history.filter((h) => h.sessionId !== sessionId);
            return {
              ...item,
              totalSessions: remainingSessions.length,
              sessions: remainingSessions,
              history: remainingHistory,
            };
          }
          return item;
        })
      );

      if (activeInspectionSession?.id === sessionId) {
        setActiveInspectionSession(null);
      }

      triggerFeedback('success', `Session ${sessionId} removed successfully.`);
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Error deleting session.');
    }
  };

  // Download individual session transcript
  const handleDownloadSession = (session: StoredSessionRecord, format: 'json' | 'txt') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let content = `==========================================================\n`;
      content += `CLINICAL SIMULATION TRANSCRIPT & SUPERVISORY REPORT\n`;
      content += `==========================================================\n\n`;
      content += `Session ID: ${session.id}\n`;
      content += `Timestamp: ${session.timestamp}\n`;
      content += `Trainee: ${session.user?.name || 'Practitioner'} (${session.user?.email || 'N/A'})\n`;
      content += `Vignette: ${session.vignette?.clientName} (${session.vignette?.track}) - ${session.vignette?.difficulty} Level\n`;
      content += `Modality: ${session.config?.modality?.toUpperCase()} | Mode: ${session.config?.mode}\n`;
      content += `Supervisor Headline Score: ${session.evaluation?.overallScore || 'N/A'}/100 (${session.evaluation?.bandLabel || 'Completed'})\n\n`;
      content += `--- CONVERSATION TRANSCRIPT ---\n\n`;
      (session.messages || []).forEach((msg) => {
        const role = msg.role === 'counselor' ? 'COUNSELOR' : (session.vignette?.clientName || 'CLIENT').toUpperCase();
        content += `${role} [Turn ${msg.turnNumber || ''}]:\n${msg.text}\n\n`;
      });
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${session.id}_transcript.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle Backup File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setParsedBackupData(parsed);
      } catch (err) {
        triggerFeedback('error', 'Selected file is not valid JSON. Please check the backup file.');
        setSelectedFile(null);
        setParsedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Database Restore
  const handleExecuteRestore = async () => {
    if (!parsedBackupData) {
      triggerFeedback('error', 'Please select a valid JSON backup file first.');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/backup/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: restoreMode,
          backupData: parsedBackupData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Restore failed');
      }

      setRestoreSuccessMsg(data.message || 'Database restored successfully!');
      triggerFeedback('success', `Database successfully restored! Total active records: ${data.recordsCount}`);
      
      // Clear file selection and refresh user data
      setSelectedFile(null);
      setParsedBackupData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchUsersWithHistory();
    } catch (err: any) {
      triggerFeedback('error', err.message || 'Failed to restore database.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Filtered Users List
  const filteredUsers = usersData.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      item.user.name.toLowerCase().includes(query) ||
      item.user.email.toLowerCase().includes(query) ||
      (item.user.institution && item.user.institution.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (tierFilter === 'premium') return item.user.isPremium;
    if (tierFilter === 'standard') return !item.user.isPremium;
    return true;
  });

  // Calculate high-level stats
  const totalUsersCount = usersData.length;
  const premiumCount = usersData.filter((u) => u.user.isPremium).length;
  const totalSessionsCount = usersData.reduce((acc, u) => acc + u.totalSessions, 0);
  const totalTurnsCount = usersData.reduce((acc, u) => acc + u.totalTurns, 0);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Toast Notification */}
      {actionFeedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center space-x-2.5 transition-all animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Top Administrative Header Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-md mb-8 border border-stone-800 overflow-hidden">
        {/* Top Utility Sub-Header */}
        <div className="flex flex-wrap items-center gap-2.5 pb-5 mb-5 border-b border-stone-800/80">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5 shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Executive Clinical Hub</span>
          </span>
          <span className="text-xs text-stone-400 font-medium">
            Authenticated as:{' '}
            <span className="text-stone-200 font-mono">
              {currentUser?.email || 'athulgovind.1993@gmail.com'}
            </span>
          </span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Practitioner Intelligence & Database Hub
            </h1>
            <p className="text-sm text-stone-300 mt-2 leading-relaxed">
              Monitor registered clinicians, inspect multi-turn session transaction logs, grant or revoke
              Phase 2 premium privileges, and download or restore complete database backups across version releases.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              id="admin-create-admin-btn"
              onClick={() => {
                setShowAddAdminModal(true);
                setCreateAdminError(null);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
              title="Create a new system administrator"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Admin</span>
            </button>

            <button
              id="admin-launch-simulation-btn"
              onClick={onNavigateToSimulation}
              className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Simulation</span>
            </button>

            <a
              href="/api/admin/backup/download"
              download
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-medium text-xs sm:text-sm transition-colors flex items-center space-x-2"
              title="Download raw database backup (.json)"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Backup</span>
            </a>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
              }`}
              title="Change Administrator Password & Security Settings"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Security Settings</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-800/80 rounded-2xl p-3.5 border border-stone-700/60">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Registered Clinicians
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-white">{totalUsersCount}</span>
              <span className="text-xs text-stone-400">practitioners</span>
            </div>
          </div>

          <div className="bg-stone-800/80 rounded-2xl p-3.5 border border-stone-700/60">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center">
              <Crown className="w-3 h-3 mr-1" />
              Premium Access Tier
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-300">{premiumCount}</span>
              <span className="text-xs text-stone-400">unlocked</span>
            </div>
          </div>

          <div className="bg-stone-800/80 rounded-2xl p-3.5 border border-stone-700/60">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
              Completed Sessions
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-teal-300">{totalSessionsCount}</span>
              <span className="text-xs text-stone-400">simulations</span>
            </div>
          </div>

          <div className="bg-stone-800/80 rounded-2xl p-3.5 border border-stone-700/60">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Total Turns Logged
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-white">{totalTurnsCount}</span>
              <span className="text-xs text-stone-400">exchanges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-stone-200 pb-3 mb-6">
        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Activity ({usersData.length})</span>
        </button>

        <button
          id="admin-tab-cases"
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'cases'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>Case Studies & Personas</span>
        </button>

        <button
          id="admin-tab-backup"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'backup'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }`}
        >
          <Database className="w-4 h-4 text-amber-600" />
          <span>Backup & Disaster Recovery</span>
        </button>

        <button
          id="admin-tab-security"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-500" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={fetchUsersWithHistory}
          disabled={loading}
          className="ml-auto p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          title="Refresh database records"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY, TRANSACTION HISTORY & PREMIUM MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Controls Bar: Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or clinic..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-stone-500">Tier:</span>
              <button
                onClick={() => setTierFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tierFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All ({usersData.length})
              </button>
              <button
                onClick={() => setTierFilter('premium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  tierFilter === 'premium'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Premium ({premiumCount})</span>
              </button>
              <button
                onClick={() => setTierFilter('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tierFilter === 'standard'
                    ? 'bg-stone-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Standard ({usersData.length - premiumCount})
              </button>
            </div>
          </div>

          {/* Premium Tier Value Proposition Callout */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-amber-950">
                  Premium Clinical Privileges Control
                </h2>
                <p className="text-xs text-amber-900/80 leading-relaxed mt-0.5">
                  Granting Premium tier unlocks full <strong>Phase 2 Qualitative Supervision</strong> (strengths, growth areas, rupture/repair turning points, CBT cognitive distortions), <strong>covert planted referral cases</strong>, and unlimited 30-turn standard sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-700">Loading clinician records & session histories...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No matching clinicians found</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `No practitioners match "${searchQuery}". Try broadening your search.`
                  : 'No users have registered or completed sessions yet. Start a session to generate records.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((item) => {
                const isExpanded = expandedUserEmail === item.user.email;
                const isToggling = togglingPremiumEmail === item.user.email;
                const isTogglingAdmin = togglingAdminEmail === item.user.email;
                const isMasterAdmin = item.user.email.toLowerCase() === 'athulgovind.1993@gmail.com';
                const isUserAdmin = !!item.user.isAdmin || item.user.role === 'admin' || isMasterAdmin;

                return (
                  <div
                    key={item.user.email}
                    className={`bg-white rounded-2xl border transition-all shadow-sm ${
                      isMasterAdmin
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : isUserAdmin
                        ? 'border-indigo-200 ring-1 ring-indigo-100'
                        : item.user.isPremium
                        ? 'border-amber-200 ring-1 ring-amber-100'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* User Summary Row */}
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Clinician Meta */}
                      <div className="flex items-start space-x-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl font-bold text-sm flex items-center justify-center shrink-0 ${
                            isMasterAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isUserAdmin
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : item.user.isPremium
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {item.user.name ? item.user.name.slice(0, 2).toUpperCase() : 'PR'}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-stone-900">
                              {item.user.name || 'Anonymous Practitioner'}
                            </h3>

                            {isMasterAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-stone-900 text-amber-300 flex items-center space-x-1">
                                <Crown className="w-3 h-3 text-amber-400 mr-1" />
                                Master Admin
                              </span>
                            ) : isUserAdmin ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center space-x-1">
                                <ShieldCheck className="w-3 h-3 text-indigo-600 mr-1" />
                                Administrator
                              </span>
                            ) : null}

                            {item.user.isPremium ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                                <Crown className="w-3 h-3 text-amber-600 mr-1" />
                                Premium Access
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                Standard Free
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-1">
                            <span className="font-mono text-stone-700">{item.user.email}</span>
                            <span>•</span>
                            <span>{item.user.institution || 'General Clinic'}</span>
                            <span>•</span>
                            <span className="font-medium text-stone-600">{item.user.level || 'Beginner'}</span>
                            <span>•</span>
                            <span>Registered {new Date(item.user.registeredAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Performance & Activity Metrics */}
                      <div className="flex items-center space-x-6 px-4 py-2 bg-stone-50 rounded-xl border border-stone-100 text-xs shrink-0">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Sessions</span>
                          <span className="text-sm font-bold text-stone-900">{item.totalSessions}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Turns</span>
                          <span className="text-sm font-bold text-stone-900">{item.totalTurns}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Avg Score</span>
                          <span
                            className={`text-sm font-bold ${
                              item.averageScore >= 85
                                ? 'text-emerald-700'
                                : item.averageScore >= 70
                                ? 'text-teal-700'
                                : item.averageScore > 0
                                ? 'text-amber-700'
                                : 'text-stone-400'
                            }`}
                          >
                            {item.averageScore > 0 ? `${item.averageScore}%` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 justify-end flex-wrap gap-y-2">
                        {/* Grant / Revoke Premium Button */}
                        <button
                          id={`toggle-premium-btn-${item.user.email}`}
                          disabled={isToggling}
                          onClick={() => handleTogglePremium(item.user.email, !!item.user.isPremium)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                            item.user.isPremium
                              ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                          title={
                            item.user.isPremium
                              ? 'Revoke Premium tier access'
                              : 'Grant full Premium tier access with qualitative Phase 2 analysis'
                          }
                        >
                          {isToggling ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : item.user.isPremium ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <Crown className="w-3.5 h-3.5" />
                          )}
                          <span>{item.user.isPremium ? 'Revoke Premium' : 'Grant Premium'}</span>
                        </button>

                        {/* Promote to / Demote from Admin (for non-master accounts) */}
                        {!isMasterAdmin && (
                          <button
                            id={`toggle-admin-btn-${item.user.email}`}
                            disabled={isTogglingAdmin}
                            onClick={() => handleToggleAdminRole(item.user.email, isUserAdmin)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors border ${
                              isUserAdmin
                                ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                                : 'border-stone-200 hover:bg-stone-100 text-stone-700'
                            }`}
                            title={isUserAdmin ? 'Demote administrator to regular clinician' : 'Promote clinician to administrator'}
                          >
                            {isTogglingAdmin ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isUserAdmin ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-stone-500" />
                            )}
                            <span>{isUserAdmin ? 'Demote Admin' : 'Make Admin'}</span>
                          </button>
                        )}

                        {/* Reset User Password Button */}
                        <button
                          id={`reset-pwd-btn-${item.user.email}`}
                          onClick={() => {
                            setUserToResetPassword(item.user);
                            setNewPasswordForUser('');
                            setResetUserPwdError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                          title="Set a new password for this user"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Reset Pwd</span>
                        </button>

                        {/* Delete User Button (Hidden for master admin) */}
                        {!isMasterAdmin && (
                          <button
                            id={`delete-user-btn-${item.user.email}`}
                            onClick={() => setUserToDelete(item.user)}
                            className="p-1.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-400 hover:text-rose-700 transition-colors"
                            title="Delete user account and all session records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Expand History Button */}
                        <button
                          onClick={() =>
                            setExpandedUserEmail(isExpanded ? null : item.user.email)
                          }
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        >
                          <History className="w-3.5 h-3.5 text-stone-500" />
                          <span>Activity Log ({item.history.length})</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-stone-400 ml-1" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Transaction History & Session Log */}
                    {isExpanded && (
                      <div className="border-t border-stone-200 bg-stone-50/70 p-5 rounded-b-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                            <Activity className="w-4 h-4 text-teal-700" />
                            <span>Audit Trail & Simulation Sessions for {item.user.name}</span>
                          </h4>
                          <span className="text-[11px] text-stone-500">
                            {item.sessions.length} simulation sessions • {item.history.length} lifecycle events
                          </span>
                        </div>

                        {item.history.length === 0 ? (
                          <p className="text-xs text-stone-500 italic py-2">
                            No recorded simulation sessions or state modifications yet for this practitioner.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {item.history.map((event) => {
                              const relatedSession = event.sessionId
                                ? item.sessions.find((s) => s.id === event.sessionId)
                                : null;

                              return (
                                <div
                                  key={event.id}
                                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-start space-x-3">
                                    <div
                                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                        event.type === 'premium_granted'
                                          ? 'bg-amber-100 text-amber-800'
                                          : event.type === 'premium_revoked'
                                          ? 'bg-rose-100 text-rose-800'
                                          : event.type === 'registration'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-teal-100 text-teal-800'
                                      }`}
                                    >
                                      {event.type === 'premium_granted' ? (
                                        <Crown className="w-4 h-4" />
                                      ) : event.type === 'premium_revoked' ? (
                                        <XCircle className="w-4 h-4" />
                                      ) : event.type === 'registration' ? (
                                        <UserCheck className="w-4 h-4" />
                                      ) : (
                                        <FileCheck className="w-4 h-4" />
                                      )}
                                    </div>

                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-stone-900">{event.title}</span>
                                        {event.score !== undefined && (
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                              event.score >= 85
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : event.score >= 70
                                                ? 'bg-teal-100 text-teal-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            Score: {event.score}%
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-stone-500 mt-0.5">{event.details}</p>
                                      <span className="text-[11px] text-stone-400 mt-1 block">
                                        {new Date(event.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions for sessions */}
                                  {relatedSession && (
                                    <div className="flex items-center space-x-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                                      <button
                                        onClick={() => setActiveInspectionSession(relatedSession)}
                                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center space-x-1"
                                        title="View multi-turn conversation dialogue"
                                      >
                                        <FileText className="w-3 h-3 text-teal-700" />
                                        <span>Transcript</span>
                                      </button>

                                      <button
                                        onClick={() => handleDownloadSession(relatedSession, 'txt')}
                                        className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                                        title="Download Plaintext Transcript (.txt)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteSession(relatedSession.id, item.user.email)}
                                        className="p-1 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50"
                                        title="Delete this test session"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: CASE STUDIES & SIMULATED CLIENT PERSONAS */}
      {activeTab === 'cases' && (
        <CaseManagerTab onCasesUpdated={onCasesUpdated} />
      )}

      {/* TAB 2: DATABASE BACKUP, DISASTER RECOVERY & UPLOAD */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Version Reset & Persistence Explainer */}
          <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-7 border border-stone-800">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Database Continuity Across Version Releases
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mt-1">
                  When releasing updates, deploying fresh containers, or upgrading codebase versions, the
                  local persistent database container may be refreshed. You can download the full database
                  backup before releasing, then re-upload it here to preserve all registered users,
                  simulation records, and granted premium privileges without disruption.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Export & Download Suite */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">
                      Export System Backups & Datasets
                    </h3>
                    <p className="text-xs text-stone-500">
                      Download current state before triggering a release or server restart.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-5">
                  {/* Master Backup JSON */}
                  <a
                    href="/api/admin/backup/download"
                    download
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-stone-50 hover:bg-white transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 block group-hover:text-teal-800">
                        Complete System Backup (JSON)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Raw snapshot of all user profiles, premium permissions, and session records.
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 ml-3" />
                  </a>

                  {/* Users CSV */}
                  <a
                    href="/api/users/export/csv"
                    download
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-stone-50 hover:bg-white transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 block group-hover:text-teal-800">
                        Registered Clinicians Roster (CSV)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Tabular list of emails, training levels, institutions, and session counts.
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 ml-3" />
                  </a>

                  {/* Sessions CSV */}
                  <a
                    href="/api/sessions/export/csv"
                    download
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-stone-50 hover:bg-white transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 block group-hover:text-teal-800">
                        Simulation Sessions Summary (CSV)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Turn counts, talk ratio %, supervisor scores, and vignette metadata for spreadsheets.
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 ml-3" />
                  </a>

                  {/* LLM Training JSON */}
                  <a
                    href="/api/sessions/export"
                    download
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-stone-900 bg-stone-50 hover:bg-white transition-all flex items-center justify-between group block"
                  >
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 block group-hover:text-teal-800">
                        LLM Model Training Dataset (JSON)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Formatted user/assistant multi-turn dialogues for Gemini fine-tuning.
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 ml-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Section 2: Re-upload & Restore Suite */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">
                      Upload & Restore Database
                    </h3>
                    <p className="text-xs text-stone-500">
                      Restore downloaded backups to resume operations seamlessly.
                    </p>
                  </div>
                </div>

                {/* Upload Mode Selector */}
                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-700 block mb-2">
                    Select Restore Strategy:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-2.5 rounded-lg text-left text-xs font-medium border transition-all ${
                        restoreMode === 'merge'
                          ? 'bg-white border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-600'
                          : 'bg-stone-100/70 border-stone-200 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <span className="font-bold block">Safe Merge</span>
                      <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                        Keep existing data and add missing users/sessions
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`p-2.5 rounded-lg text-left text-xs font-medium border transition-all ${
                        restoreMode === 'replace'
                          ? 'bg-white border-amber-600 text-amber-900 shadow-xs ring-1 ring-amber-600'
                          : 'bg-stone-100/70 border-stone-200 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <span className="font-bold block">Clean Overwrite</span>
                      <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                        Replace database with uploaded backup file
                      </span>
                    </button>
                  </div>
                </div>

                {/* File Dropzone */}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="admin-backup-file-input"
                  />
                  <label
                    htmlFor="admin-backup-file-input"
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
                    }`}
                  >
                    {selectedFile ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                        <span className="text-xs font-bold text-emerald-950 block">{selectedFile.name}</span>
                        <span className="text-[11px] text-emerald-700 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Validated JSON
                        </span>
                        <span className="text-[10px] text-stone-500 mt-2 underline">Click to change file</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-stone-400 mb-2" />
                        <span className="text-xs font-bold text-stone-800 block">
                          Click or drag backup (.json) file here
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5">
                          Accepts previously downloaded backups or dataset manifests
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Validation Preview */}
                {parsedBackupData && (
                  <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950">
                    <span className="font-bold block">Ready to restore:</span>
                    <span className="text-teal-800">
                      {Array.isArray(parsedBackupData)
                        ? `Found ${parsedBackupData.length} total database records.`
                        : parsedBackupData.records
                        ? `Found ${parsedBackupData.records.length} records exported on ${new Date(
                            parsedBackupData.backupExportedAt || ''
                          ).toLocaleDateString()}.`
                        : 'Custom JSON dataset ready to import.'}
                    </span>
                  </div>
                )}

                {restoreSuccessMsg && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-medium flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{restoreSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Restore Action Button */}
              <div className="mt-6">
                <button
                  id="admin-execute-restore-btn"
                  type="button"
                  disabled={!parsedBackupData || isRestoring}
                  onClick={handleExecuteRestore}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 ${
                    !parsedBackupData || isRestoring
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-stone-900 hover:bg-black text-white shadow-md'
                  }`}
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Restoring Database Records...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>
                        Restore Database ({restoreMode === 'merge' ? 'Safe Merge' : 'Clean Overwrite'})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD MANAGEMENT */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Access Control & Security Credentials
                </span>
                <h2 className="text-xl font-black text-stone-900 mt-0.5">
                  Administrator Password Settings
                </h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
                  Update the master authentication credentials for Athul Govind (
                  <span className="font-mono text-stone-700">athulgovind.1993@gmail.com</span>). Passwords are permanently stored in the server database and take effect immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Credential Status</span>
                <span className="font-bold text-stone-800 flex items-center mt-0.5">
                  {credentialStatus?.hasCustomPassword ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      Custom Password Active
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 mr-1" />
                      Default Master Credentials
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="border-b border-stone-100 pb-4 mb-6">
                  <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-stone-600" />
                    <span>Change Master Password</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Enter your existing password for verification, then provide your new desired password.
                  </p>
                </div>

                {passwordError && (
                  <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Password Update Failed</span>
                      <p className="mt-0.5">{passwordError}</p>
                    </div>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Security Credentials Updated</span>
                      <p className="mt-0.5">{passwordSuccess}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Current Administrator Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder="Enter current password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      New Administrator Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder="Minimum 6 characters"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        placeholder="Re-enter new password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Realtime password feedback check list */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                    <div className="flex items-center space-x-2 text-xs">
                      {newPassword.length >= 6 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shrink-0" />
                      )}
                      <span className={newPassword.length >= 6 ? 'text-stone-800 font-medium' : 'text-stone-500'}>
                        At least 6 characters in length
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {confirmPassword && newPassword === confirmPassword ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shrink-0" />
                      )}
                      <span
                        className={
                          confirmPassword && newPassword === confirmPassword
                            ? 'text-stone-800 font-medium'
                            : 'text-stone-500'
                        }
                      >
                        Passwords match exactly
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {newPassword && currentPassword && newPassword !== currentPassword ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shrink-0" />
                      )}
                      <span
                        className={
                          newPassword && currentPassword && newPassword !== currentPassword
                            ? 'text-stone-800 font-medium'
                            : 'text-stone-500'
                        }
                      >
                        Distinct from previous password
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword.length < 6}
                      className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        isChangingPassword || !currentPassword || !newPassword || newPassword.length < 6
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-900 hover:bg-black text-white shadow-md'
                      }`}
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Updating Master Credentials...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Save & Activate New Password</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError(null);
                        setPasswordSuccess(null);
                      }}
                      className="px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Information & Guidelines Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-sm border border-stone-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                    AG
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Athul Govind</h4>
                    <span className="text-[11px] text-stone-400 font-mono">athulgovind.1993@gmail.com</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-stone-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Authority Role</span>
                    <span className="text-stone-200 font-medium">Executive Master Admin</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Total Administrators</span>
                    <span className="text-amber-400 font-bold">{adminList.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Last Modified</span>
                    <span className="text-amber-400 font-medium">
                      {credentialStatus?.lastUpdatedAt
                        ? new Date(credentialStatus.lastUpdatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Initial Setup'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Accounts List */}
              <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Authorized Administrators ({adminList.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddAdminModal(true);
                      setCreateAdminError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
                  {adminList.map((admin) => {
                    const isMaster = admin.email.toLowerCase() === 'athulgovind.1993@gmail.com';
                    return (
                      <div
                        key={admin.email}
                        className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-stone-800 truncate">
                              {admin.name || admin.email}
                            </span>
                            {isMaster ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-stone-900 text-amber-300">
                                Master
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono truncate">{admin.email}</div>
                        </div>

                        {!isMaster && (
                          <button
                            onClick={() => handleDeleteAdminAccount(admin.email)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                            title="Remove Administrator Privileges"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security Advisory */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Administrative Security Best Practices</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Administrator accounts hold unrestricted control over simulation session databases, trainee profiles, and evaluative scorecards.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-900/90 text-[11px]">
                  <li>Never share your credentials with unauthorized personnel.</li>
                  <li>Use a combination of uppercase, lowercase, numbers, and symbols.</li>
                  <li>Perform a full database backup before and after major operational reviews.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Inspection Modal */}
      {activeInspectionSession && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Simulation Dialogue Inspection
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  {activeInspectionSession.vignette?.clientName} • {activeInspectionSession.vignette?.title}
                </h3>
                <p className="text-xs text-stone-500">
                  Trainee: <strong>{activeInspectionSession.user?.name}</strong> ({activeInspectionSession.user?.email}) •{' '}
                  {new Date(activeInspectionSession.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadSession(activeInspectionSession, 'txt')}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
                <button
                  onClick={() => setActiveInspectionSession(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scorecard Brief */}
            {activeInspectionSession.evaluation && (
              <div className="px-5 py-3 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span>
                    Score: <strong>{activeInspectionSession.evaluation.overallScore}/100</strong> (
                    {activeInspectionSession.evaluation.bandLabel})
                  </span>
                  <span>
                    Counselor Share: <strong>{activeInspectionSession.stats?.counselorSharePct || 0}%</strong>
                  </span>
                  <span>
                    Total Turns: <strong>{activeInspectionSession.stats?.totalTurnsCompleted || 0}</strong>
                  </span>
                </div>
                {activeInspectionSession.evaluation.ethicsFlag?.triggered && (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Ethics Flag Triggered
                  </span>
                )}
              </div>
            )}

            {/* Modal Body: Transcript Messages */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1 bg-stone-50/50">
              {(activeInspectionSession.messages || []).map((msg, idx) => {
                const isCounselor = msg.role === 'counselor';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isCounselor ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-[11px] font-bold text-stone-500">
                        {isCounselor ? 'COUNSELOR' : activeInspectionSession.vignette?.clientName}
                      </span>
                      {msg.turnNumber && (
                        <span className="text-[10px] text-stone-400 font-mono">
                          Turn {msg.turnNumber}
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        isCounselor
                          ? 'bg-teal-700 text-white rounded-tr-xs'
                          : 'bg-white border border-stone-200 text-stone-900 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-white flex justify-end">
              <button
                onClick={() => setActiveInspectionSession(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Admin Reset User Password */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Reset User Password</h3>
                  <p className="text-xs text-stone-500 font-mono">{userToResetPassword.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserToResetPassword(null);
                  setNewPasswordForUser('');
                  setResetUserPwdError(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetUserPassword} className="p-6 space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter a new password for <strong>{userToResetPassword.name || userToResetPassword.email}</strong>. Once saved, this clinician can sign in with the new password.
              </p>

              {resetUserPwdError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {resetUserPwdError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordForUser}
                  onChange={(e) => {
                    setNewPasswordForUser(e.target.value);
                    if (resetUserPwdError) setResetUserPwdError(null);
                  }}
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserToResetPassword(null);
                    setNewPasswordForUser('');
                    setResetUserPwdError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingUserPwd || !newPasswordForUser.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isResettingUserPwd ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">Delete Clinician Account</h3>
                  <p className="text-xs text-rose-700 font-mono">{userToDelete.email}</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-700 leading-relaxed">
                Are you sure you want to delete <strong>{userToDelete.name || userToDelete.email}</strong>?
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Action Warning:</span>
                </div>
                <p>
                  This will permanently delete the user profile, all clinical simulation transcripts, supervisory evaluation scorecards, and historical logs. This action cannot be reversed.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingUser}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={isDeletingUser}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isDeletingUser ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Permanent Deletion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Administrator */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Create New Administrator</h3>
                  <p className="text-xs text-stone-500">Grant full supervisory and admin hub privileges</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setNewAdminEmail('');
                  setNewAdminPassword('');
                  setNewAdminName('');
                  setNewAdminDepartment('');
                  setCreateAdminError(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {createAdminError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{createAdminError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Sarah Jenkins"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Admin Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@institution.org"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 4 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Clinical Department / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g., Department of Psychiatry"
                  value={newAdminDepartment}
                  onChange={(e) => setNewAdminDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setNewAdminEmail('');
                    setNewAdminPassword('');
                    setNewAdminName('');
                    setNewAdminDepartment('');
                    setCreateAdminError(null);
                  }}
                  disabled={isCreatingAdmin}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAdmin || !newAdminEmail.trim() || !newAdminPassword.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isCreatingAdmin ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Create Admin Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
