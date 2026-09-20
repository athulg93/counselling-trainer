import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Sliders,
  MessageSquare,
  Crown,
  Sparkles,
  Lock,
  Unlock,
  BookOpen,
  Lightbulb,
  FileText,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { EvaluationResult, CaseVignette, ChatMessage, UserProfile } from '../types';

interface ScorecardScreenProps {
  evaluation: EvaluationResult;
  vignette: CaseVignette;
  messages: ChatMessage[];
  onRetryScenario: () => void;
  onNewScenario: () => void;
  onOpenDashboard?: () => void;
  currentUser?: UserProfile | null;
}

export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  evaluation,
  vignette,
  messages,
  onRetryScenario,
  onNewScenario,
  onOpenDashboard,
  currentUser,
}) => {
  const isPremiumOrAdmin = Boolean(currentUser?.isPremium || currentUser?.isAdmin);
  const [showSupervisorView, setShowSupervisorView] = useState(isPremiumOrAdmin ? true : false);
  const [showBlockedNotice, setShowBlockedNotice] = useState(false);

  // Band styling helper
  const getBandBadge = (score: number, band: string) => {
    if (score >= 90) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        bar: 'bg-emerald-600',
        icon: Award,
      };
    }
    if (score >= 75) {
      return {
        bg: 'bg-teal-50 border-teal-200 text-teal-800',
        bar: 'bg-teal-600',
        icon: CheckCircle2,
      };
    }
    if (score >= 60) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        bar: 'bg-amber-500',
        icon: TrendingUp,
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      bar: 'bg-rose-500',
      icon: AlertTriangle,
    };
  };

  const badge = getBandBadge(evaluation.overallScore, evaluation.bandLabel);

  // Export transcript to de-identified text file
  const handleDownloadTranscript = () => {
    let content = `CONVERSATIONAL COUNSELLING TRAINER — CLINICAL SIMULATION TRANSCRIPT\n`;
    content += `===================================================================\n`;
    content += `Vignette: ${vignette.title}\n`;
    content += `Domain Track: ${vignette.track.toUpperCase()}\n`;
    content += `Client Presentation: ${vignette.presentingProblem}\n`;
    content += `Overall Evaluation Score: ${evaluation.overallScore}/100 (${evaluation.bandLabel})\n`;
    content += `De-identified for deliberate practice training audit.\n\n`;
    content += `--- TRANSCRIPT START ---\n\n`;

    messages.forEach((msg, idx) => {
      const speaker = msg.role === 'counselor' ? 'COUNSELOR' : vignette.clientName.toUpperCase();
      const turnInfo = msg.turnNumber ? ` [Turn ${msg.turnNumber}]` : '';
      content += `${speaker}${turnInfo}:\n${msg.text}\n\n`;
    });

    content += `--- TRANSCRIPT END ---\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counseling_session_${vignette.id}_score_${evaluation.overallScore}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Critical Ethics Flag Banner (PRD Section 5.2 / Section 6: Always visible if triggered) */}
      {evaluation.ethicsFlag?.triggered && (
        <div
          id="critical-ethics-banner"
          className="mb-6 bg-rose-50 border-2 border-rose-500 text-rose-900 rounded-2xl p-5 shadow-sm flex items-start space-x-3.5"
        >
          <div className="p-2 bg-rose-200 text-rose-800 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base uppercase tracking-wider text-rose-700">
                Critical Clinical Ethics Flag
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed mt-1 font-medium">
              {evaluation.ethicsFlag.message ||
                'Planted out-of-scope clinical condition was actively dismissed or outside medical referral was discouraged. In clinical practice, client safety and referral boundaries take immediate precedence.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Scorecard Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6 mb-6">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Agent 2 • Clinical Supervisor Evaluation
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Session Performance Scorecard
            </h1>
            <div className="text-xs sm:text-sm text-stone-500 mt-0.5 flex items-center space-x-2 flex-wrap gap-y-1">
              <span>
                Case: <strong className="text-stone-700">{vignette.title}</strong> • {vignette.difficulty.toUpperCase()} Level
              </span>
              {currentUser?.isPremium && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-700" />
                    <span>Premium Tier</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Headline Score & Band (PRD Section 6 Phase 1 Requirement) */}
          <div className="flex items-center space-x-4 bg-stone-50 border border-stone-200 p-3 sm:p-4 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-stone-500 block">
                Headline Score
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {evaluation.overallScore}
                <span className="text-stone-400 text-lg font-normal">/100</span>
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold ${badge.bg}`}>
              {evaluation.bandLabel}
            </div>
          </div>
        </div>

        {/* Phase 1 Category Subtotal Bars (PRD Section 6 Requirement) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Rubric Category Subtotals
            </h2>
            <span className="text-xs text-stone-400">Weighted per Modality</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {evaluation.categories.map((cat, idx) => {
              const pct = cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0;
              return (
                <div
                  key={cat.id || idx}
                  id={`category-bar-${idx}`}
                  className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 sm:p-4"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900 text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-stone-900">
                        {cat.score} / {cat.maxScore} pts
                      </span>
                      <span className="text-xs font-medium text-stone-500">
                        ({pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${badge.bar} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                    />
                  </div>

                  {cat.description && (
                    <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                      {cat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deterministic Session Metrics & Clinical Fidelity Indicators */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">Counselor Words</span>
              <span className="text-base font-bold text-stone-900">
                {evaluation.deterministicStats?.counselorWordCount ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">Patient Words</span>
              <span className="text-base font-bold text-stone-900">
                {evaluation.deterministicStats?.patientWordCount ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">Talk Share</span>
              <span className="text-base font-bold text-teal-700">
                {evaluation.deterministicStats?.counselorSharePct ?? 0}%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">Turns Completed</span>
              <span className="text-base font-bold text-stone-900">
                {evaluation.deterministicStats?.totalTurnsCompleted ?? 0} of{' '}
                {evaluation.deterministicStats?.targetTurns ?? 15}
              </span>
            </div>
          </div>

          {/* Key Clinical Behavioral Audits: Relational Distance Events & Goal Drift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Relational Distance & Defensive Withdrawal Counter */}
            <div className={`p-3 rounded-xl border flex items-start space-x-3 ${
              (evaluation.clientDistanceEventsCount || 0) === 0
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : (evaluation.clientDistanceEventsCount || 0) === 1
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-rose-50/60 border-rose-200 text-rose-900'
            }`}>
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                (evaluation.clientDistanceEventsCount || 0) === 0
                  ? 'bg-emerald-200/80 text-emerald-800'
                  : (evaluation.clientDistanceEventsCount || 0) === 1
                  ? 'bg-amber-200/80 text-amber-800'
                  : 'bg-rose-200/80 text-rose-800'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Client Relational Distance / Withdrawal
                  </span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-white/80 border border-current">
                    {evaluation.clientDistanceEventsCount || 0} {(evaluation.clientDistanceEventsCount || 0) === 1 ? 'time' : 'times'}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {(evaluation.clientDistanceEventsCount || 0) === 0
                    ? 'Patient remained engaged with high warmth and no defensive withdrawal.'
                    : (evaluation.clientDistanceEventsCount || 0) === 1
                    ? 'Patient pulled back or exhibited defensive resistance once during dialogue.'
                    : `Patient moved away or reduced friendliness ${evaluation.clientDistanceEventsCount} times due to triggers or premature pacing.`}
                </p>
              </div>
            </div>

            {/* Clinical Goal Drift Audit */}
            <div className={`p-3 rounded-xl border flex items-start space-x-3 ${
              !evaluation.goalDriftObserved
                ? 'bg-teal-50/60 border-teal-200 text-teal-900'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}>
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                !evaluation.goalDriftObserved
                  ? 'bg-teal-200/80 text-teal-800'
                  : 'bg-amber-200/80 text-amber-800'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Clinical Goal Adherence
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/80 border ${
                    !evaluation.goalDriftObserved ? 'text-teal-800 border-teal-300' : 'text-amber-800 border-amber-300'
                  }`}>
                    {!evaluation.goalDriftObserved ? 'Maintained Focus' : 'Goal Drift Flagged'}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {evaluation.goalDriftDetails ||
                    (!evaluation.goalDriftObserved
                      ? 'Counselor maintained focus on the core presenting problem throughout.'
                      : 'Counselor drifted from the primary presenting concern in later turns.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center space-x-2">
          {onOpenDashboard && (
            <button
              id="back-to-dashboard-btn"
              onClick={onOpenDashboard}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <span>Back to Dashboard</span>
            </button>
          )}

          <button
            id="retry-scenario-btn"
            onClick={onRetryScenario}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>

          <button
            id="new-scenario-btn"
            onClick={onNewScenario}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all"
          >
            <span>Select Another Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          id="download-transcript-btn"
          onClick={handleDownloadTranscript}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Transcript (.txt)</span>
        </button>
      </div>

      {/* Discrete Supervisor Inspection Toggle (PRD Section 6 Implementation Note) */}
      <div className="border border-stone-200 bg-white rounded-2xl p-5 shadow-xs">
        <button
          id="supervisor-toggle-btn"
          onClick={() => setShowSupervisorView(!showSupervisorView)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg transition-colors ${
              isPremiumOrAdmin
                ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-200'
                : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
            }`}>
              {isPremiumOrAdmin ? <Sliders className="w-4 h-4" /> : <Lock className="w-4 h-4 text-stone-500" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-stone-800 block">
                  Clinical Supervisor Qualitative Insights (Phase 2 In-Depth Report)
                </span>
                {isPremiumOrAdmin ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                    <Crown className="w-3 h-3 text-amber-600 mr-0.5" />
                    <span>Premium Unlocked</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-300 flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5 text-stone-500 mr-0.5" />
                    <span>Locked • Premium Only</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-500">
                {isPremiumOrAdmin
                  ? 'Comprehensive supervisory narrative, alliance diagnostics, turning point critique, and expert rephrasings.'
                  : 'In-depth supervisory formulation, turn-by-turn critique, and expert rephrasings (Available on Premium Tier).'}
              </span>
            </div>
          </div>
          <div className="text-stone-400 group-hover:text-stone-700">
            {showSupervisorView ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showSupervisorView && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            {!isPremiumOrAdmin ? (
              /* Blocked State for Free Tier Users */
              <div className="p-6 rounded-2xl bg-stone-50/80 border border-stone-200 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Phase 2 Qualitative Clinical Insights are Locked
                  </h3>
                  <p className="text-xs text-stone-600 max-w-lg mx-auto mt-1 leading-relaxed">
                    This option is enabled exclusively for verified <strong className="text-stone-800">Premium Members</strong>. Free tier practitioners receive quantitative rubric grading and talk-to-listen ratios. In-depth supervisory narratives, verbatim alternate rephrasings, and deliberate practice assignments are reserved for Premium supervision.
                  </p>
                </div>

                {/* Locked capability matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left">
                  <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-start space-x-2.5 opacity-75">
                    <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">Supervisory Case Narrative</span>
                      <span className="text-[11px] text-stone-500">Pedagogical formulation of modality fidelity and presence.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-start space-x-2.5 opacity-75">
                    <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">Turn-by-Turn Rephrasings</span>
                      <span className="text-[11px] text-stone-500">Verbatim supervisor rewrites for critical dialogue moments.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-start space-x-2.5 opacity-75">
                    <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">Alliance & Rupture Diagnostics</span>
                      <span className="text-[11px] text-stone-500">Deep audit of bond depth, goal consensus, and defense handling.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-start space-x-2.5 opacity-75">
                    <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">Deliberate Practice Plan</span>
                      <span className="text-[11px] text-stone-500">Actionable clinical homework drills for future sessions.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-stone-500 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Institutional supervisors or administrator <strong>Athul Govind</strong> can grant Premium status from the Admin Hub.</span>
                </div>
              </div>
            ) : (
              /* Super Detailed Phase 2 Qualitative Insights for Premium / Admin Users */
              <div className="space-y-6">
                {/* 1. Supervisory Clinical Narrative Formulation */}
                <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-4 h-4 text-teal-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Supervisory Clinical Case Formulation
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {evaluation.phase2Details?.supervisoryNarrative ||
                      `In this simulation with ${vignette.clientName}, the counselor demonstrated notable clinical presence addressing ${vignette.presentingProblem}. Pacing and emotional resonance were maintained across the session. Deliberate practice should center on tightening open Socratic inquiries and avoiding premature reassurance when resistance surfaces.`}
                  </p>
                </div>

                {/* 2. Therapeutic Working Alliance & Rupture Dynamics */}
                {evaluation.phase2Details?.allianceAssessment && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 flex items-center space-x-1.5">
                      <Target className="w-4 h-4 text-teal-700" />
                      <span>Therapeutic Working Alliance Dynamics</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <span className="font-bold text-stone-800 block mb-1">Emotional Bond</span>
                        <p className="text-stone-600 leading-relaxed">
                          {evaluation.phase2Details.allianceAssessment.bond || 'Good baseline warmth and respectful listening.'}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <span className="font-bold text-stone-800 block mb-1">Goal Consensus</span>
                        <p className="text-stone-600 leading-relaxed">
                          {evaluation.phase2Details.allianceAssessment.goalConsensus || 'Exploration remained aligned with client presenting concerns.'}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <span className="font-bold text-stone-800 block mb-1">Rupture & Resistance</span>
                        <p className="text-stone-600 leading-relaxed">
                          {evaluation.phase2Details.allianceAssessment.ruptureHandling || 'Client ambivalence was met with steady neutrality.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2.5 Dedicated Client Relational Distance & Resistance Log */}
                {evaluation.phase2Details?.relationalDistanceEvents && evaluation.phase2Details.relationalDistanceEvents.length > 0 && (
                  <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                        <span>Client Relational Distance & Withdrawal Log ({evaluation.phase2Details.relationalDistanceEvents.length} detected)</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                        Attunement Deficit
                      </span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      {evaluation.phase2Details.relationalDistanceEvents.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-rose-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-stone-900">Turn {item.turn}</span>
                            <span className="text-rose-700 font-medium">Trigger: {item.triggerCause}</span>
                          </div>
                          <div className="text-stone-700 italic bg-stone-50 p-2 rounded-lg border border-stone-200/60">
                            <strong>Counselor:</strong> "{item.counselorStatement}"
                          </div>
                          <div className="text-stone-800 font-medium pl-1">
                            <span className="text-rose-800 font-semibold">Client Withdrawal:</span> "{item.clientReaction}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CBT Cognitive Distortion Diagnostic Mapping (if present) */}
                {evaluation.phase2Details?.cbtDistortionName && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-700" />
                        <span>Cognitive Distortion Diagnostic: {evaluation.phase2Details.cbtDistortionName}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-200/70 text-amber-900">
                        {evaluation.phase2Details.cbtDistortionIdentified ? 'Addressed in Dialogue' : 'Elicited by Client'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {evaluation.phase2Details.distortionAnalysis ||
                        `The client exhibited patterns of ${evaluation.phase2Details.cbtDistortionName}. The counselor's task was to help externalize this thought pattern through gentle downward-arrow or thought-record questioning.`}
                    </p>
                  </div>
                )}

                {/* 4. Strengths & Growth Areas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-2.5">
                      Key Clinical Strengths Observed
                    </span>
                    <ul className="space-y-2 text-xs text-stone-700">
                      {evaluation.phase2Details?.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      )) || (
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>Maintained respectful and supportive counseling presence.</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-2.5">
                      Targeted Deliberate Growth Vectors
                    </span>
                    <ul className="space-y-2 text-xs text-stone-700">
                      {evaluation.phase2Details?.areasForGrowth?.map((g, idx) => (
                        <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      )) || (
                        <li className="flex items-start space-x-2">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <span>Increase open-question share to encourage deeper exploration.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* 5. Turn-by-Turn Clinical Moments & Verbatim Supervisor Rephrasings */}
                {evaluation.phase2Details?.criticalTurns &&
                  evaluation.phase2Details.criticalTurns.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                          Turn-by-Turn Clinical Moments & Supervisory Rephrasings
                        </h3>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {evaluation.phase2Details.criticalTurns.length} pivotal turns analyzed
                        </span>
                      </div>
                      <div className="space-y-3">
                        {evaluation.phase2Details.criticalTurns.map((turn, idx) => (
                          <div
                            key={idx}
                            className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-teal-900 font-mono">
                                Turn {turn.turn} • {turn.speaker}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-700">
                                {turn.type.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white border border-stone-200/70 text-stone-700 italic">
                              "{turn.quote}"
                            </div>

                            <p className="text-stone-800 font-medium leading-relaxed">
                              <strong className="text-stone-900 font-semibold">Supervisory Observation:</strong> {turn.observation}
                            </p>

                            {turn.recommendedAlternate && (
                              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200/90 text-teal-950 space-y-1">
                                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-teal-800">
                                  <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Supervisor's Recommended Alternative Phrasing:</span>
                                </div>
                                <p className="text-xs italic leading-relaxed text-teal-900">
                                  "{turn.recommendedAlternate}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 6. Prescribed Deliberate Practice Homework */}
                {evaluation.phase2Details?.deliberatePracticeRecommendations &&
                  evaluation.phase2Details.deliberatePracticeRecommendations.length > 0 && (
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                        <span>Prescribed Deliberate Practice Drills</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-teal-950 list-disc list-inside">
                        {evaluation.phase2Details.deliberatePracticeRecommendations.map((drill, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {drill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
