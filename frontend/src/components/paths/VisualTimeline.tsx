import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  FolderGit2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { progressService } from '../../services/progressService';
import { YearlyMilestone } from '../../types';

interface VisualTimelineProps {
  milestones: YearlyMilestone[];
  currentYearOfStudy?: number; // 1 to 4
  pathSlug: string;
}

export const VisualTimeline: React.FC<VisualTimelineProps> = ({
  milestones,
  currentYearOfStudy = 3,
  pathSlug,
}) => {
  // State for expanded milestone accordion nodes (default: all open or current year open)
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    milestones.forEach((_, idx) => {
      initial[idx] = true; // Open all by default for visibility
    });
    return initial;
  });

  // Checkpoints completion local state for reactive UI updates
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    milestones.forEach((m) => {
      m.checkpoints.forEach((cp) => {
        initial[cp] = progressService.isCheckpointCompleted(pathSlug, cp);
      });
    });
    return initial;
  });

  const toggleNode = (index: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleToggleCheckpoint = (checkpoint: string) => {
    const nextState = progressService.toggleCheckpoint(pathSlug, checkpoint);
    setCompletedCheckpoints((prev) => ({
      ...prev,
      [checkpoint]: nextState,
    }));
  };

  // Helper to determine year status: "past" | "current" | "upcoming" | "postgrad"
  const getMilestoneStatus = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('post-graduation') || lower.includes('post graduation') || lower.includes('first 1-2 years')) {
      return 'postgrad';
    }

    let parsedYear: number | null = null;
    if (lower.includes('year 1') || lower.includes('1st year')) parsedYear = 1;
    else if (lower.includes('year 2') || lower.includes('2nd year')) parsedYear = 2;
    else if (lower.includes('year 3') || lower.includes('3rd year')) parsedYear = 3;
    else if (lower.includes('year 4') || lower.includes('4th year') || lower.includes('final year')) parsedYear = 4;

    if (parsedYear !== null) {
      if (parsedYear === currentYearOfStudy) return 'current';
      if (parsedYear < currentYearOfStudy) return 'past';
      return 'upcoming';
    }

    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary-600" />
            Year-by-Year Academic & Placement Roadmap
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Structured roadmap from your current academic standing (Year {currentYearOfStudy}) through campus placement and early career.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-2xs sm:text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 font-semibold border border-primary-200">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
            Current Year
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
            Foundation / Past
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Upcoming
          </span>
        </div>
      </div>

      {/* Desktop Horizontal Milestone Stepper */}
      <div
        className="hidden lg:flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto"
        role="region"
        aria-label="Desktop Horizontal Milestone Track"
      >
        {milestones.map((m, idx) => {
          const label = m.label || m.academic_year || `Milestone ${idx + 1}`;
          const status = getMilestoneStatus(label);
          const isExpanded = !!expandedNodes[idx];
          return (
            <div key={idx} className="flex-1 min-w-[160px] flex items-center">
              <button
                type="button"
                onClick={() => toggleNode(idx)}
                className={`w-full p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  status === 'current'
                    ? 'bg-primary-50/80 border-primary-300 ring-2 ring-primary-100'
                    : status === 'past'
                    ? 'bg-gray-100/80 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-500">
                    Phase {idx + 1}
                  </span>
                  {status === 'current' && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" title="Active Academic Year"></span>
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 truncate">{label}</span>
                <span className="text-2xs text-gray-500 mt-1">
                  {isExpanded ? 'Expanded ▼' : 'Collapsed ▶'}
                </span>
              </button>
              {idx < milestones.length - 1 && (
                <div className="w-3 h-0.5 bg-gray-300 shrink-0 mx-1"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stepped Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {milestones.map((milestone, idx) => {
          const label = milestone.label || milestone.academic_year || `Milestone ${idx + 1}`;
          const goals = milestone.goals || milestone.focus_goals || [];
          const skills = milestone.skills_to_learn || milestone.skills_to_acquire || [];
          const projects = milestone.projects || milestone.recommended_projects || [];
          const activities = milestone.target_activities || milestone.internships_or_hackathons || [];
          const checkpoints = milestone.checkpoints || [];

          const status = getMilestoneStatus(label);
          const isExpanded = !!expandedNodes[idx];
          const completedCount = checkpoints.filter(
            (cp) => completedCheckpoints[cp]
          ).length;

          let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
          let nodeDot = 'bg-blue-600 ring-4 ring-blue-100';

          if (status === 'current') {
            badgeColor = 'bg-primary-600 text-white border-primary-700 shadow-xs';
            nodeDot = 'bg-primary-600 ring-4 ring-primary-200 animate-pulse';
          } else if (status === 'past') {
            badgeColor = 'bg-gray-200 text-gray-800 border-gray-300';
            nodeDot = 'bg-gray-400 ring-4 ring-gray-100';
          } else if (status === 'postgrad') {
            badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
            nodeDot = 'bg-purple-600 ring-4 ring-purple-100';
          }

          return (
            <div key={idx} className="relative group">
              {/* Stepper Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full ${nodeDot} -translate-x-1/2 flex items-center justify-center`}
              />

              {/* Node Card */}
              <div
                className={`bg-white rounded-xl border transition-all ${
                  status === 'current'
                    ? 'border-primary-400 shadow-md ring-1 ring-primary-100'
                    : 'border-gray-200 shadow-2xs hover:border-gray-300'
                }`}
              >
                {/* Node Header */}
                <button
                  type="button"
                  onClick={() => toggleNode(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
                    >
                      {label}
                    </span>

                    {status === 'current' && (
                      <span className="text-2xs uppercase tracking-wider font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        Active Focus
                      </span>
                    )}

                    <span className="text-xs text-gray-500 font-medium">
                      &bull; {completedCount}/{checkpoints.length} Checkpoints Cleared
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 space-y-5 mt-2">
                    {/* Focus Goals */}
                    {goals.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-primary-600" />
                          Key Academic & Placement Goals
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                          {goals.map((goal, gIdx) => (
                            <li
                              key={gIdx}
                              className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                            >
                              <span className="text-primary-600 font-bold">&bull;</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skills & Recommended Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Skills to Learn */}
                      {skills.length > 0 && (
                        <div className="bg-indigo-50/50 rounded-lg p-3.5 border border-indigo-100 space-y-2">
                          <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Core Skills to Acquire
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded bg-white text-indigo-800 text-2xs font-semibold border border-indigo-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects to Build */}
                      {projects.length > 0 && (
                        <div className="bg-emerald-50/50 rounded-lg p-3.5 border border-emerald-100 space-y-2">
                          <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                            Projects to Ship
                          </h5>
                          <ul className="text-xs text-emerald-900 space-y-1">
                            {projects.map((proj, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">&bull;</span>
                                <span>{proj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Internships, Hackathons & Competitions */}
                    {activities.length > 0 && (
                      <div className="bg-amber-50/50 rounded-lg p-3.5 border border-amber-100 space-y-2">
                        <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                          Target Internships & Campus Hackathons
                        </h5>
                        <div className="flex flex-wrap gap-2 text-xs text-amber-900">
                          {activities.map((item, hIdx) => (
                            <span
                              key={hIdx}
                              className="px-2.5 py-1 rounded bg-white border border-amber-200 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checkpoints (Checkable for Progress Tracking) */}
                    {checkpoints.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Measurable Progress Checkpoints
                          </h5>
                          <span className="text-2xs text-gray-400">
                            Persisted to your progress tracker
                          </span>
                        </div>

                        <div className="space-y-2">
                          {checkpoints.map((cp, cIdx) => {
                            const isDone = !!completedCheckpoints[cp];
                            return (
                              <label
                                key={cIdx}
                                className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                  isDone
                                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => handleToggleCheckpoint(cp)}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300"
                                />
                                <div className="text-xs">
                                  <span className={isDone ? 'line-through text-emerald-800' : ''}>
                                    {cp}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
