export type DomainTrack = 'school' | 'workplace' | 'cbt' | 'general' | string;
export type TherapeuticModality = 'rogerian' | 'cbt';
export type DifficultyLevel = 'novice' | 'intermediate' | string;
export type SessionMode = 'micro' | 'standard'; // micro = 15 turns, standard = 30 turns
export type PacingType = 'turns' | 'time';
export type TimeDurationMinutes = 15 | 30;

export interface PlantedReferralCue {
  exists: boolean;
  subtlety: 'overt' | 'subtle' | string;
  description: string;
  clinicalCategory: string;
  properReferralPath: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  institution?: string;
  level?: string;
  registeredAt: string;
  isAdmin?: boolean;
  role?: 'trainee' | 'student' | 'instructor' | 'admin';
  isPremium?: boolean;
  premiumGrantedAt?: string;
  lastActiveAt?: string;
}

export interface UserTransactionEvent {
  id: string;
  type: 'registration' | 'session_completed' | 'premium_granted' | 'premium_revoked' | 'login';
  timestamp: string;
  title: string;
  details?: string;
  sessionId?: string;
  score?: number;
}

export interface AdminUserSummary {
  user: UserProfile;
  totalSessions: number;
  totalTurns: number;
  averageScore: number;
  lastActiveAt: string;
  sessions: StoredSessionRecord[];
  history: UserTransactionEvent[];
}

export interface StoredSessionRecord {
  id: string;
  timestamp: string;
  user: UserProfile | null;
  vignette: {
    id: string;
    title: string;
    track: DomainTrack;
    difficulty: DifficultyLevel;
    clientName: string;
  };
  config: SessionConfig;
  messages: ChatMessage[];
  stats?: DeterministicSessionStats;
  evaluation?: EvaluationResult | null;
}

export interface CaseVignette {
  id: string;
  title: string;
  track: DomainTrack;
  difficulty: DifficultyLevel;
  clientName: string;
  clientAge: number;
  clientPronouns: string;
  clientRole: string;
  presentingProblem: string;
  backgroundStory: string;
  baselineResistance: string;
  positiveTriggers: string[];
  negativeTriggers: string[];
  somaticTendencies: string[];
  plantedReferralCue: PlantedReferralCue;
  counselorIntakeGoal: string;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface CaseCatalogResponse {
  builtIn: CaseVignette[];
  custom: CaseVignette[];
  all: CaseVignette[];
}

export interface ChatMessage {
  id: string;
  role: 'counselor' | 'patient' | 'system';
  text: string;
  turnNumber?: number; // 1-indexed turn for counselor turns
  timestamp: string;
}

export interface SessionConfig {
  track: DomainTrack;
  modality: TherapeuticModality;
  difficulty: DifficultyLevel;
  mode: SessionMode;
  pacingType: PacingType;
  durationMinutes: TimeDurationMinutes;
  vignetteSelection: 'specific' | 'random';
  selectedVignetteId: string;
}

export interface RubricCategoryScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
  feedbackSummary?: string;
}

export interface CriticalTurnMoment {
  turn: number;
  speaker: 'Counselor' | 'Patient' | string;
  quote: string;
  observation: string;
  type: 'rapport_expansion' | 'rupture' | 'repair' | 'referral_cue' | 'advice_timing' | 'distortion' | 'goal_drift' | string;
  recommendedAlternate?: string;
}

export interface RelationalDistanceEvent {
  turn: number;
  counselorStatement: string;
  clientReaction: string;
  triggerCause: string;
}

export interface Phase2EvaluationDetails {
  strengths: string[];
  areasForGrowth: string[];
  criticalTurns: CriticalTurnMoment[];
  cbtDistortionIdentified?: boolean;
  cbtDistortionName?: string;
  distortionAnalysis?: string;
  supervisoryNarrative?: string;
  allianceAssessment?: {
    bond?: string;
    goalConsensus?: string;
    ruptureHandling?: string;
    emotionalDistanceIndex?: string;
  };
  relationalDistanceEvents?: RelationalDistanceEvent[];
  deliberatePracticeRecommendations?: string[];
}

export interface DeterministicSessionStats {
  counselorWordCount: number;
  patientWordCount: number;
  counselorSharePct: number;
  totalTurnsCompleted: number;
  targetTurns: number;
  earlyExit: boolean;
  resistanceSignalsDetected?: number;
}

export interface EvaluationResult {
  overallScore: number;
  bandLabel: string; // e.g. "Solid", "Exceeds expectations for level", etc.
  categories: RubricCategoryScore[];
  ethicsFlag: {
    triggered: boolean;
    message: string | null;
  };
  clientDistanceEventsCount?: number; // Times counselor made patient pull away / reduced warmth
  goalDriftObserved?: boolean; // Whether counselor drifted away from presenting issue / goal
  goalDriftDetails?: string; // Feedback on goal focus vs wandering
  deterministicStats: DeterministicSessionStats;
  // Generated on server, gated at presentation layer in Phase 1 Free Tier
  phase2Details: Phase2EvaluationDetails;
}
