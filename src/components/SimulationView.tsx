import React, { useState } from 'react';
import { CareerPath, SimulationResult, StudentProfile } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  CircleDot,
  Compass,
  Code2,
  BrainCircuit,
  BarChart3,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Target,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Database
} from 'lucide-react';

interface SimulationViewProps {
  simulation: SimulationResult | null;
  profile: StudentProfile;
  isLoading: boolean;
  onRunSimulation: () => void;
  onOpenReadiness: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  simulation,
  profile,
  isLoading,
  onRunSimulation,
  onOpenReadiness,
}) => {
  const [selectedPathId, setSelectedPathId] = useState<'full_stack' | 'ai_ml' | 'data_science' | 'data_engineering'>('full_stack');
  const [activeDetailTab, setActiveDetailTab] = useState<'roadmap' | 'gaps' | 'projects' | 'action_plan' | 'resources'>('roadmap');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <Cpu className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Simulating Three Futures for {profile.name}...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Analyzing {profile.branch} (Year {profile.yearOfStudy}), {profile.cgpa} CGPA, {profile.hoursPerWeek} hrs/week, {profile.skills.length} technical skills against Indian tech hiring benchmarks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 max-w-4xl mx-auto">
            {['Full Stack Developer', 'AI / ML Engineer', 'Data Scientist'].map((title, i) => (
              <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-3">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700/50 rounded-lg"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
          <Compass className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to Simulate Your Three Futures</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Generate customized roadmaps, milestone readiness, project suggestions, and 30-day plans.
          </p>
          <button
            onClick={onRunSimulation}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20"
          >
            Simulate My Three Futures
          </button>
        </div>
      </div>
    );
  }

  const allAvailablePaths = simulation.paths && simulation.paths.length > 0
    ? simulation.paths
    : [simulation.full_stack, simulation.data_science, simulation.ai_ml, simulation.data_engineering].filter(Boolean) as CareerPath[];

  const paths = allAvailablePaths;
  const bestFit = [...paths].sort((a, b) => b.matchScore - a.matchScore)[0] || paths[0];
  const activePath = paths.find((p) => (p.pathId || p.id) === selectedPathId) || paths[0];

  // Path styling definitions
  const pathConfig: Record<string, any> = {
    full_stack: {
      name: 'Full Stack Developer',
      accentColor: 'blue',
      gradient: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
      gaugeStroke: '#3b82f6',
      icon: Code2
    },
    ai_ml: {
      name: 'AI / ML Engineer',
      accentColor: 'violet',
      gradient: 'from-violet-600 to-purple-600',
      badgeBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      borderActive: 'border-violet-500 ring-2 ring-violet-500/20',
      gaugeStroke: '#8b5cf6',
      icon: BrainCircuit
    },
    data_science: {
      name: 'Data Scientist',
      accentColor: 'teal',
      gradient: 'from-teal-600 to-emerald-600',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      borderActive: 'border-teal-500 ring-2 ring-teal-500/20',
      gaugeStroke: '#14b8a6',
      icon: BarChart3
    },
    data_engineering: {
      name: 'Data Engineer',
      accentColor: 'amber',
      gradient: 'from-amber-600 to-orange-600',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
      gaugeStroke: '#f59e0b',
      icon: Database
    }
  };

  // Milestone statistics for current path
  const allMilestones = activePath.yearByYear.flatMap((y) => y.milestones);
  const achievedCount = allMilestones.filter((m) => m.status === 'achieved').length;
  const inProgressCount = allMilestones.filter((m) => m.status === 'in_progress').length;
  const remainingCount = allMilestones.filter((m) => m.status === 'remaining').length;
  const totalMilestones = allMilestones.length || 1;
  const achievedPercent = Math.round((achievedCount / totalMilestones) * 100);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Fallback Banner if using Sample Data */}
      {simulation.fallback && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              <strong>Showing Verified Sample Data:</strong> Gemini API key not present or demo mode active. Full interactive features, roadmaps, and charts are fully operational!
            </span>
          </div>
          <button
            onClick={onRunSimulation}
            className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-100 font-bold"
          >
            Re-simulate
          </button>
        </div>
      )}

      {/* Top Strip: Path Comparison & Best Fit */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Path Comparison</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                ★ Best Fit: {bestFit.title} ({bestFit.matchScore}%)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Three Projected Futures for {profile.name} ({profile.branch}, Year {profile.yearOfStudy})
            </h2>
          </div>

          {/* Quick Score Bars Comparison */}
          <div className="flex flex-wrap items-center gap-2">
            {paths.map((p) => {
              const pid = p.id || p.pathId || 'full_stack';
              const cfg = pathConfig[pid] || pathConfig.full_stack;
              const isSelected = selectedPathId === pid;
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPathId(pid as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <cfg.icon className="w-3.5 h-3.5" />
                  <span>{cfg.name.split(' ')[0]}</span>
                  <span className="font-extrabold">{p.matchScore}%</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* THREE / FOUR SIDE-BY-SIDE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {paths.map((path) => {
          const pid = path.id || path.pathId || 'full_stack';
          const cfg = pathConfig[pid] || pathConfig.full_stack;
          const isSelected = selectedPathId === pid;
          const PathIcon = cfg.icon;

          // Circular gauge calculations
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (path.matchScore / 100) * circumference;

          const pKey = (path.pathId || path.id || 'full_stack') as any;

          return (
            <div
              key={pKey}
              onClick={() => setSelectedPathId(pKey)}
              className={`cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border p-6 transition-all shadow-md hover:shadow-xl flex flex-col justify-between ${
                isSelected
                  ? `${cfg.borderActive} shadow-lg`
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header & Match Score Gauge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg ${cfg.badgeBg}`}>
                        <PathIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cfg.badgeBg}`}>
                        {path.badge || 'Simulated Path'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {path.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {path.subtitle}
                    </p>
                  </div>

                  {/* Circular Match Gauge */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-100 dark:text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={cfg.gaugeStroke}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {path.matchScore}%
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Match</span>
                    </div>
                  </div>
                </div>

                {/* Match Reason */}
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-4 line-clamp-3">
                  <strong>Why it fits:</strong> {path.matchReason}
                </p>

                {/* Day in the Life preview */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Day in the Life
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {path.dayInLife}
                  </p>
                </div>
              </div>

              {/* Card Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {path.yearByYear.length} Years · {path.projects.length} Projects
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPathId(pKey);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>View Details</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED ROADMAP & ACTION CENTER FOR ACTIVE PATH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Detail Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                Detailed Blueprint
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                {activePath.title} ({activePath.matchScore}% Fit)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {activePath.title} Roadmap & Implementation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {activePath.matchReason}
            </p>
          </div>

          {/* Quick CTA to Check Readiness */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onOpenReadiness}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Check My Skill Readiness
            </button>
          </div>
        </div>

        {/* Milestone Progress Bar Strip */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span className="text-slate-700 dark:text-slate-300">
              Milestone Coverage: <strong>{achievedPercent}% Achieved</strong>
            </span>
            <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${achievedPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {achievedCount} Achieved
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <CircleDot className="w-3.5 h-3.5" /> {inProgressCount} In Progress
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> {remainingCount} Remaining
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <div className="flex space-x-6 overflow-x-auto">
            {[
              { id: 'roadmap', label: 'Year-by-Year Roadmap', icon: Calendar },
              { id: 'gaps', label: 'Skill Gaps & Levels', icon: Target },
              { id: 'projects', label: 'Projects to Build', icon: Code2 },
              { id: 'action_plan', label: 'First 30 Days Plan', icon: Zap },
              { id: 'resources', label: 'Curated Free Resources', icon: BookOpen }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeDetailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="p-6 sm:p-8">
          {/* 1. ROADMAP TIMELINE */}
          {activeDetailTab === 'roadmap' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Milestones Timeline (Current Year → Graduation)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Milestones are auto-marked based on your existing skills and background achievements.
                  </p>
                </div>
              </div>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pl-6">
                {activePath.yearByYear.map((yr, idx) => (
                  <div key={idx} className="relative space-y-3">
                    {/* Year Marker */}
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                      Y{yr.academicYear}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {yr.year}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {yr.theme}
                          </h4>
                        </div>
                      </div>

                      {/* Milestones in this year */}
                      <div className="space-y-2.5 mt-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Key Milestones
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {yr.milestones.map((m, mIdx) => {
                            const isAchieved = m.status === 'achieved';
                            const isInProgress = m.status === 'in_progress';
                            return (
                              <div
                                key={mIdx}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                                  isAchieved
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                    : isInProgress
                                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {isAchieved ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : isInProgress ? (
                                  <CircleDot className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <span className="text-xs font-bold block">{m.title}</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(m.requiredSkills || []).map((rs, rIdx) => (
                                      <span
                                        key={rIdx}
                                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                      >
                                        {rs}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Skills to Learn */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Target Skills to Master in {yr.year}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {yr.skillsToLearn.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium"
                            >
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. SKILL GAPS & COMPARISON */}
          {activeDetailTab === 'gaps' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Skill Gaps & Industry Benchmark Levels
                </h3>
                <p className="text-xs text-slate-500">
                  Compares your current verified level (0-5) against the required proficiency for Day-1 placements and high-package roles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePath.skillGaps.map((gap, idx) => {
                  const currentPercent = (gap.currentLevel / 5) * 100;
                  const requiredPercent = (gap.requiredLevel / 5) * 100;
                  const priorityBadge =
                    gap.priority === 'high'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200'
                      : gap.priority === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {gap.skill}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityBadge}`}>
                          {gap.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      {/* Bar Comparison */}
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-0.5">
                            <span>Your Level</span>
                            <span>{gap.currentLevel} / 5</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${currentPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-0.5">
                            <span>Required Placement Level</span>
                            <span>{gap.requiredLevel} / 5</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${requiredPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PROJECTS TO BUILD */}
          {activeDetailTab === 'projects' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended Proof-of-Work Projects
                </h3>
                <p className="text-xs text-slate-500">
                  Engineered to stand out in technical resume screening and withstand deep-dive questions during placement interviews.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activePath.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        {proj.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          {proj.difficulty}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ~{proj.estimatedHours} hrs build time
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-semibold mr-1">Stack:</span>
                      {proj.techStack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. FIRST 30 DAYS ACTION PLAN */}
          {activeDetailTab === 'action_plan' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    First Month Action Plan (4-Week Sprint)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated for your schedule: {profile.hoursPerWeek} hours/week (~{(profile.hoursPerWeek / 7).toFixed(1)} hrs/day).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePath.firstMonthPlan.map((wk, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Week {wk.week}: {wk.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {wk.dailyHours} hrs/day
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Weekly Goals:</span>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {wk.goals.map((g, gIdx) => (
                          <li key={gIdx} className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs">
                      <strong className="text-indigo-900 dark:text-indigo-300 block text-[11px]">
                        Weekly Deliverable:
                      </strong>
                      <span className="text-indigo-800 dark:text-indigo-200">{wk.deliverable}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. CURATED FREE RESOURCES */}
          {activeDetailTab === 'resources' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Curated Free Learning Resources
                </h3>
                <p className="text-xs text-slate-500">
                  Verified stable learning links (Roadmap.sh, freeCodeCamp, CS50, NPTEL, Kaggle) tailored to this career path.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activePath.resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all group flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                          {res.isFree ? '100% Free' : 'Resource'}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">{res.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {res.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-1">{res.url}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
