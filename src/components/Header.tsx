import React, { useState } from 'react';
import { HelpCircle, Activity, ShieldCheck, Download, LogOut, Crown, Play, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { TierInfoModal } from './TierInfoModal';

interface HeaderProps {
  onShowInfoModal?: () => void;
  activeView: 'login' | 'setup' | 'simulation' | 'evaluating' | 'scorecard' | 'admin';
  onNewSession?: () => void;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  onOpenTrainingDb?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onShowInfoModal,
  activeView,
  onNewSession,
  currentUser,
  onOpenLogin,
  onOpenTrainingDb,
  onOpenAdmin,
  onLogout,
}) => {
  const isAdmin = currentUser?.isAdmin;
  const isPremium = currentUser?.isPremium;
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  return (
    <header id="app-header" className="w-full bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewSession}>
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 shrink-0">
            <Activity className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-semibold text-stone-900 tracking-tight text-base sm:text-lg">
                Conversational Counselling Trainer
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  <span>Admin Hub</span>
                </span>
              ) : isPremium ? (
                <button
                  id="header-premium-tier-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTierModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs cursor-pointer"
                  title="Supervision Level: Premium Tier (Full Qualitative Supervision Active). Click for details."
                >
                  <Crown className="w-3 h-3 text-amber-700 shrink-0" />
                  <span>Premium Tier</span>
                </button>
              ) : (
                <button
                  id="header-free-tier-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTierModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 transition-colors shadow-2xs cursor-pointer"
                  title="Supervision Level: Free Tier (Standard Practice). Click for details."
                >
                  <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                  <span>Free Tier</span>
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Dual-Agent Simulation • In-Character Patient & Supervisor Evaluator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin quick actions */}
          {isAdmin ? (
            <>
              {activeView === 'admin' ? (
                <button
                  id="header-switch-to-simulation-btn"
                  onClick={onNewSession}
                  className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-teal-600 bg-teal-700 hover:bg-teal-800 text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                  title="Launch Simulation Lab to practice or test cases"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Launch Simulation</span>
                  <span className="sm:hidden">Simulate</span>
                </button>
              ) : (
                <button
                  id="header-admin-db-btn"
                  onClick={onOpenAdmin || onOpenTrainingDb}
                  className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors flex items-center space-x-1.5 shadow-xs"
                  title="Open Admin Hub: View All Users, History, Premium Controls & Backup"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Admin Management Hub</span>
                  <span className="sm:hidden">Admin Hub</span>
                </button>
              )}

              <a
                id="header-quick-export-btn"
                href="/api/admin/backup/download"
                download
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center space-x-1.5"
                title="Download complete database backup snapshot (JSON)"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Backup DB</span>
              </a>

              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center space-x-1 text-xs"
                  title="Log out of Admin mode"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Normal Folks Profile / Tier Indicator Pill */}
              {currentUser ? (
                <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Trainee Session" />
                  <span className="font-semibold text-stone-800 hidden md:inline truncate max-w-[120px]" title={currentUser.name}>
                    {currentUser.name}
                  </span>
                  <span className="text-stone-300 hidden md:inline">•</span>
                  <button
                    id="header-user-tier-pill"
                    onClick={() => setIsTierModalOpen(true)}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      isPremium
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        : 'bg-stone-200 text-stone-700 border border-stone-300 hover:bg-stone-300'
                    }`}
                    title="Click to inspect tier entitlements"
                  >
                    {isPremium ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Premium</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-teal-700 shrink-0" />
                        <span>Free Tier</span>
                      </>
                    )}
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="text-stone-400 hover:text-stone-700 p-0.5 ml-0.5 transition-colors"
                      title="Sign out of current trainee profile"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsTierModalOpen(true)}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                  title="Click to view plan details"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Free Tier</span>
                </button>
              )}
            </>
          )}

          {activeView !== 'setup' && activeView !== 'login' && (
            <button
              id="header-new-session-btn"
              onClick={onNewSession}
              className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors"
            >
              Configure Case
            </button>
          )}

          <button
            id="header-info-btn"
            onClick={onShowInfoModal}
            aria-label="Clinical Protocol Information"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title="Simulation Protocol & Scoring Guidelines"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tier Details Inspection Modal */}
      <TierInfoModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        currentUser={currentUser}
      />
    </header>
  );
};
