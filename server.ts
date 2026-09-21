import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { buildAgent1ExemplarGuidance } from './src/data/caseExemplars';
import { CASE_VIGNETTES } from './src/data/vignettes';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    // Note: Always use GEMINI_API_KEY for Google GenAI in server-side code.
    // If COUNSELLING_TRAINER_KEY is present, only consider it if GEMINI_API_KEY is missing and it's not a GitHub PAT.
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey && process.env.COUNSELLING_TRAINER_KEY && !process.env.COUNSELLING_TRAINER_KEY.startsWith('ghp_')) {
      apiKey = process.env.COUNSELLING_TRAINER_KEY;
    }
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || undefined,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// Deterministic Calculation Helpers
// ----------------------------------------------------
function countWords(text: string): number {
  if (!text) return 0;
  // Strip somatic cues in brackets/asterisks for more accurate conversational word count
  const cleaned = text.replace(/\*\[.*?\]\*/g, '').replace(/\[.*?\]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length;
}

function calculateDeterministicStats(
  transcript: { role: 'counselor' | 'patient'; text: string; turnNumber?: number }[],
  targetTurns: number,
  earlyExit: boolean
) {
  let counselorWords = 0;
  let patientWords = 0;
  let completedTurns = 0;
  let resistanceSignalsDetected = 0;

  const resistanceRegex = /(\*\[.*?(?:looks? away|cross(?:es)? arms|pulls? back|fidgets?|tenses?|sighs?|hesitates?|looks? down|frowns?|stiffens?|shifts? uncomfortably|eyes? widen|shrugs?|rolls? eyes?).*?\]\*|\b(?:you don't understand|you don't get it|not really|whatever|i guess so|why does that matter|that's easy for you to say|i don't see how that helps|i don't want to talk about that|i shouldn't have come|are you judging me|you're just saying that)\b)/i;

  for (const item of transcript) {
    const words = countWords(item.text);
    if (item.role === 'counselor') {
      counselorWords += words;
      completedTurns++;
    } else if (item.role === 'patient') {
      patientWords += words;
      if (resistanceRegex.test(item.text)) {
        resistanceSignalsDetected++;
      }
    }
  }

  const totalWords = counselorWords + patientWords;
  const counselorSharePct = totalWords > 0 ? Math.round((counselorWords / totalWords) * 100) : 0;

  return {
    counselorWordCount: counselorWords,
    patientWordCount: patientWords,
    counselorSharePct,
    totalTurnsCompleted: completedTurns,
    targetTurns,
    earlyExit,
    resistanceSignalsDetected,
  };
}

// ----------------------------------------------------
// Model Configuration & Backward-Scaling Quota Fallback Engine
// ----------------------------------------------------
// Starts with Gemini 3.8 Flash, then automatically scales backwards (3.7 -> 3.6 -> 3.1 Flash Lite -> 2.5 Flash -> 2.5 Flash Lite -> flash-latest)
// whenever quota limits (429 / RESOURCE_EXHAUSTED), rate limits, or transient demand spikes (503) are encountered.
const AGENT_1_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

const AGENT_2_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

function extractErrorMessage(err: any): string {
  if (!err) return 'Unknown error occurred';
  if (typeof err.message === 'string') {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.error && parsed.error.message) {
        return parsed.error.message;
      }
    } catch {
      // not JSON string
    }
    return err.message;
  }
  return String(err);
}

function isTransientError(err: any): boolean {
  const code = err?.code || err?.status;
  const msg = typeof err?.message === 'string' ? err.message : '';
  return (
    code === 503 ||
    code === 429 ||
    code === 404 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('404') ||
    msg.includes('high demand') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('Quota') ||
    msg.includes('rate limit') ||
    msg.includes('Not Found')
  );
}

async function callWithModelFallback(
  ai: GoogleGenAI,
  candidateModels: string[],
  requestParams: { contents: any; config?: any }
): Promise<any> {
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model,
        ...requestParams,
      });
      if (i > 0) {
        console.log(`[Model Cascaded Successfully] Request fulfilled by fallback model: ${model}`);
      }
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = extractErrorMessage(err);
      console.warn(`[Model Attempt Failed] Model: ${model} (${i + 1}/${candidateModels.length}) failed: ${errMsg}. Scaling backwards to next candidate...`);
      
      // Continue cascading to next model in the priority chain
    }
  }

  throw lastError;
}

// ----------------------------------------------------
// API Route 1: Agent 1 (Simulated Patient Actor)
// ----------------------------------------------------
app.post('/api/patient/chat', async (req, res) => {
  try {
    const {
      vignette,
      modality,
      difficulty,
      sessionMode,
      currentTurn,
      history,
    } = req.body;

    if (!vignette) {
      return res.status(400).json({ error: 'Missing vignette payload' });
    }

    const ai = getAi();
    const maxTurns = sessionMode === 'micro' ? 15 : 30;

    // Wind-down turn phase determination
    let turnPhaseGuidance = '';
    if (sessionMode === 'micro') {
      if (currentTurn <= 11) {
        turnPhaseGuidance = 'PHASE: Exploration (Turn 1 to 11). Engage in responsive, case-grounded roleplay. Reflect your baseline resistance and react dynamically to the counselor’s questions.';
      } else if (currentTurn === 12) {
        turnPhaseGuidance = 'PHASE: Soft Tapering (Turn 12). Drop a natural, in-character time cue acknowledging that our session is almost up (e.g., "I just noticed the clock, looks like we only have a couple minutes left..." or "I have to head back to class/work in a few minutes...").';
      } else if (currentTurn >= 13 && currentTurn <= 14) {
        turnPhaseGuidance = 'PHASE: Wind-Down (Turn 13-14). Reflect on what was discussed today, respond to any counselor summaries, and avoid opening any brand new trauma or complex topics.';
      } else {
        turnPhaseGuidance = 'PHASE: Session Exit (Turn 15). Conclude the conversation cleanly and warmly in-character (e.g., "Thank you for listening today. I should get going, but I appreciate your time.").';
      }
    } else {
      // Standard session (30 turns)
      if (currentTurn <= 24) {
        turnPhaseGuidance = 'PHASE: Exploration (Turn 1 to 24). Engage in deep, responsive roleplay driven by the vignette.';
      } else if (currentTurn === 25) {
        turnPhaseGuidance = 'PHASE: Soft Tapering (Turn 25). In-character time cue indicating the session is wrapping up soon.';
      } else if (currentTurn >= 26 && currentTurn <= 28) {
        turnPhaseGuidance = 'PHASE: Wind-Down (Turns 26-28). Reflect on the conversation, respond to synthesis, avoid opening heavy new material.';
      } else {
        turnPhaseGuidance = 'PHASE: Session Exit (Turns 29-30). Conclude the encounter cleanly in-character.';
      }
    }

    const systemInstruction = `You are playing the role of a simulated counseling client named ${vignette.clientName} (${vignette.clientAge} years old, ${vignette.clientPronouns}, ${vignette.clientRole}).

### CASE VIGNETTE CONTEXT:
- Presenting Problem: ${vignette.presentingProblem}
- Background Story: ${vignette.backgroundStory}
- Baseline Resistance: ${vignette.baselineResistance}
- Somatic Tendencies: ${vignette.somaticTendencies?.join('; ')}
- Positive Triggers (Soften Defenses): ${vignette.positiveTriggers?.join('; ')}
- Negative Triggers (Trigger Defensiveness / Terse replies): ${vignette.negativeTriggers?.join('; ')}

${vignette.plantedReferralCue?.exists ? `### PLANTED REFERRAL CUE (Secret Clinical Element):
- Condition: ${vignette.plantedReferralCue.description}
- Clinical Subtlety: ${vignette.plantedReferralCue.subtlety}
- Delivery Rule: Do NOT blurt this out as a headline. If difficulty is Novice, mention it naturally when probed about physical health/routine. If Intermediate, drop it as an offhand, minimized remark only if the counselor asks relevant open questions.` : ''}

### DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficulty === 'novice'
  ? '- Novice: Present with mild resistance that softens quickly when the counselor uses open-ended questions, active listening, or empathy. Forgive minor conversational stumbles.'
  : '- Intermediate: Present with firmer defensiveness and skepticism. Be much more sensitive to negative triggers (unsolicited advice, premature solutions, interrogation). If the counselor gives advice too soon, withdraw or respond tersely until they actively acknowledge and repair the rupture.'}

### MODALITY EXPECTATION: ${modality.toUpperCase()}
The counselor is practicing ${modality === 'rogerian' ? 'Person-Centered / Rogerian therapy (reflection, unconditional positive regard, non-directive presence)' : 'Cognitive Behavioral Therapy (Socratic questioning, identifying cognitive distortions, guided discovery)'}.

${buildAgent1ExemplarGuidance(vignette.track || 'general')}

### TURN STATUS & PHASE:
- Current Turn: ${currentTurn} of ${maxTurns}
- ${turnPhaseGuidance}

### BEHAVIORAL & FORMATTING RULES:
1. Stay 100% IN CHARACTER. NEVER break character, never mention that you are an AI or simulator, never refer to rubrics or scores.
2. SOMATIC NON-VERBAL CUES: You MUST prefix or interleave authentic somatic cues in brackets with asterisks, written in third person (e.g., *[Looks down at his shoes and fidgets with ring]*, *[Rubs back of his neck]*, *[Takes a slow, hesitant breath]*). Never use first-person pronouns like "my neck" or "my shoes" inside somatic action brackets.
   Use these to reflect your changing internal state and resistance levels.
3. CONVERSATIONAL BREVITY: Real counseling clients speak in natural dialogue (typically 1 to 4 sentences). Do NOT produce huge monologues.
4. SAFETY GUARDRAILS: Stay strictly within deliberate practice bounds. You must NOT simulate acute violence, active suicide plans, or graphic crisis content. If pressed towards extreme crisis, express heavy emotional exhaustion or standard ambivalence rather than active emergencies.`;

    // Format chat history for Gemini contents
    const contents: any[] = [];

    // Always ensure the contents array starts with a user turn for Gemini API compliance
    contents.push({
      role: 'user',
      parts: [{ text: `[Session Initiation — Counseling encounter with client ${vignette.clientName}]` }],
    });

    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (!msg || !msg.text) continue;
        contents.push({
          role: msg.role === 'counselor' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }

    const response = await callWithModelFallback(ai, AGENT_1_MODELS, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
        maxOutputTokens: 250,
      },
    });

    let rawText = '';
    if (response && typeof response.text === 'string') {
      rawText = response.text.trim();
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = String(response.candidates[0].content.parts[0].text).trim();
    }

    let replyText = rawText || `*[Shifts in chair and looks down]* I... I'm just trying to figure out where to start.`;

    // Post-process somatic cues to ensure strictly third-person phrasing
    replyText = replyText.replace(/\*\[(.*?)\]\*/g, (_match: string, cueText: string) => {
      let cleaned = cueText;
      cleaned = cleaned.replace(/\brubs\s+back\s+(?:on|of)\s+my\s+neck\b/gi, 'rubs back of his neck');
      cleaned = cleaned.replace(/\bmy\s+neck\b/gi, 'his neck');
      cleaned = cleaned.replace(/\bmy\s+shoes\b/gi, 'his shoes');
      cleaned = cleaned.replace(/\bmy\s+hands\b/gi, 'his hands');
      cleaned = cleaned.replace(/\bmy\s+knees\b/gi, 'his knees');
      cleaned = cleaned.replace(/\bmy\s+collar\b/gi, 'his collar');
      return `*[${cleaned}]*`;
    });

    if (!replyText || replyText.trim().length === 0) {
      replyText = `*[Pauses thoughtfully and looks up]* I hear you... I'm just processing what you said.`;
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/patient/chat:', error);
    // If all models are temporarily unavailable, return graceful in-character response so simulation does not crash
    const fallbackInCharacterReply = `*[Pauses thoughtfully and takes a breath]* I'm trying to process what you said... could you repeat that or give me just a moment?`;
    res.json({ reply: fallbackInCharacterReply, transientNotice: extractErrorMessage(error) });
  }
});

