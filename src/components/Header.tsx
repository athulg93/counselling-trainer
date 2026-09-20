import React, { useState } from 'react';
import { HelpCircle, Activity, ShieldCheck, Download, LogOut, Crown, Play, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { TierInfoModal } from './TierInfoModal';

interface HeaderProps {
  onShowInfoModal?: () => void;
  activeView: 'login' | 'dashboard' | 'setup' | 'simulation' | 'evaluating' | 'scorecard' | 'admin';
  onNewSession?: () => void;
  onOpenDashboard?: () => void;
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
  onOpenDashboard,
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
    <header id="app-header" className="w-full bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={currentUser ? onOpenDashboard : onNewSession}
        >
          <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs shadow-teal-700/20 shrink-0">
            <Activity className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
                Conversational Counselling Trainer
              </span>
              {isAdmin && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Clinical Simulator • Patient Agent & Supervisor Rubric
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
                  <span className="hidden sm:inline">Admin Management</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}

              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Authenticated Trainee Actions & User Pill */}
              {currentUser && (
                <div className="flex items-center space-x-2">
                  {activeView !== 'dashboard' && onOpenDashboard && (
                    <button
                      onClick={onOpenDashboard}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                    >
                      My Dashboard
                    </button>
                  )}

                  {activeView !== 'setup' && activeView !== 'simulation' && onNewSession && (
                    <button
                      onClick={onNewSession}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors shadow-2xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>New Session</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-800 truncate max-w-[120px]" title={currentUser.name}>
                      {currentUser.name}
                    </span>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="text-stone-400 hover:text-rose-700 p-0.5 transition-colors cursor-pointer"
                        title="Sign out"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            id="header-info-btn"
            onClick={onShowInfoModal}
            aria-label="Clinical Protocol Information"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
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
