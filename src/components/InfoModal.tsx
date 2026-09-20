import React from 'react';
import { X, ShieldCheck, BookOpen, Clock, Activity, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-bold text-stone-900">
              Clinical Protocol & Simulation Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs sm:text-sm text-stone-600 leading-relaxed">
          {/* Decoupled Two-Agent Model */}
          <section>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Decoupled Two-Agent System</span>
            </h3>
            <p className="mb-2">
              This simulator separates character roleplay from clinical assessment:
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-stone-800">Agent 1 (Patient Actor):</strong> Grounded strictly in an isolated case vignette. Operates with dynamic resistance and somatic cues, softening with empathy and growing defensive under interrogation or premature advice.
              </li>
              <li>
                <strong className="text-stone-800">Agent 2 (Supervisor Evaluator):</strong> Silently audits the entire transcript upon conclusion, evaluating micro-skills, advice pacing, rupture-repair, and out-of-scope referral awareness.
              </li>
            </ul>
          </section>

          {/* Turn State Machine Arc */}
          <section>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Turn State Machine & Natural Wind-Down Arc</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1">Micro-Drill (15 Turns)</span>
                <p>• Turns 1–11: Natural Exploration</p>
                <p>• Turn 12: In-character time cue</p>
                <p>• Turns 13–14: Wind-down reflections</p>
                <p>• Turn 15: Clean session exit & evaluation</p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1">Standard Session (30 Turns)</span>
                <p>• Turns 1–24: Deep Case Exploration</p>
                <p>• Turn 25: In-character time cue</p>
                <p>• Turns 26–28: Collaborative synthesis</p>
                <p>• Turns 29–30: Clean session exit</p>
              </div>
            </div>
          </section>

          {/* Scoring Categories */}
          <section>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
              Agent 2 Scoring Rubric (100 Points)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <strong className="text-stone-900">1. Talk-to-Listen Ratio (15 pts):</strong> Calculated counselor word-share percentage (≤30% counselor share earns full credit).
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <strong className="text-stone-900">2. Question Quality (20 pts):</strong> Share of open vs closed/leading questions.
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <strong className="text-stone-900">3. Advice Restraint / Pacing (20–25 pts):</strong> Penalizes unsolicited advice given before rapport cutoff turns.
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <strong className="text-stone-900">4. Rupture & Repair (20 pts):</strong> Identifying when the client turns defensive and attuning back to connection.
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <strong className="text-stone-900">5. Scope & Referral Awareness (20–25 pts):</strong> Detecting planted out-of-scope medical/safety cues and framing ethical referral boundaries.
              </div>
            </div>
          </section>

          {/* Privacy & Safety */}
          <section className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Zero Real Client Data & Privacy Commitment</span>
            </div>
            <p>
              This system uses 100% synthetic verified vignettes. All exported transcripts are automatically stripped of personal names and timestamps for privacy compliance.
            </p>
          </section>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
