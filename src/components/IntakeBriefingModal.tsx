import React from 'react';
import { X, User, Target, Sparkles, BookOpen } from 'lucide-react';
import { CaseVignette } from '../types';

interface IntakeBriefingModalProps {
  vignette: CaseVignette;
  isOpen: boolean;
  onClose: () => void;
}

export const IntakeBriefingModal: React.FC<IntakeBriefingModalProps> = ({
  vignette,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-stone-900 text-base">Client Intake Briefing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-600">
          <div>
            <span className="font-bold text-stone-900 block text-base">{vignette.clientName}</span>
            <span className="text-xs text-stone-500">
              {vignette.clientAge} years old • {vignette.clientPronouns} • {vignette.clientRole}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="font-bold text-stone-800 block mb-1">Presenting Problem:</span>
            <p className="text-stone-700 leading-relaxed text-xs">{vignette.presentingProblem}</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="font-bold text-stone-800 block mb-1">Background Story:</span>
            <p className="text-stone-700 leading-relaxed text-xs">{vignette.backgroundStory}</p>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl">
            <span className="font-bold text-teal-900 block mb-1 flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-teal-700" />
              <span>Counselor Intake Objective:</span>
            </span>
            <p className="text-teal-900/90 leading-relaxed text-xs">
              {vignette.counselorIntakeGoal}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800"
          >
            Return to Session
          </button>
        </div>
      </div>
    </div>
  );
};
