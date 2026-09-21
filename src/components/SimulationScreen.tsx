import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Clock,
  Timer,
  LogOut,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Volume2,
  ChevronDown,
  Info,
  FileCheck,
  RefreshCw,
  Edit3,
  X,
} from 'lucide-react';
import { CaseVignette, ChatMessage, SessionConfig } from '../types';

interface SimulationScreenProps {
  vignette: CaseVignette;
  config: SessionConfig;
  messages: ChatMessage[];
  currentTurn: number;
  maxTurns: number;
  isLoadingPatient: boolean;
  errorMessage?: string | null;
  onSendMessage: (text: string) => void;
  onRetryLastTurn?: () => void;
  onEditLastTurn?: () => string | void;
  onClearError?: () => void;
  onConcludeEarly: () => void;
  onExit: () => void;
  onShowIntakeBriefing: () => void;
}

export const SimulationScreen: React.FC<SimulationScreenProps> = ({
  vignette,
  config,
  messages,
  currentTurn,
  maxTurns,
  isLoadingPatient,
  errorMessage,
  onSendMessage,
  onRetryLastTurn,
  onEditLastTurn,
  onClearError,
  onConcludeEarly,
  onExit,
  onShowIntakeBriefing,
}) => {
  const [inputText, setInputText] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showConcludeDialog, setShowConcludeDialog] = useState(false);
  const [showNothingToReviewDialog, setShowNothingToReviewDialog] = useState(false);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const prevLoadingPatientRef = useRef<boolean>(isLoadingPatient);

  // Completed counselor turns count
  const counselorTurnsCompleted = messages.filter((m) => m.role === 'counselor').length;
  const getElapsedSeconds = () => Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

  // Time-based mode timer state
  const isTimeMode = config.pacingType === 'time';
  const totalSeconds = (config.durationMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);

  // Countdown timer effect for time-based mode
  useEffect(() => {
    if (!isTimeMode) return;
    if (secondsRemaining <= 0) {
      // Auto conclude session when time expires
      onConcludeEarly();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onConcludeEarly();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimeMode, secondsRemaining, onConcludeEarly]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingPatient]);

  // Auto-focus and highlight the chat input window whenever the patient finishes responding
  useEffect(() => {
    const wasLoading = prevLoadingPatientRef.current;
    prevLoadingPatientRef.current = isLoadingPatient;

    if (!isLoadingPatient) {
      const isSessionActive =
        (!isTimeMode && currentTurn <= maxTurns) || (isTimeMode && secondsRemaining > 0);
      if (isSessionActive) {
        // Focus the textarea so the user can immediately type without clicking
        const focusTimer = setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            // Highlight the chat window visually
            setIsInputHighlighted(true);
            const fadeTimer = setTimeout(() => {
              setIsInputHighlighted(false);
            }, 2000);
            return () => clearTimeout(fadeTimer);
          }
        }, 100);
        return () => clearTimeout(focusTimer);
      }
    }
  }, [isLoadingPatient, messages.length, currentTurn, isTimeMode, secondsRemaining, maxTurns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !inputText.trim() ||
      isLoadingPatient ||
      (!isTimeMode && currentTurn > maxTurns) ||
      (isTimeMode && secondsRemaining <= 0)
    )
      return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Determine current turn phase
  const getTurnPhase = () => {
    if (config.mode === 'micro') {
      if (currentTurn <= 11) return { name: 'Exploration', color: 'bg-emerald-100 text-emerald-800' };
      if (currentTurn === 12) return { name: 'Soft Tapering', color: 'bg-amber-100 text-amber-800' };
      if (currentTurn <= 14) return { name: 'Wind-Down', color: 'bg-indigo-100 text-indigo-800' };
      return { name: 'Session Exit', color: 'bg-stone-200 text-stone-800' };
    } else {
      if (currentTurn <= 24) return { name: 'Exploration', color: 'bg-emerald-100 text-emerald-800' };
      if (currentTurn === 25) return { name: 'Soft Tapering', color: 'bg-amber-100 text-amber-800' };
      if (currentTurn <= 28) return { name: 'Wind-Down', color: 'bg-indigo-100 text-indigo-800' };
      return { name: 'Session Exit', color: 'bg-stone-200 text-stone-800' };
    }
  };

  const phase = getTurnPhase();

  // Helper to format patient somatic non-verbal cues (e.g. *[looks away]*, [looks away], or *looks away*)
  const renderPatientMessage = (text: string) => {
    // Normalize unclosed somatic brackets if any
    let normalized = text;
    if (normalized.includes('*[') && !normalized.includes(']*')) {
      normalized = normalized.endsWith('*') ? normalized.slice(0, -1) + ']*' : normalized + ']*';
    } else if (normalized.startsWith('[') && !normalized.includes(']')) {
      normalized = normalized + ']';
    }

    // Match *[...]* or [...] or leading *...* somatic actions
    const parts = normalized.split(/(\*\[.*?\]\*|\[.*?\]|^\*[^*]+?\*|\s\*[^*]+?\*)/g);
    return (
      <div className="leading-relaxed whitespace-pre-wrap text-stone-800">
        {parts.map((part, i) => {
          if (!part) return null;
          const trimmed = part.trim();
          const isCue =
            (trimmed.startsWith('*[') && trimmed.endsWith(']*')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2);

          if (isCue) {
            const clean = trimmed.replace(/^\*\[?|\]?\*?$|^\[|\]$/g, '').trim();
            return (
              <span
                key={i}
                className="inline-block my-0.5 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-serif italic text-xs tracking-wide border border-stone-200/60 select-none mr-1.5"
              >
                *{clean}*
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-4xl mx-auto h-[100dvh] flex flex-col p-2 sm:p-3 overflow-hidden">
      {/* Sleek, Compact Simulation Session Bar */}
      <div className="bg-white rounded-xl border border-stone-200 px-3 py-2 sm:py-2.5 shadow-xs mb-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Patient Details & Quick Intake Goal */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
              {vignette.clientName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 truncate">
                <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                  {vignette.clientName}
                </span>
                <span className="text-[11px] text-stone-500 hidden xs:inline shrink-0">
                  ({vignette.clientAge}y)
                </span>
              </div>
              <button
                onClick={onShowIntakeBriefing}
                className="text-[10px] text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center space-x-0.5 font-medium"
                title="View intake goal & presenting issue"
              >
                <Info className="w-2.5 h-2.5" />
                <span>Intake Goal</span>
              </button>
            </div>
          </div>

          {/* Turn & Phase Status OR Time Countdown */}
          <div className="flex items-center space-x-2 shrink-0">
            {isTimeMode ? (
              <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg">
                <Timer className={`w-3.5 h-3.5 ${secondsRemaining <= 180 ? 'text-amber-600 animate-pulse' : 'text-teal-700'}`} />
                <span className={`font-mono font-bold text-xs ${secondsRemaining <= 180 ? 'text-amber-700' : 'text-stone-800'}`}>
                  {formatTime(secondsRemaining)}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline ${
                    secondsRemaining <= 180
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : secondsRemaining <= totalSeconds * 0.5
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {secondsRemaining <= 180 ? 'Wrap-Up' : 'Active'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg">
                <span className="text-xs font-semibold text-stone-800 font-mono">
                  {Math.min(currentTurn, maxTurns)}/{maxTurns}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${phase.color}`}>
                  {phase.name}
                </span>
              </div>
            )}

            {/* Action Buttons: Exit OR Conclude Early & Review */}
            <div className="flex items-center space-x-1.5">
              <button
                id="session-exit-btn"
                type="button"
                onClick={() => setShowExitDialog(true)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center space-x-1"
                title="Exit without running Agent 2 review"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Exit</span>
              </button>

              <button
                id="session-conclude-review-btn"
                type="button"
                onClick={() => {
                  const elapsed = getElapsedSeconds();
                  if (counselorTurnsCompleted <= 3 || elapsed < 60) {
                    setShowNothingToReviewDialog(true);
                  } else {
                    setShowConcludeDialog(true);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 shadow-2xs transition-colors flex items-center space-x-1"
                title="Conclude and evaluate session with Agent 2"
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">Conclude & Review</span>
                <span className="sm:hidden">Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Exit Simulation (No Agent 2 call) */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center mb-3">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1.5">
              Exit Simulation?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed">
              This will end your session and return to scenario selection. <strong>Agent 2 will not be called</strong>, preventing any unnecessary token consumption or wasted quota.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Continue Dialogue
              </button>
              <button
                id="confirm-exit-btn"
                type="button"
                onClick={() => {
                  setShowExitDialog(false);
                  onExit();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition-colors"
              >
                Exit Without Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Nothing to Review (3 or fewer turns, or under 1 minute) */}
      {showNothingToReviewDialog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center mb-3 border border-stone-200">
              <AlertCircle className="w-5 h-5 text-stone-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1.5">
              Nothing to Review
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed">
              {counselorTurnsCompleted <= 3 && getElapsedSeconds() < 60
                ? `You have completed ${counselorTurnsCompleted} turn${counselorTurnsCompleted === 1 ? '' : 's'} and the session was under 1 minute (${getElapsedSeconds()}s). There is not enough dialogue for supervisor review.`
                : counselorTurnsCompleted <= 3
                ? `You have completed ${counselorTurnsCompleted} turn${counselorTurnsCompleted === 1 ? '' : 's'}. Sessions with 3 or fewer turns do not have sufficient dialogue for supervisory evaluation.`
                : `The session was under 1 minute (${getElapsedSeconds()}s elapsed). At least 1 minute of dialogue is required for supervisor evaluation.`}
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNothingToReviewDialog(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Continue Dialogue
              </button>
              <button
                id="nothing-to-review-exit-btn"
                type="button"
                onClick={() => {
                  setShowNothingToReviewDialog(false);
                  onExit();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Conclude Early & Review (When turns >= 3) */}
      {showConcludeDialog && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 border border-teal-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1.5">
              Conclude Early & Review?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
              You have completed <strong>{counselorTurnsCompleted} dialogue turns</strong>. Agent 2 (Supervisor) will scale talk ratios and evaluate your completed interaction against the clinical rubric.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowConcludeDialog(false);
                  onExit();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                Exit Without Review
              </button>
              <button
                type="button"
                onClick={() => setShowConcludeDialog(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Continue Dialogue
              </button>
              <button
                id="confirm-conclude-btn"
                type="button"
                onClick={() => {
                  setShowConcludeDialog(false);
                  onConcludeEarly();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 shadow-sm transition-colors"
              >
                Conclude & Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        id="chat-messages-container"
        className="flex-1 bg-stone-50/50 rounded-2xl border border-stone-200 p-3 sm:p-4 overflow-y-auto space-y-3.5"
      >
        {messages.map((msg, idx) => {
          const isCounselor = msg.role === 'counselor';
          return (
            <div
              key={msg.id || idx}
              id={`message-${idx}`}
              className={`flex ${isCounselor ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 shadow-2xs ${
                  isCounselor
                    ? 'bg-teal-700 text-white rounded-br-xs'
                    : 'bg-white text-stone-900 border border-stone-200/80 rounded-bl-xs'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-80">
                  <span className="font-semibold">
                    {isCounselor ? 'You (Counselor)' : vignette.clientName}
                  </span>
                  {msg.turnNumber && isCounselor && (
                    <span className="ml-2 font-mono text-[10px] bg-teal-800/60 px-1.5 py-0.5 rounded text-teal-100">
                      Turn {msg.turnNumber}
                    </span>
                  )}
                </div>

                {isCounselor ? (
                  <p className="leading-relaxed whitespace-pre-wrap text-sm text-white">
                    {msg.text}
                  </p>
                ) : (
                  <div className="text-sm">
                    {renderPatientMessage(msg.text)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Patient reflection loader */}
        {isLoadingPatient && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs p-3.5 shadow-2xs flex items-center space-x-2 text-stone-500 text-xs">
              <span className="font-medium text-stone-700">{vignette.clientName} is reflecting</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}

        {/* API Error / Retry Card */}
        {errorMessage && (
          <div
            id="simulation-error-banner"
            className="flex justify-start my-2"
          >
            <div className="bg-red-50/90 border border-red-200 text-red-900 rounded-2xl p-3.5 shadow-xs max-w-lg w-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-semibold text-xs text-red-800">
                    Patient response interrupted
                  </span>
                </div>
                {onClearError && (
                  <button
                    type="button"
                    onClick={onClearError}
                    className="text-red-400 hover:text-red-700 p-0.5"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-red-700 leading-relaxed mb-3">
                {errorMessage}
              </p>
              <div className="flex items-center space-x-2">
                {onRetryLastTurn && (
                  <button
                    type="button"
                    id="retry-turn-btn"
                    onClick={onRetryLastTurn}
                    disabled={isLoadingPatient}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Turn</span>
                  </button>
                )}
                {onEditLastTurn && (
                  <button
                    type="button"
                    id="edit-turn-btn"
                    onClick={() => {
                      const text = onEditLastTurn();
                      if (typeof text === 'string') {
                        setInputText(text);
                      }
                    }}
                    disabled={isLoadingPatient}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-800 text-xs font-medium transition-colors flex items-center space-x-1.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit & Resend</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Counselor Input Box */}
      <div
        id="counselor-input-container"
        className={`mt-2 bg-white rounded-xl border transition-all duration-300 p-2 sm:p-2.5 shadow-xs shrink-0 ${
          isInputHighlighted
            ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-md shadow-teal-700/10'
            : 'border-stone-200'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              id="counselor-input-field"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoadingPatient || (!isTimeMode && currentTurn > maxTurns) || (isTimeMode && secondsRemaining <= 0)}
              placeholder={
                isTimeMode
                  ? secondsRemaining <= 0
                    ? 'Session time concluded. Submitting transcript...'
                    : `Your clinical response as counselor (${formatTime(secondsRemaining)} remaining)...`
                  : currentTurn > maxTurns
                  ? 'Session completed. Submitting to supervisor evaluator...'
                  : `Your response as counselor (Turn ${currentTurn} of ${maxTurns})...`
              }
              className={`flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-stone-900 border transition-all placeholder:text-stone-400 disabled:opacity-50 ${
                isInputHighlighted
                  ? 'bg-teal-50/40 border-teal-500 ring-2 ring-teal-500/30'
                  : 'bg-stone-50/60 border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-transparent'
              }`}
            />
            <button
              id="counselor-send-btn"
              type="submit"
              disabled={
                !inputText.trim() ||
                isLoadingPatient ||
                (!isTimeMode && currentTurn > maxTurns) ||
                (isTimeMode && secondsRemaining <= 0)
              }
              aria-label="Send Counselor Response"
              className="p-3 rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 disabled:hover:bg-teal-700 transition-all shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
            <div className="flex items-center space-x-2">
              <span>{wordCount} words</span>
              {isInputHighlighted && (
                <span className="text-teal-700 font-semibold flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                  <span>Input focused — type directly</span>
                </span>
              )}
              {wordCount > 60 && !isInputHighlighted && (
                <span className="text-amber-700 font-medium">
                  • High word share: Keep questions concise to balance talk-to-listen ratio.
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-stone-400">
              Press Enter to send • Shift+Enter for newline
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