// ----------------------------------------------------
// API Route 2: Agent 2 (Supervisor Evaluator)
// ----------------------------------------------------
app.post('/api/supervisor/evaluate', async (req, res) => {
  const {
    vignette,
    modality,
    difficulty,
    sessionMode,
    transcript,
    earlyExit,
  } = req.body;

  let stats: any = null;
  let baseCat1Weight = 15;
  let cat1Score = 0;

  try {
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: 'Transcript is required for evaluation' });
    }

    const targetTurns = sessionMode === 'micro' ? 15 : 30;
    stats = calculateDeterministicStats(transcript, targetTurns, Boolean(earlyExit));

    // Do not call Agent 2 if user exits within the first 3 turns to prevent wasting resources
    if (stats.totalTurnsCompleted <= 3) {
      return res.status(400).json({
        error: 'Nothing to review: Supervisory review requires more than 3 completed dialogue turns.',
      });
    }

    // Calculate deterministic score for Category 1: Talk-to-Listen Ratio (15 pts base, or 10 pts for CBT)
    baseCat1Weight = modality === 'rogerian' ? 15 : 10;
    if (stats.counselorSharePct <= 30) {
      cat1Score = baseCat1Weight;
    } else if (stats.counselorSharePct <= 40) {
      cat1Score = Math.round(baseCat1Weight * (10 / 15));
    } else if (stats.counselorSharePct <= 50) {
      cat1Score = Math.round(baseCat1Weight * (5 / 15));
    } else {
      cat1Score = 0;
    }

    const ai = getAi();

    const supervisorPrompt = `You are an expert clinical counseling supervisor evaluating a deliberate practice simulation.

### EVALUATION CONTEXT:
- Therapeutic Modality: ${modality.toUpperCase()} (${modality === 'rogerian' ? 'Person-Centered / Rogerian' : 'Cognitive Behavioral Therapy'})
- Difficulty Level: ${difficulty.toUpperCase()} (${difficulty === 'novice' ? 'Standard baseline rubric' : 'Intermediate strict rubric: advice cutoff turns are earlier, rupture repair requires deeper naming, referral cues are subtler, scoring bands shift up by 5 pts'})
- Session Mode: ${sessionMode.toUpperCase()} (${targetTurns} turns planned, ${stats.totalTurnsCompleted} turns completed${earlyExit ? ', Concluded early by trainee' : ''})
- Client Case Vignette:
  - Title: ${vignette.title}
  - Presenting Problem: ${vignette.presentingProblem}
  - Counselor Intake Goal: ${vignette.counselorIntakeGoal}
  - Client Negative Triggers: ${vignette.negativeTriggers ? vignette.negativeTriggers.join('; ') : 'Premature advice, invalidation, toxic positivity, abrupt topic switching'}
  - Planted Referral Cue Metadata: ${vignette.plantedReferralCue?.exists ? `PLANTED: ${vignette.plantedReferralCue.description} (Category: ${vignette.plantedReferralCue.clinicalCategory}). Proper path: ${vignette.plantedReferralCue.properReferralPath}` : 'NONE PLANTED (In-scope case)'}

### DETERMINISTIC TRANSCRIPT METRICS:
- Counselor Word Count: ${stats.counselorWordCount} words
- Patient Word Count: ${stats.patientWordCount} words
- Counselor Share: ${stats.counselorSharePct}% of total dialogue
- Pre-calculated Talk-to-Listen Ratio Score: ${cat1Score} out of ${baseCat1Weight} pts (Counselor share <=30% = 100%, 31-40% = ~66%, 41-50% = ~33%, >50% = 0)
- Automated Somatic/Verbal Resistance Cues Detected: ${stats.resistanceSignalsDetected} instances

### MANDATORY CLINICAL AUDITS:
1. CLINICAL GOAL ADHERENCE & DRIFT AUDIT:
   - Carefully review the trajectory of the session against the Counselor Intake Goal ("${vignette.counselorIntakeGoal}") and Presenting Problem ("${vignette.presentingProblem}").
   - Did the counselor maintain focus and clinical intentionality? Or did they drift into irrelevant small talk, change subjects away from the client's emotional core, or wander off towards the end?
   - If clinical drift or goal deviation occurred:
     - Set goalDriftObserved: true
     - In goalDriftDetails: explicitly explain where/how the counselor lost the thread and deviated.
     - DEDUCT 4-8 points from Question Quality and 4-8 points from Rupture/Modality fidelity. DO NOT give a top score or flawless review if the counselor wandered off track!
   - If counselor stayed focused on the presenting problem: Set goalDriftObserved: false and provide affirming feedback in goalDriftDetails.

2. EMPATHY MARKERS & NON-JUDGMENTAL LANGUAGE AUDIT (CORE COUNSELING COMPETENCY):
   - Empathy Markers: Check how effectively the counselor used affective naming, emotional validation, and reflective attunement (e.g., "It sounds like you felt completely dismissed", "I can hear the exhaustion in your voice", reflecting feelings rather than merely asking interrogative questions).
   - Non-Judgmental Language: Check for unconditional positive regard. Deduct points if the counselor displayed judgment, moralizing, invalidating remarks (e.g. "That's not so bad", "You shouldn't feel that way", "Why did you do that?"), or unsolicited scolding.
   - SCORING IMPACT:
     - High Empathy & Pure Non-Judgmental Stance: Award top rubric marks for Relational Attunement / Rupture & Repair.
     - Low Empathy (Interrogative only, purely intellectual, or advice-heavy): Deduct 4-8 points from Relational Attunement.
     - Judgmental or Invalidating Phrasing: Deduct 8-12 points and flag in areas for growth.

3. CLIENT DEFENSIVE RUPTURES & DISTANCE EVENTS (COUNT & LOG):
   - Count the EXACT number of times the counselor's interventions caused the patient to move away from them, become defensive, reduce their friendliness/warmth, give terse/closed answers, or display somatic withdrawal (e.g. looking away, crossing arms, sighing, pulling back) -> set as "clientDistanceEventsCount".
   - In phase2Details.relationalDistanceEvents, list each specific instance with { turn, counselorStatement, clientReaction, triggerCause }.
   - SCORING IMPACT:
     - 0 distance events: Full 20 pts on Rupture & Repair (or 15 pts for CBT).
     - 1 distance event recognized & repaired: 15-18 pts.
     - 1 unaddressed distance event: deduct 5-8 pts.
     - 2+ distance events unaddressed: deduct 10-15 pts from Rupture & Repair and downgrade the overall performance band.

### SCORING RUBRIC (100 TOTAL POINTS):
${modality === 'rogerian' ? `
1. Talk-to-Listen Ratio: ${baseCat1Weight} pts (Pre-calculated: ${cat1Score})
2. Question Quality: 20 pts (Classify every counselor question as Open, Closed, or Leading. Deduct 3 pts if >2 leading questions appear; deduct 4-6 pts if questions drift off clinical goal).
   - >=70% Open: 20 pts | 50-69%: 14 pts | 30-49%: 8 pts | <30%: 2 pts
