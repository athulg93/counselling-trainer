import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { SetupScreen } from './components/SetupScreen';
import { SimulationScreen } from './components/SimulationScreen';
import { ScorecardScreen } from './components/ScorecardScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminPortalScreen } from './components/AdminPortalScreen';
import { InfoModal } from './components/InfoModal';
import { IntakeBriefingModal } from './components/IntakeBriefingModal';
import { TrainingDbModal } from './components/TrainingDbModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CASE_VIGNETTES } from './data/vignettes';
import { saveUserToFirestore, saveSessionToFirestore } from './lib/firebase';
import {
  SessionConfig,
  CaseVignette,
  ChatMessage,
  EvaluationResult,
  UserProfile,
  StoredSessionRecord,
} from './types';
import { Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('counseling_trainer_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'login' | 'dashboard' | 'setup' | 'simulation' | 'evaluating' | 'scorecard' | 'admin'>(() => {
    try {
      const saved = localStorage.getItem('counseling_trainer_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.isAdmin) return 'admin';
        if (u?.email) return 'dashboard';
      }
    } catch {}
    return 'login';
  });

  const [dbStats, setDbStats] = useState<{ totalSessions: number; uniqueUsersCount: number } | undefined>();
  const [isTrainingDbOpen, setIsTrainingDbOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<SessionConfig>({
    track: 'school',
    modality: 'rogerian',
    difficulty: 'novice',
    mode: 'micro',
    pacingType: 'turns',
    durationMinutes: 15,
    vignetteSelection: 'specific',
    selectedVignetteId: 'school-novice-1',
  });

  const [activeVignette, setActiveVignette] = useState<CaseVignette>(CASE_VIGNETTES[0]);
  const [allCases, setAllCases] = useState<CaseVignette[]>(CASE_VIGNETTES);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [isLoadingPatient, setIsLoadingPatient] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);

  // Fetch dynamic case studies & personas catalog
  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        if (data.all && data.all.length > 0) {
          setAllCases(data.all);
        }
      }
    } catch (err) {
      console.warn('Could not fetch custom cases, fallback to default vignettes', err);
    }
  };

  // Fetch DB statistics on load and refresh profile if user is logged in
  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/sessions/stats');
      if (res.ok) {
        const data = await res.json();
        setDbStats({
          totalSessions: data.totalSessions,
          uniqueUsersCount: data.uniqueUsersCount,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDbStats();
    fetchCases();

    // If current user is present, refresh profile to sync granted/revoked premium status
    if (currentUser?.email) {
      fetch(`/api/users/profile?email=${encodeURIComponent(currentUser.email)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
            try {
              localStorage.setItem('counseling_trainer_user', JSON.stringify({ ...currentUser, ...data.user }));
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('counseling_trainer_user', JSON.stringify(user));
    } catch {
      // ignore
    }

    // Persist registered user to Firestore Cloud Database
    saveUserToFirestore(user).catch((err) => console.warn('Failed to save user to Firestore:', err));

    // Persist registered user immediately to server database
    fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
          try {
            localStorage.setItem('counseling_trainer_user', JSON.stringify({ ...user, ...data.user }));
          } catch {
            // ignore
          }
        }
        fetchDbStats();
      })
      .catch((err) => console.warn('Failed to register user to backend:', err));

    // Adapt simulation configuration according to selected training level
    if (user.level === 'Beginner') {
      const beginnerVignette =
        allCases.find((v) => v.difficulty === 'novice' && v.track === 'school') ||
        allCases[0];
      setConfig({
        track: 'school',
        modality: 'rogerian',
        difficulty: 'novice',
        mode: 'micro',
        pacingType: 'turns',
        durationMinutes: 15,
        vignetteSelection: 'specific',
        selectedVignetteId: beginnerVignette.id,
      });
      setActiveVignette(beginnerVignette);
    } else if (user.level === 'Intermediate') {
      const interVignette =
        allCases.find((v) => v.difficulty === 'intermediate' && v.track === 'school') ||
        allCases[0];
      setConfig({
        track: 'school',
        modality: 'rogerian',
        difficulty: 'intermediate',
        mode: 'standard',
        pacingType: 'turns',
        durationMinutes: 30,
        vignetteSelection: 'specific',
        selectedVignetteId: interVignette.id,
      });
      setActiveVignette(interVignette);
    }

    setActiveView('dashboard');
  };

  const handleReviewPastSession = (record: StoredSessionRecord) => {
    if (record.evaluation) {
      setEvaluationResult(record.evaluation);
      if (record.messages) setMessages(record.messages);
      if (record.vignette) {
        const matched = allCases.find((c) => c.id === record.vignette?.id);
        if (matched) {
          setActiveVignette(matched);
        } else {
        const fallbackVignette: CaseVignette = {
          id: record.vignette?.id || 'custom-case',
          title: record.vignette?.title || 'Past Case',
          track: (record.vignette?.track as any) || 'school',
          difficulty: (record.vignette?.difficulty as any) || 'novice',
          clientName: record.vignette?.clientName || 'Client',
          clientAge: 25,
          clientPronouns: 'they/them',
          clientRole: 'Client',
          presentingProblem: 'Clinical simulation archive record.',
          backgroundStory: 'Archived case record for review.',
          baselineResistance: 'Standard baseline presentation.',
          positiveTriggers: ['Reflective listening'],
          negativeTriggers: ['Premature advice'],
          somaticTendencies: ['Quiet eye contact'],
          plantedReferralCue: {
            exists: false,
            subtlety: 'subtle',
            description: 'None planted',
            clinicalCategory: 'none',
            properReferralPath: 'Maintain primary modality scope.',
          },
          counselorIntakeGoal: 'Demonstrate active empathetic attunement.',
        };
        setActiveVignette(fallbackVignette);
        }
      }
      setActiveView('scorecard');
    }
  };

  const maxTurns = config.mode === 'micro' ? 15 : 30;

  const handleConfigChange = (newConfig: Partial<SessionConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Start Simulation Session
  const handleStartSession = async (chosenVignette: CaseVignette) => {
    setActiveVignette(chosenVignette);
    setCurrentTurn(1);
    setEvaluationResult(null);
    setErrorMessage(null);
    setActiveView('simulation');

    // Initial greeting from patient reflecting baseline resistance
    const initialPatientMessage: ChatMessage = {
      id: 'patient-initial',
      role: 'patient',
      text: `*[Sits down and shifts in chair, looking around with ${chosenVignette.difficulty === 'novice' ? 'mild hesitation' : 'guarded defensiveness'}]* Hi... I was told I should come in and talk to you today.`,
      timestamp: new Date().toISOString(),
    };

    setMessages([initialPatientMessage]);
  };

  // Counselor sends a message
  const handleSendMessage = async (text: string) => {
    const counselorTurn = currentTurn;
    const counselorMsg: ChatMessage = {
      id: `counselor-${Date.now()}`,
      role: 'counselor',
      text,
      turnNumber: counselorTurn,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, counselorMsg];
    setMessages(updatedHistory);
    setIsLoadingPatient(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/patient/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vignette: activeVignette,
          modality: config.modality,
          difficulty: config.difficulty,
          sessionMode: config.mode,
          currentTurn: counselorTurn,
          history: updatedHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const patientMsg: ChatMessage = {
        id: `patient-${Date.now()}`,
        role: 'patient',
        text: data.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedHistory, patientMsg];
      setMessages(finalMessages);
      setIsLoadingPatient(false);

      const nextTurn = counselorTurn + 1;
      setCurrentTurn(nextTurn);

      // If we have completed the final turn in turn-based mode, automatically trigger evaluation
      if (config.pacingType !== 'time' && counselorTurn >= maxTurns) {
        triggerEvaluation(finalMessages, false);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setIsLoadingPatient(false);
      setErrorMessage(err.message || 'Failed to receive response from patient simulator.');
    }
  };

  // Retry last turn if patient response failed
  const handleRetryLastTurn = async () => {
    if (isLoadingPatient || messages.length === 0) return;
    setIsLoadingPatient(true);
    setErrorMessage(null);

    try {
      const counselorTurn = currentTurn;
      const res = await fetch('/api/patient/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vignette: activeVignette,
          modality: config.modality,
          difficulty: config.difficulty,
          sessionMode: config.mode,
          currentTurn: counselorTurn,
          history: messages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const patientMsg: ChatMessage = {
        id: `patient-${Date.now()}`,
        role: 'patient',
        text: data.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...messages, patientMsg];
      setMessages(finalMessages);
      setIsLoadingPatient(false);

      const nextTurn = counselorTurn + 1;
      setCurrentTurn(nextTurn);

      if (config.pacingType !== 'time' && counselorTurn >= maxTurns) {
        triggerEvaluation(finalMessages, false);
      }
    } catch (err: any) {
      console.error('Error retrying turn:', err);
      setIsLoadingPatient(false);
      setErrorMessage(err.message || 'Failed to receive response from patient simulator. Please click retry.');
    }
  };

  // Allow trainee to edit their last message if turn failed
  const handleEditLastTurn = (): string => {
    setErrorMessage(null);
    if (messages.length > 0 && messages[messages.length - 1].role === 'counselor') {
      const lastMsg = messages[messages.length - 1];
      setMessages((prev) => prev.slice(0, -1));
      return lastMsg.text;
    }
    return '';
  };

  // Trigger evaluation
  const triggerEvaluation = async (transcriptMessages: ChatMessage[], earlyExit: boolean) => {
    setActiveView('evaluating');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/supervisor/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vignette: activeVignette,
          modality: config.modality,
          difficulty: config.difficulty,
          sessionMode: config.mode,
          transcript: transcriptMessages,
          earlyExit,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Evaluation error ${res.status}`);
      }

      const result: EvaluationResult = await res.json();
      setEvaluationResult(result);
      setActiveView('scorecard');

      // Automatically save completed session to Firestore Cloud Database & local store
      try {
        const sessionPayload: StoredSessionRecord = {
          id: `session_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser,
          vignette: {
            id: activeVignette.id,
            title: activeVignette.title,
            track: activeVignette.track,
            difficulty: activeVignette.difficulty,
            clientName: activeVignette.clientName,
          },
          config,
          messages: transcriptMessages,
          stats: result.deterministicStats,
          evaluation: result,
        };

        saveSessionToFirestore(sessionPayload).catch((err) => console.warn('Failed to save session to Firestore:', err));

        fetch('/api/sessions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionPayload),
        })
          .then(() => fetchDbStats())
          .catch((err) => console.warn('Failed to save to local DB:', err));
      } catch (err) {
        console.warn('Error saving session record:', err);
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setErrorMessage(err.message || 'Agent 2 supervisor evaluation failed. Please retry.');
      setActiveView('simulation');
    }
  };

  // Conclude early handler
  const handleConcludeEarly = () => {
    const counselorTurnCount = messages.filter((m) => m.role === 'counselor').length;
    if (counselorTurnCount <= 3) {
      setErrorMessage('Nothing to review: Session had 3 or fewer turns. Returned to scenario selection.');
      handleNewScenario();
      return;
    }
    triggerEvaluation(messages, true);
  };

  // Retry same scenario
  const handleRetryScenario = () => {
    handleStartSession(activeVignette);
  };

  // Go back to setup for new scenario
  const handleNewScenario = () => {
    setActiveView('setup');
    setMessages([]);
    setEvaluationResult(null);
    setErrorMessage(null);
  };

  const handleAdminLoginSuccess = (admin: UserProfile) => {
    setCurrentUser(admin);
    try {
      localStorage.setItem('counseling_trainer_user', JSON.stringify(admin));
    } catch {
      // ignore
    }
    setActiveView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('counseling_trainer_user');
    } catch {
      // ignore
    }
    setActiveView('login');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {activeView !== 'simulation' && (
        <Header
          activeView={activeView}
          onShowInfoModal={() => setIsInfoModalOpen(true)}
          onNewSession={handleNewScenario}
          onOpenDashboard={currentUser && !currentUser.isAdmin ? () => setActiveView('dashboard') : undefined}
          currentUser={currentUser}
          onOpenLogin={!currentUser ? () => setActiveView('login') : undefined}
          onOpenAdmin={currentUser?.isAdmin ? () => setActiveView('admin') : undefined}
          onOpenTrainingDb={currentUser?.isAdmin ? () => setIsTrainingDbOpen(true) : undefined}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 flex flex-col">
        {/* Global error banner if any */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold underline hover:text-rose-950"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* View 0: Starting / Trainee Check-in & Login Screen */}
        <ErrorBoundary onReset={() => setActiveView('dashboard')}>
          {activeView === 'login' && (
            <LoginScreen
              currentUser={currentUser}
              onLogin={handleLogin}
              onAdminLoginSuccess={handleAdminLoginSuccess}
              sessionStats={dbStats}
            />
          )}

          {/* View 0.5: Student Dashboard & Practicum History Vault */}
          {activeView === 'dashboard' && currentUser && !currentUser.isAdmin && (
            <StudentDashboard
              currentUser={currentUser}
              onStartNewSession={handleNewScenario}
              onReviewPastSession={handleReviewPastSession}
              onOpenAdmin={currentUser.isAdmin ? () => setActiveView('admin') : undefined}
            />
          )}

          {/* View 1: Setup & Configuration */}
          {activeView === 'setup' && (
            <SetupScreen
              config={config}
              onChangeConfig={handleConfigChange}
              onStartSession={handleStartSession}
              currentUser={currentUser}
              onSwitchUser={() => setActiveView('login')}
              vignettes={allCases}
            />
          )}

          {/* View 2: Active Simulation */}
          {activeView === 'simulation' && (
            <SimulationScreen
              vignette={activeVignette}
              config={config}
              messages={messages}
              currentTurn={currentTurn}
              maxTurns={maxTurns}
              isLoadingPatient={isLoadingPatient}
              errorMessage={errorMessage}
              onSendMessage={handleSendMessage}
              onRetryLastTurn={handleRetryLastTurn}
              onEditLastTurn={handleEditLastTurn}
              onClearError={() => setErrorMessage(null)}
              onConcludeEarly={handleConcludeEarly}
              onExit={handleNewScenario}
              onShowIntakeBriefing={() => setIsIntakeModalOpen(true)}
            />
          )}

          {/* View 3: Evaluating State (Transition) */}
          {activeView === 'evaluating' && (
            <div className="max-w-xl mx-auto py-24 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
                Agent 2 Evaluating Session Transcript
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                Analyzing Talk-to-Listen ratio, question distribution (open vs closed/leading), advice pacing against cutoff turns, rupture attunement, empathy markers, and clinical referral scope.
              </p>
              <div className="inline-flex items-center space-x-2 text-xs font-medium text-stone-400 bg-white border border-stone-200 px-4 py-2 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Applying {config.modality.toUpperCase()} Rubric & {config.difficulty.toUpperCase()} Curve</span>
              </div>
            </div>
          )}

          {/* View 4: Post-Session Scorecard */}
          {activeView === 'scorecard' && evaluationResult && (
            <ScorecardScreen
              evaluation={evaluationResult}
              vignette={activeVignette}
              messages={messages}
              currentUser={currentUser}
              onRetryScenario={handleRetryScenario}
              onNewScenario={handleNewScenario}
              onOpenDashboard={() => setActiveView('dashboard')}
            />
          )}

          {/* View 5: Dedicated Admin Management Portal (User Directory, Transaction History, Premium Controls & DB Backup/Restore) */}
          {activeView === 'admin' && (
            <AdminPortalScreen
              currentUser={currentUser}
              onNavigateToSimulation={() => setActiveView('setup')}
              onLogout={handleLogout}
              onCasesUpdated={fetchCases}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Modals */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      <IntakeBriefingModal
        vignette={activeVignette}
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
      />

      {currentUser?.isAdmin && (
        <TrainingDbModal
          isOpen={isTrainingDbOpen}
          currentUser={currentUser}
          onAdminLogin={(admin) => {
            setCurrentUser(admin);
            try {
              localStorage.setItem('counseling_trainer_user', JSON.stringify(admin));
            } catch {
              // ignore
            }
          }}
          onAdminLogout={handleLogout}
          onClose={() => {
            setIsTrainingDbOpen(false);
            fetchDbStats();
          }}
        />
      )}
    </div>
  );
}
