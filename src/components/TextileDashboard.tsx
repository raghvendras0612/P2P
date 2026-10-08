import React, { useState, useEffect } from 'react';
import { CareerPath, ChecklistItem, ChecklistStage, SimulationResult, StudentProfile } from '../types';
import {
  Sparkles,
  Check,
  X,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Code2,
  BrainCircuit,
  BarChart3,
  Database,
  Bot,
  MessageSquare,
  Award,
  TrendingUp,
  Layers
} from 'lucide-react';

interface TextileDashboardProps {
  simulation: SimulationResult | null;
  profile: StudentProfile;
  isLoading: boolean;
  onOpenRoadmapDetails: (pathId: 'full_stack' | 'ai_ml' | 'data_science' | 'data_engineering') => void;
  onOpenReadiness: () => void;
  onOpenMentorPrompt: (prompt: string) => void;
  onUpdateSkills: (newSkills: any[]) => void;
  onTriggerBookAnimation?: () => void;
  onEditProfile?: () => void;
  onChecklistChange?: (pathId: string, updatedChecklist: ChecklistItem[]) => void;
}

export const TextileDashboard: React.FC<TextileDashboardProps> = ({
  simulation,
  profile,
  isLoading,
  onOpenRoadmapDetails,
  onOpenReadiness,
  onOpenMentorPrompt,
  onUpdateSkills,
  onTriggerBookAnimation,
  onEditProfile,
  onChecklistChange
}) => {
  const [showAddCustomSkill, setShowAddCustomSkill] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [activePlanWeek, setActivePlanWeek] = useState(1);
  const [activeChecklistPathId, setActiveChecklistPathId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manage checklist states in localStorage under csp_checklist
  const [checklistsByPath, setChecklistsByPath] = useState<Record<string, ChecklistItem[]>>(() => {
    try {
      const saved = localStorage.getItem('csp_checklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading csp_checklist', e);
    }
    const initial: Record<string, ChecklistItem[]> = {};
    (simulation?.paths || []).forEach((p) => {
      initial[p.id] = p.checklist || [];
    });
    return initial;
  });

  useEffect(() => {
    if (simulation?.paths) {
      setChecklistsByPath((prev) => {
        const next = { ...prev };
        simulation.paths.forEach((p) => {
          if (!next[p.id] || next[p.id].length === 0) {
            next[p.id] = p.checklist || [];
          }
        });
        return next;
      });
    }
  }, [simulation]);

  useEffect(() => {
    try {
      localStorage.setItem('csp_checklist', JSON.stringify(checklistsByPath));
    } catch (e) {
      console.warn('Error saving csp_checklist', e);
    }
  }, [checklistsByPath]);

  // All 4 paths sorted by matchScore
  const paths: CareerPath[] = (simulation?.paths || []).map((p) => {
    const cl = checklistsByPath[p.id] || p.checklist || [];
    const totalGained = cl.reduce((acc, item) => acc + item.levelGained, 0) || 1;
    const checkedGained = cl.filter((i) => i.checked).reduce((acc, item) => acc + item.levelGained, 0);
    const progress = checkedGained / totalGained;

    const baseScore = p.baseMatchScore || p.matchScore;
    // Section 8 rule: matchScore = clamp(round(baseMatchScore + (98 - baseMatchScore) * (progress - baseProgress) / (1 - baseProgress)), 0, 98)
    const baseProgress = 0.25;
    const newScore = Math.min(
      98,
      Math.max(
        0,
        Math.round(baseScore + (98 - baseScore) * ((progress - baseProgress) / (1 - baseProgress || 0.01)))
      )
    );

    return {
      ...p,
      matchScore: newScore,
      checklist: cl
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const featuredThree = paths.slice(0, 3);
  const fourthPath = paths[3] || null;

  const handleToggleChecklistItem = (pathId: string, itemId: string) => {
    const currentList = checklistsByPath[pathId] || [];
    const item = currentList.find((i) => i.id === itemId);
    if (!item) return;

    const nextChecked = !item.checked;
    const updated = currentList.map((i) => (i.id === itemId ? { ...i, checked: nextChecked } : i));

    setChecklistsByPath({
      ...checklistsByPath,
      [pathId]: updated
    });

    if (onChecklistChange) {
      onChecklistChange(pathId, updated);
    }

    // Check if stage is 100% complete for celebration
    const stageItems = updated.filter((i) => i.stage === item.stage);
    const stageAllDone = stageItems.every((i) => i.checked);
    if (stageAllDone && nextChecked) {
      setToastMessage(`🎉 Stage "${item.stage.toUpperCase()}" 100% completed! Next up: ${item.stage === 'foundation' ? 'Build' : 'Specialize'}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleAddNewSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;
    const trimmed = newSkillText.trim();
    if (!profile.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      onUpdateSkills([
        ...profile.skills,
        { name: trimmed, level: 'Intermediate', verified: false }
      ]);
      setToastMessage(`Added "${trimmed}" to your profile! You can now take a readiness quiz for it.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
    setNewSkillText('');
    setShowAddCustomSkill(false);
  };

  const handleRemoveSkill = (skillName: string) => {
    onUpdateSkills(profile.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
  };

  const pathStyles: Record<string, { bg: string; border: string; gauge: string; icon: string }> = {
    full_stack: { bg: 'bg-plaid-blue', border: 'border-amber-400', gauge: '#3b82f6', icon: '🚀' },
    data_science: { bg: 'bg-plaid-green', border: 'border-cyan-400', gauge: '#14b8a6', icon: '📊' },
    ai_ml: { bg: 'bg-corduroy-olive', border: 'border-pink-400', gauge: '#8b5cf6', icon: '🧠' },
    data_engineering: { bg: 'bg-[#451a03]', border: 'border-amber-500', gauge: '#f59e0b', icon: '⚙️' }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border-2 border-dashed border-emerald-400 text-emerald-300 text-xs font-bold shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* SECTION TITLE: YOUR THREE FUTURES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <span>YOUR THREE FUTURES</span>
            <span className="text-xs font-normal text-slate-400 capitalize hidden md:inline">
              (Ranked top 3 by match score · 4th under exploration)
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Recommended best fit: <strong className="text-cyan-300">{featuredThree[0]?.title}</strong>, with <strong className="text-teal-300">{featuredThree[1]?.title}</strong> as closest second.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onTriggerBookAnimation && (
            <button
              onClick={onTriggerBookAnimation}
              className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-purple-500/30 border-2 border-dashed border-amber-400 text-amber-200 font-black hover:from-amber-500/50 hover:to-purple-500/50 shadow-md transition-all flex items-center gap-1.5"
              title="Play 3D Magical Tome Loading Animation (from video)"
            >
              <span>📖</span>
              <span>Play Spellbook Animation</span>
            </button>
          )}

          <button
            onClick={onOpenReadiness}
            className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600/30 border border-dashed border-emerald-400 text-emerald-300 font-bold hover:bg-emerald-600/50 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Skills Quiz</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SKILL CHIP PICKER (Denim Pocket Patch) */}
        <div className="lg:col-span-4 bg-denim-pocket rounded-3xl p-5 border-2 border-dashed border-cyan-400 shadow-2xl relative flex flex-col justify-between min-h-[580px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
              <span className="text-base font-extrabold text-white tracking-tight">
                Skill Chip Picker
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 font-semibold">
                  Self-rating
                </span>
                {onEditProfile && (
                  <button
                    onClick={onEditProfile}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                    title="Edit Profile (shows 8-second 3D loading animation)"
                  >
                    <span>✏️ Edit (8s)</span>
                  </button>
                )}
              </div>
            </div>

            {/* CHIPS CONTAINER */}
            <div className="flex flex-wrap gap-2.5 items-center">
              {profile.skills.map((skill) => {
                const isPy = skill.name.toLowerCase() === 'python';
                const isJs = skill.name.toLowerCase() === 'javascript';
                const isReact = skill.name.toLowerCase() === 'react';
                const isSql = skill.name.toLowerCase() === 'sql';
                const isGit = skill.name.toLowerCase() === 'git';

                let chipBg = 'bg-[#1e40af] text-white border-blue-300';
                if (skill.level === 'Advanced') chipBg = 'bg-[#eab308] text-slate-950 border-yellow-200 font-black';
                else if (skill.level === 'Intermediate') chipBg = 'bg-[#0284c7] text-white border-cyan-300';
                else chipBg = 'bg-[#15803d] text-white border-emerald-300';

                return (
                  <div
                    key={skill.name}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border shadow-sm text-xs font-bold ${chipBg}`}
                  >
                    <span>{skill.name} ({skill.level})</span>
                    {skill.verified ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center text-[9px]">✓</span>
                    ) : (
                      <span className="text-[10px] opacity-70">⋮</span>
                    )}
                    <button
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="ml-1 text-slate-400 hover:text-rose-300 text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* CGPA Badge */}
              <div className="w-9 h-9 rounded-full bg-[#1e3a5f] border-2 border-cyan-400 text-cyan-300 flex items-center justify-center text-xs font-black shadow-md">
                {profile.cgpa}
              </div>

              {/* + Add Skill Button */}
              <button
                onClick={() => setShowAddCustomSkill(true)}
                className="w-8 h-8 rounded-full bg-[#1b2b40] border-2 border-dashed border-cyan-400 text-cyan-300 hover:text-white flex items-center justify-center text-sm font-black shadow-sm transition-transform active:scale-90"
                title="Mark a new skill as learned"
              >
                +
              </button>
            </div>

            {/* Custom Skill Quick Form */}
            {showAddCustomSkill && (
              <form onSubmit={handleAddNewSkill} className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-cyan-400 flex gap-2">
                <input
                  type="text"
                  placeholder="Mark skill as learned (e.g. Next.js, Docker, Airflow)..."
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-bold rounded bg-cyan-500 text-slate-950 font-mono"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomSkill(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          {/* Bottom Area: Add-on skills frayed burlap patch */}
          <div className="pt-6 border-t-2 border-dashed border-cyan-500/30 mt-6 flex items-center justify-between">
            <div className="burlap-ribbon px-4 py-2 flex items-center gap-3">
              <div className="wooden-button"></div>
              <span className="font-extrabold text-xs tracking-wider uppercase">
                Add-on skills
              </span>
            </div>

            <button
              onClick={() => onUpdateSkills(profile.skills.slice(0, 3))}
              className="p-2 text-cyan-300/80 hover:text-rose-400 transition-colors"
              title="Reset skills"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 3 FEATURED CARDS + 4TH EXPLORATION CARD */}
        <div className="lg:col-span-8 space-y-6">
          {/* TOP 3 FEATURED PATHS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredThree.map((path) => {
              const style = pathStyles[path.id] || pathStyles.full_stack;
              const cl = checklistsByPath[path.id] || path.checklist || [];
              const checkedCount = cl.filter((i) => i.checked).length;
              const totalCount = cl.length || 1;
              const checklistPercent = Math.round((checkedCount / totalCount) * 100);

              return (
                <div
                  key={path.id}
                  className={`${style.bg} rounded-3xl p-5 border-2 border-dashed ${style.border} shadow-2xl relative flex flex-col justify-between min-h-[320px] text-white`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-white tracking-wide">
                        {path.title}
                      </h3>
                      <span className="text-base">{style.icon}</span>
                    </div>

                    {/* Coiled Yarn Gauge & Match Score */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 p-1 bg-slate-950/40 border-2 border-white/40 shadow-lg">
                        <div className="w-full h-full rounded-full border-4 border-dashed border-white/70 flex items-center justify-center">
                          <span className="font-black text-sm text-white">
                            {path.matchScore}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-black text-white block">
                          {path.matchScore}% match score
                        </span>
                        <span className="text-[10px] text-slate-300 block">
                          Checklist: {checklistPercent}% done
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 mt-2 line-clamp-2 leading-relaxed">
                      {path.matchReason}
                    </p>

                    {/* View Roadmap / Checklist Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => onOpenRoadmapDetails(path.id as any)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs shadow-md transition-all active:scale-95"
                      >
                        View Roadmap
                      </button>
                      <button
                        onClick={() => setActiveChecklistPathId(activeChecklistPathId === path.id ? null : path.id)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-900/80 border border-white/40 text-xs font-bold hover:bg-slate-800 transition-all"
                        title="Interactive Skills Checklist"
                      >
                        Checklist ({checkedCount}/{totalCount})
                      </button>
                    </div>
                  </div>

                  {/* Milestones Preview Strip */}
                  <div className="pt-3 border-t border-white/20 mt-3 flex items-center justify-between text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-[#4d7c0f] text-emerald-100 border border-lime-300">
                      Campus placements
                    </span>
                    <span className="text-slate-300 font-mono">
                      {path.yearByYear.length} Years
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4TH PATH: ALSO WORTH EXPLORING */}
          {fourthPath && (
            <div className="p-4 rounded-3xl bg-[#2a1b0a] border-2 border-dashed border-amber-500 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-amber-400 flex items-center justify-center text-xl flex-shrink-0">
                  ⚙️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400">
                      Also Worth Exploring (Rank #4)
                    </span>
                    <span className="font-extrabold text-xs text-amber-200">
                      {fourthPath.matchScore}% Match
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    {fourthPath.title} — Reliable Pipeline & Storage Engineering
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                    {fourthPath.matchReason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onOpenRoadmapDetails(fourthPath.id as any)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition-all shadow-md"
                >
                  Explore Path
                </button>
                <button
                  onClick={() => setActiveChecklistPathId(activeChecklistPathId === fourthPath.id ? null : fourthPath.id)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-400 text-amber-200 text-xs font-bold hover:bg-slate-800"
                >
                  Checklist
                </button>
              </div>
            </div>
          )}

          {/* EXPANDABLE INTERACTIVE SKILL CHECKLIST ("UPDATE MY PROGRESS") */}
          {activeChecklistPathId && (
            <div className="p-5 rounded-3xl bg-slate-900 border-2 border-dashed border-cyan-400 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Skills Checklist &amp; Live Match Recalculation:</span>
                    <span className="text-cyan-300">
                      {paths.find((p) => p.id === activeChecklistPathId)?.title}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ticking items updates your profile, auto-marks milestones as achieved, and recalculates your match score live!
                  </p>
                </div>
                <button
                  onClick={() => setActiveChecklistPathId(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Close ×
                </button>
              </div>

              {/* STAGES BREAKDOWN */}
              {(['foundation', 'build', 'specialize', 'job_ready'] as ChecklistStage[]).map((stage) => {
                const list = checklistsByPath[activeChecklistPathId] || [];
                const stageItems = list.filter((i) => i.stage === stage);
                if (stageItems.length === 0) return null;

                const stageDone = stageItems.filter((i) => i.checked).length;
                const stagePercent = Math.round((stageDone / stageItems.length) * 100);

                return (
                  <div key={stage} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="uppercase tracking-wider text-cyan-300">
                        Stage: {stage.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400">
                        {stageDone} of {stageItems.length} ({stagePercent}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${stagePercent}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {stageItems.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                            item.checked
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleChecklistItem(activeChecklistPathId, item.id)}
                            className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                          />
                          <div className="flex-1">
                            <span className="font-semibold block">{item.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{item.levelGained} lvl · {item.skill} ({item.category})
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTTOM ROW: ROADMAP TIMELINE, SKILL GAPS, AND 30-DAY ACTION PLAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. ROADMAP TIMELINE */}
            <div className="bg-linen rounded-3xl p-5 border-2 border-dashed border-cyan-400 shadow-2xl relative space-y-4">
              <div className="px-3 py-1.5 rounded-xl bg-[#1d3557] text-cyan-300 border border-cyan-400 text-xs font-black tracking-wide text-center">
                Roadmap Timeline
              </div>

              <div className="relative pl-6 space-y-5 border-l-2 border-dashed border-cyan-600/70 ml-2">
                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-[33px] w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">3 year</span>
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">Achieved</span>
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-[33px] wooden-button !w-5 !h-5 !text-[7px]"></div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">2 year</span>
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">In progress</span>
                  </div>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="absolute -left-[33px] w-5 h-5 rounded-full bg-slate-400 text-slate-800 flex items-center justify-center text-[8px] font-bold shadow-md">::</div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">1 year</span>
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">Remaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SKILL GAPS */}
            <div className="bg-[#152238] rounded-3xl p-5 border-2 border-dashed border-pink-400 shadow-2xl relative space-y-4 text-white">
              <div className="px-3 py-1.5 rounded-xl bg-[#581c87] text-pink-200 border border-pink-400 text-xs font-black tracking-wide text-center">
                Skill Gaps
              </div>

              <div className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">Full Stack</span>
                  <div className="h-3.5 w-full bg-slate-900/80 rounded-full p-0.5 border border-slate-700">
                    <div className="h-full w-[82%] yarn-thread-bar"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">Data Scientist</span>
                  <div className="h-3.5 w-full bg-slate-900/80 rounded-full p-0.5 border border-slate-700">
                    <div className="h-full w-[78%] yarn-cyan-bar"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">AI/ML Engineer</span>
                  <div className="h-3.5 w-full bg-slate-900/80 rounded-full p-0.5 border border-slate-700">
                    <div className="h-full w-[74%] yarn-orange-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 30-DAY ACTION PLAN */}
            <div className="bg-linen rounded-3xl p-5 border-2 border-dashed border-amber-500 shadow-2xl relative space-y-3">
              <div className="px-3 py-1.5 rounded-xl bg-[#7c2d12] text-amber-200 border border-amber-400 text-xs font-black tracking-wide text-center">
                30-Day Action Plan
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { num: 1, label: 'Week 1', desc: 'Web basics refresh & Git' },
                  { num: 2, label: 'Week 2', desc: 'Responsive design & CSS Grid' },
                  { num: 3, label: 'Week 3', desc: 'JavaScript ES6 & DOM start' },
                  { num: 4, label: 'Week 4', desc: 'Fetch APIs & Weather app deliverable' }
                ].map((wk) => (
                  <button
                    key={wk.num}
                    onClick={() => setActivePlanWeek(wk.num)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all border-cyan-400 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 ${
                      activePlanWeek === wk.num ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'opacity-85'
                    }`}
                  >
                    <span>{wk.label}</span>
                    <span className="text-[10px] opacity-75">{wk.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