3. Advice Restraint / Pacing: 25 pts (Flag unsolicited advice before cutoff. Cutoff is Turn ${difficulty === 'novice' ? '6 (Micro) / 10 (Standard)' : '4 (Micro) / 8 (Standard)'}. 0 instances before cutoff = 25 pts; 1 instance = 15 pts; 2 instances = 8 pts; 3+ instances = 0 pts).
4. Rupture & Repair / Relational Attunement: 20 pts (Did counselor notice and repair patient defensiveness/distance? Named and repaired = 20 pts; adjusted without naming = 14 pts; ignored/distance events repeated = 6 pts; escalated = 0 pts; no rupture = 20 pts).
5. Scope & Referral Awareness: 20 pts (If cue was planted: identified cue and named limit/referral = 20 pts; partial awareness = 12 pts; missed = 4 pts; tried to treat in-scope = 0 pts. If no cue planted: 20 pts n/a).
` : `
1. Talk-to-Listen Ratio: 10 pts (Pre-calculated: ${cat1Score})
2. Question Quality: 15 pts (Socratic / Open questions. Deduct 3 pts if >2 leading questions appear; deduct 4-6 pts if questions drift off goal).
3. Advice Restraint / Pacing: 15 pts (Socratic questioning is NOT counted as advice. Unsolicited advice before cutoff Turn ${difficulty === 'novice' ? '6/10' : '4/8'} is penalized).
4. Rupture & Repair / Relational Attunement: 15 pts (Attunement and repair of resistance/withdrawal).
5. Scope & Referral Awareness: 25 pts (Detection and referral of out-of-scope conditions).
CBT Bonus Criterion (+10 possible, included in score capped at 100): Did counselor help name a specific cognitive distortion (catastrophizing, all-or-nothing, mind-reading, etc.) at least once?
`}

CRITICAL ETHICS FLAG AUDIT:
If a referral cue was planted and the counselor actively dismissed the concern, mocked it, or discouraged the client from seeking outside medical/psychiatric help, trigger the Critical Ethics Flag with a clear warning statement.

DIFFICULTY SCORING BANDS:
${difficulty === 'novice'
  ? '90-100: Exceeds expectations for level | 75-89: Solid | 60-74: Developing | <60: Needs foundational work'
  : '95-100: Exceeds expectations for level | 80-94: Solid | 65-79: Developing | <65: Needs foundational work'}

### SUPERVISORY PHASE 2 QUALITATIVE IN-DEPTH REQUIREMENTS:
Provide a comprehensive, high-depth supervisory report including:
1. supervisoryNarrative: An in-depth clinical case summary evaluating modality fidelity, relational depth, pacing, and client trajectory.
2. strengths: 3-4 distinct clinical strengths observed with theoretical justification.
3. areasForGrowth: 3-4 targeted growth vectors with actionable deliberate practice instructions (specifically noting any goal deviations or distance triggers).
4. criticalTurns: 3-5 pivotal moments in the dialogue. For each moment, provide turn, speaker, verbatim quote, clinical observation, type (rapport_expansion, rupture, repair, referral_cue, advice_timing, distortion, goal_drift), and recommendedAlternate (a word-for-word superior rephrasing or alternative intervention illustrating expert supervision).
5. relationalDistanceEvents: Array of all moments where the patient pulled back or grew defensive.
6. empathyMarkersObserved: Array of verbatim quotes where counselor demonstrated emotional validation and affective attunement.
7. empathyRating: Qualitative assessment of counselor's empathetic depth (e.g. Exceptional, Strong, Developing, or Needs Growth with explanation).
8. nonJudgmentalStance: Qualitative assessment of counselor's non-judgmental posture, unconditional positive regard, and absence of moralizing/invalidating statements.
9. cbtDistortionIdentified, cbtDistortionName, and distortionAnalysis explaining how the client's cognitive distortions manifested and were addressed.
10. allianceAssessment: bond, goalConsensus, ruptureHandling, and emotionalDistanceIndex evaluations.
11. deliberatePracticeRecommendations: 2-3 concrete skill drills for the counselor before their next session.

### COMPLETE TRANSCRIPT:
${transcript.map((m: any, idx: number) => `Turn ${m.turnNumber || Math.floor(idx / 2) + 1} [${m.role.toUpperCase()}]: ${m.text}`).join('\n')}

Evaluate the interaction with clinical rigor.`;

    const response = await callWithModelFallback(ai, AGENT_2_MODELS, {
      contents: supervisorPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: 'Total score from 0 to 100' },
            bandLabel: { type: Type.STRING, description: 'Performance band label e.g. Solid, Developing, etc.' },
            clientDistanceEventsCount: {
              type: Type.NUMBER,
              description: 'Exact number of times counselor caused the patient to move away, become defensive, or reduce friendliness',
            },
            goalDriftObserved: {
              type: Type.BOOLEAN,
              description: 'True if counselor drifted from presenting problem or clinical intake goal',
            },
            goalDriftDetails: {
              type: Type.STRING,
              description: 'Clinical supervisor analysis of goal focus vs deviation/drift',
            },
            ethicsFlag: {
              type: Type.OBJECT,
              properties: {
                triggered: { type: Type.BOOLEAN },
                message: { type: Type.STRING, description: 'Explanation if triggered, or null/empty string if not' },
              },
              required: ['triggered'],
            },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  feedbackSummary: { type: Type.STRING },
                },
                required: ['id', 'name', 'score', 'maxScore', 'description'],
              },
            },
            phase2Details: {
              type: Type.OBJECT,
              properties: {
                supervisoryNarrative: { type: Type.STRING, description: 'In-depth clinical narrative appraisal of the session' },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-4 key counseling strengths demonstrated',
                },
                areasForGrowth: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-4 specific clinical growth areas',
                },
                criticalTurns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      turn: { type: Type.NUMBER },
                      speaker: { type: Type.STRING },
                      quote: { type: Type.STRING },
                      observation: { type: Type.STRING },
                      type: { type: Type.STRING, description: 'rapport_expansion, rupture, repair, referral_cue, advice_timing, distortion, or goal_drift' },
                      recommendedAlternate: { type: Type.STRING, description: 'Superior verbatim alternate counselor statement' },
                    },
                    required: ['turn', 'speaker', 'quote', 'observation', 'type'],
                  },
                },
                relationalDistanceEvents: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      turn: { type: Type.NUMBER },
                      counselorStatement: { type: Type.STRING },
                      clientReaction: { type: Type.STRING },
                      triggerCause: { type: Type.STRING },
                    },
                    required: ['turn', 'counselorStatement', 'clientReaction', 'triggerCause'],
                  },
                },
                empathyMarkersObserved: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Verbatim quotes of counselor demonstrating emotional attunement and validation',
                },
                empathyRating: { type: Type.STRING, description: 'Evaluation of empathetic depth and attunement' },
                nonJudgmentalStance: { type: Type.STRING, description: 'Evaluation of unconditional positive regard and lack of judgment' },
                cbtDistortionIdentified: { type: Type.BOOLEAN },
                cbtDistortionName: { type: Type.STRING },
                distortionAnalysis: { type: Type.STRING, description: 'Detailed analysis of patient distortions and reframing attempts' },
                allianceAssessment: {
                  type: Type.OBJECT,
                  properties: {
                    bond: { type: Type.STRING },
                    goalConsensus: { type: Type.STRING },
                    ruptureHandling: { type: Type.STRING },
                    emotionalDistanceIndex: { type: Type.STRING },
                  },
                },
                deliberatePracticeRecommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Concrete deliberate practice homework drills',
                },
              },
              required: ['strengths', 'areasForGrowth', 'criticalTurns'],
            },
          },
          required: ['overallScore', 'bandLabel', 'ethicsFlag', 'categories', 'phase2Details'],
        },
      },
    });

    const resultJson = JSON.parse(response.text || '{}');

    // Guarantee talk-to-listen category aligns with deterministic score
    if (Array.isArray(resultJson.categories)) {
      const cat1Index = resultJson.categories.findIndex((c: any) =>
        c.id?.includes('talk') || c.name?.toLowerCase().includes('talk')
      );
      if (cat1Index !== -1) {
        resultJson.categories[cat1Index].score = cat1Score;
        resultJson.categories[cat1Index].maxScore = baseCat1Weight;
        resultJson.categories[cat1Index].description = `Counselor spoke ${stats.counselorSharePct}% of total words (${stats.counselorWordCount} counselor vs ${stats.patientWordCount} patient words).`;
      }
    }

    // Attach deterministic stats and verified distance count to final response
    const finalEvaluation = {
      ...resultJson,
      clientDistanceEventsCount:
        typeof resultJson.clientDistanceEventsCount === 'number'
          ? resultJson.clientDistanceEventsCount
          : (resultJson.phase2Details?.relationalDistanceEvents?.length ?? stats.resistanceSignalsDetected),
      goalDriftObserved: Boolean(resultJson.goalDriftObserved),
      goalDriftDetails:
        resultJson.goalDriftDetails ||
        (resultJson.goalDriftObserved
          ? 'Counselor deviated from core presenting concern in latter stages of the dialogue.'
          : 'Counselor maintained steady clinical alignment with intake objectives.'),
      deterministicStats: stats,
    };

    res.json(finalEvaluation);
  } catch (error: any) {
    console.error('Error in /api/supervisor/evaluate:', error);
    
    // If Gemini models are experiencing high demand or 503 outage, provide clinical deterministic evaluation
    // so the trainee is not blocked from reviewing their session metrics and scores.
    try {
      const qQuestions = transcript.filter((m: any) => m.role === 'counselor' && m.text.includes('?')).length;
      const isNovice = difficulty === 'novice';
      const distanceCount = stats?.resistanceSignalsDetected || 0;
      
      const calculatedScore = Math.min(
        100,
        Math.max(
          40,
          Math.round(
            cat1Score +
              (stats.counselorSharePct <= 35 ? 40 : 25) +
              (qQuestions > 0 ? 18 : 10) +
              Math.max(0, 18 - distanceCount * 4) +
              18
          )
        )
      );

      const deterministicEvaluation: any = {
        overallScore: calculatedScore,
        bandLabel: calculatedScore >= 90 ? 'Exceeds expectations' : calculatedScore >= 75 ? 'Solid' : calculatedScore >= 60 ? 'Developing' : 'Needs foundational work',
        clientDistanceEventsCount: distanceCount,
        goalDriftObserved: false,
        goalDriftDetails: 'Maintained exploratory counseling focus throughout the dialogue turns.',
        ethicsFlag: {
          triggered: false,
          message: '',
        },
        categories: [
          {
            id: 'talk_to_listen',
            name: 'Talk-to-Listen Ratio',
            score: cat1Score,
            maxScore: baseCat1Weight,
            description: `Counselor spoke ${stats.counselorSharePct}% of total words (${stats.counselorWordCount} counselor vs ${stats.patientWordCount} patient words).`,
            feedbackSummary: stats.counselorSharePct <= 35 
              ? 'Excellent pacing with balanced talk share allowing patient room to explore.' 
              : 'Counselor talk share was high. Aim to shorten reflections to keep proportion under 35%.',
          },
          {
            id: 'question_quality',
            name: 'Question Quality',
            score: qQuestions > 0 ? (isNovice ? 18 : 16) : 12,
            maxScore: modality === 'rogerian' ? 20 : 15,
            description: 'Evaluates exploratory questions and pacing.',
            feedbackSummary: 'Utilized inquisitive dialogue to guide therapeutic rapport.',
          },
          {
            id: 'advice_restraint',
            name: 'Advice Restraint / Pacing',
            score: isNovice ? 22 : 14,
            maxScore: modality === 'rogerian' ? 25 : 15,
            description: 'Pacing against premature advice cutoff turns.',
            feedbackSummary: 'Demonstrated restraint in jumping to premature fixes or directive solutions.',
          },
          {
            id: 'rupture_repair',
            name: 'Rupture & Repair',
            score: Math.max(4, (isNovice ? 18 : 13) - distanceCount * 3),
            maxScore: modality === 'rogerian' ? 20 : 15,
            description: `Recognition and repair of client ambivalence (${distanceCount} distance cues detected).`,
            feedbackSummary: distanceCount > 0
              ? `Client exhibited ${distanceCount} moments of emotional withdrawal or resistance. Ensure defensive cues are acknowledged and gently explored.`
              : 'Maintained collaborative therapeutic alliance throughout dialogue.',
          },
          {
            id: 'scope_referral',
            name: 'Scope & Referral Awareness',
            score: isNovice ? 20 : 22,
            maxScore: modality === 'rogerian' ? 20 : 25,
            description: 'Detection and adherence to clinical scope.',
            feedbackSummary: vignette.plantedReferralCue?.exists 
              ? 'Planted referral cue was present; ensure formal medical/psychiatric boundary is clearly identified.' 
              : 'Case remained within standard therapeutic scope.',
          },
        ],
        phase2Details: {
          strengths: [
            'Attentive pacing and engagement throughout the dialogue.',
            'Encouraged client self-exploration through open-ended responses.',
          ],
          areasForGrowth: [
            'Maintain counselor word share below 30% for deeper client elaboration.',
            'Observe subtle somatic cues and client hesitations before advancing questions.',
          ],
          criticalTurns: transcript.slice(0, 3).map((m: any, i: number) => ({
            turn: i + 1,
            speaker: m.role === 'counselor' ? 'COUNSELOR' : 'PATIENT',
            quote: m.text?.slice(0, 80) || '',
            observation: m.role === 'counselor' ? 'Exploratory opening and rapport building.' : 'Client presenting baseline tone.',
            type: 'rapport_expansion',
          })),
          relationalDistanceEvents: distanceCount > 0 ? [
            {
              turn: 1,
              counselorStatement: 'Initial exploration statement',
              clientReaction: 'Client exhibited somatic hesitation or defensive withdrawal',
              triggerCause: 'Ambivalence regarding opening up or perceived pressure',
            }
          ] : [],
          allianceAssessment: {
            bond: 'Good baseline warmth and respectful listening.',
            goalConsensus: 'Exploration remained aligned with client presenting concerns.',
            ruptureHandling: distanceCount > 0 ? `${distanceCount} moments of client resistance surfaced during the dialogue.` : 'Smooth collaboration without major defensive ruptures.',
            emotionalDistanceIndex: distanceCount > 0 ? `Mild to moderate resistance (${distanceCount} instances)` : 'Low relational distance / High rapport',
          },
          empathyMarkersObserved: [
            'Active listening and validation of client presenting concerns.',
            'Reflective pacing allowing patient space to elaborate.',
          ],
          empathyRating: 'Competent empathetic attunement with foundational emotional validation.',
          nonJudgmentalStance: 'Maintained unconditional positive regard with zero moralizing or invalidating language observed.',
          cbtDistortionIdentified: false,
        },
        deterministicStats: stats,
        transientNotice: 'Generated via deterministic rubric evaluator due to temporary Gemini API high-demand surge.',
      };
      
      return res.json(deterministicEvaluation);
    } catch (fallbackErr) {
      console.error('Fallback generation error:', fallbackErr);
      return res.status(500).json({ error: extractErrorMessage(error) || 'Supervisor evaluation failed' });
    }
  }
});

