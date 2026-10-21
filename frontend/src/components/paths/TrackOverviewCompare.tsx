import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Layers,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { SimulatedPath, SimulationOutput } from '../../types';

interface TrackOverviewCompareProps {
  output: SimulationOutput;
  activePathSlug?: string | null;
  onSelectPathTab: (index: number) => void;
  onChoosePath: (path: SimulatedPath) => void;
}

export const TrackOverviewCompare: React.FC<TrackOverviewCompareProps> = ({
  output,
  activePathSlug,
  onSelectPathTab,
  onChoosePath,
}) => {
  const { paths, overall_recommendation, assumptions_made } = output;

  return (
    <div className="space-y-8" data-testid="overview-compare-view">
      {/* Overall AI Recommendation Banner */}
      <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-primary-900 font-bold text-base">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <span>Simulation Engine Recommendation</span>
        </div>
        <p className="text-sm text-primary-950 leading-relaxed font-medium">
          {overall_recommendation}
        </p>
      </div>

      {/* 3 Summary Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-600" />
          Simulated Career Paths (3 Tracks)
        </h3>
        <p className="text-xs text-gray-500">
          Compare the three simulated options generated based on your academic profile, verified skills, and career interests.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
          {paths.map((path, idx) => {
            const isSelected = activePathSlug === path.path_slug;
            const highPriorityGaps = path.skill_gaps.filter(
              (g) => g.priority.toLowerCase() === 'high'
            ).length;

            return (
              <div
                key={path.path_slug}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${
                  isSelected
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badge & Fit Score */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-400">
                      Option {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 border border-primary-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                          Active Track
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        {path.fit_score}% Fit
                      </span>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h4 className="text-base font-bold text-gray-900 leading-snug">
                      {path.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                      {path.summary}
                    </p>
                  </div>

                  {/* Indian Market Highlights */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Fresher CTC:
                      </span>
                      <strong className="text-gray-900 font-semibold">
                        {path.india_market_notes.salary_range_lpa}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Market Demand:
                      </span>
                      <span className="text-2xs font-medium text-gray-800 line-clamp-1 max-w-[150px]">
                        {path.india_market_notes.demand_outlook}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> High-Priority Gaps:
                      </span>
                      <span className="font-bold text-rose-700">
                        {highPriorityGaps} skills to bridge
                      </span>
                    </div>
                  </div>

                  {/* Fit Reasoning Snippet */}
                  <div className="text-2xs text-gray-500 bg-primary-50/40 p-2.5 rounded-lg border border-primary-100/70">
                    <span className="font-semibold text-primary-900">Why this fits you: </span>
                    <span className="text-primary-800">{path.fit_reasoning}</span>
                  </div>

                  {/* Top Risks */}
                  {path.risks_and_tradeoffs && path.risks_and_tradeoffs.length > 0 && (
                    <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 text-2xs text-rose-900 space-y-1">
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Top Risk / Placement Hurdle:
                      </span>
                      <p className="text-rose-950 line-clamp-2">
                        {path.risks_and_tradeoffs[0]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPathTab(idx + 1)}
                    className="text-xs font-semibold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1"
                  >
                    Deep Dive <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onChoosePath(path)}
                    disabled={isSelected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 text-white shadow-2xs'
                    }`}
                  >
                    {isSelected ? 'Currently Selected' : 'Choose Track'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary-600" />
          Side-by-Side Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" role="table" aria-label="Career Path Comparison Matrix">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/70">
                <th scope="col" className="py-3 px-4 rounded-l-lg">Metric</th>
                {paths.map((p) => (
                  <th key={p.path_slug} scope="col" className="py-3 px-4 font-bold text-gray-900">
                    {p.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Fit Score */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Student Profile Fit</td>
                {paths.map((p) => (
                  <td key={p.path_slug} className="py-3 px-4 font-bold text-emerald-700">
                    {p.fit_score}% match
                  </td>
                ))}
              </tr>

              {/* Fresher CTC Range */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Approx. Fresher CTC (LPA)</td>
                {paths.map((p) => (
                  <td key={p.path_slug} className="py-3 px-4 font-mono font-medium text-gray-900">
                    {p.india_market_notes.salary_range_lpa}
                  </td>
                ))}
              </tr>

              {/* Hiring Company Types */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Primary Company Types</td>
                {paths.map((p) => (
                  <td key={p.path_slug} className="py-3 px-4 text-gray-600 text-2xs">
                    {p.india_market_notes.company_types.join(', ')}
                  </td>
                ))}
              </tr>

              {/* Critical Skill Gaps */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">High-Priority Skill Gaps</td>
                {paths.map((p) => {
                  const count = p.skill_gaps.filter((g) => g.priority.toLowerCase() === 'high').length;
                  return (
                    <td key={p.path_slug} className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-800">
                        {count} critical skills
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Time to be Job-Ready */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Time to Job-Ready</td>
                {paths.map((p) => {
                  const academicMilestones = p.yearly_milestones.filter(
                    (m) => !m.label.toLowerCase().includes('post') && !m.label.toLowerCase().includes('first 1-2 years')
                  );
                  const timeText = academicMilestones.length <= 1 ? '6 - 12 Months' : `${academicMilestones.length} Academic Years`;
                  return (
                    <td key={p.path_slug} className="py-3 px-4 text-gray-700 font-medium">
                      {timeText}
                    </td>
                  );
                })}
              </tr>

              {/* Projects to Build */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">Recommended Projects</td>
                {paths.map((p) => (
                  <td key={p.path_slug} className="py-3 px-4 text-gray-600">
                    {p.projects_to_build.length} portfolio apps
                  </td>
                ))}
              </tr>

              {/* Kickoff Sprint Duration */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold text-gray-700">First-Month Kickoff</td>
                {paths.map((p) => (
                  <td key={p.path_slug} className="py-3 px-4 text-primary-700 font-medium">
                    {p.first_month_plan.weeks.length} structured weeks
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions & Disclaimers Accordion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assumptions */}
        <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200/80 space-y-2">
          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            AI Simulation Assumptions
          </h4>
          <ul className="text-xs text-amber-900/90 space-y-1">
            {assumptions_made.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            Market Projection Disclaimer
          </h4>
          <div className="text-xs text-gray-600 leading-relaxed space-y-1">
            {Array.isArray(output.disclaimers) ? (
              output.disclaimers.map((d, idx) => <p key={idx}>{d}</p>)
            ) : (
              <p>{output.disclaimer}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
