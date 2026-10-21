import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Code2,
  FolderGit2,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { progressService } from '../../services/progressService';
import { ProjectRecommendation } from '../../types';

interface ProjectsShowcaseProps {
  projects: ProjectRecommendation[];
  pathSlug: string;
}

export const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({ projects, pathSlug }) => {
  const [startedProjects, setStartedProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    projects.forEach((p) => {
      initial[p.title] = progressService.isProjectStarted(pathSlug, p.title);
    });
    return initial;
  });

  const toggleProject = (title: string) => {
    const nextState = progressService.toggleProjectStarted(pathSlug, title);
    setStartedProjects((prev) => ({
      ...prev,
      [title]: nextState,
    }));
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Beginner
          </span>
        );
      case 'intermediate':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Intermediate
          </span>
        );
      case 'advanced':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Advanced
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-primary-600" />
          Recommended Portfolio Projects ({projects.length})
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Recruiters prioritize real, deployable code over certificate hoarders. These projects are engineered to prove your core competencies in technical interviews.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" data-testid="projects-grid">
        {projects.map((project, idx) => {
          const isStarted = !!startedProjects[project.title];

          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all shadow-2xs ${
                isStarted
                  ? 'border-emerald-300 ring-1 ring-emerald-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header: Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary-600 shrink-0" />
                      {project.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        ~{project.estimated_weeks} weeks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(project.difficulty)}
                    {isStarted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Stack Chips */}
                <div className="space-y-1">
                  <span className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">
                    Tech Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(project.tech_stack)
                      ? project.tech_stack
                      : typeof project.tech_stack === 'string'
                      ? (project.tech_stack as string).split(',').map((t) => t.trim()).filter(Boolean)
                      : []
                    ).map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-2xs font-mono font-medium border border-gray-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What it Proves */}
                <div className="bg-primary-50/50 rounded-lg p-3 border border-primary-100 text-xs text-primary-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary-800">
                    <Trophy className="w-3.5 h-3.5 text-primary-600" />
                    <span>Hiring Signal (What It Proves):</span>
                  </div>
                  <p className="text-primary-800/90 text-2xs leading-relaxed">
                    {project.what_it_proves}
                  </p>
                </div>

                {/* Stretch Goal */}
                {project.stretch_goal && (
                  <div className="bg-purple-50/40 rounded-lg p-2.5 border border-purple-100 text-2xs text-purple-900 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-purple-800">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Advanced Stretch Goal:</span>
                    </div>
                    <p className="text-purple-700">
                      {project.stretch_goal}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleProject(project.title)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isStarted
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700 shadow-2xs'
                  }`}
                >
                  {isStarted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Project In Progress</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start This Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