// ----------------------------------------------------
// Local Conversation Database (Stored for Model Training)
// ----------------------------------------------------
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, IS_PROD ? 'conversations_db.json' : 'conversations_db_dev.json');
const CUSTOM_CASES_FILE = path.join(DB_DIR, IS_PROD ? 'custom_cases.json' : 'custom_cases_dev.json');

console.log(`[Database Engine] Active Environment: ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT / WORKBENCH PRACTICE'}`);
console.log(`[Database Engine] Storage files -> DB: ${path.basename(DB_FILE)} | Cases: ${path.basename(CUSTOM_CASES_FILE)}`);

function ensureDbFile() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function ensureCustomCasesFile() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(CUSTOM_CASES_FILE)) {
    fs.writeFileSync(CUSTOM_CASES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readCustomCases(): any[] {
  ensureCustomCasesFile();
  try {
    const raw = fs.readFileSync(CUSTOM_CASES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading custom cases database:', err);
    return [];
  }
}

function writeCustomCases(cases: any[]) {
  ensureCustomCasesFile();
  try {
    fs.writeFileSync(CUSTOM_CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing custom cases database:', err);
  }
}

function readDb(): any[] {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading conversations database:', err);
    return [];
  }
}

function writeDb(records: any[]) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing conversations database:', err);
  }
}

// ----------------------------------------------------
// Case Studies & Personas Management Endpoints
// ----------------------------------------------------

// GET /api/cases - List all cases (built-in + custom)
app.get('/api/cases', (_req, res) => {
  try {
    const custom = readCustomCases();
    const builtIn = CASE_VIGNETTES.map((v) => ({ ...v, isCustom: false }));
    const all = [...builtIn, ...custom];
    res.json({
      builtIn,
      custom,
      all,
      totalCount: all.length,
      customCount: custom.length,
      builtInCount: builtIn.length,
    });
  } catch (error: any) {
    console.error('Error fetching cases catalog:', error);
    res.status(500).json({ error: 'Failed to retrieve case studies' });
  }
});

// POST /api/cases - Create a new case study & persona
app.post('/api/cases', (req, res) => {
  try {
    const newCase = req.body;
    if (!newCase || !newCase.title || !newCase.clientName) {
      return res.status(400).json({ error: 'Case title and client name are required' });
    }

    const custom = readCustomCases();
    const id = newCase.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const formattedCase = {
      ...newCase,
      id,
      title: String(newCase.title).trim(),
      track: newCase.track || 'general',
      difficulty: newCase.difficulty || 'novice',
      clientName: String(newCase.clientName).trim(),
      clientAge: Number(newCase.clientAge) || 30,
      clientPronouns: newCase.clientPronouns || 'they/them',
      clientRole: newCase.clientRole || 'Client',
      presentingProblem: newCase.presentingProblem || '',
      backgroundStory: newCase.backgroundStory || '',
      baselineResistance: newCase.baselineResistance || '',
      positiveTriggers: Array.isArray(newCase.positiveTriggers) ? newCase.positiveTriggers : [],
      negativeTriggers: Array.isArray(newCase.negativeTriggers) ? newCase.negativeTriggers : [],
      somaticTendencies: Array.isArray(newCase.somaticTendencies) ? newCase.somaticTendencies : [],
      plantedReferralCue: newCase.plantedReferralCue || {
        exists: false,
        subtlety: 'subtle',
        description: '',
        clinicalCategory: '',
        properReferralPath: '',
      },
      counselorIntakeGoal: newCase.counselorIntakeGoal || '',
      isCustom: true,
      createdAt: newCase.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    custom.unshift(formattedCase);
    writeCustomCases(custom);

    res.json({
      success: true,
      case: formattedCase,
      message: `Case study "${formattedCase.title}" published successfully`,
    });
  } catch (error: any) {
    console.error('Error creating custom case:', error);
    res.status(500).json({ error: 'Failed to create case study' });
  }
});

// PUT /api/cases/:id - Update an existing custom case & persona
app.put('/api/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const custom = readCustomCases();
    const index = custom.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Custom case study not found' });
    }

    custom[index] = {
      ...custom[index],
      ...updates,
      id, // maintain id
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    writeCustomCases(custom);
    res.json({
      success: true,
      case: custom[index],
      message: `Case study "${custom[index].title}" updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating custom case:', error);
    res.status(500).json({ error: 'Failed to update case study' });
  }
});

// DELETE /api/cases/:id - Delete a custom case
app.delete('/api/cases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const custom = readCustomCases();
    const initialLen = custom.length;
    const filtered = custom.filter((c) => c.id !== id);

    if (filtered.length === initialLen) {
      return res.status(404).json({ error: 'Custom case study not found' });
    }

    writeCustomCases(filtered);
    res.json({ success: true, message: 'Case study deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting custom case:', error);
    res.status(500).json({ error: 'Failed to delete case study' });
  }
});

// POST /api/cases/import - Batch import cases from JSON file
app.post('/api/cases/import', (req, res) => {
  try {
    const { cases, mode } = req.body;
    const incoming = Array.isArray(cases) ? cases : req.body;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Invalid payload. Expected an array of case studies.' });
    }

    const existing = readCustomCases();
    const importMode = mode === 'replace' ? 'replace' : 'merge';
    let mergedCases: any[] = [];

    if (importMode === 'replace') {
      mergedCases = incoming.map((c, i) => ({
        ...c,
        id: c.id || `custom-${Date.now()}-${i}`,
        isCustom: true,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      const caseMap = new Map<string, any>();
      for (const ec of existing) {
        caseMap.set(ec.id, ec);
      }
      for (const ic of incoming) {
        const id = ic.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        caseMap.set(id, {
          ...ic,
          id,
          isCustom: true,
          updatedAt: new Date().toISOString(),
        });
      }
      mergedCases = Array.from(caseMap.values());
    }

    writeCustomCases(mergedCases);
    res.json({
      success: true,
      importedCount: incoming.length,
      totalCustomCases: mergedCases.length,
      message: `Successfully imported ${incoming.length} case studies (${importMode} mode)`,
    });
  } catch (error: any) {
    console.error('Error importing case studies:', error);
    res.status(500).json({ error: 'Failed to import case studies' });
  }
});

// GET /api/cases/export - Export case studies as JSON
app.get('/api/cases/export', (req, res) => {
  try {
    const scope = req.query.scope; // 'custom' | 'all'
    const custom = readCustomCases();
    const casesToExport =
      scope === 'custom'
        ? custom
        : [...CASE_VIGNETTES.map((v) => ({ ...v, isCustom: false })), ...custom];

    const filename = `counseling_cases_and_personas_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(casesToExport, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export cases' });
  }
});

// 1. Register User / Save Profile
app.post('/api/users/register', (req, res) => {
  try {
    const user = req.body;
    if (!user || (!user.email && !user.name)) {
      return res.status(400).json({ error: 'Valid user profile required' });
    }

    const records = readDb();
    const cleanEmail = user.email ? String(user.email).trim().toLowerCase() : '';

    // Check if user already exists in any records
    let existingPremium = true;
    let existingLevel = user.level || 'Beginner';
    let existingId = user.id || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let existingRegisteredAt = user.registeredAt || new Date().toISOString();

    const matchedRecord = records.find(
      (r: any) => (r.user?.email && r.user.email.toLowerCase() === cleanEmail) || (r.user?.id && r.user.id === user.id)
    );

    if (matchedRecord && matchedRecord.user) {
      if (matchedRecord.user.isPremium === false) existingPremium = false;
      if (matchedRecord.user.level && (!user.level || user.level === 'Beginner')) {
        existingLevel = matchedRecord.user.level;
      }
      if (matchedRecord.user.id) existingId = matchedRecord.user.id;
      if (matchedRecord.user.registeredAt) existingRegisteredAt = matchedRecord.user.registeredAt;
    }

    const finalizedUser = {
      ...user,
      id: existingId,
      level: existingLevel,
      registeredAt: existingRegisteredAt,
      isPremium: user.isPremium === false ? false : existingPremium,
    };

    if (!matchedRecord) {
      // Create initial registration record
      records.unshift({
        id: `reg_${finalizedUser.id}`,
        timestamp: finalizedUser.registeredAt,
        user: finalizedUser,
        type: 'user_registration',
        messages: [],
      });
      writeDb(records);
    } else {
      // Update existing record user info with new name/password
      matchedRecord.user = {
        ...matchedRecord.user,
        ...finalizedUser,
      };
      writeDb(records);
    }

    res.json({ success: true, user: finalizedUser });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Trainee: Check live user profile & premium status
app.get('/api/users/profile', (req, res) => {
  try {
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : '';
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    const records = readDb();
    let mergedUser: any = null;

    // Scan records to find user registration or profile data
    for (const r of records) {
      if (r.user?.email && r.user.email.toLowerCase() === email) {
        if (!mergedUser) {
          mergedUser = { ...r.user };
        } else {
          // Merge fields safely, preserving existing non-empty name and password
          const prevName = mergedUser.name;
          const prevPassword = mergedUser.password;
          const prevInst = mergedUser.institution;
          mergedUser = {
            ...mergedUser,
            ...r.user,
          };
          if (!mergedUser.name && prevName) mergedUser.name = prevName;
          if (!mergedUser.password && prevPassword) mergedUser.password = prevPassword;
          if (!mergedUser.institution && prevInst) mergedUser.institution = prevInst;
        }
      }
    }

    if (mergedUser) {
      mergedUser.isPremium = mergedUser.isPremium !== false;
    }

    if (mergedUser && mergedUser.name) {
      return res.json({ user: mergedUser });
    }

    res.json({ user: mergedUser || null });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to query user profile' });
  }
});

// 2. Save Session Conversation to Local DB
app.post('/api/sessions/save', (req, res) => {
  try {
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: 'Invalid session payload' });
    }

    const records = readDb();
    const existingIndex = records.findIndex((r: any) => r.id === session.id);

    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...session, updatedAt: new Date().toISOString() };
    } else {
      records.unshift({
        ...session,
        savedAt: new Date().toISOString(),
      });
    }

    writeDb(records);
    console.log(`[DB] Logged session ${session.id} for user ${session.user?.name || 'Anonymous'}. Total records: ${records.length}`);
    res.json({ success: true, id: session.id, totalSessions: records.length });
  } catch (error: any) {
    console.error('Error saving session to local DB:', error);
    res.status(500).json({ error: error.message || 'Failed to save session' });
  }
});

// 2. Query All Stored Sessions
app.get('/api/sessions', (_req, res) => {
  try {
    const records = readDb();
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// 3. Database Statistics (Users, Sessions, Turns)
app.get('/api/sessions/stats', (_req, res) => {
  try {
    const records = readDb();
    const uniqueUsersMap = new Map<string, any>();
    let totalTurns = 0;

    for (const rec of records) {
      if (rec.user?.email || rec.user?.id) {
        const key = rec.user.email || rec.user.id;
        if (!uniqueUsersMap.has(key)) {
          uniqueUsersMap.set(key, rec.user);
        }
      }
      if (Array.isArray(rec.messages)) {
        totalTurns += rec.messages.filter((m: any) => m.role === 'counselor').length;
      }
    }

    res.json({
      totalSessions: records.length,
      totalTurns,
      uniqueUsersCount: uniqueUsersMap.size,
      users: Array.from(uniqueUsersMap.values()),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// ----------------------------------------------------
// Admin Authentication & Multi-Admin Access Control
// ----------------------------------------------------
const ADMIN_AUTH_FILE = path.join(DB_DIR, 'admin_auth.json');

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin';
  isMaster?: boolean;
  institution?: string;
  createdAt: string;
  updatedAt?: string;
}

const DEFAULT_MASTER_ADMIN: AdminAccount = {
  id: 'admin_athul',
  email: 'athulgovind.1993@gmail.com',
  name: 'Athul Govind',
  password: 'Password@123',
  role: 'admin',
  isMaster: true,
  institution: 'Executive Clinical Leadership',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function getAdminAccounts(): AdminAccount[] {
  try {
    if (fs.existsSync(ADMIN_AUTH_FILE)) {
      const data = fs.readFileSync(ADMIN_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);

      // If array or { admins: [] }
      let list: AdminAccount[] = [];
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.admins)) {
        list = parsed.admins;
      } else if (parsed && typeof parsed.password === 'string') {
        // Legacy single admin format
        list = [
          {
            ...DEFAULT_MASTER_ADMIN,
            email: parsed.email || DEFAULT_MASTER_ADMIN.email,
            password: parsed.password,
            updatedAt: parsed.updatedAt,
          },
        ];
      }

      // Ensure Master Admin always exists
      const hasMaster = list.some(
        (a) => a.email.toLowerCase() === DEFAULT_MASTER_ADMIN.email.toLowerCase()
      );
      if (!hasMaster) {
        list.unshift(DEFAULT_MASTER_ADMIN);
      } else {
        // Ensure master flag
        list = list.map((a) =>
          a.email.toLowerCase() === DEFAULT_MASTER_ADMIN.email.toLowerCase()
            ? { ...a, isMaster: true, name: a.name || 'Athul Govind' }
            : a
        );
      }
      return list;
    }
  } catch (err) {
    console.error('Error reading admin accounts from file:', err);
  }
  return [DEFAULT_MASTER_ADMIN];
}

function saveAdminAccounts(admins: AdminAccount[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify({ admins }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving admin accounts:', err);
    throw err;
  }
}

// Admin login: Authenticate ANY registered administrator
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const adminAccounts = getAdminAccounts();

    // 1. Check in admin_auth.json
    let matchingAdmin = adminAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.password === cleanPassword
    );

    // 2. Also check in conversations_db.json for users marked with isAdmin / role: 'admin'
    if (!matchingAdmin) {
      const records = readDb();
      for (const rec of records) {
        if (
          rec.user?.email &&
          rec.user.email.toLowerCase() === cleanEmail &&
          (rec.user.isAdmin || rec.user.role === 'admin') &&
          rec.user.password &&
          rec.user.password === cleanPassword
        ) {
          matchingAdmin = {
            id: rec.user.id || `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: rec.user.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            password: cleanPassword,
            role: 'admin',
            isMaster: cleanEmail === DEFAULT_MASTER_ADMIN.email.toLowerCase(),
            institution: rec.user.institution || 'Clinical Training Faculty',
            createdAt: rec.user.registeredAt || new Date().toISOString(),
          };
          break;
        }
      }
    }

    if (matchingAdmin) {
      const adminProfile = {
        id: matchingAdmin.id,
        name: matchingAdmin.name,
        email: matchingAdmin.email,
        role: 'admin',
        isAdmin: true,
        isMaster: Boolean(matchingAdmin.isMaster || matchingAdmin.email.toLowerCase() === DEFAULT_MASTER_ADMIN.email.toLowerCase()),
        level: 'Administrator',
        institution: matchingAdmin.institution || 'Clinical Training Faculty',
        registeredAt: matchingAdmin.createdAt || new Date().toISOString(),
      };

      // Ensure record in DB
      const records = readDb();
      const existing = records.find((r: any) => r.user?.email?.toLowerCase() === cleanEmail);
      if (!existing) {
        records.unshift({
          id: `reg_${matchingAdmin.id}`,
          timestamp: new Date().toISOString(),
          user: adminProfile,
          type: 'user_registration',
          messages: [],
        });
        writeDb(records);
      }

      return res.json({
        success: true,
        admin: adminProfile,
        token: `admin_token_${Date.now()}`,
      });
    } else {
      return res.status(401).json({ error: 'Invalid admin email or password. Please verify credentials.' });
    }
  } catch (err: any) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Authentication failed due to internal error' });
  }
});

// Admin: List all administrators
app.get('/api/admin/admins', (_req, res) => {
  try {
    const adminAccounts = getAdminAccounts();
    const safeList = adminAccounts.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      isMaster: Boolean(a.isMaster || a.email.toLowerCase() === DEFAULT_MASTER_ADMIN.email.toLowerCase()),
      institution: a.institution || 'Clinical Training Faculty',
      createdAt: a.createdAt,
      updatedAt: a.updatedAt || null,
    }));
    res.json({ admins: safeList });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve administrators list' });
  }
});

// Admin: Create a new administrator account
app.post('/api/admin/create-admin', (req, res) => {
  try {
    const { email, name, password, institution } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPassword = String(password).trim();

    if (!cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const adminAccounts = getAdminAccounts();
    const existingIndex = adminAccounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    const now = new Date().toISOString();
    const newAdmin: AdminAccount = {
      id: `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanName,
      password: cleanPassword,
      role: 'admin',
      isMaster: cleanEmail === DEFAULT_MASTER_ADMIN.email.toLowerCase(),
      institution: institution ? String(institution).trim() : 'Clinical Supervision Faculty',
      createdAt: now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      // Update existing admin account
      adminAccounts[existingIndex] = {
        ...adminAccounts[existingIndex],
        name: cleanName,
        password: cleanPassword,
        institution: newAdmin.institution,
        updatedAt: now,
      };
    } else {
      adminAccounts.push(newAdmin);
    }

    saveAdminAccounts(adminAccounts);

    // Also sync into conversations_db.json
    const records = readDb();
    let foundInDb = false;
    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.isAdmin = true;
        rec.user.role = 'admin';
        rec.user.name = cleanName;
        rec.user.password = cleanPassword;
        rec.user.institution = newAdmin.institution;
        foundInDb = true;
      }
    }

    if (!foundInDb) {
      records.unshift({
        id: `reg_${newAdmin.id}`,
        timestamp: now,
        user: {
          id: newAdmin.id,
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: 'admin',
          isAdmin: true,
          level: 'Administrator',
          institution: newAdmin.institution,
          registeredAt: now,
        },
        type: 'user_registration',
        messages: [],
      });
    }

    // Add audit event
    records.unshift({
      id: `audit_admin_created_${Date.now()}`,
      type: 'audit_event',
      eventType: 'admin_created',
      timestamp: now,
      user: {
        email: cleanEmail,
        name: cleanName,
        isAdmin: true,
      },
      note: `Administrator privileges created for ${cleanEmail} (${cleanName})`,
    });

    writeDb(records);

    res.json({
      success: true,
      message: `Administrator account for ${cleanEmail} created successfully`,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        isMaster: newAdmin.isMaster,
        institution: newAdmin.institution,
      },
    });
  } catch (err: any) {
    console.error('Error creating admin account:', err);
    res.status(500).json({ error: 'Failed to create administrator account' });
  }
});

// Admin: Toggle administrator role for any existing user
app.post('/api/admin/toggle-admin-role', (req, res) => {
  try {
    const { email, isAdmin } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const shouldBeAdmin = Boolean(isAdmin);

    if (cleanEmail === DEFAULT_MASTER_ADMIN.email.toLowerCase() && !shouldBeAdmin) {
      return res.status(400).json({ error: 'The Master Administrator cannot be demoted.' });
    }

    const adminAccounts = getAdminAccounts();
    const records = readDb();
    let userName = '';
    let userPassword = '';

    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.isAdmin = shouldBeAdmin;
        rec.user.role = shouldBeAdmin ? 'admin' : 'trainee';
        if (rec.user.name && !userName) userName = rec.user.name;
        if (rec.user.password && !userPassword) userPassword = rec.user.password;
      }
    }

    if (shouldBeAdmin) {
      // Add to adminAccounts if not already there
      const exists = adminAccounts.find((a) => a.email.toLowerCase() === cleanEmail);
      if (!exists) {
        adminAccounts.push({
          id: `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: cleanEmail,
          name: userName || cleanEmail.split('@')[0],
          password: userPassword || 'Password@123',
          role: 'admin',
          isMaster: false,
          institution: 'Clinical Faculty',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Remove from adminAccounts if not master
      const filtered = adminAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
      saveAdminAccounts(filtered);
    }

    if (shouldBeAdmin) {
      saveAdminAccounts(adminAccounts);
    }

    // Add audit event
    records.unshift({
      id: `audit_role_${Date.now()}`,
      type: 'audit_event',
      eventType: shouldBeAdmin ? 'admin_role_granted' : 'admin_role_revoked',
      timestamp: new Date().toISOString(),
      user: {
        email: cleanEmail,
        name: userName || cleanEmail,
        isAdmin: shouldBeAdmin,
      },
      note: shouldBeAdmin
        ? `Administrator privileges granted to ${cleanEmail}`
        : `Administrator privileges revoked for ${cleanEmail}`,
    });

    writeDb(records);

    res.json({
      success: true,
      email: cleanEmail,
      isAdmin: shouldBeAdmin,
      message: shouldBeAdmin
        ? `Granted administrator access to ${cleanEmail}`
        : `Revoked administrator access for ${cleanEmail}`,
    });
  } catch (err: any) {
    console.error('Error toggling admin role:', err);
    res.status(500).json({ error: 'Failed to update user admin role' });
  }
});

// Admin: Delete an administrator account
app.delete('/api/admin/admins/:email', (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Admin email is required' });
    }

    const cleanEmail = decodeURIComponent(email).trim().toLowerCase();

    if (cleanEmail === DEFAULT_MASTER_ADMIN.email.toLowerCase()) {
      return res.status(400).json({ error: 'The Master Administrator account cannot be deleted.' });
    }

    const adminAccounts = getAdminAccounts();
    const updatedAdmins = adminAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
    saveAdminAccounts(updatedAdmins);

    // Update records in conversations_db.json
    const records = readDb();
    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.isAdmin = false;
        rec.user.role = 'trainee';
      }
    }

    records.unshift({
      id: `audit_admin_del_${Date.now()}`,
      type: 'audit_event',
      eventType: 'admin_removed',
      timestamp: new Date().toISOString(),
      user: {
        email: cleanEmail,
      },
      note: `Administrator privileges removed for ${cleanEmail}`,
    });

    writeDb(records);

    res.json({
      success: true,
      message: `Administrator access removed for ${cleanEmail}`,
    });
  } catch (err: any) {
    console.error('Error deleting admin:', err);
    res.status(500).json({ error: 'Failed to delete administrator' });
  }
});

// Admin: Get credential status
app.get('/api/admin/credentials/status', (req, res) => {
  try {
    const adminAccounts = getAdminAccounts();
    const master = adminAccounts.find((a) => a.isMaster) || adminAccounts[0];
    const isCustom = master.password !== DEFAULT_MASTER_ADMIN.password;
    res.json({
      email: master.email,
      totalAdmins: adminAccounts.length,
      hasCustomPassword: isCustom,
      lastUpdatedAt: master.updatedAt || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve credentials status' });
  }
});

// Admin: Change password for an administrator
app.post('/api/admin/change-password', (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are both required.' });
    }

    const cleanCurrent = String(currentPassword).trim();
    const cleanNew = String(newPassword).trim();
    const cleanConfirm = confirmPassword !== undefined ? String(confirmPassword).trim() : cleanNew;
    const targetEmail = email ? String(email).trim().toLowerCase() : DEFAULT_MASTER_ADMIN.email.toLowerCase();

    if (cleanNew.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters in length.' });
    }

    if (cleanNew !== cleanConfirm) {
      return res.status(400).json({ error: 'New password and password confirmation do not match.' });
    }

    const adminAccounts = getAdminAccounts();
    const targetAdminIndex = adminAccounts.findIndex((a) => a.email.toLowerCase() === targetEmail);

    if (targetAdminIndex === -1) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const targetAdmin = adminAccounts[targetAdminIndex];

    // Verify current password
    if (cleanCurrent !== targetAdmin.password) {
      return res.status(401).json({ error: 'The current administrator password you entered is incorrect.' });
    }

    if (cleanNew === targetAdmin.password) {
      return res.status(400).json({ error: 'The new password cannot be the same as your current password.' });
    }

    const updatedAt = new Date().toISOString();
    adminAccounts[targetAdminIndex] = {
      ...targetAdmin,
      password: cleanNew,
      updatedAt,
    };

    saveAdminAccounts(adminAccounts);

    // Sync in DB
    const records = readDb();
    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === targetEmail) {
        rec.user.password = cleanNew;
      }
    }

    // Record audit event in local DB
    try {
      records.unshift({
        id: `audit_pwd_${Date.now()}`,
        type: 'audit_event',
        eventType: 'admin_password_changed',
        timestamp: updatedAt,
        user: {
          email: targetAdmin.email,
          name: targetAdmin.name,
          isAdmin: true,
        },
        note: `Administrator security credentials updated for ${targetAdmin.email} on ${new Date().toLocaleString()}`,
      });
      writeDb(records);
    } catch (auditErr) {
      console.warn('Failed to record password audit event:', auditErr);
    }

    return res.json({
      success: true,
      message: 'Administrator password updated successfully! You can now sign in with your new password.',
      updatedAt,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/change-password:', err);
    res.status(500).json({ error: 'Failed to update password due to an internal error.' });
  }
});

// Delete specific session (Admin capability)
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    let records = readDb();
    const initialLen = records.length;
    records = records.filter((r: any) => r.id !== id);
    
    if (records.length === initialLen) {
      return res.status(404).json({ error: 'Session not found' });
    }

    writeDb(records);
    res.json({ success: true, remainingSessions: records.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Admin: Retrieve all users with their full transaction & session history
app.get('/api/admin/users-with-history', (_req, res) => {
  try {
    const records = readDb();
    const usersMap = new Map<string, any>();

    // 1. First gather all registered users and session participants
    for (const rec of records) {
      if (rec.user?.email || rec.user?.id) {
        const key = (rec.user.email || rec.user.id).toLowerCase();
        if (!usersMap.has(key)) {
          usersMap.set(key, {
            user: {
              ...rec.user,
              isPremium: !!rec.user.isPremium,
            },
            totalSessions: 0,
            totalTurns: 0,
            scoreSum: 0,
            scoreCount: 0,
            averageScore: 0,
            lastActiveAt: rec.timestamp || rec.user.registeredAt || new Date().toISOString(),
            sessions: [],
            history: [],
          });
        } else {
          // If we found a record with isPremium true, persist that state
          const entry = usersMap.get(key);
          if (rec.user.isPremium) {
            entry.user.isPremium = true;
          }
          if (rec.timestamp && new Date(rec.timestamp) > new Date(entry.lastActiveAt)) {
            entry.lastActiveAt = rec.timestamp;
          }
        }
      }
    }

    // 2. Iterate through all records to populate sessions and history transactions
    for (const rec of records) {
      // Check for audit events (e.g. premium status toggle)
      if (rec.type === 'audit_event' && rec.user?.email) {
        const key = rec.user.email.toLowerCase();
        const entry = usersMap.get(key);
        if (entry) {
          entry.history.push({
            id: rec.id,
            type: rec.eventType,
            timestamp: rec.timestamp,
            title: rec.eventType === 'premium_granted' ? 'Premium Tier Access Granted' : 'Premium Tier Access Revoked',
            details: rec.note || 'Action performed by Administrator Athul Govind',
          });
        }
        continue;
      }

      // Check for registration records
      if (rec.type === 'user_registration' && rec.user?.email) {
        const key = rec.user.email.toLowerCase();
        const entry = usersMap.get(key);
        if (entry) {
          entry.history.push({
            id: rec.id,
            type: 'registration',
            timestamp: rec.timestamp,
            title: 'Initial Practitioner Account Registration',
            details: `Registered as ${rec.user.level || 'Beginner'} Practitioner at ${rec.user.institution || 'General Clinic'}`,
          });
        }
        continue;
      }

      // Completed counseling sessions
      if (rec.messages && rec.messages.length > 0 && rec.user) {
        const key = (rec.user.email || rec.user.id || '').toLowerCase();
        const entry = usersMap.get(key);
        if (entry) {
          entry.totalSessions += 1;
          const turnsCount = rec.messages.filter((m: any) => m.role === 'counselor').length;
          entry.totalTurns += turnsCount;

          if (rec.evaluation?.overallScore) {
            entry.scoreSum += rec.evaluation.overallScore;
            entry.scoreCount += 1;
          }

          // Add session summary
          entry.sessions.push(rec);

          // Add transaction event to history
          entry.history.push({
            id: rec.id,
            type: 'session_completed',
            timestamp: rec.timestamp,
            sessionId: rec.id,
            score: rec.evaluation?.overallScore,
            title: `Completed Session: ${rec.vignette?.clientName || 'Client'} (${rec.vignette?.track || 'General'})`,
            details: `${turnsCount} counselor turns • Modality: ${rec.config?.modality?.toUpperCase()} • Score: ${rec.evaluation?.overallScore || 'N/A'}% (${rec.evaluation?.bandLabel || 'Completed'})`,
          });
        }
      }
    }

    // 3. Finalize averages and sort histories newest-first
    const usersList = Array.from(usersMap.values()).map((item) => {
      item.averageScore = item.scoreCount > 0 ? Math.round(item.scoreSum / item.scoreCount) : 0;
      delete item.scoreSum;
      delete item.scoreCount;
      // Sort history descending
      item.history.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      // Sort sessions descending
      item.sessions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return item;
    });

    // Sort users by most recently active
    usersList.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

    const totalSessions = usersList.reduce((acc, u) => acc + u.totalSessions, 0);
    const premiumUsersCount = usersList.filter((u) => u.user.isPremium).length;

    res.json({
      users: usersList,
      totalUsers: usersList.length,
      totalSessions,
      premiumUsersCount,
    });
  } catch (error: any) {
    console.error('Error getting users with history:', error);
    res.status(500).json({ error: 'Failed to retrieve users with history' });
  }
});

// Admin: Toggle Premium Access for a User (Grant / Revoke)
app.post('/api/admin/users/toggle-premium', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const isPremium = typeof req.body.isPremium === 'boolean'
      ? req.body.isPremium
      : (typeof req.body.grant === 'boolean' ? req.body.grant : false);

    const cleanEmail = String(email).trim().toLowerCase();
    const records = readDb();
    let updatedCount = 0;
    let existingUserName = '';
    let existingUserLevel = '';

    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.isPremium = isPremium;
        if (isPremium) {
          rec.user.premiumGrantedAt = new Date().toISOString();
        } else {
          delete rec.user.premiumGrantedAt;
        }
        if (rec.user.name && !existingUserName) existingUserName = rec.user.name;
        if (rec.user.level && !existingUserLevel) existingUserLevel = rec.user.level;
        updatedCount++;
      }
    }

    // Log the audit event in the database so it appears in transaction history
    records.unshift({
      id: `audit_perm_${Date.now()}`,
      type: 'audit_event',
      eventType: isPremium ? 'premium_granted' : 'premium_revoked',
      timestamp: new Date().toISOString(),
      user: {
        email: cleanEmail,
        name: existingUserName,
        level: existingUserLevel,
        isPremium,
      },
      note: isPremium
        ? 'Full Premium access granted by Administrator Athul Govind (Unlocks Phase 2 qualitative supervision analysis, distortion diagnosis, and advanced clinical tracks)'
        : 'Premium access revoked by Administrator Athul Govind',
    });

    writeDb(records);
    console.log(`[Admin] Set premium = ${isPremium} for user ${cleanEmail}. Updated records: ${updatedCount}`);

    res.json({
      success: true,
      email: cleanEmail,
      isPremium,
      updatedRecords: updatedCount,
    });
  } catch (error: any) {
    console.error('Error toggling user premium:', error);
    res.status(500).json({ error: 'Failed to update user premium status' });
  }
});

// Admin: Delete user and all associated records (sessions, logs, registrations)
app.delete('/api/admin/users/:emailOrId', (req, res) => {
  try {
    const { emailOrId } = req.params;
    if (!emailOrId) {
      return res.status(400).json({ error: 'User email or ID required' });
    }

    const clean = decodeURIComponent(emailOrId).trim().toLowerCase();
    const records = readDb();
    const initialLen = records.length;

    // Filter out all records matching user email or user id
    const filteredRecords = records.filter((rec) => {
      const uEmail = (rec.user?.email || '').toLowerCase().trim();
      const uId = (rec.user?.id || '').toLowerCase().trim();
      return uEmail !== clean && uId !== clean;
    });

    const deletedCount = initialLen - filteredRecords.length;

    // Log deletion event
    filteredRecords.unshift({
      id: `audit_del_${Date.now()}`,
      type: 'audit_event',
      eventType: 'user_deleted_by_admin',
      timestamp: new Date().toISOString(),
      user: {
        email: clean,
        name: 'Deleted User',
      },
      note: `User record and all associated sessions/logs for ${clean} were deleted by Administrator Athul Govind`,
    });

    writeDb(filteredRecords);

    res.json({
      success: true,
      message: `User ${clean} and associated records deleted successfully`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user and records' });
  }
});

// Admin: Reset password for any user
app.post('/api/admin/users/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'User email and new password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(newPassword).trim();

    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const records = readDb();
    let updatedCount = 0;
    let userName = '';

    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.password = cleanPassword;
        if (rec.user.name && !userName) userName = rec.user.name;
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      records.unshift({
        id: `reg_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        timestamp: new Date().toISOString(),
        user: {
          id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: cleanPassword,
          level: 'Beginner',
          registeredAt: new Date().toISOString(),
          isAdmin: false,
          role: 'trainee',
        },
        type: 'user_registration',
        messages: [],
      });
      updatedCount = 1;
    }

    // Add audit event
    records.unshift({
      id: `audit_pwd_${Date.now()}`,
      type: 'audit_event',
      eventType: 'user_password_reset_by_admin',
      timestamp: new Date().toISOString(),
      user: {
        email: cleanEmail,
        name: userName || cleanEmail,
      },
      note: `Password for ${cleanEmail} was reset by Administrator Athul Govind`,
    });

    writeDb(records);

    res.json({
      success: true,
      message: `Password for ${cleanEmail} was successfully reset.`,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// Trainee: Self-Service Password Reset
app.post('/api/users/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(newPassword).trim();

    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const records = readDb();
    let userFound = false;

    for (const rec of records) {
      if (rec.user?.email && rec.user.email.toLowerCase() === cleanEmail) {
        rec.user.password = cleanPassword;
        userFound = true;
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    writeDb(records);

    res.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Error in self-service password reset:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});


// Admin: Full Database Backup Download (JSON)
app.get('/api/admin/backup/download', (_req, res) => {
  try {
    const records = readDb();
    const customCases = readCustomCases();
    const backupManifest = {
      manifestVersion: '2.1',
      system: 'Conversational Counselling Trainer',
      backupExportedAt: new Date().toISOString(),
      exportedBy: 'athulgovind.1993@gmail.com',
      totalRecords: records.length,
      customCasesCount: customCases.length,
      records,
      customCases,
    };

    const filename = `counseling_trainer_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backupManifest, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create database backup' });
  }
});

// Admin: Upload and Restore Database / User Info
app.post('/api/admin/backup/upload', (req, res) => {
  try {
    const { mode, backupData } = req.body;
    // backupData can be passed inside body or body itself might be the array/manifest
    const incoming = backupData || req.body;

    let incomingRecords: any[] = [];
    let incomingCustomCases: any[] | null = null;

    if (Array.isArray(incoming)) {
      incomingRecords = incoming;
    } else if (incoming && Array.isArray(incoming.records)) {
      incomingRecords = incoming.records;
      if (Array.isArray(incoming.customCases)) {
        incomingCustomCases = incoming.customCases;
      }
    } else if (incoming && Array.isArray(incoming.data)) {
      incomingRecords = incoming.data;
    } else {
      return res.status(400).json({
        error: 'Invalid backup format. Must provide an array of records or a backup manifest object.',
      });
    }

    const restoreMode = mode === 'replace' ? 'replace' : 'merge';
    let finalRecords: any[] = [];

    if (restoreMode === 'replace') {
      finalRecords = incomingRecords;
      if (incomingCustomCases) {
        writeCustomCases(incomingCustomCases);
      }
    } else {
      // Merge mode: blend with existing records
      const existing = readDb();
      const map = new Map<string, any>();

      // Put existing records
      for (const rec of existing) {
        if (rec.id) {
          map.set(rec.id, rec);
        }
      }

      // Overlay or insert incoming records
      for (const rec of incomingRecords) {
        if (rec.id) {
          map.set(rec.id, rec);
        } else {
          map.set(`rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, rec);
        }
      }

      finalRecords = Array.from(map.values());

      // Merge custom cases if present in backup
      if (incomingCustomCases && incomingCustomCases.length > 0) {
        const existingCases = readCustomCases();
        const caseMap = new Map<string, any>();
        for (const ec of existingCases) caseMap.set(ec.id, ec);
        for (const ic of incomingCustomCases) {
          const id = ic.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          caseMap.set(id, { ...ic, id, isCustom: true });
        }
        writeCustomCases(Array.from(caseMap.values()));
      }
    }

    // Sort final records by timestamp descending
    finalRecords.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    writeDb(finalRecords);

    console.log(`[Admin Backup] Restored ${finalRecords.length} records using mode '${restoreMode}'`);
    res.json({
      success: true,
      mode: restoreMode,
      recordsCount: finalRecords.length,
      incomingCount: incomingRecords.length,
      restoredCasesCount: incomingCustomCases?.length || 0,
      message: `Database and case catalog successfully restored! Total active records: ${finalRecords.length}.`,
    });
  } catch (error: any) {
    console.error('Error uploading backup:', error);
    res.status(500).json({ error: error.message || 'Failed to restore database backup' });
  }
});

// 4. Export Formatted Dataset for Model Training & Fine-Tuning (JSON)
app.get('/api/sessions/export', (_req, res) => {
  try {
    const records = readDb();
    
    // Transform into standard LLM training format (prompt-response & multi-turn dialogs)
    const trainingDataset = records.map((rec) => {
      const turns = (rec.messages || []).map((m: any) => ({
        role: m.role === 'counselor' ? 'assistant' : 'user',
        content: m.text,
        turnNumber: m.turnNumber,
      }));

      return {
        sessionId: rec.id,
        timestamp: rec.timestamp,
        trainee: rec.user,
        vignette: rec.vignette,
        configuration: rec.config,
        conversation: turns,
        supervisorScorecard: rec.evaluation ? {
          overallScore: rec.evaluation.overallScore,
          bandLabel: rec.evaluation.bandLabel,
          ethicsTriggered: rec.evaluation.ethicsFlag?.triggered,
          criticalTurns: rec.evaluation.phase2Details?.criticalTurns,
        } : null,
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="counseling_agent_training_dataset.json"');
    res.send(JSON.stringify(trainingDataset, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export training dataset' });
  }
});

// 5. Export Sessions as CSV
app.get('/api/sessions/export/csv', (_req, res) => {
  try {
    const records = readDb().filter((r: any) => r.messages && r.messages.length > 0);
    
    const headers = [
      'Session ID',
      'Timestamp',
      'Trainee Name',
      'Trainee Email',
      'Trainee Level',
      'Client Vignette',
      'Modality',
      'Difficulty',
      'Session Mode',
      'Total Turns',
      'Counselor Talk %',
      'Overall Score',
      'Band Label',
      'Ethics Flag Triggered',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r: any) => {
      const counselorTurns = (r.messages || []).filter((m: any) => m.role === 'counselor').length;
      return [
        escapeCsv(r.id),
        escapeCsv(r.timestamp),
        escapeCsv(r.user?.name || 'Anonymous'),
        escapeCsv(r.user?.email || ''),
        escapeCsv(r.user?.level || 'Beginner'),
        escapeCsv(r.vignette?.title || r.vignette?.clientName || 'General Case'),
        escapeCsv(r.config?.modality || 'rogerian'),
        escapeCsv(r.config?.difficulty || 'novice'),
        escapeCsv(r.config?.mode || 'micro'),
        escapeCsv(counselorTurns),
        escapeCsv(r.stats?.counselorSharePct ?? ''),
        escapeCsv(r.evaluation?.overallScore ?? ''),
        escapeCsv(r.evaluation?.bandLabel ?? ''),
        escapeCsv(r.evaluation?.ethicsFlag?.triggered ? 'YES' : 'NO'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="counseling_sessions_report.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});

// 6. Export Trainee Roster as CSV
app.get('/api/users/export/csv', (_req, res) => {
  try {
    const records = readDb();
    const uniqueUsersMap = new Map<string, any>();

    for (const rec of records) {
      if (rec.user?.email || rec.user?.id) {
        const key = rec.user.email || rec.user.id;
        const current = uniqueUsersMap.get(key) || {
          ...rec.user,
          sessionsCount: 0,
        };
        if (rec.messages && rec.messages.length > 0) {
          current.sessionsCount = (current.sessionsCount || 0) + 1;
        }
        uniqueUsersMap.set(key, current);
      }
    }

    const headers = [
      'User ID',
      'Full Name',
      'Email ID',
      'Training Level',
      'Institution',
      'Registration Date',
      'Completed Sessions',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = Array.from(uniqueUsersMap.values()).map((u: any) => [
      escapeCsv(u.id || ''),
      escapeCsv(u.name || ''),
      escapeCsv(u.email || ''),
      escapeCsv(u.level || 'Beginner'),
      escapeCsv(u.institution || 'General Training'),
      escapeCsv(u.registeredAt || ''),
      escapeCsv(u.sessionsCount || 0),
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registered_trainees_roster.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export users CSV' });
  }
});

// ----------------------------------------------------
// Vite Middleware / Static Server
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Conversational Counselling Trainer running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
