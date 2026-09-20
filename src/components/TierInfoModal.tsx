import React from 'react';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Award
} from 'lucide-react';
import { UserProfile } from '../types';

interface TierInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
}

export const TierInfoModal: React.FC<TierInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  const isPremium = currentUser?.isPremium;
  const isAdmin = currentUser?.isAdmin;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isAdmin
            ? 'bg-amber-950 text-white border-amber-900'
            : isPremium
            ? 'bg-gradient-to-r from-amber-900 to-amber-950 text-white border-amber-800'
            : 'bg-stone-900 text-white border-stone-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : isPremium
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
            }`}>
              {isAdmin ? (
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              ) : isPremium ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-teal-300" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Account Supervision Plan
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAdmin
                    ? 'bg-amber-500 text-stone-950'
                    : isPremium
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-teal-400 text-teal-950'
                }`}>
                  {isAdmin ? 'ADMINISTRATOR' : isPremium ? 'PREMIUM TIER' : 'FREE TIER'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5 text-white">
                {isAdmin
                  ? 'Administrator Authority Hub'
                  : isPremium
                  ? 'Premium Clinical Supervision Active'
                  : 'Free Tier (Standard Access)'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-700 text-sm">
          {/* Active User Info Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Signed-In Profile
              </span>
              <p className="font-semibold text-stone-900 mt-0.5 text-sm">
                {currentUser?.name || 'Standard Guest / Prospective Trainee'}
              </p>
              {currentUser?.email && (
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  {currentUser.email}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Current Tier
              </span>
              <div className="mt-0.5">
                {isPremium ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Crown className="w-3.5 h-3.5 text-amber-700" />
                    <span>Premium Tier</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-800 border border-stone-300">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>Free Tier</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tier Comparison Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Feature Matrix & Tier Entitlements
            </h3>

            {/* Free Tier Features */}
            <div className={`p-4 rounded-2xl border transition-all ${
              !isPremium
                ? 'bg-teal-50/50 border-teal-200 ring-1 ring-teal-500/20'
                : 'bg-white border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-stone-900">Free Tier (Included for Everyone)</span>
                </div>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                  Included
                </span>
              </div>
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Full Dual-Agent Simulation:</strong> Complete live conversational practice with Agent 1 patient persona.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>All Vignette Tracks:</strong> School Counseling, Workplace/EAP, CBT Fundamentals, and General Relationship cases.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Phase 1 Quantitative Scoring:</strong> Headline score (0-100), band ranking, and modality-weighted category subtotals.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Clinical Conversational Metrics:</strong> Talk-to-Listen ratio, Question Distribution (open vs closed/leading), and Premature Advice Timing radar.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Transcript Download:</strong> Export de-identified session logs for personal deliberate study.</span>
                </li>
              </ul>
            </div>

            {/* Premium Tier Features */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isPremium
                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-500/20'
                : 'bg-stone-50/70 border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-stone-900">Premium Tier (Advanced Supervision)</span>
                </div>
                {isPremium ? (
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active on your account</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Supervisor Assignment</span>
                  </span>
                )}
              </div>
              <ul className="space-y-2 text-xs text-stone-600">
                <li className="flex items-start space-x-2">
                  {isPremium ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-700/60 shrink-0 mt-0.5" />
                  )}
                  <span><strong>Phase 2 Qualitative Clinical Supervision:</strong> Narrative supervisory diagnostic critique and pedagogical feedback.</span>
                </li>
                <li className="flex items-start space-x-2">
                  {isPremium ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-700/60 shrink-0 mt-0.5" />
                  )}
                  <span><strong>Cognitive Distortion Diagnosis:</strong> Precise cataloging of patient distortions (catastrophizing, mind-reading, emotional reasoning) and counselor reframing efficacy.</span>
                </li>
                <li className="flex items-start space-x-2">
                  {isPremium ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-700/60 shrink-0 mt-0.5" />
                  )}
                  <span><strong>Alliance Rupture & Attunement Analysis:</strong> Identifies patient withdrawal or confrontation moments with recovery ratings.</span>
                </li>
                <li className="flex items-start space-x-2">
                  {isPremium ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-700/60 shrink-0 mt-0.5" />
                  )}
                  <span><strong>Turn-by-Turn Supervisory Critical Micro-Interventions:</strong> Concrete model counselor phrasing for your pivotal session turns.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Upgrade & Administration Notice */}
          <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200 text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-stone-800">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>How Tier Assignments Work</span>
            </div>
            <p className="leading-relaxed">
              {isPremium ? (
                <span>
                  Your account currently holds <strong>Premium Practitioner</strong> status. Full clinical supervision reports will be generated upon concluding any simulation scenario.
                </span>
              ) : (
                <span>
                  All practitioners start on the <strong>Free Tier</strong> with full simulation and quantitative assessment capabilities. Premium Tier supervision is assigned by institutional supervisors or administrator <strong>Athul Govind</strong> via the Administrator Hub.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
