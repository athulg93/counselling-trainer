import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  Users,
  MessageSquare,
  Award,
  Clock,
  ChevronRight,
  FileText,
  CheckCircle2,
  Mail,
  UserCheck,
  Search,
  BookOpen,
  Building2,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Trash2,
  FileSpreadsheet,
  LogIn,
  Eye,
  EyeOff,
  ArrowDownToLine,
} from 'lucide-react';
import { StoredSessionRecord, UserProfile } from '../types';

interface TrainingDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onAdminLogin?: (user: UserProfile) => void;
  onAdminLogout?: () => void;
}

export const TrainingDbModal: React.FC<TrainingDbModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAdminLogin,
  onAdminLogout,
}) => {
  const isAdmin = currentUser?.isAdmin;
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'admin-auth'>('users');
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalTurns: number;
    uniqueUsersCount: number;
    users: any[];
  } | null>(null);
  const [selectedSession, setSelectedSession] = useState<StoredSessionRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline admin login state
  const [adminEmail, setAdminEmail] = useState('athulgovind.1993@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessRes, statsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/sessions/stats'),
      ]);

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load training database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen]);

  const handleDownloadDatasetJson = () => {
    window.open('/api/sessions/export', '_blank');
    setDownloadNotice('Downloaded Training Dataset (JSON)');
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const handleDownloadSessionsCsv = () => {
    window.open('/api/sessions/export/csv', '_blank');
    setDownloadNotice('Downloaded Sessions Report (CSV)');
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const handleDownloadUsersCsv = () => {
    window.open('/api/users/export/csv', '_blank');
    setDownloadNotice('Downloaded Trainees Roster (CSV)');
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const handleDownloadSingleSessionJson = (session: StoredSessionRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `session_${session.id}_${session.vignette?.clientName || 'transcript'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadNotice('Downloaded Session JSON');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleDownloadSingleSessionTxt = (session: StoredSessionRecord) => {
    let transcript = `=======================================================\n`;
    transcript += `COUNSELING SIMULATION SESSION TRANSCRIPT\n`;
    transcript += `=======================================================\n`;
    transcript += `Session ID: ${session.id}\n`;
    transcript += `Date: ${new Date(session.timestamp).toLocaleString()}\n`;
    transcript += `Trainee: ${session.user?.name} (${session.user?.email || 'No email'})\n`;
    transcript += `Training Level: ${session.user?.level || 'Beginner'}\n`;
    transcript += `Client Vignette: ${session.vignette?.clientName} (${session.vignette?.track}, ${session.config?.difficulty})\n`;
    transcript += `Modality: ${session.config?.modality?.toUpperCase()}\n`;
    if (session.evaluation) {
      transcript += `Supervisor Score: ${session.evaluation.overallScore}% (${session.evaluation.bandLabel})\n`;
      transcript += `Ethics Flag: ${session.evaluation.ethicsFlag?.triggered ? 'YES - FLAG TRIGGERED' : 'None'}\n`;
    }
    transcript += `\n----------------- DIALOGUE TRANSCRIPT -----------------\n\n`;

    (session.messages || []).forEach((m) => {
      const speaker = m.role === 'counselor' ? `COUNSELOR [${session.user?.name}]:` : `${session.vignette?.clientName?.toUpperCase() || 'CLIENT'}:`;
      transcript += `${speaker}\n${m.text}\n\n`;
    });

    if (session.evaluation?.phase2Details) {
      transcript += `\n------------- SUPERVISOR RUBRIC FEEDBACK -------------\n\n`;
      transcript += `Observed Strengths:\n`;
      session.evaluation.phase2Details.strengths.forEach((s) => {
        transcript += ` - ${s}\n`;
      });
      transcript += `\nAreas For Growth:\n`;
      session.evaluation.phase2Details.areasForGrowth.forEach((a) => {
        transcript += ` - ${a}\n`;
      });
    }

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `transcript_${session.id}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadNotice('Downloaded Plaintext Transcript');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session record? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedSession(null);
        await fetchData();
        setDownloadNotice('Session successfully deleted.');
        setTimeout(() => setDownloadNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleInlineAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAuthenticating(true);

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
        setAdminLoginError(data.error || 'Authentication failed. Invalid password.');
        setIsAuthenticating(false);
        return;
      }

      if (onAdminLogin) {
        onAdminLogin(data.admin);
      }
      setActiveTab('users');
      setDownloadNotice('Authenticated as Administrator!');
      setTimeout(() => setDownloadNotice(null), 3000);
    } catch (err) {
      setAdminLoginError('Network or server error during admin sign in.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isOpen) return null;

  // Filtered lists
  const filteredUsers = (stats?.users || []).filter((u: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.level && u.level.toLowerCase().includes(q)) ||
      (u.institution && u.institution.toLowerCase().includes(q))
    );
  });

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.user?.name && s.user.name.toLowerCase().includes(q)) ||
      (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
      (s.vignette?.clientName && s.vignette.clientName.toLowerCase().includes(q)) ||
      (s.config?.modality && s.config.modality.toLowerCase().includes(q)) ||
      (s.config?.difficulty && s.config.difficulty.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isAdmin ? 'bg-amber-700' : 'bg-teal-700'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {isAdmin ? 'Administrator & Product Owner Control Hub' : 'Trainee Records & Training Database'}
                </h2>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    <span>Admin Mode (Athul Govind)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    Training Hub
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Inspect registered users, browse counseling transcripts with supervisor scorecards, and export formatted datasets.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isAdmin && (
              <button
                id="modal-admin-signin-tab-btn"
                onClick={() => {
                  setSelectedSession(null);
                  setActiveTab('admin-auth');
                }}
                className="text-xs px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold flex items-center space-x-1 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>Admin Login</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Bar & Multi-Format Download Suite */}
        <div className="px-6 py-3 bg-stone-100/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-5 text-xs text-stone-600">
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-teal-700" />
              <span>
                <strong className="text-stone-900 font-semibold">{stats?.uniqueUsersCount || 0}</strong> Trainees
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>
                <strong className="text-stone-900 font-semibold">{stats?.totalSessions || 0}</strong> Sessions Stored
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-teal-700" />
              <span>
                <strong className="text-stone-900 font-semibold">{stats?.totalTurns || 0}</strong> Counselor Turns
              </span>
            </div>
          </div>

          {/* Download Buttons Group */}
          <div className="flex items-center space-x-2">
            {downloadNotice && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                {downloadNotice}
              </span>
            )}

            {/* 1. JSON Dataset Download */}
            <button
              id="download-json-dataset-btn"
              onClick={handleDownloadDatasetJson}
              disabled={!sessions.length}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 transition-all shadow-xs"
              title="Download full dataset with turns and supervisory evaluations formatted for model fine-tuning"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dataset (JSON)</span>
            </button>

            {/* 2. Sessions CSV Download */}
            <button
              id="download-sessions-csv-btn"
              onClick={handleDownloadSessionsCsv}
              disabled={!sessions.length}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 transition-all shadow-xs"
              title="Download spreadsheet summary of sessions, scores, and turns"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sessions (CSV)</span>
            </button>

            {/* 3. Trainees Roster CSV Download */}
            <button
              id="download-trainees-csv-btn"
              onClick={handleDownloadUsersCsv}
              disabled={!stats?.uniqueUsersCount}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 transition-all shadow-xs"
              title="Download registered trainees list with contact emails and levels"
            >
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>Trainees (CSV)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab('users');
                setSelectedSession(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'users' && !selectedSession
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Registered Trainees ({stats?.uniqueUsersCount || 0})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sessions');
                setSelectedSession(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'sessions' && !selectedSession
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Completed Sessions ({sessions.length})</span>
            </button>

            {!isAdmin && (
              <button
                onClick={() => {
                  setActiveTab('admin-auth');
                  setSelectedSession(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'admin-auth' && !selectedSession
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          {!selectedSession && activeTab !== 'admin-auth' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'users' ? 'Search by name, email, level...' : 'Search by client, trainee, modality...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:bg-white transition-colors"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400 text-sm">
              <Database className="w-8 h-8 animate-pulse text-teal-600 mb-2" />
              <span>Reading database records...</span>
            </div>
          ) : activeTab === 'admin-auth' && !selectedSession ? (
            /* Inline Admin Login View */
            <div className="max-w-md mx-auto py-6">
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center space-x-2.5 mb-3 text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <h3 className="font-bold text-base">Administrator Login</h3>
                </div>
                <p className="text-xs text-amber-800 mb-4 leading-relaxed">
                  Sign in with product owner credentials to unlock session deletion, elevated controls, and direct downloads.
                </p>

                {adminLoginError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {adminLoginError}
                  </div>
                )}

                <form onSubmit={handleInlineAdminLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-stone-900 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-3.5 pr-9 py-2 rounded-xl border border-stone-200 text-stone-900 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isAuthenticating ? 'Verifying...' : 'Sign In as Administrator'}</span>
                  </button>
                </form>
              </div>
            </div>
          ) : selectedSession ? (
            /* Detailed Transcript View of Single Session with Individual Downloads */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-stone-200 gap-3">
                <div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold mb-1"
                  >
                    ← Back to all sessions
                  </button>
                  <h3 className="text-sm font-bold text-stone-900">
                    Session with {selectedSession.vignette?.clientName || 'Client'} ({selectedSession.vignette?.track})
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-stone-500 mt-0.5">
                    <span>Trainee: <strong>{selectedSession.user?.name}</strong> ({selectedSession.user?.email})</span>
                    <span>•</span>
                    <span>Date: {new Date(selectedSession.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedSession.evaluation && (
                    <div className="text-right mr-3">
                      <span className="text-xs text-stone-500">Supervisor Score:</span>
                      <div className="text-base font-bold text-teal-800">
                        {selectedSession.evaluation.overallScore}% ({selectedSession.evaluation.bandLabel})
                      </div>
                    </div>
                  )}

                  {/* Download Individual Session Transcript (.txt) */}
                  <button
                    id="download-session-txt-btn"
                    onClick={() => handleDownloadSingleSessionTxt(selectedSession)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
                    title="Download readable plaintext transcript with timestamps"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Download TXT</span>
                  </button>

                  {/* Download Individual Session JSON */}
                  <button
                    id="download-session-json-btn"
                    onClick={() => handleDownloadSingleSessionJson(selectedSession)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
                    title="Download complete session JSON object"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-700" />
                    <span>Download JSON</span>
                  </button>

                  {/* Admin Delete Action */}
                  {isAdmin && (
                    <button
                      id="delete-session-btn"
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete this session record (Admin only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transcript list */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2">
                {selectedSession.messages?.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'counselor'
                        ? 'bg-teal-50/70 border border-teal-100 text-stone-900 ml-6'
                        : 'bg-stone-50 border border-stone-200 text-stone-800 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 font-semibold text-[11px]">
                      <span className={msg.role === 'counselor' ? 'text-teal-800' : 'text-stone-600'}>
                        {msg.role === 'counselor' ? `Counselor (${selectedSession.user?.name})` : selectedSession.vignette?.clientName || 'Client'}
                      </span>
                      {msg.turnNumber && <span className="text-stone-400">Turn {msg.turnNumber}</span>}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'users' ? (
            /* Roster of Registered Users */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Registered Trainees Directory ({filteredUsers.length})
                </h3>
                <span className="text-[11px] text-stone-400">
                  Stored in local server database
                </span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 px-4 bg-stone-50/50 rounded-xl border border-stone-200">
                  <UserCheck className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-stone-600">No trainees found matching search query.</p>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Trainee Name</th>
                        <th className="py-3 px-4">Email ID</th>
                        <th className="py-3 px-4">Training Level</th>
                        <th className="py-3 px-4">Institution / Clinic</th>
                        <th className="py-3 px-4 text-right">Sessions Run</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredUsers.map((user: any, idx: number) => {
                        const userSessionsCount = sessions.filter(
                          (s) => (s.user?.email && s.user.email === user.email) || (s.user?.id && s.user.id === user.id)
                        ).length;

                        return (
                          <tr key={user.id || user.email || idx} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-stone-900">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[11px]">
                                  {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span>{user.name || 'Anonymous Trainee'}</span>
                                {user.email === 'athulgovind.1993@gmail.com' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                              <div className="flex items-center space-x-1.5">
                                <Mail className="w-3.5 h-3.5 text-stone-400" />
                                <span>{user.email || '—'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  user.level === 'Intermediate'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : user.level === 'Professional'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : user.level === 'Administrator'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                                }`}
                              >
                                {user.level || 'Beginner'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-stone-600">
                              <div className="flex items-center space-x-1.5">
                                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                                <span>{user.institution || 'General Clinical Training'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-teal-800">
                              {userSessionsCount} {userSessionsCount === 1 ? 'session' : 'sessions'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : filteredSessions.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">No sessions recorded yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Completed counseling simulation sessions will automatically appear here with their transcripts and supervisor scorecards.
              </p>
            </div>
          ) : (
            /* List of Stored Sessions */
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Logged Sessions ({filteredSessions.length})
              </h3>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
                {filteredSessions.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedSession(rec)}
                    className="p-4 hover:bg-stone-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-stone-900">
                          {rec.vignette?.clientName || 'Client'}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {rec.vignette?.track} • {rec.config?.difficulty}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800">
                          {rec.config?.modality?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-stone-500">
                        <span>Trainee: <strong className="text-stone-700">{rec.user?.name || 'Unknown'}</strong> ({rec.user?.email || 'No email'})</span>
                        <span>•</span>
                        <span>{rec.user?.institution || 'General Clinic'}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{new Date(rec.timestamp).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      {rec.evaluation ? (
                        <div className="text-right">
                          <div className="text-sm font-bold text-teal-800">
                            {rec.evaluation.overallScore}%
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {rec.evaluation.bandLabel}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">In progress / early</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 text-xs text-stone-500 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>Storage file: <code className="bg-stone-200 px-1.5 py-0.5 rounded text-[11px]">data/conversations_db.json</code></span>
            {isAdmin && onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="text-stone-500 hover:text-rose-700 underline text-xs transition-colors"
              >
                Log Out of Admin
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
