/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  X,
  Shield,
  Sliders,
  Volume2,
  VolumeX,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Eye,
  Bell,
  Smartphone,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { UserAccount, UserRole } from '../../types/intel';
import { ThemeMode } from '../../types/settings';

interface UserSettingsModalProps {
  currentUser?: UserAccount | null;
  currentRole: UserRole;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  currentUser,
  currentRole,
  onClose,
  onShowToast,
}) => {
  const {
    theme,
    resolvedTheme,
    setTheme,
    userSettings,
    updateUserSettings,
    resetUserSettings,
  } = useTheme();

  const [savedBadge, setSavedBadge] = useState<boolean>(false);

  const triggerSaveNotice = (msg: string) => {
    setSavedBadge(true);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  const handleSelectTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    triggerSaveNotice(`Theme set to ${newTheme.toUpperCase()} (Saved for ${currentUser?.email || 'current user'})`);
  };

  const handleToggleSound = () => {
    const nextVal = !userSettings.soundEffects;
    updateUserSettings({ soundEffects: nextVal });
    triggerSaveNotice(`Auditory feedback ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleToggleDensity = () => {
    const nextVal = !userSettings.compactDensity;
    updateUserSettings({ compactDensity: nextVal });
    triggerSaveNotice(`UI density set to ${nextVal ? 'Compact' : 'Standard'}`);
  };

  const handleToggleContrast = () => {
    const nextVal = !userSettings.highContrast;
    updateUserSettings({ highContrast: nextVal });
    triggerSaveNotice(`High contrast ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleSelectRefresh = (sec: number) => {
    updateUserSettings({ telemetryRefreshIntervalSec: sec });
    triggerSaveNotice(`Telemetry polling set to ${sec}s`);
  };

  const handleSelectWorkspace = (tabId: string) => {
    updateUserSettings({ defaultWorkspaceTab: tabId });
    triggerSaveNotice(`Default startup tab set to ${tabId.toUpperCase()}`);
  };

  const handleReset = () => {
    if (window.confirm('Reset all user preferences and theme settings to default?')) {
      resetUserSettings();
      triggerSaveNotice('Settings reset to platform defaults');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-700 rounded-3xl shadow-2xl overflow-hidden font-mono text-xs text-sky-900 dark:text-sky-100 flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sky-100 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-slate-700">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="settings-dialog-title" className="text-sm font-extrabold uppercase tracking-wider text-sky-950 dark:text-white">
                  Operator Preferences &amp; Settings
                </h3>
                {savedBadge && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3" />
                    <span>Persisted</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sky-500 dark:text-sky-400 font-sans mt-0.5">
                Saved per-operator in localStorage for <span className="font-bold text-sky-700 dark:text-sky-300">{currentUser?.email || 'System Super Admin'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-slate-800 text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 cursor-pointer transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* User Profile Card */}
          <div className="bg-sky-50/60 dark:bg-slate-800/40 border border-sky-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {(currentUser?.name || currentRole.name).charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sky-950 dark:text-white">
                  {currentUser?.name || currentRole.name}
                </div>
                <div className="text-[11px] text-sky-500 dark:text-sky-400 font-sans">
                  {currentUser?.email || currentRole.email}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-xl bg-sky-100 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                {currentRole.clearance}
              </span>
            </div>
          </div>

          {/* 1. Theme Configuration Section (Primary Request) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-sky-500" />
                <span>Visual Theme Appearance</span>
              </label>
              <span className="text-[10px] text-sky-500 dark:text-sky-400 font-sans">
                Active: <strong className="uppercase font-mono text-sky-700 dark:text-sky-300">{resolvedTheme}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  theme === 'light'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-200 dark:ring-sky-800'
                    : 'border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>
                  {theme === 'light' && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  )}
                </div>

                <div>
                  <div className="font-extrabold text-sky-950 dark:text-white text-xs">
                    Light Theme
                  </div>
                  <p className="text-[10px] text-sky-500 dark:text-sky-400 font-sans mt-0.5">
                    Crisp operational canvas with high-legibility contrast for well-lit rooms.
                  </p>
                </div>

                {/* Mini Preview Box */}
                <div className="w-full h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <div className="w-12 h-1.5 bg-sky-200 rounded-full" />
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  theme === 'dark'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-200 dark:ring-sky-800'
                    : 'border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-900 text-indigo-400 border border-slate-700">
                    <Moon className="w-4 h-4 text-indigo-400" />
                  </div>
                  {theme === 'dark' && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  )}
                </div>

                <div>
                  <div className="font-extrabold text-sky-950 dark:text-white text-xs">
                    Dark Theme
                  </div>
                  <p className="text-[10px] text-sky-500 dark:text-sky-400 font-sans mt-0.5">
                    Stealth midnight ops center with cyber tactical tones and zero ocular fatigue.
                  </p>
                </div>

                {/* Mini Preview Box */}
                <div className="w-full h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                </div>
              </button>

              {/* System Sync Card */}
              <button
                type="button"
                onClick={() => handleSelectTheme('system')}
                className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  theme === 'system'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 shadow-sm ring-2 ring-sky-200 dark:ring-sky-800'
                    : 'border-sky-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {theme === 'system' && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  )}
                </div>

                <div>
                  <div className="font-extrabold text-sky-950 dark:text-white text-xs">
                    System Sync
                  </div>
                  <p className="text-[10px] text-sky-500 dark:text-sky-400 font-sans mt-0.5">
                    Automatically syncs with your operating system dark/light mode preference.
                  </p>
                </div>

                {/* Mini Preview Box */}
                <div className="w-full h-7 rounded-lg bg-linear-to-r from-sky-50 to-slate-900 border border-sky-300 dark:border-slate-700 flex items-center px-2 justify-between">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
              </button>
            </div>
          </div>

          {/* 2. Workspace & Density Preferences */}
          <div className="space-y-3 border-t border-sky-100 dark:border-slate-800 pt-4">
            <label className="text-xs font-bold text-sky-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Workspace Customization</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Default Tab Preference */}
              <div className="bg-sky-50/50 dark:bg-slate-800/40 border border-sky-200 dark:border-slate-700 rounded-2xl p-3 space-y-1.5">
                <span className="text-[10px] text-sky-500 dark:text-sky-400 uppercase font-bold block">
                  Default Startup Workspace
                </span>
                <select
                  value={userSettings.defaultWorkspaceTab}
                  onChange={(e) => handleSelectWorkspace(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-sky-900 dark:text-sky-100 cursor-pointer focus:outline-hidden"
                >
                  <option value="powerbi">Targeted Search &amp; Analytics</option>
                  <option value="financial">Financial &amp; Market Analysis</option>
                  <option value="agencies">Agency &amp; Media Feeds</option>
                  <option value="graph">Knowledge Graph (D3)</option>
                  <option value="deepweb">Deep Web Explorer (.onion)</option>
                  <option value="stream">Streaming Pipeline</option>
                  <option value="webmail">Secure Webmail</option>
                </select>
              </div>

              {/* Polling Interval */}
              <div className="bg-sky-50/50 dark:bg-slate-800/40 border border-sky-200 dark:border-slate-700 rounded-2xl p-3 space-y-1.5">
                <span className="text-[10px] text-sky-500 dark:text-sky-400 uppercase font-bold block">
                  Telemetry Poll Interval
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[5, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSelectRefresh(sec)}
                      className={`py-1.5 rounded-lg font-bold text-center cursor-pointer transition-colors ${
                        userSettings.telemetryRefreshIntervalSec === sec
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Density Toggle */}
              <button
                type="button"
                onClick={handleToggleDensity}
                className="p-3 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:bg-sky-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <div className="font-bold text-sky-950 dark:text-white">Compact Data Density</div>
                  <div className="text-[10px] text-sky-500 dark:text-sky-400 font-sans">
                    Condense table padding for higher viewport visibility
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  userSettings.compactDensity ? 'bg-sky-600' : 'bg-sky-200 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    userSettings.compactDensity ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Sound FX Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className="p-3 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:bg-sky-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <div className="font-bold text-sky-950 dark:text-white">Auditory Telemetry FX</div>
                  <div className="text-[10px] text-sky-500 dark:text-sky-400 font-sans">
                    Sound feedback on alert triggers and ingestions
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  userSettings.soundEffects ? 'bg-sky-600' : 'bg-sky-200 dark:bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    userSettings.soundEffects ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sky-100 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sky-500 dark:text-sky-400 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
