import React from 'react';
import { StudentProfile } from '../types';
import { Sparkles, Moon, Sun, Compass, Play, RefreshCw } from 'lucide-react';

interface NavbarProps {
  profile: StudentProfile | null;
  activeTab: 'simulator' | 'readiness' | 'resume' | 'profile';
  setActiveTab: (tab: 'simulator' | 'readiness' | 'resume' | 'profile') => void;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onReset: () => void;
  onOpenReadiness: () => void;
  onTriggerBookAnimation?: () => void;
  onEditProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  demoMode,
  setDemoMode,
  darkMode,
  setDarkMode,
  onReset,
  onOpenReadiness,
  onTriggerBookAnimation,
  onEditProfile
}) => {
  return (
    <div className="w-full space-y-3 no-print">
      {/* TOP HEADER BAR (From Reference Image) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-2">
        {/* Left: ROLE: Career Path Simulator Denim Patch */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3452] border-2 border-dashed border-cyan-400 text-white shadow-md relative group">
          <span className="text-lg">🚀</span>
          <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase font-mono">
            ROLE: Career Path Simulator
          </span>
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600"></div>
        </div>

        {/* Center: Three Futures, One Student (Linen/Burlap Patch) */}
        <div className="flex-1 max-w-xl text-center px-6 py-2 rounded-xl bg-[#f5e9d3] dark:bg-[#2e261b] border-2 border-dashed border-[#b89567] dark:border-[#85653b] shadow-md relative">
          <h1 className="text-base sm:text-lg font-black text-[#382613] dark:text-[#f7e6ce] tracking-tight">
            Three Futures, One Student
          </h1>
          {/* Subtle stitch pins */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#8c6b45]"></div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#8c6b45]"></div>
        </div>

        {/* Right: Demo Mode & Dark/Light Stitched Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Demo Mode Stitched Capsule */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#1a2f4c] border-2 border-dashed border-cyan-400 text-white text-xs font-bold shadow-md">
            <span>Demo Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-emerald-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
            {/* Small green sewn button hole */}
            <div className="wooden-button !w-5 !h-5 !text-[8px]"></div>
          </div>

          {/* Dark / Light Stitched Oval Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#581c87] border-2 border-dashed border-pink-400 text-pink-200 hover:text-white text-xs font-bold shadow-md transition-all active:scale-95"
            title="Toggle Dark / Light Theme"
          >
            <div className="wooden-button !w-4 !h-4 !text-[7px]"></div>
            <span>Dark/Light</span>
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Prominent Magical Book Loading Animation Button */}
          {onTriggerBookAnimation && (
            <button
              onClick={onTriggerBookAnimation}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 via-purple-600/30 to-blue-600/30 hover:from-amber-500/50 hover:to-blue-600/50 border-2 border-dashed border-amber-300 text-amber-200 hover:text-white text-xs font-black shadow-[0_0_18px_rgba(245,158,11,0.5)] transition-all transform hover:scale-105 active:scale-95 group"
              title="Play 3D Magical Tome Loading Animation (from video)"
            >
              <span className="text-base animate-bounce">📖</span>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-black tracking-wide text-amber-300 group-hover:text-white">Loading Animation</span>
                <span className="text-[9px] text-amber-200/70 font-mono">Click to preview</span>
              </div>
            </button>
          )}

          {/* New Profile Reset */}
          {profile && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-xl bg-rose-900/40 border border-dashed border-rose-400 text-rose-300 hover:text-white transition-colors"
              title="Reset Profile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* EMBROIDERY PROGRESS BAR WITH NEEDLE & THREAD (From Reference Image) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#14233a] border border-slate-700/80 shadow-md">
        {/* Glowing Cyan-to-Magenta Thread Bar */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 h-3.5 bg-slate-900/90 rounded-full p-0.5 border border-slate-700 relative overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative"
              style={{
                width: profile ? '100%' : '35%',
                background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 35%, #a855f7 70%, #ec4899 100%)',
                boxShadow: '0 0 12px rgba(236, 72, 153, 0.6)'
              }}
            >
              {/* Highlight glimmer */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Right Needle and Curled Thread */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 flex-shrink-0">
          <span>Career ID creation</span>
          <span className="text-cyan-400 font-extrabold">{profile ? '100%' : '35%'}</span>
          {/* Silver Needle Graphic & Thread Curl */}
          <div className="flex items-center relative pl-1">
            <span className="text-base select-none">🪡</span>
            <svg className="w-6 h-4 text-cyan-400 overflow-visible" viewBox="0 0 24 16">
              <path
                d="M 0,8 Q 6,0 12,8 T 24,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3,2"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* STUDENT PROFILE PILL STRIP */}
      {profile && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-[#1d3557] border-2 border-dashed border-cyan-500/70 text-xs text-slate-200 shadow-md">
          <div className="flex items-center gap-2.5">
            {/* Student Avatar */}
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              👨‍🎓
            </div>
            <span className="font-extrabold text-white text-sm">
              {profile.name}
            </span>
            <span className="text-slate-400">•</span>
            <span>{profile.branch}, Year {profile.yearOfStudy}</span>
            <span className="text-slate-400">•</span>
            <span className="font-bold text-cyan-300">CGPA: {profile.cgpa}</span>
            <span className="text-slate-400">•</span>
            <span>{profile.hoursPerWeek} hrs/wk</span>
            <span className="text-slate-400">•</span>
            <span className="px-2 py-0.5 rounded-md bg-[#0f1d2e] border border-cyan-400 text-cyan-300 font-mono font-bold text-[11px]">
              {profile.careerId}
            </span>
            <button
              onClick={() => {
                if (onEditProfile) onEditProfile();
                else setActiveTab('profile');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/80 text-amber-200 text-[11px] font-bold transition-all ml-1 shadow-sm active:scale-95"
              title="Edit Profile (plays 8-second magical tome animation)"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                  : 'bg-[#15273f] text-slate-300 border-slate-600 hover:border-cyan-400'
              }`}
            >
              Futures Dashboard
            </button>
            <button
              onClick={onOpenReadiness}
              className={`px-3 py-1 rounded-lg border transition-all ${
                activeTab === 'readiness'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                  : 'bg-[#15273f] text-slate-300 border-slate-600 hover:border-cyan-400'
              }`}
            >
              Readiness Quiz
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                activeTab === 'resume'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                  : 'bg-[#15273f] text-slate-300 border-slate-600 hover:border-cyan-400'
              }`}
            >
              ATS Resume
            </button>
            <button
              onClick={() => {
                if (onEditProfile) onEditProfile();
                else setActiveTab('profile');
              }}
              className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                activeTab === 'profile'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                  : 'bg-[#15273f] text-slate-300 border-slate-600 hover:border-cyan-400'
              }`}
              title="Edit Profile (shows 8-second 3D loading animation)"
            >
              <span>Edit Profile</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono">8s</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
