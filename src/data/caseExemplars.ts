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
  {
    id: 'exemplar-cbt-parentification-rebt',
    domainTrack: 'cbt',
    theme: 'Adult Parentification, Caregiver Enmeshment & Conditional Self-Worth (REBT/Choice Theory)',
    sourceNote: 'Clinical adult case study: Rational Emotive Behavior Therapy (REBT) and Glasser Choice Theory',
    clientArchetype: {
      ageRange: '35-55',
      defenseMechanisms: ['Parentification scripts', 'Maternal over-responsibility', 'Equating personal autonomy with betrayal'],
      typicalSpeechPatterns: ['"I am just marking time"', '"If I do not do it, who will?"', '"I cannot let my family down"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to set strict boundaries with your adult son and tell him you will no longer drive him everywhere.',
        authenticClientReaction: '*[Looks down, crossing arms defensively with a tense sigh]* You make it sound so simple. He is my son. He cannot read or drive. If I leave him stranded, I would be a terrible mother, wouldn\'t I?',
        clinicalAnalysis: 'Direct boundary advice before exploring core beliefs activates severe maternal guilt and triggers defensive withdrawal.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like ever since you were a young girl begging for food to keep your siblings fed, you learned that your right to exist and be loved depended entirely on never having wishes of your own.',
        authenticClientReaction: '*[Gasps softly, posture freezing for a moment as tears well up]* ...I have never thought of it that way. I have spent my whole life feeling like I was only allowed to exist if I was fixing things for everyone else.',
        clinicalAnalysis: 'Socratically linking early survival scripts with current caregiver enmeshment unlocks core REBT disputation and genuine self-worth discovery.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Slowly lifts head, meeting counselor\'s eyes with a mixture of shock and profound relief]*',
          '*[Spine straightens, releasing the slumped posture]*',
          '*[Exhales a trembling breath and nods slowly]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-marital-vacuum',
    domainTrack: 'general',
    theme: 'Marital Lifecycle Vacuum, Peer Network Loss & Identity Differentiation',
    sourceNote: 'Couples & identity transition case studies (Bowen differentiation / Values clarification)',
    clientArchetype: {
      ageRange: '25-35',
      defenseMechanisms: ['Externalizing blame onto spouse hobbies/gaming', 'Anxious hyper-focus on partner', 'Identity diffusion'],
      typicalSpeechPatterns: ['"If he would just turn off the computer"', '"I feel totally invisible in my own house"', '"We used to have so much fun"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You should just give him an ultimatum or find a hobby of your own to keep busy.',
        authenticClientReaction: '*[Scoffs with frustrated tears, shaking head]* A hobby? I didn\'t get married to sit in separate rooms doing crafts while my husband plays video games 6 hours a day! That completely misses the point.',
        clinicalAnalysis: 'Premature advice ignores the existential grief of a dissolving friendship circle and triggers heightened marital panic.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like when your entire friend group dispersed, you were left with a double loss—not only the absence of your daily social world, but the terrifying realization that you and John had never actually learned who you are alone together.',
        authenticClientReaction: '*[Freezes, eyes widening with vulnerable stillness]* That is exactly it. We had a great time when 10 other people were laughing around us... but without them, I don\'t even know who I am or what John wants.',
        clinicalAnalysis: 'Articulating the systemic vacuum shifts focus from defensive blame to deeper identity and relational exploration.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Stops twisting wedding ring, placing both hands flat on lap]*',
          '*[Eyes soften, breathing slows down from rapid anxious pitch]*',
          '*[Nods slowly with a quiet, reflective expression]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-avoidant-negotiation',
    domainTrack: 'general',
    theme: 'Introverted Decompression, Avoidant Shutdown & Structured Marital Negotiation',
    sourceNote: 'Couples communication & behavioral contracting case study (Gottman / Behavioral Exchange)',
    clientArchetype: {
      ageRange: '25-40',
      defenseMechanisms: ['Avoidant withdrawal into solitary screens', 'Minimization of marital distress', 'Fear of engulfed autonomy'],
      typicalSpeechPatterns: ['"I work hard all day, I just want to relax"', '"Why does everything have to be a big summit meeting?"', '"I am not bothering anyone"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to step up as a husband and turn off the computer as soon as you get home.',
        authenticClientReaction: '*[Shrugs coldly, sinking hands into pockets and staring at shoes]* Fine. I will sit on the couch and stare at the wall instead. Is that what makes a good marriage?',
        clinicalAnalysis: 'Direct moral scolding creates hostile passive-compliance and strengthens avoidant stonewalling.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like gaming has been your safe harbor to recharge after high-stimulus days, and when Sue-Anne approaches you with emotional urgency, it feels less like an invitation and more like a demand that threatens your personal breathing room.',
        authenticClientReaction: '*[Looks up surprised, posture visibly relaxing as tension leaves his shoulders]* Exactly. It feels like if I give an inch, I will have zero time to just exist by myself. I do love her, I just need to decompress.',
        clinicalAnalysis: 'Legitimizing the introverted recharge need neutralizes the defensive armor and enables structured win/win negotiation.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Pulls hands out of pockets and rests elbows on knees, leaning in]*',
          '*[Jaw relaxes from tight clenched clench into open gaze]*',
          '*[Nods with genuine willingness to problem-solve]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-child-bereavement',
    domainTrack: 'general',
    theme: 'Child Bereavement, Maternal Survivor Guilt & Asynchronous Spousal Pacing',
    sourceNote: 'Clinical bereavement casework (Kübler-Ross / Worden Tasks of Mourning / Stroebe Dual Process)',
    clientArchetype: {
      ageRange: '35-55',
      defenseMechanisms: ['Survivor guilt ("Why her and not me?")', 'Hyper-vigilant over-protection of surviving child', 'Disenfranchised grief from friends avoiding the deceased child\'s name'],
      typicalSpeechPatterns: ['"I can\'t even get the dishes done"', '"Nobody mentions her name anymore"', '"Tom thinks I should be over this by now"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You have to be strong for your son David and get back to your old routine like Tom is doing.',
        authenticClientReaction: '*[Wipes eyes abruptly, voice turning sharp and defensive]* Tom didn\'t sit by her hospital bed for six months watching her deteriorate! I can\'t just "get back to my routine" when my little girl isn\'t in her bedroom anymore.',
        clinicalAnalysis: 'Comparing recovery rates or forcing cheerfulness shames the bereaved mother and triggers profound relational alienation.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like the hardest part isn\'t just missing Jill every second, but feeling like the entire world—and even your own husband—is moving on while you are still holding the sacred weight of her memory.',
        authenticClientReaction: '*[Buries face in tissues, weeping openly with deep body sobs]* Yes... thank you for saying her name. Everyone else acts like if they mention Jill, it will break me. But pretending she didn\'t exist breaks me a thousand times more.',
        clinicalAnalysis: 'Saying the deceased child\'s name and honoring the sanctity of the grief shatters disenfranchised isolation.',
      },
      somaticTransitions: {
        state: 'vulnerable',
        somaticCues: [
          '*[Clutched tissue relaxes in trembling fingers]*',
          '*[Deep shuddering breath as sobbing shifts into grounded stillness]*',
          '*[Looks directly at counselor with tearful, trusting eyes]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-collaborative-parenting',
    domainTrack: 'general',
    theme: 'Polarized Parenting, Transgenerational Upbringing & Collaborative Alignment',
    sourceNote: 'Family systems & co-parenting clinical case studies (Collaborative Parenting / Adlerian Family Meetings)',
    clientArchetype: {
      ageRange: '30-45',
      defenseMechanisms: ['Righteous adherence to rules/discipline', 'Catastrophic projection of child entitlement', 'Vulnerability masking behind order'],
      typicalSpeechPatterns: ['"If we don\'t teach them now, they\'ll fail in life"', '"There have to be rules and order"', '"Cassie just lets them run rampant"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to relax your expectations and stop demanding so much order from a five and six year old.',
        authenticClientReaction: '*[Sits up rigidly, tightening jaw with intense irritation]* Relax? So my house descends into total chaos, my kids go to bed at midnight, and nobody learns accountability? That might work in a fairy tale, but not in real life.',
        clinicalAnalysis: 'Dismissing the father\'s need for structure invalidates his sense of parental duty and triggers entrenched authoritarian defense.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like your strict standards aren\'t about wanting to be harsh—they come from a deep, protective desire to make sure your sons have the discipline to succeed, even if it feels terrifying when things get chaotic and out of control.',
        authenticClientReaction: '*[Pauses, jaw noticeably unclenches as he rubs his temples]* ...That is it exactly. Growing up, there was zero room for error. If things were messy, punishment followed. I just want my boys to be prepared, but I hate that Cassie and I are fighting every night.',
        clinicalAnalysis: 'Validating the protective intention behind the structure uncovers the underlying childhood fear and opens the door to collaborative rule-setting and family meetings.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Shoulders drop from stiff defensive posture]*',
          '*[Rubs forehead, letting out an exhausted breath]*',
          '*[Looks up with open curiosity rather than critical tension]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-active-listening',
    domainTrack: 'general',
    theme: 'Pseudo-Listening, Rush-Induced Communication Barriers & Playback Mirroring',
    sourceNote: 'Couples communication case casework (Speaker-Listener / Active Playback / Imago Dialogue)',
    clientArchetype: {
      ageRange: '30-50',
      defenseMechanisms: ['Advising & premature problem-solving', 'Planning ahead during conversations', 'Deflecting or placating under stress'],
      typicalSpeechPatterns: ['"We don\'t have time for a two-hour summit"', '"I already know what he is going to say"', '"I was just trying to fix it!"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to put your phones away and spend 30 minutes every evening talking about your day.',
        authenticClientReaction: '*[Shakes head with a hurried sigh, glancing at watch]* We\'ve tried that. It takes about two minutes before Jake placates me with "yes dear" and I start diagnosing his job issues. Generic "talk time" just gives us more time to miscommunicate.',
        clinicalAnalysis: 'Recommending conversation volume without teaching active listening mechanics reinforces frustration.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like you both love each other deeply, but because your lives are running on such a fast-paced treadmill, you\'ve fallen into the trap of pseudo-listening—jumping to advice and planning your replies before the other person even finishes their sentence.',
        authenticClientReaction: '*[Freezes, bursts into a brief self-conscious laugh before softening]* That is so humiliatingly accurate. I literally caught myself diagnosing his boss yesterday before he even took his coat off. We forgot how to just be present.',
        clinicalAnalysis: 'Accurately naming the specific behavioral barriers (advising, planning ahead) deconstructs defensiveness through self-awareness.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Puts phone face down in bag, settling back against the chair]*',
          '*[Speaking rhythm decelerates from hurried cadence into thoughtful pauses]*',
          '*[Maintains steady eye contact with open posture]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-automatic-thoughts-core-beliefs',
    domainTrack: 'cbt',
    theme: 'Workplace Stress, Automatic Thought Identification & Core Belief Disputation (CBT Steps 1-3)',
    sourceNote: 'CBT Clinical Case Protocol: Identifying Automatic Thoughts ("No one appreciates what I do"), Emotional Consequences, and Disputing Absolute Core Beliefs ("Must be competent and successful in all things attempted")',
    clientArchetype: {
      ageRange: '28-45',
      defenseMechanisms: ['Workplace irritability masking underlying exhaustion', 'Personalization ("They don\'t understand because they don\'t appreciate me")', 'All-or-Nothing Core Demands ("I must succeed at everything")'],
      typicalSpeechPatterns: ['"I work 12-hour days and nobody appreciates it"', '"If they make a small mistake, it infuriates me"', '"I have to be on top of every single change"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to set better boundaries at work and stop working 12-hour days.',
        authenticClientReaction: '*[Scoffs with frustrated tension, crossing arms]* That is easy to say from that chair. If I drop the ball on rolling out these corporate policies or headhunting, the executive team comes down on my head. I can\'t just work less.',
        clinicalAnalysis: 'Premature boundary directives ignore the client\'s rigid core belief that their worth equals flawless execution in all tasks.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'When you implemented that new policy and the phones started ringing with questions, an automatic thought flashed through your mind: "No one appreciates what I do." Believing that thought put you into a state of fury where snapping felt like the only outlet.',
        authenticClientReaction: '*[Pauses, startled, then lets out a soft, genuine laugh]* Wow. Yes... when you put it like that, it infuriates me because I feel so undervalued. But if I didn\'t automatically jump to believing that... I guess I would probably be much less snappy and actually patient with people.',
        clinicalAnalysis: 'Isolating the automatic thought and examining its emotional/behavioral consequence enables the client to see the cognitive link and softens defensive irritability.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Tension leaves shoulders, releases a self-aware chuckle]*',
          '*[Uncrosses arms and leans forward with genuine curiosity]*',
          '*[Voice drops from agitated pitch into grounded self-reflection]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-behavior-modification-planned-ignoring',
    domainTrack: 'cbt',
    theme: 'Parent-Child Behavior Modification, Intermittent Reinforcement & Planned Ignoring Protocol',
    sourceNote: 'Operant Behavioral CBT & Parent Management Training (PMT): Intermittent reinforcement schedules, extinction bursts, 5-step planned ignoring, and labeled praise for positive behaviors',
    clientArchetype: {
      ageRange: '28-48',
      defenseMechanisms: ['Parental despair and helplessness ("We tried everything and nothing works")', 'Guilt over physical discipline / harsh reactions', 'Rationalizing intermittent surrender ("I only give in once a week when I can\'t take it")'],
      typicalSpeechPatterns: ['"She screams until she gets her way"', '"If I send her to her room she just plays with her toys"', '"We try to ignore it but it just gets louder"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to be more consistent with discipline and not let your 5-year-old control the household.',
        authenticClientReaction: '*[Wipes eyes, voice shaking with defensive exhaustion]* You think we haven\'t tried being consistent? When she is screaming at the top of her lungs for 45 minutes in public or at bedtime, you will do literally anything just to make it stop so the neighbors don\'t call the police.',
        clinicalAnalysis: 'Shaming parents for inconsistency overlooks the biological exhaustion of intermittent reinforcement and triggers defensive guilt.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'You are exhausted because you love your daughter and have been trying your absolute hardest. What is happening isn\'t that you\'ve failed—it\'s that when you hold out for 20 minutes and then give in once a week, it accidentally teaches her brain that if she just screams louder and longer, the reward will eventually come.',
        authenticClientReaction: '*[Freezes, staring with a mixture of revelation and relief]* ...Oh God. That makes so much sense. We thought ignoring 90% of the time was good enough, but we were actually training her to scream longer. What do we actually do when she starts?',
        clinicalAnalysis: 'De-stigmatizing the parents\' effort while clearly psychoeducating on intermittent schedules unlocks motivation to learn the 5-step Planned Ignoring and Labeled Praise protocol.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Tears subside as posture transitions from defeated slump to alert focus]*',
          '*[Pulls out notepad or leans in attentively]*',
          '*[Nods vigorously as the 5-step planned ignoring rule is explained]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-anxiety-case-management-somatic-misinterpretation',
    domainTrack: 'cbt',
    theme: 'Anxiety Case Management, Interoceptive Catastrophizing & Unstructured Time Traps',
    sourceNote: 'Anxiety & Early Sobriety Case Management Protocol: Misinterpreting autonomic stress cues (tachycardia, breathlessness, dizziness), doctor shopping / sedative crutches, and multi-system behavioral activation',
    clientArchetype: {
      ageRange: '22-35',
      defenseMechanisms: ['Chemical deadening / sedative crutches for emotional distress', 'Interoceptive hypervigilance (misinterpreting fight-or-flight symptoms as medical damage)', 'Internalized pessimism and helplessness ("I ruined my life, nobody can help me")'],
      typicalSpeechPatterns: ['"When the room gets quiet, my chest tightens and I feel like I\'m dying"', '"I just need something to take the edge off"', '"I have so much free time now that all I do is spiral"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to attend 90 AA meetings in 90 days and find a new hobby so you aren\'t sitting around.',
        authenticClientReaction: '*[Pulls jacket tighter, eyes darting anxiously to the floor]* Going to a crowded church basement when my heart is hammering at 130 beats a minute makes me feel like I\'m going to collapse. When the panic hits, standard advice just feels impossible.',
        clinicalAnalysis: 'Prescribing high-exposure group activities without psychoeducation on the autonomic fight-or-flight response exacerbates agoraphobic panic.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'When you notice your heart pounding, dizziness, and shortness of breath, your brain immediately screams that something is medically wrong with you, which sends your panic into overdrive—especially when you\'re sitting in an empty room with unstructured time.',
        authenticClientReaction: '*[Exhales shakily, touching chest, voice dropping to a vulnerable whisper]* Exactly. I thought I had damaged my heart or my brain from drinking. Hearing that it\'s just the adrenaline surge from the fight-or-flight response... I don\'t know, it takes away that feeling of terror that I\'m about to die.',
        clinicalAnalysis: 'Normalizing autonomic physiological sensations breaks the catastrophic feedback loop and primes the client for structured daily activity scheduling.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Unclasps hands from rigid grip on chest and lets them rest on knees]*',
          '*[Breathing slows from rapid shallow chest breaths to slower diaphragmatic pace]*',
          '*[Looks up with engaged, hopeful eye contact]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-person-centered-grief-loss',
    domainTrack: 'general',
    theme: 'Person-Centered Mourning of Marital Loss, Disenfranchised Timeline Pressure & Self-Empowerment',
    sourceNote: 'Carl Rogers Person-Centered Therapy Protocol: Non-expert stance, holding holding container for silence/tears, deconstructing external timeline pressure ("I should be over it by now"), and facilitating organic client-led problem solving',
    clientArchetype: {
      ageRange: '28-50',
      defenseMechanisms: ['Internalized timeline shame ("Friends tell me it has been 6 months, I should be over it")', 'Self-recrimination over sole-parenting struggles', 'Seeking counselor validation / advice ("What do you think I should do?")'],
      typicalSpeechPatterns: ['"I just don\'t seem to be able to get on with my life"', '"Maybe I should be over him by now... what do you think?"', '"It was all so sudden, my dream of our family is gone"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to set up a strict daily schedule, hire a babysitter, and start sending resumes out immediately so you feel productive.',
        authenticClientReaction: '*[Looks down at tissue, wiping tears while nodding politely but looking overwhelmed]* I know... that\'s what my sister says. But when the boys cry for their dad at bedtime, I can barely breathe. Putting more tasks on my list just makes me feel like a bigger failure.',
        clinicalAnalysis: 'Directive problem-solving reinforces the client\'s internalized shame that she is inadequate for struggling with sudden abandonment grief.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'You\'ve described a massive upheaval in your life—suddenly carrying sole responsibility for two young boys, managing the house and finances on your own, and grieving the sudden loss of your marriage all at once. That is an enormous amount of pain to carry.',
        authenticClientReaction: '*[Pauses after a silence, wipes eyes with tissue, then exhales as facial tension visibly softens]* Yes... it really is when you put it all together. Hearing you say that makes me realize I\'ve been holding myself to an impossible standard. You know... maybe I could negotiate to return part-time first and ask my close friends to help with pickups.',
        clinicalAnalysis: 'Unconditional positive regard and deep emotional reflection create the psychological safety for the client to organically access her own inner strengths and solutions.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Speaking pace slows, shoulders drop from hunched tension]*',
          '*[Assumes a relaxed posture, sitting back comfortably in the chair]*',
          '*[Looks up from floor and smiles with genuine self-compassion]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-systematic-desensitization-phobia',
    domainTrack: 'cbt',
    theme: 'Systematic Desensitization, In-Vivo Exposure Hierarchy & Behavioral Contracting for Phobia',
    sourceNote: 'Classical & Operant Conditioning Behavior Modification: Graduated exposure hierarchy, paired relaxation counter-conditioning, 0-10 SUDS monitoring (threshold 7 pause/recalibration), and behavioral contracting with support partners',
    clientArchetype: {
      ageRange: '25-55',
      defenseMechanisms: ['Long-term experiential avoidance (e.g., years of avoiding driving or social situations)', 'Over-generalization from past adverse incident ("I had an accident, therefore I am unsafe forever")', 'Helpless surrender to avoidance comfort ("I just gave up and wanted someone else to do it for me")'],
      typicalSpeechPatterns: ['"Every time I even think about doing it, I break into a cold sweat and my legs shake"', '"I used to blame myself for not avoiding it"', '"Is it too late to relearn after all these years?"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just have to face your fears head-on. Next Monday, get in the car and drive the full 20 minutes to work during morning rush hour.',
        authenticClientReaction: '*[Freezes, skin paling, hands trembling visibly on chair armrests]* I can\'t. If I try that, my hands will shake so bad I won\'t be able to steer and I\'ll cause another accident. Pushing me straight into rush hour makes me want to cancel the job and never try again.',
        clinicalAnalysis: 'Flooding without client-led graduated hierarchy or paired relaxation mechanisms triggers acute panic and consolidates behavioral refusal.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'Trying to drive all the way to work on day one would be terrifying after 15 years. What if we broke this down into manageable steps—starting with just sitting in the parked car with relaxing music for 5 minutes, rating your anxiety from 0 to 10, and pausing whenever it hits a 7 until your body calms down?',
        authenticClientReaction: '*[Exhales deeply, color returning to face, leaning in with visible relief]* Sitting in the parked car with calming music... that I can actually do. And knowing I can stop and recalibrate if my anxiety hits a 7 takes away the feeling that I\'m trapped. How do we track the steps?',
        clinicalAnalysis: 'Graduated systematic desensitization paired with clear SUDS boundaries provides emotional safety and empowers the client to contract for active behavioral homework.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Hand tremors cease; unclasps clenched fingers]*',
          '*[Nods with determined focus while reviewing the graduated exposure ladder]*',
          '*[Smiles warmly when discussing involving their supportive partner in the practice drives]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-rebt-approval-musts',
    domainTrack: 'cbt',
    theme: 'REBT ABCDEF Disputation, Absolutistic Demands ("Musts & Shoulds") & In-Law Approval Trap',
    sourceNote: 'Albert Ellis Rational Emotive Behaviour Therapy: Disputing irrational absolutistic demands ("I MUST have their approval to be a worthy spouse"), transforming demands into flexible preferences, using therapeutic humor, and establishing healthy relational boundaries',
    clientArchetype: {
      ageRange: '25-45',
      defenseMechanisms: ['Approval addiction / excessive appeasement ("If I just try harder, they will eventually love me")', 'Demand thinking / Musturbation ("I MUST have their respect for my marriage to work")', 'Externalized self-worth ("Their disapproval means I am defective as a partner")'],
      typicalSpeechPatterns: ['"It is my duty to make them like me"', '"If my in-laws don\'t respect me, how can my partner?"', '"I\'ve bent over backwards for years and nothing works"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'Your in-laws sound toxic. You should just cut off contact and refuse to go over to their house for Sunday dinners.',
        authenticClientReaction: '*[Wrings hands anxiously, looking alarmed]* I can\'t just cut them off—they\'re my wife\'s parents and my child\'s grandparents. If I do that, I\'ll tear the whole family apart and prove to them that I\'m the horrible person they think I am.',
        clinicalAnalysis: 'Premature advice to cut off family ignores the underlying irrational belief ("I MUST have their approval to be worthy") and triggers fierce resistance.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'Under these trying circumstances, where you\'ve been criticized and ignored for four years, I must congratulate you on your heroic persistence! But tell me: where is it written in the universe that you MUST have their approval to be a worthy husband, rather than strongly PREFERRING it?',
        authenticClientReaction: '*[Startles, then bursts into an involuntary laugh of self-recognition, posture unslouching]* *[Laughs]* When you put it like that... on my wedding day I certainly didn\'t promise to obey her parents! I guess I\'ve been treating their approval like oxygen, when really it\'s just something I\'d prefer to have. They might never like me, and maybe that doesn\'t have to destroy my marriage.',
        clinicalAnalysis: 'Calibrated therapeutic humor combined with REBT disputing (transforming absolute "Musts" into rational "Preferences") punctures dogmatic approval-demands and restores personal agency.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Chuckles spontaneously, shoulders dropping from defensive tension]*',
          '*[Sits back with hands open on lap, smiling with newfound clarity]*',
          '*[Writes down "Must vs Preference" distinction with energetic focus]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-school-cbt-adolescent-depression-parental-triangulation',
    domainTrack: 'school',
    theme: 'Adolescent MDD, Parental Conflict Triangulation & Cultural Familismo',
    sourceNote: 'Manual-Based Youth CBT & Familismo Protocol (Jiménez Chafey et al., 2009): Adolescent MDD with severe symptom fluctuation contingent on parental marital strife, messenger triangulation, internalized guilt ("They fight because of my grades"), pleasant activity scheduling, assertiveness role-play, and catastrophic divorce fear disputation',
    clientArchetype: {
      ageRange: '14-18',
      defenseMechanisms: ['Internalized responsibility/guilt ("My parents fight because of me")', 'Triangulated messenger burden (carrying hostility between fighting parents)', 'Social withdrawal and self-concept collapse ("I\'m ugly/stupid, no one will like me")'],
      typicalSpeechPatterns: ['"If I could just get straight A\'s, maybe they\'d stop yelling at each other"', '"They don\'t talk directly, they make me tell the other one things"', '"I just put my head down in class because my chest feels so heavy"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to tell your parents that their marriage isn\'t your problem, focus on your homework planner, and stop letting their arguments distract you.',
        authenticClientReaction: '*[Pulls oversized sleeves over knuckles, eyes welling with tears, sinking into chair]* You don\'t understand. In my family, we don\'t just turn our backs on our parents. When my dad storms out and slams the door, I can\'t just sit there and do geometry. I feel like the whole house is falling apart because of me.',
        clinicalAnalysis: 'Dismissing parental conflict and cultural family loyalty (*familismo*) invalidates the adolescent\'s reality and overlooks systemic triangulation.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like you have been carrying an agonizing double burden—trying to survive high school while feeling like you\'re caught in the crossfire as a messenger between your parents, and secretly believing that their fighting is your fault.',
        authenticClientReaction: '*[Wipes tears with sleeve, sitting up slightly as a heavy sigh escapes]* Yes... exactly. Every time they start shouting in the kitchen, my stomach drops and I think, "If I hadn\'t failed that test, Mom wouldn\'t be stressed and Dad wouldn\'t be mad." I\'ve never told anyone how scared I am that Dad will just disappear.',
        clinicalAnalysis: 'Accurately naming the emotional burden of parental triangulation lifts the shame of internalized blame and creates safety for cognitive thought-disputation and structured pleasant activity scheduling.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Dabs eyes with tissue; uncurls from protective posture]*',
          '*[Makes direct eye contact with relieved vulnerability]*',
          '*[Leans in to review the daily mood thermometer and pleasant activity weekly planner]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-school-ipta-adolescent-depression-role-disputes',
    domainTrack: 'school',
    theme: 'Interpersonal Psychotherapy for Adolescents (IPT-A), Role Disputes & Closeness Circle Mapping',
    sourceNote: 'APA Interpersonal Psychotherapy for Adolescents (IPT-A) Protocol (Mufson et al.): Biopsychosocial formulation of adolescent MDD, non-blaming "Sick Role" relief, Interpersonal Inventory (Closeness Circles), Communication Analysis of explosive disputes, and Decision Analysis / Role-Playing for renegotiating non-reciprocal expectations',
    clientArchetype: {
      ageRange: '13-18',
      defenseMechanisms: ['Irritable masking of depressive despair', 'Role dispute impasse / communication shutdown ("Nobody listens anyway so I just yell or walk out")', 'Experiencing life transitions as personal abandonment (e.g. sibling moving out, romantic rupture)'],
      typicalSpeechPatterns: ['"I\'m only here because they threatened detention"', '"My teachers and my parents have ridiculous expectations and then treat me like a criminal"', '"Ever since my brother left, the house is dead and nobody talks to me"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You need to control your temper, apologize to the substitute teacher, and go sit in detention without complaining.',
        authenticClientReaction: '*[Scowls, leans back crossing arms tightly, eyes rolling toward the ceiling]* Right. Typical. Another adult telling me to shut up and take the blame. Don\'t bother asking why the guy made a joke about me in front of the whole class. You\'re just like everyone else.',
        clinicalAnalysis: 'Moralizing about rules and giving disciplinary advice alienates the adolescent, reinforcing the perception of systemic hostility and blocking interpersonal exploration.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'It sounds like when that teacher made a comment about your lab partner, you felt publicly humiliated and cornered—and when you\'re already feeling isolated at home since your brother left, having an adult dismiss you felt like the final straw.',
        authenticClientReaction: '*[Uncrosses arms, leaning forward with sudden, raw honesty, jaw relaxing]* Yeah... it really was. When he said that in front of everyone, I just saw red. It feels like everyone expects me to be this quiet robot when everything around me feels completely upside down. Nobody ever asked what actually happened.',
        clinicalAnalysis: 'Framing depressive irritability through an IPT-A interpersonal lens (connecting mood/anger to interpersonal role disputes and role transitions) validates the adolescent, enabling communication analysis and role-play renegotiation.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Uncrosses arms and drops cynical smirk]*',
          '*[Leans forward with elbows on knees, engaging in genuine conversation]*',
          '*[Willingly maps relationships onto the IPT-A Closeness Circle chart]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-cbt-apa-adult-depression-formulation',
    domainTrack: 'cbt',
    theme: 'APA Guideline CBT for Adult Major Depression, Beckian Case Conceptualization & Behavioral Activation',
    sourceNote: 'APA Clinical Practice Guideline for the Treatment of Depression in Adults (Beck Cognitive Therapy): Cognitive case formulation, Cognitive Triad (self/world/future), distinction between thoughts and feelings, Mastery & Pleasure behavioral activation (0-10), 7-column Dysfunctional Thought Record, and collaborative empirical testing of depressogenic core beliefs',
    clientArchetype: {
      ageRange: '25-60',
      defenseMechanisms: ['Depressive inertia and withdrawal ("Nothing gives me pleasure, what is the point of trying?")', 'All-or-nothing helplessness ("I failed at this job, my whole career is over")', 'Disqualifying the positive / Mental filter ("Any small win was just luck, my failure is permanent")'],
      typicalSpeechPatterns: ['"I just sit on the couch all weekend staring at the wall"', '"Even if I try to go for a walk, I know it won\'t make me feel better"', '"I used to be competent, but now I\'m completely defective"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just have clinical depression. You need to push yourself to go to the gym, socialize with your friends, and think positive thoughts every morning.',
        authenticClientReaction: '*[Stares down at the floor with heavy, leaden exhaustion, shaking head slowly]* If I could just "think positive" and go to the gym, I wouldn\'t be here paying you. When you say that, it just confirms what I already know: nobody gets how heavy this feels, and I\'m completely beyond help.',
        clinicalAnalysis: 'Toxic positivity and premature behavioral cheerleading invalidate the neurovegetative weight of adult depression, reinforcing core beliefs of defectiveness and hopelessness.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'When depression takes over, it whispers that nothing will ever feel good again and that attempting even small things is pointless. What if we don\'t aim for 100% happiness right away, but treat a 10-minute walk like a scientific experiment—rating your sense of Pleasure and Mastery from 0 to 10 before and after, just to test what depression is predicting?',
        authenticClientReaction: '*[Lifts head, eyes softening with quiet curiosity, a subtle release of shoulder tension]* Framing it as a test instead of a chore... that feels different. Depression tells me it\'ll be a zero. I guess I could walk around the block for 10 minutes and see if it stays at zero or ticks up to a two.',
        clinicalAnalysis: 'Collaborative empiricism paired with low-stakes Mastery/Pleasure behavioral activation bypasses depressive all-or-nothing resistance and generates experiential counter-evidence.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Lifts gaze from floor; heavy posture subtly straightens]*',
          '*[Nods thoughtfully with faint glimmer of hope in eyes]*',
          '*[Picks up pen to record baseline Mastery and Pleasure ratings on the activity worksheet]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-workplace-cultural-dharma-cognitive-emotional-regulation',
    domainTrack: 'workplace',
    theme: 'Multicultural Cognitive-Emotional Regulation (CER), Duty/Dharma Conflict & Micro vs. Macro Environment',
    sourceNote: 'Indian Indigenous & Multicultural Counseling Framework (Kashyap, 2025): Acute moral conflict, limbic freeze/flee reactions, duty (*dharma*) versus personal grief/guilt, distinguishing macro-environment chaos from micro-environment sovereignty, and positive reappraisal beyond Western individualistic outcome obsession',
    clientArchetype: {
      ageRange: '30-50',
      defenseMechanisms: ['Limbic overwhelm / somatic freeze (trembling, feeling overwhelmed by systemic injustice)', 'Survivor guilt & moral anguish ("How can I do my job while people I care about are suffering?")', 'Outcome fixation / catastrophizing macro-level organizational collapse'],
      typicalSpeechPatterns: ['"I feel paralyzed—part of me wants to walk away, but another part feels a deep duty to stay"', '"How am I supposed to just focus on my work when everything around me is falling apart?"', '"I feel like a coward for just trying to survive this"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need to look out for number one. Update your resume, detach completely from the company, and quiet-quit until you find another job.',
        authenticClientReaction: '*[Jaw tightens, eyes flashing with wounded pride]* Just "quiet quit" and look out for number one? That goes against everything I believe in. In my culture and my family, you don\'t abandon your responsibilities or your juniors who are counting on you just because things are hard. If that\'s your advice, you don\'t understand who I am.',
        clinicalAnalysis: 'Imposing individualistic, transactional Western coping ("just look out for yourself") violates the client\'s cultural values around duty (*dharma*), loyalty, and collective integrity.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'You are caught in a deep ethical battlefield—feeling the immense weight of your duty to support your remaining team, while wrestling with grief and survivor guilt over the colleagues who were cut. Even if you cannot control the macro-chaos of executive decisions, what would it look like to honor your own integrity and duty in your daily micro-environment without taking on the burden of saving the entire system?',
        authenticClientReaction: '*[Exhales a long, trembling breath, posture softening as tension leaves neck]* Hearing you frame it as a duty rather than me just being a pushover... that resonates deeply. I\'ve been killing myself trying to fix the unfixable macro-mess. If I focus on doing right by my immediate team and protecting my own energy, I can fulfill my duty without letting the company destroy my soul.',
        clinicalAnalysis: 'Integrating culturally resonant concepts of duty (*dharma*), differentiating macro-chaos from micro-environment agency, and validating relational integrity restores equilibrium and facilitates adaptive CER.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Unclenches jaw and lowers rigid shoulders]*',
          '*[Nods with deep contemplative recognition]*',
          '*[Places hand on heart with grounded composure, refocusing on internal sphere of control]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-general-marital-trauma-vulnerability-defenses',
    domainTrack: 'general',
    theme: 'Marital Disharmony, Trauma Vulnerability Defenses & The Passive-Aggressive Withdrawal Trap',
    sourceNote: 'Psychotherapy of Marital Disharmony & Attachment Trauma (Psychological Counsellor Case Series): Hostile/nasty exterior acting as a defense mechanism against deep unresolved vulnerability/trauma, passive withdrawal and withholding affection as covert punishment, and restructuring family-of-origin schemas to slow down reactivity and rebuild emotional intimacy',
    clientArchetype: {
      ageRange: '35-55',
      defenseMechanisms: ['Hostile/sour defensive armor protecting against catastrophic vulnerability and grief', 'Passive-aggressive emotional withholding ("I just don\'t feel motivated to be affectionate with her")', 'Demand-withdraw interactional dance fueled by unaddressed family-of-origin schemas and enmeshment'],
      typicalSpeechPatterns: ['"She is a street angel and a house devil"', '"Whenever she starts snapping, I just shut down, watch TV, and stay at work late"', '"I can\'t remember the last time we were genuinely soft or affectionate with each other"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You two just need to stop fighting over chores, schedule a Friday date night, and make a rule that no one brings up each other\'s mothers.',
        authenticClientReaction: '*[Leans back, shaking head with a cold, hollow smirk]* A Friday date night? If we sit across a restaurant table right now, we won\'t make it to the appetizers without one of us storming out. Scheduling a dinner doesn\'t fix the fact that she treats me with venom, and I\'ve completely checked out.',
        clinicalAnalysis: 'Superficial behaviorist tips ("date night") bypass deep-seated defensive shields, unaddressed attachment injuries, and covert emotional withholding.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'When you describe her harsh, prickly exterior feeling like a sudden threat, and your instinct to pull back and go silent, it sounds like both of you have built high defensive walls. Could her sharp exterior be a protective armor guarding against deep vulnerability, and your withdrawal be the only way you feel you can keep from breaking down?',
        authenticClientReaction: '*[Freezes, eyes softening as tears well up, twisting wedding ring slowly]* Wow... I never looked at it that way. When she gets nasty, I just see anger and I punish her with silence. But knowing what she\'s lost in her past... maybe her harshness is terror, and my checking out is proving to her that nobody stays. How do we actually start talking without those shields?',
        clinicalAnalysis: 'Reframing hostile marital defenses as protective armor over profound vulnerability deconstructs the demand-withdraw cycle and creates safety for conjoint schema repair.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Stops fidgeting with wedding ring; looks up with open, vulnerable eye contact]*',
          '*[Heavy defensive sigh transitions into relaxed, steady breathing]*',
          '*[Nods slowly with genuine empathy when viewing the partner\'s defense mechanisms]*',
        ],
      },
    },
  },
  {
    id: 'exemplar-school-smartphone-addiction-iacbt',
    domainTrack: 'school',
    theme: 'Educational Counseling, Smartphone Addiction & Indigenously Adapted CBT (IACBT-ESU)',
    sourceNote: 'Counselling in Education Case Study (Sultana, Seema, & Saleem, 2024 / Peshawar, Pakistan): University student screen addiction, chronic nocturnal scrolling (3-4 AM), somatic deterioration (eye strain, joint pain, fatigue), social avoidance driven by core belief ("No one is interested in me / everyone dislikes me") as an escape from family conflict, and recovery via educator-counselor active listening, cognitive restructuring, and behavioral substitution',
    clientArchetype: {
      ageRange: '18-24',
      defenseMechanisms: ['Digital emotional escape / experiential avoidance (scrolling to avoid interpersonal tension)', 'Internalized rejection schema ("No one actually cares about me, they only judge me")', 'Denial and minimizing screen time ("It\'s just what everyone my age does")'],
      typicalSpeechPatterns: ['"I feel like my phone is the only thing that doesn\'t judge me or demand things from me"', '"Whenever family starts arguing or criticizing, I just go to my room, put my headphones on, and scroll until 4 AM"', '"I know my grades are falling and my eyes burn, but without my screen I feel completely empty and anxious"'],
    },
    demonstrations: {
      whenCounselorAdvisesPrematurely: {
        counselorSnippet: 'You just need discipline. Delete all your social media apps, put your phone in another room at 9 PM, and force yourself to study 3 hours every day.',
        authenticClientReaction: '*[Pulls smartphone closer, clutching it against chest with defensive irritation]* If it were that simple, don\'t you think I would have done it? When you say "just delete your apps", it tells me you don\'t understand that my phone is my only buffer against the noise and criticism in my house. Taking it away without fixing why I\'m running to it will just make me panic.',
        clinicalAnalysis: 'Prescriptive behavioral prohibition without exploring the functional emotional escape or the core rejection schema triggers defiance and intensifies addiction shame.',
      },
      whenCounselorValidatesOrReflects: {
        counselorSnippet: 'Your phone started as a safe harbor—a quiet place where you could escape the constant family tension and the exhausting feeling that people were judging or disliking you. It makes total sense why scrolling late into the night felt like your only protection, even as it started stealing your sleep, your health, and your studies. What would it look like if we worked together to create real safety in your daily life so you don\'t have to hide behind the screen to survive?',
        authenticClientReaction: '*[Sets phone facedown on the table, tears welling in eyes with a long, trembling breath]* That\'s exactly it... Nobody in my family asked why I was in my room; they just yelled at me for being lazy. I was using it to survive the criticism. Knowing you understand that makes me feel like I\'m not just a broken addict. I really want to get my life and my degree back.',
        clinicalAnalysis: 'Validating the adaptive emotional origin of screen avoidance while introducing collaborative CBT restructuring and behavioral substitution dissolves shame and sparks intrinsic motivation for recovery.',
      },
      somaticTransitions: {
        state: 'softening',
        somaticCues: [
          '*[Places smartphone facedown on the desk and pulls hands away from it]*',
          '*[Wipes eyes and sits upright with engaged, hopeful eye contact]*',
          '*[Breathes deeply, relaxing previously tight shoulder and neck muscles]*',
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
