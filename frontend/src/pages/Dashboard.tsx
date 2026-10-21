import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Bot,
  BrainCircuit,
  Code2,
  Compass,
  DollarSign,
  FileCheck2,
  Flame,
  FolderGit2,
  GraduationCap,
  Play,
  RefreshCw,
  ShieldAlert,
  User,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSelectedPath } from '../context/SelectedPathContext';
import { progressService } from '../services/progressService';
import { ProgressDashboardResponse } from '../types';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { selectedPath } = useSelectedPath();

  const [progress, setProgress] = useState<ProgressDashboardResponse | null>(null);

  const currentYear = profile?.year_of_study || 3;
  const simulated = selectedPath?.simulated_path;
  const pathSlug = selectedPath?.career_path?.slug || simulated?.path_slug || '';

  useEffect(() => {
    if (api.progress?.getDashboard) {
      api.progress
        .getDashboard()
        .then((data) => {
          setProgress(data);
          if (pathSlug && data.completed_items_map) {
            progressService.syncFromBackend(pathSlug, data.completed_items_map);
          }
        })
        .catch(() => {});
    }
  }, [pathSlug]);

  // Extract next academic year milestone
  const nextMilestone = useMemo(() => {
    if (!simulated?.yearly_milestones) return null;
    const milestones = simulated.yearly_milestones;
    // Find current year milestone or first upcoming
    const found = milestones.find((m) => {
      const lower = (m.label || m.academic_year || '').toLowerCase();
      return (
        lower.includes(`year ${currentYear}`) ||
        (currentYear === 4 && lower.includes('final'))
      );
    });
    return found || milestones[0];
  }, [simulated, currentYear]);

  // Extract top 3 critical skill gaps
  const topSkillGaps = useMemo(() => {
    if (!simulated?.skill_gaps) return [];
    return [...simulated.skill_gaps]
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, 3);
  }, [simulated]);

  // Extract next recommended project
  const nextProject = useMemo(() => {
    if (!simulated?.projects_to_build || simulated.projects_to_build.length === 0) return null;
    // Find first project that isn't started yet
    const unstarted = simulated.projects_to_build.find(
      (p) => !progressService.isProjectStarted(pathSlug, p.title)
    );
    return unstarted || simulated.projects_to_build[0];
  }, [simulated, pathSlug]);

  // Checkpoints status
  const milestoneProgress = useMemo(() => {
    if (!nextMilestone) return { total: 0, done: 0, percent: 0 };
    const total = nextMilestone.checkpoints.length;
    const done = nextMilestone.checkpoints.filter((cp) =>
      progressService.isCheckpointCompleted(pathSlug, cp)
    ).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [nextMilestone, pathSlug]);

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Placement Readiness Engine &bull; Phase 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome, {profile?.full_name || 'Engineering Student'}!
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            {profile?.college || 'Your College'} &bull; {profile?.branch || 'Engineering'} &bull;{' '}
            <span className="font-semibold text-gray-700">Year {profile?.year_of_study || 3}</span> &bull; CGPA:{' '}
            <span className="font-semibold text-gray-700">{profile?.cgpa ? Number(profile.cgpa).toFixed(2) : 'N/A'}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
          >
            <User className="w-4 h-4 mr-1.5" /> View Profile
          </Link>
          <Link
            to="/paths"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-xs"
          >
            <Compass className="w-4 h-4 mr-1.5" /> Explore All Paths
          </Link>
        </div>
      </div>

      {/* ACTIVE CAREER PATH HERO SECTION (ADAPTIVE) */}
      {selectedPath ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-primary-500 shadow-xs space-y-6" data-testid="active-path-banner">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-primary-600 text-white">
                  Active Career Track
                </span>
                {simulated?.fit_score && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    {simulated.fit_score}% Fit Match
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {selectedPath.career_path.name || simulated?.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
                {selectedPath.career_path.description || simulated?.summary}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/paths"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Change Track
              </Link>
              <Link
                to="/paths"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Full Blueprint</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          {simulated && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Target Fresher CTC</span>
                </div>
                <div className="text-lg font-mono font-bold text-gray-900">
                  {simulated.india_market_notes.salary_range_lpa}
                </div>
                <span className="text-2xs text-gray-400">Campus & Off-Campus INR</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Critical Skills to Learn</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {simulated.skill_gaps.filter((g) => g.priority === 'high').length} Skills
                </div>
                <span className="text-2xs text-rose-600 font-medium">Ranked High-Priority</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-gray-500 text-xs flex items-center gap-1 mb-1">
                  <FolderGit2 className="w-4 h-4 text-indigo-500" />
                  <span>Portfolio Projects</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {simulated.projects_to_build.length} Applications
                </div>
                <span className="text-2xs text-indigo-600 font-medium">Interview Signals</span>
              </div>
            </div>
          )}

          {/* Daily Streak & Next Action Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Streak Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-sm">
                      {progress?.current_streak_days || 0} Day Streak
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {progress?.current_streak_days ? 'Active Today' : 'Ready to start'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Longest: {progress?.longest_streak_days || 0} days &bull; Roadmap:{' '}
                    {progress?.overall_roadmap_percent || 0}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* Next Best Action Card */}
            {progress?.next_best_action ? (
              <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded">
                    Next Recommended Step
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs truncate mt-1">
                    {progress.next_best_action.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 line-clamp-1">
                    {progress.next_best_action.description}
                  </p>
                </div>
                <Link
                  to={progress.next_best_action.link}
                  className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
                >
                  Start &rarr;
                </Link>
              </div>
            ) : (
              <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">Verify Your Claimed Skills</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Take technical diagnostic tests to calibrate fit scores and ATS resume.
                  </p>
                </div>
                <Link
                  to="/tests"
                  className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Skill Tests &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Adaptive Widgets: Milestone & Next Skill Gaps & Recommended Project */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* 1. Next Milestone & Progress */}
            {nextMilestone && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      Current Milestone
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {milestoneProgress.done}/{milestoneProgress.total} Done
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {nextMilestone.label || nextMilestone.academic_year}
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
                    {(nextMilestone.goals || nextMilestone.focus_goals || []).slice(0, 3).map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary-600 font-bold">&bull;</span>
                        <span className="line-clamp-2">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-2">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${milestoneProgress.percent}%` }}
                    />
                  </div>
                  <Link
                    to="/paths"
                    className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center justify-between"
                  >
                    <span>View All Checkpoints</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Top 3 Critical Skill Gaps */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Top Priority Skill Gaps
                </span>
                <h4 className="font-bold text-gray-900 text-sm">
                  Skills to Bridge Next
                </h4>

                <div className="space-y-2">
                  {topSkillGaps.map((gap, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 truncate">{gap.skill}</span>
                        <span className="text-2xs font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          +{gap.required_level - gap.current_level} Level
                        </span>
                      </div>
                      <div className="text-2xs text-gray-500 line-clamp-1">
                        {gap.why_it_matters}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Link
                  to="/paths"
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center justify-between"
                >
                  <span>Open Skill Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Next Recommended Project */}
            {nextProject && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Recommended Project
                    </span>
                    <span className="text-2xs font-semibold text-gray-500">
                      ~{nextProject.estimated_weeks} weeks
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary-600 shrink-0" />
                    <span>{nextProject.title}</span>
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {nextProject.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(Array.isArray(nextProject.tech_stack)
                      ? nextProject.tech_stack
                      : typeof nextProject.tech_stack === 'string'
                      ? (nextProject.tech_stack as string).split(',').map((t) => t.trim()).filter(Boolean)
                      : []
                    ).slice(0, 3).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-2xs font-mono font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <Link
                    to="/paths"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800"
                  >
                    <Play className="w-3.5 h-3.5 text-primary-600" />
                    <span>Review Project Blueprint</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PROMPT WHEN NO PATH IS SELECTED */
        <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center space-y-4 shadow-2xs" data-testid="no-path-prompt">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto border border-primary-200">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-gray-900">
              No Career Track Selected Yet
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Run a career simulation to generate 3 realistic pathways for your year of study ({currentYear}rd Year). Once you pick one, your entire dashboard roadmap, diagnostic tests, and ATS resume will adapt to that target!
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/paths"
              className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-all shadow-xs"
            >
              <span>Simulate & Choose Career Path</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      )}

      {/* Feature Roadmap & Capability Cards (Referencing Active Path) */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Preparation Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Path Simulator</h3>
            <p className="text-xs text-gray-500">
              {selectedPath
                ? `Currently targeting ${selectedPath.career_path.name}.`
                : 'Simulate 3 paths and choose one.'}
            </p>
            <Link to="/paths" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center pt-1">
              Explore Paths &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Diagnostic Skill Tests</h3>
            <p className="text-xs text-gray-500">
              {selectedPath
                ? `Test and verify skills for ${selectedPath.career_path.name}.`
                : 'Verify claimed skills to unlock proof.'}
            </p>
            <Link to="/tests" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center pt-1">
              Skill Tests Hub &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Dynamic ATS Resume</h3>
            <p className="text-xs text-gray-500">
              Auto-tailored to highlight projects and verified skills for your chosen path.
            </p>
            <Link to="/resume" className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center pt-1">
              Resume Studio &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">AI Placement Mentor</h3>
            <p className="text-xs text-gray-500">
              Ask interview questions grounded in Indian hiring benchmarks.
            </p>
            <Link to="/mentor" className="text-xs font-semibold text-gray-400 hover:text-gray-500 inline-flex items-center pt-1">
              Phase 5 &bull; Coming Soon &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
