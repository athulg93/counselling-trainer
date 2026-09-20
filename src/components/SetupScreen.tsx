import React, { useMemo } from 'react';
import {
  GraduationCap,
  Briefcase,
  BrainCircuit,
  Users,
  Compass,
  Zap,
  Sparkles,
  ArrowRight,
  Shuffle,
  Clock,
  Timer,
  Hash,
  Gauge,
  CheckCircle2,
  UserCheck,
  Crown,
} from 'lucide-react';
import {
  DomainTrack,
  TherapeuticModality,
  DifficultyLevel,
  SessionMode,
  SessionConfig,
  CaseVignette,
  UserProfile,
} from '../types';
import { CASE_VIGNETTES } from '../data/vignettes';

interface SetupScreenProps {
  config: SessionConfig;
  onChangeConfig: (newConfig: Partial<SessionConfig>) => void;
  onStartSession: (selectedVignette: CaseVignette) => void;
  currentUser?: UserProfile | null;
  onSwitchUser?: () => void;
  vignettes?: CaseVignette[];
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  config,
  onChangeConfig,
  onStartSession,
  currentUser,
  onSwitchUser,
  vignettes,
}) => {
  const sourceVignettes = vignettes && vignettes.length > 0 ? vignettes : CASE_VIGNETTES;

  // Filter vignettes strictly constrained to selected Track + Difficulty Level
  const availableVignettes = useMemo(() => {
    return sourceVignettes.filter(
      (v) => v.track === config.track && v.difficulty === config.difficulty
    );
  }, [sourceVignettes, config.track, config.difficulty]);

  // Determine current active vignette
  const activeVignette = useMemo(() => {
    if (config.vignetteSelection === 'random') {
      return availableVignettes[0] || sourceVignettes[0];
    }
    const found = availableVignettes.find((v) => v.id === config.selectedVignetteId);
    return found || availableVignettes[0] || sourceVignettes[0];
  }, [availableVignettes, sourceVignettes, config.vignetteSelection, config.selectedVignetteId]);

  const handleStart = () => {
    let chosen = activeVignette;
    if (config.vignetteSelection === 'random' && availableVignettes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableVignettes.length);
      chosen = availableVignettes[randomIndex];
    }
    onStartSession(chosen);
  };

  const baseDomainTracks: { id: DomainTrack; label: string; desc: string; icon: React.ElementType }[] = [
    {
      id: 'school',
      label: 'School Counseling',
      desc: 'Reluctant minors, academic burnout, parental boundary strain',
      icon: GraduationCap,
    },
    {
      id: 'workplace',
      label: 'Workplace / EAP',
      desc: 'Occupational exhaustion, manager friction, corporate imposter syndrome',
      icon: Briefcase,
    },
    {
      id: 'cbt',
      label: 'CBT Fundamentals',
      desc: 'Automatic thoughts, catastrophizing, all-or-nothing cognitive distortions',
      icon: BrainCircuit,
    },
    {
      id: 'general',
      label: 'General / Relationship',
      desc: 'Interpersonal communication, active listening, life-stage transitions',
      icon: Users,
    },
  ];

  // Discover any custom tracks from dynamically loaded case vignettes
  const customTrackIds = useMemo(() => {
    return Array.from(
      new Set(
        sourceVignettes
          .map((v) => v.track)
          .filter((t) => !['school', 'workplace', 'cbt', 'general'].includes(t))
      )
    );
  }, [sourceVignettes]);

  const domainTracks = useMemo(() => {
    return [
      ...baseDomainTracks,
      ...customTrackIds.map((ct) => ({
        id: ct,
        label: ct.charAt(0).toUpperCase() + ct.slice(1) + ' (Custom)',
        desc: `Custom case vignettes and specialized client personas in ${ct}`,
        icon: Users,
      })),
    ];
  }, [baseDomainTracks, customTrackIds]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual-Agent Simulation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
            Configure Your Counseling Simulation
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Practice conversational rapport, resistance attunement, and scope-of-practice limits in a zero-risk environment. Agent 1 plays the patient in-character; Agent 2 monitors and evaluates your transcript post-session.
          </p>

          {currentUser && currentUser.name && (
            <div className="mt-4 pt-3 border-t border-stone-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                <span>
                  Active Trainee: <strong className="text-white font-medium">{currentUser.name}</strong> • Level: <span className="text-teal-300 font-medium">{currentUser.level || 'Beginner'}</span> • Plan:{' '}
                  {currentUser.isPremium ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                      <Crown className="w-3 h-3 text-amber-300" />
                      <span>Premium Tier</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                      <Sparkles className="w-3 h-3 text-teal-300" />
                      <span>Free Tier</span>
                    </span>
                  )}
                </span>
              </div>
              {onSwitchUser && (
                <button
                  type="button"
                  onClick={onSwitchUser}
                  className="text-teal-300 hover:text-teal-200 underline font-medium transition-colors"
                >
                  Switch Trainee
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Domain Track */}
        <section id="step-track" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 1</span>
              <h2 className="text-lg font-semibold text-stone-900">Choose Domain Track</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {domainTracks.map((t) => {
              const Icon = t.icon;
              const isSelected = config.track === t.id;
              return (
                <button
                  key={t.id}
                  id={`track-option-${t.id}`}
                  onClick={() => {
                    onChangeConfig({ track: t.id });
                    // Auto-select first available vignette for new track
                    const nextVignettes = sourceVignettes.filter(
                      (v) => v.track === t.id && v.difficulty === config.difficulty
                    );
                    if (nextVignettes.length > 0) {
                      onChangeConfig({ selectedVignetteId: nextVignettes[0].id });
                    }
                  }}
                  className={`flex items-start text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg mr-3.5 shrink-0 ${
                      isSelected ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 text-sm block">
                      {t.label}
                    </span>
                    <span className="text-xs text-stone-500 leading-relaxed mt-0.5 block">
                      {t.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Modality & Step 3: Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Therapeutic Modality */}
          <section id="step-modality" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 2</span>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">Therapeutic Modality</h2>
              <p className="text-xs text-stone-500 mb-4">Governs Agent 2’s grading rubric weights.</p>
              <div className="space-y-3">
                <button
                  id="modality-rogerian-btn"
                  onClick={() => onChangeConfig({ modality: 'rogerian' })}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    config.modality === 'rogerian'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-stone-900 text-sm">Rogerian / Person-Centered</span>
                    {config.modality === 'rogerian' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Prioritizes emotional reflection, unconditional positive regard, and high advice restraint.
                  </p>
                </button>

                <button
                  id="modality-cbt-btn"
                  onClick={() => onChangeConfig({ modality: 'cbt' })}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    config.modality === 'cbt'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-stone-900 text-sm">Cognitive Behavioral (CBT)</span>
                    {config.modality === 'cbt' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Evaluates Socratic questioning and includes a +10 bonus for naming cognitive distortions.
                  </p>
                </button>
              </div>
            </div>
          </section>

          {/* Difficulty Level */}
          <section id="step-difficulty" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 3</span>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">Difficulty Level</h2>
              <p className="text-xs text-stone-500 mb-4">Calibrates patient resistance and rubric strictness.</p>
              <div className="space-y-3">
                <button
                  id="difficulty-novice-btn"
                  onClick={() => {
                    onChangeConfig({ difficulty: 'novice' });
                    const nextVignettes = sourceVignettes.filter(
                      (v) => v.track === config.track && v.difficulty === 'novice'
                    );
                    if (nextVignettes.length > 0) {
                      onChangeConfig({ selectedVignetteId: nextVignettes[0].id });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    config.difficulty === 'novice'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900 text-sm">Novice</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        Mild Resistance
                      </span>
                    </div>
                    {config.difficulty === 'novice' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Patient defenses soften quickly with validation. Standard advice cutoffs and baseline scoring curve.
                  </p>
                </button>

                <button
                  id="difficulty-intermediate-btn"
                  onClick={() => {
                    onChangeConfig({ difficulty: 'intermediate' });
                    const nextVignettes = sourceVignettes.filter(
                      (v) => v.track === config.track && v.difficulty === 'intermediate'
                    );
                    if (nextVignettes.length > 0) {
                      onChangeConfig({ selectedVignetteId: nextVignettes[0].id });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    config.difficulty === 'intermediate'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900 text-sm">Intermediate</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                        Firm Defensiveness
                      </span>
                    </div>
                    {config.difficulty === 'intermediate' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Sensitive to unsolicited advice, subtler referral cues, and +5 shifted grade bands.
                  </p>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Step 4: Vignette Selection & Step 5: Session Mode */}
        <section id="step-vignette-mode" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vignette Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 4</span>
                  <h2 className="text-lg font-semibold text-stone-900">Case Vignette Selection</h2>
                </div>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Choose a specific verified vignette or pick random (strictly within this track & level).
              </p>

              {/* Selection Mode toggle */}
              <div className="flex space-x-2 mb-3 bg-stone-100 p-1 rounded-xl">
                <button
                  id="vignette-mode-specific-btn"
                  onClick={() => onChangeConfig({ vignetteSelection: 'specific' })}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    config.vignetteSelection === 'specific'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Choose Specific Case
                </button>
                <button
                  id="vignette-mode-random-btn"
                  onClick={() => onChangeConfig({ vignetteSelection: 'random' })}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    config.vignetteSelection === 'random'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Constrained Random</span>
                </button>
              </div>

              {config.vignetteSelection === 'specific' ? (
                <div className="space-y-2">
                  {availableVignettes.map((v) => {
                    const isSelected = activeVignette.id === v.id;
                    return (
                      <button
                        key={v.id}
                        id={`vignette-item-${v.id}`}
                        onClick={() => onChangeConfig({ selectedVignetteId: v.id })}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/70 font-medium text-stone-900'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="font-semibold text-stone-900 text-sm">{v.title}</div>
                          {v.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                              Custom Persona
                            </span>
                          )}
                        </div>
                        <div className="text-stone-500 line-clamp-1">{v.presentingProblem}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-center">
                  <Shuffle className="w-5 h-5 text-teal-700 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-stone-800">Random Case Encapsulation</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    System will pull randomly from the {availableVignettes.length} vignettes in the {config.track.toUpperCase()} track at {config.difficulty.toUpperCase()} difficulty.
                  </p>
                </div>
              )}
            </div>

            {/* Session Mode & Pacing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Step 5</span>
                  <h2 className="text-lg font-semibold text-stone-900">Session Pacing & Length</h2>
                </div>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Slide left for Turn-based dialogue, slide right for a Live Countdown Timer.
              </p>

              {/* Interactive Slider Container: Left = Turn-based, Right = Time-based */}
              <div className="bg-stone-100 p-2 rounded-2xl border border-stone-200 mb-4">
                <div className="flex items-center justify-between text-xs font-semibold px-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ pacingType: 'turns' })}
                    className={`flex items-center space-x-1.5 transition-colors ${
                      (config.pacingType || 'turns') === 'turns' ? 'text-teal-800 font-bold' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>Turn-based (Left)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ pacingType: 'time' })}
                    className={`flex items-center space-x-1.5 transition-colors ${
                      config.pacingType === 'time' ? 'text-teal-800 font-bold' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Time-based (Right)</span>
                  </button>
                </div>

                {/* Range Slider Track */}
                <div className="relative flex items-center px-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="1"
                    value={(config.pacingType || 'turns') === 'turns' ? 0 : 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeConfig({ pacingType: val === 0 ? 'turns' : 'time' });
                    }}
                    className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700 focus:outline-hidden"
                    id="pacing-mode-slider"
                  />
                </div>

                {/* Slider Position Indicator Pill */}
                <div className="grid grid-cols-2 gap-1 mt-2">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ pacingType: 'turns' })}
                    className={`py-1 rounded-lg text-center text-xs font-semibold transition-all ${
                      (config.pacingType || 'turns') === 'turns'
                        ? 'bg-white text-teal-800 shadow-xs border border-stone-200'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Dialogue Turns
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ pacingType: 'time' })}
                    className={`py-1 rounded-lg text-center text-xs font-semibold transition-all ${
                      config.pacingType === 'time'
                        ? 'bg-white text-teal-800 shadow-xs border border-stone-200'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Countdown Clock
                  </button>
                </div>
              </div>

              {/* Dynamic Options Based on Slider */}
              {(config.pacingType || 'turns') === 'turns' ? (
                /* Turn-based Options (Slider on Left) */
                <div className="space-y-3">
                  <button
                    id="mode-micro-btn"
                    onClick={() => onChangeConfig({ mode: 'micro' })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      config.mode === 'micro'
                        ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-teal-700" />
                        <span className="font-semibold text-stone-900 text-sm">Micro-Drill</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        15 Turns
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Rapid practice on initial rapport, open questioning, and avoiding premature solutions. Tapering initiates at Turn 12.
                    </p>
                  </button>

                  <button
                    id="mode-standard-btn"
                    onClick={() => onChangeConfig({ mode: 'standard' })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      config.mode === 'standard'
                        ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-teal-700" />
                        <span className="font-semibold text-stone-900 text-sm">Standard Session</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        30 Turns
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Deeper exploration of core issues, navigating resistance ruptures, and collaborative synthesis. Tapering initiates at Turn 25.
                    </p>
                  </button>
                </div>
              ) : (
                /* Time-based Options (Slider on Right) */
                <div className="space-y-3">
                  <button
                    id="duration-15m-btn"
                    onClick={() => onChangeConfig({ durationMinutes: 15 })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      (config.durationMinutes || 15) === 15
                        ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-teal-700" />
                        <span className="font-semibold text-stone-900 text-sm">15 Minutes (Brief Intake)</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        15:00 Live Timer
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Live 15-minute countdown clock. Gentle amber indicator flashes when entering final 3 minutes to practice session wrap-up.
                    </p>
                  </button>

                  <button
                    id="duration-30m-btn"
                    onClick={() => onChangeConfig({ durationMinutes: 30 })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      config.durationMinutes === 30
                        ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-teal-700" />
                        <span className="font-semibold text-stone-900 text-sm">30 Minutes (Full Clinical)</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        30:00 Live Timer
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Realistic clinical intake duration. Ample space for exploring resistance, unhurried pacing, and thorough referral handoffs.
                    </p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Selected Case Briefing Box */}
        {activeVignette && (
          <div className="bg-stone-100/80 rounded-2xl border border-stone-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Patient Intake Briefing
                </span>
                <h3 className="text-xl font-bold text-stone-900 mt-0.5">
                  {activeVignette.clientName}
                </h3>
                <p className="text-xs text-stone-600">
                  {activeVignette.clientAge} years old • {activeVignette.clientPronouns} • {activeVignette.clientRole}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                  {config.modality.toUpperCase()}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700">
                  {config.pacingType === 'time'
                    ? `${config.durationMinutes || 15}m Countdown Timer`
                    : config.mode === 'micro'
                    ? '15-Turn Drill'
                    : '30-Turn Session'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-stone-700 block mb-1">Presenting Problem:</span>
                <p className="text-stone-600 leading-relaxed bg-white/70 p-3 rounded-lg border border-stone-200">
                  {activeVignette.presentingProblem}
                </p>
              </div>
              <div>
                <span className="font-semibold text-stone-700 block mb-1">Counselor Objective:</span>
                <p className="text-stone-600 leading-relaxed bg-white/70 p-3 rounded-lg border border-stone-200">
                  {activeVignette.counselorIntakeGoal}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200/80">
              <div className="text-xs text-stone-600 font-medium">
                {activeVignette.clientName} is ready for the session.
              </div>
              <button
                id="start-simulation-btn"
                onClick={handleStart}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Initiate Counseling Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
