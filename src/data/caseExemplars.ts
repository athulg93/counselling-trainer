/**
 * Case Study Exemplars & Clinical Training Knowledge Base
 * 
 * This module stores high-fidelity clinical exemplars, client psychological archetypes,
 * real-world counseling micro-interactions, and master-level resistance patterns.
 * 
 * Agent 1 uses these exemplars to dynamically learn:
 * 1. How real clients articulate resistance and ambivalence across specific domains.
 * 2. Somatic and non-verbal tells corresponding to emotional states.
 * 3. Exact behavioral shifts between softening (when validated) vs. stonewalling (when advised prematurely).
 * 4. Realistic cadence, hesitation markers, and conversational subtext.
 */

export interface ClinicalExemplar {
  id: string;
  domainTrack: 'school' | 'workplace' | 'cbt' | 'general';
  theme: string;
  sourceNote?: string;
  clientArchetype: {
    ageRange: string;
    defenseMechanisms: string[];
    typicalSpeechPatterns: string[];
  };
  // Interaction patterns demonstrating authentic psychological reactions
  demonstrations: {
    whenCounselorAdvisesPrematurely: {
      counselorSnippet: string;
      authenticClientReaction: string;
      clinicalAnalysis: string;
    };
    whenCounselorValidatesOrReflects: {
      counselorSnippet: string;
      authenticClientReaction: string;
      clinicalAnalysis: string;
    };
    somaticTransitions: {
      state: 'anxious' | 'withdrawn' | 'defensive' | 'softening' | 'vulnerable';
      somaticCues: string[];
    };
  };
}

