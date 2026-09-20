import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  StoredSessionRecord,
  CaseVignette,
} from '../types';
import { fetchSessionsFromFirestore } from '../lib/firebase';
import {
  User,
  Activity,
  Award,
  Play,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Target,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  FileText,
  Brain,
  Search,
  Filter,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onStartNewSession: () => void;
  onReviewPastSession: (record: StoredSessionRecord) => void;
  onOpenAdmin?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onStartNewSession,
  onReviewPastSession,
  onOpenAdmin,
}) => {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');

  useEffect(() => {
    loadUserSessions();
  }, [currentUser.email]);

  const loadUserSessions = async () => {
    setIsLoading(true);
    try {
      // 1. Try fetching from Firestore Cloud DB
      const cloudSessions = await fetchSessionsFromFirestore(currentUser.email);
      const validCloud = cloudSessions.filter(
        (s) =>
          s &&
          !s.deleted &&
          s.messages &&
          s.messages.length > 0 &&
          s.type !== 'user_registration' &&
          s.type !== 'audit_event'
      );

      if (validCloud.length > 0) {
        setSessions(validCloud);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to local server DB endpoint if cloud has no records yet
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const all: StoredSessionRecord[] = await res.json();
        const userSpecific = all.filter(
          (s) =>
            s &&
            !s.deleted &&
            s.messages &&
            s.messages.length > 0 &&
            s.type !== 'user_registration' &&
            s.type !== 'audit_event' &&
            s.user?.email &&
            s.user.email.toLowerCase() === currentUser.email.toLowerCase()
        );
        setSessions(userSpecific);
      }
    } catch (e) {
      console.error('Failed to load user sessions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      (s.vignette?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.vignette?.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.vignette?.track || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModality =
      modalityFilter === 'all' ||
      (s.config?.modality || '').toLowerCase() === modalityFilter.toLowerCase();

    return matchesSearch && matchesModality;
  });

  // Calculate aggregated student metrics
  const totalSessions = sessions.length;
  const scoredSessions = sessions.filter((s) => s.evaluation?.overallScore != null);
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce(
            (acc, s) => acc + (s.evaluation?.overallScore || 0),
            0
          ) / scoredSessions.length
        )
      : 0;

  const avgWordShare =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => {
            if (s.stats?.counselorSharePct != null) {
              return acc + s.stats.counselorSharePct;
            }
            if (s.messages && s.messages.length > 0) {
              const cWords = s.messages
                .filter((m) => m.role === 'counselor')
                .reduce((wAcc, m) => wAcc + (m.text ? m.text.split(/\s+/).filter(Boolean).length : 0), 0);
              const pWords = s.messages
                .filter((m) => m.role === 'patient')
                .reduce((wAcc, m) => wAcc + (m.text ? m.text.split(/\s+/).filter(Boolean).length : 0), 0);
              const tot = cWords + pWords;
              return acc + (tot > 0 ? Math.round((cWords / tot) * 100) : 0);
            }
            return acc;
          }, 0) / sessions.length
        )
      : 0;

  const totalTurnsCompleted = sessions.reduce(
    (acc, s) =>
      acc + (s.messages ? s.messages.filter((m) => m.role === 'counselor').length : 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. Welcome & Primary Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-stone-900 text-white p-6 sm:p-8 mb-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-700/60 border border-teal-500/30 text-teal-200">
                Clinician Practicum Workspace
              </span>
              <span className="text-xs text-teal-300/80">
                {currentUser.level || 'Novice Counselor'} Track
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {currentUser.name || 'Counselor'}
            </h1>
            <p className="text-sm text-teal-100/80 max-w-xl leading-relaxed">
              Track your clinical growth, review supervisor evaluation rubrics, and engage in deliberate practice with responsive simulated client personas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="dashboard-start-session-btn"
              onClick={onStartNewSession}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-sm transition-all flex items-center space-x-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Start Practice Session</span>
            </button>
            {currentUser.isAdmin && onOpenAdmin && (
              <button
                id="dashboard-admin-hub-btn"
                onClick={onOpenAdmin}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Admin Hub</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Sessions</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{totalSessions}</span>
            <span className="text-xs text-stone-400">cases</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Total clinical simulations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-bold ${
              avgScore >= 80 ? 'text-emerald-700' : avgScore >= 65 ? 'text-teal-700' : 'text-stone-900'
            }`}>
              {avgScore > 0 ? `${avgScore}/100` : '—'}
            </span>
            {avgScore > 0 && (
              <span className="text-xs text-emerald-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Supervisor
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Rubric fidelity average</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Talk-to-Listen</span>
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">
              {avgWordShare > 0 ? `${avgWordShare}%` : '—'}
            </span>
            <span className="text-xs text-stone-500 font-medium">counselor share</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Target benchmark: &lt;30%</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Turns Logged</span>
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{totalTurnsCompleted}</span>
            <span className="text-xs text-stone-400">counselor responses</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Deliberate practice turns</p>
        </div>
      </div>

      {/* 3. Main Content: Past Sessions Vault */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-teal-700" />
              <span>Practice History & Evaluation Vault</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Review supervisor qualitative reports, dialogue transcripts, and critical turn reflections.
            </p>
          </div>

          {/* Search & Modality Filter */}
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 bg-stone-50 focus:outline-hidden focus:border-teal-600"
            >
              <option value="all">All Modalities</option>
              <option value="rogerian">Rogerian Person-Centered</option>
              <option value="cbt">Cognitive Behavioral (CBT)</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mt-5">
          {isLoading ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading practice records from Firestore...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">No practice sessions found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                {sessions.length === 0
                  ? "You haven't completed any counseling simulations yet. Launch your first case to see your supervisor evaluation here."
                  : 'No sessions match your search criteria.'}
              </p>
              {sessions.length === 0 && (
                <button
                  onClick={onStartNewSession}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-xs transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start First Case</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredSessions.map((session) => {
                const dateStr = new Date(session.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const score = session.evaluation?.overallScore ?? null;
                const band = session.evaluation?.bandLabel || 'Competent';
                const turns = session.messages
                  ? session.messages.filter((m) => m.role === 'counselor').length
                  : 0;

                return (
                  <div
                    key={session.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/80 -mx-4 px-4 sm:mx-0 sm:px-3 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-stone-900 text-sm">
                          {session.vignette?.title || 'Case Simulation'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                          {session.config?.modality === 'cbt' ? 'CBT' : 'Rogerian'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                          {session.vignette?.difficulty || 'Novice'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-stone-500 flex-wrap gap-y-1">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>Client: {session.vignette?.clientName || 'Patient'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{dateStr}</span>
                        </span>
                        <span>•</span>
                        <span>{turns} turns</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {score != null ? (
                        <div className="text-right">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className={`text-base font-bold ${
                              score >= 80 ? 'text-emerald-700' : score >= 65 ? 'text-teal-700' : 'text-stone-800'
                            }`}>
                              {score}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">/100</span>
                          </div>
                          <span className="text-[10px] font-medium text-stone-500 block">
                            {band}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">Unscored</span>
                      )}

                      <button
                        onClick={() => onReviewPastSession(session)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 hover:border-teal-600 hover:text-teal-700 hover:bg-white text-stone-700 text-xs font-semibold transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                      >
                        <span>Scorecard</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