export const CLINICAL_CASE_EXEMPLARS: ClinicalExemplar[] = [
  {
    id: 'exemplar-school-overwhelmed',
    domainTrack: 'school',
    theme: 'Academic Perfectionism & Imposter Syndrome in Adolescents',
    sourceNote: 'Synthesized from adolescent school counseling practice literature',
    clientArchetype: {
      ageRange: '14-18',
      defenseMechanisms: ['Minimization', 'Intellectualization', 'Polite compliance masking withdrawal'],
      typicalSpeechPatterns: ['"It is fine, honestly"', '"I guess so"', '"I do not know, everyone else handles it"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'Have you tried making a study planner or using a Pomodoro timer?',
        authenticClientReaction: '*[Shrugs politely, eyes darting to the floor]* Yeah... I mean, I have an app for that. It just ends up making me feel worse when I miss a block.',
        clinicalAnalysis: 'Client feels unseen and reduces emotional risk by offering surface agreement followed by deflated compliance.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like the hardest part is not just the volume of work, but this crushing feeling that everyone else has it figured out except you.',
        authenticClientReaction: '*[Exhales deeply, shoulders dropping slightly as voice cracks]* Exactly. Like, if I admit I cannot keep up, then everything I have worked for unravels.',
        clinicalAnalysis: 'Emotional attunement drops defensive intellectualization, inviting primary vulnerability.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Shoulders visibly drop, lets out a long breath]*',
          '*[Uncrosses arms slowly, looking up with less guarded eyes]*',
          '*[Voice softens and loses the defensive edge]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-workplace-cynicism',
    domainTrack: 'workplace',
    theme: 'Senior Professional Experiencing Burnout, Moral Injury, and Corporate Cynicism',
    sourceNote: 'EAP organizational counseling case studies',
    clientArchetype: {
      ageRange: '30-55',
      defenseMechanisms: ['Sarcasm', 'Devaluation of organizational systems', 'Hyper-competence defense'],
      typicalSpeechPatterns: ['"Classic corporate playbook"', '"I have been around long enough to know"', '"It is what it is"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You should set strict boundaries and log off at 5 PM no matter what.',
        authenticClientReaction: '*[Gives a dry, patronizing chuckle, shaking head]* With all due respect, if I log off at 5, my team misses delivery, our VP escalates, and three engineers get pulled into Saturday shifts. Must be nice in theory, though.',
        clinicalAnalysis: 'Action advice given before exploring systemic workplace constraints triggers condescending pushback and reinforces isolation.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'You feel caught in an impossible bind—protecting your team from collateral damage while watching your own stamina steadily disintegrate.',
        authenticClientReaction: '*[Pushes fingers against temples and sits in silence for a few seconds]* You have no idea how heavy that feels. I have not slept through the night since October.',
        clinicalAnalysis: 'Mirroring the systemic bind dismantles sarcasm and exposes genuine exhaustion.',
      },
      somaticTransitions: {
        state: 'defensive',
        somaticCues: [
          '*[Leans back in chair with folded arms, voice taking on a sharp, clipped tone]*',
          '*[Smiles wryly with tight lips]*',
          '*[Checks watch briefly, signaling disengagement]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-catastrophizing',
    domainTrack: 'cbt',
    theme: 'Catastrophic Health Anxiety & All-or-Nothing Cognitive Loops',
    sourceNote: 'Cognitive Behavioral Therapy clinical trial case vignettes',
    clientArchetype: {
      ageRange: '20-45',
      defenseMechanisms: ['Reassurance seeking', 'Hypervigilance', 'Catastrophic filtering'],
      typicalSpeechPatterns: ['"What if it is..."', '"I know you will tell me it is fine, but..."', '"I can feel something is wrong"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'The doctor said your tests were normal, so there is nothing to worry about.',
        authenticClientReaction: '*[Tenses jaw, gripping the armrests tighter]* But doctors miss things! You read about misdiagnoses all the time. Just telling me not to worry does not stop my heart from pounding.',
        clinicalAnalysis: 'Direct logical discounting invalidates internal sensations, escalating panic and reassurance-seeking loops.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'Even though the medical charts say clear, inside your body the fear feels terrifyingly real and urgent in this exact room.',
        authenticClientReaction: '*[Grips hands together, nodding slowly]* Yes. My brain tells me I am in danger even when people tell me I am fine.',
        clinicalAnalysis: 'Validating the somatic reality of anxiety creates the safety required for later Socratic cognitive restructuring.',
      },
      somaticTransitions: {
        state: 'anxious',
        somaticCues: [
          '*[Rapid, shallow breathing, fingers twitching on knees]*',
          '*[Swallows hard, throat clearing]*',
          '*[Eyes wide, scanning the counselor’s expression for micro-tells]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-grief-relationship',
    domainTrack: 'general',
    theme: 'Unresolved Ambiguous Loss & Relational Disconnection',
    sourceNote: 'Adult humanistic counseling case logs',
    clientArchetype: {
      ageRange: '25-60',
      defenseMechanisms: ['Emotional numbness', 'Deflection to logistics', 'Guilt over self-care'],
      typicalSpeechPatterns: ['"We just do what needs to be done"', '"No point dwelling on it"', '"Other people have it harder"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to take some "me time" and pamper yourself this weekend.',
        authenticClientReaction: '*[Frowns slightly, voice turning flat and distant]* Right. And who takes care of my mother’s medication and the house while I am "pampering" myself?',
        clinicalAnalysis: 'Trite self-care prescriptions feel tone-deaf and induce resentment in caregivers carrying chronic relational loads.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like you have been carrying the weight of the entire household for so long that putting it down for even an hour feels like an act of betrayal.',
        authenticClientReaction: '*[Eyes water, quickly blinks them back and looks at the window]* ...Nobody has ever put it that way before. But that is exactly what it feels like.',
        clinicalAnalysis: 'Naming the underlying moral guilt opens the gateway for unburdening.',
      },
      somaticTransitions: {
        state: 'vulnerable',
        somaticCues: [
          '*[Looks toward the window, voice dropping to a near-whisper]*',
          '*[Blinks rapidly, wiping a quick tear before regaining composure]*',
          '*[Hands un-clench, resting palms up]*',
        ],
      },
    },
  },
];

/**
 * Formats relevant exemplars into conditioning guidelines for Agent 1.
 */
export function buildAgent1ExemplarGuidance(track: string): string {
  const relevant = CLINICAL_CASE_EXEMPLARS.filter((e) => e.domainTrack === track || e.domainTrack === 'general');
  if (relevant.length === 0) return '';

  return `
### MASTER CASE STUDY EXEMPLARS & CLINICAL REALISM BENCHMARKS:
Learn from these authentic clinical patterns to emulate genuine client reactions:
${relevant.map((ex) => `
Case Study Pattern (${ex.theme}):
- Client Defense Patterns: ${ex.clientArchetype.defenseMechanisms.join(', ')}
- Typical Speech Cadence: ${ex.clientArchetype.typicalSpeechPatterns.join('; ')}
- How to React if Counselor Jumps to Advice Prematurely:
  Counselor: "${ex.demonstrations.whenCounselorAdvisesPrematurely.counselorSnippet}"
  Your Authentic Reaction: "${ex.demonstrations.whenCounselorAdvisesPrematurely.authenticClientReaction}"
- How to React When Counselor Truly Validates & Reflects:
  Counselor: "${ex.demonstrations.whenCounselorValidatesOrReflects.counselorSnippet}"
  Your Authentic Softening: "${ex.demonstrations.whenCounselorValidatesOrReflects.authenticClientReaction}"
`).join('\n')}
`;
}
