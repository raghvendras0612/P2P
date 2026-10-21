import React, { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ArrowUpDown, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { SkillGap } from '../../types';

interface SkillGapRadarProps {
  skillGaps: SkillGap[];
  pathTitle?: string;
}

type SortField = 'priority' | 'gap' | 'skill';
type SortOrder = 'asc' | 'desc';

const PRIORITY_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const SkillGapRadar: React.FC<SkillGapRadarProps> = ({ skillGaps, pathTitle }) => {
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showTableFallback, setShowTableFallback] = useState<boolean>(false);

  // Map to chart-friendly format
  const chartData = useMemo(() => {
    return skillGaps.map((item) => ({
      skill: item.skill,
      currentLevel: item.current_level,
      requiredLevel: item.required_level,
      gap: Math.max(0, item.required_level - item.current_level),
      priority: item.priority,
      whyItMatters: item.why_it_matters,
    }));
  }, [skillGaps]);

  // Sortable gaps list
  const sortedGaps = useMemo(() => {
    return [...skillGaps].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        comparison = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      } else if (sortField === 'gap') {
        const gapA = a.required_level - a.current_level;
        const gapB = b.required_level - b.current_level;
        comparison = gapB - gapA;
      } else if (sortField === 'skill') {
        comparison = a.skill.localeCompare(b.skill);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [skillGaps, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Medium Priority
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Accessibility Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Skill Gap Radar & Proficiency Mapping
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluates your self-rated skill levels against industry hiring benchmarks (0 to 5) for{' '}
            <span className="font-medium text-gray-700">{pathTitle || 'this career track'}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTableFallback(!showTableFallback)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label={showTableFallback ? 'Hide accessible table view' : 'Show accessible table view'}
        >
          {showTableFallback ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Accessible Table</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show Accessible Table</span>
            </>
          )}
        </button>
      </div>

      {/* Radar Chart (Recharts) */}
      <div
        className="w-full bg-white rounded-xl p-4 border border-gray-200 shadow-2xs"
        role="region"
        aria-label="Skill Gap Radar Chart Visualizer"
      >
        <div className="h-72 sm:h-80 w-full" data-testid="radar-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="skill"
                tick={(props: any) => {
                  const { payload, x, y, textAnchor, ...rest } = props;
                  const text = String(payload?.value || '');
                  const display = text.length > 18 ? `${text.slice(0, 16)}…` : text;
                  return (
                    <text
                      {...rest}
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      fill="#374151"
                      fontSize={11}
                      fontWeight={500}
                    >
                      {display}
                    </text>
                  );
                }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Radar
                name="Current Level"
                dataKey="currentLevel"
                stroke="#6366f1"
                fill="#818cf8"
                fillOpacity={0.4}
              />
              <Radar
                name="Required Level"
                dataKey="requiredLevel"
                stroke="#e11d48"
                fill="#f43f5e"
                fillOpacity={0.25}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs space-y-1.5">
                        <div className="font-bold border-b border-gray-700 pb-1 text-sm text-primary-200">
                          {data.skill}
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Current Level:</span>
                          <span className="font-semibold">{data.currentLevel} / 5</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Target Level:</span>
                          <span className="font-semibold text-rose-300">{data.requiredLevel} / 5</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Priority:</span>
                          <span className="capitalize font-semibold">{data.priority}</span>
                        </div>
                        <p className="text-gray-300 text-2xs pt-1 border-t border-gray-800">
                          {data.whyItMatters}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Your Current Level</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-gray-600 font-medium">Placement Benchmark (Target)</span>
          </div>
        </div>
      </div>

      {/* Accessible Table Fallback */}
      {showTableFallback && (
        <div
          className="bg-gray-50 rounded-xl p-4 border border-gray-200 overflow-x-auto"
          role="region"
          aria-label="Accessible Skill Gap Data Table"
        >
          <table className="w-full text-left text-xs" role="table" aria-label="Skill Gap Benchmark Table">
            <caption className="sr-only">Detailed breakdown of skills, current levels, required levels, priority, and rationale.</caption>
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 font-semibold">
                <th scope="col" className="py-2 px-3">Skill</th>
                <th scope="col" className="py-2 px-3">Current (0-5)</th>
                <th scope="col" className="py-2 px-3">Required (0-5)</th>
                <th scope="col" className="py-2 px-3">Skill Gap</th>
                <th scope="col" className="py-2 px-3">Priority</th>
                <th scope="col" className="py-2 px-3">Why It Matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {skillGaps.map((gap, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-semibold text-gray-900">{gap.skill}</td>
                  <td className="py-2 px-3 text-gray-700">{gap.current_level}</td>
                  <td className="py-2 px-3 text-rose-700 font-semibold">{gap.required_level}</td>
                  <td className="py-2 px-3 font-mono font-medium text-amber-700">
                    +{Math.max(0, gap.required_level - gap.current_level)}
                  </td>
                  <td className="py-2 px-3">{getPriorityBadge(gap.priority)}</td>
                  <td className="py-2 px-3 text-gray-600 max-w-sm">{gap.why_it_matters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sortable Detailed Skill Gap Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Ranked Skill Gap Breakdown ({skillGaps.length} Skills)
          </h4>

          {/* Sort Controls */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 mr-1">Sort by:</span>
            <button
              type="button"
              onClick={() => toggleSort('priority')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors inline-flex items-center gap-1 ${
                sortField === 'priority'
                  ? 'bg-primary-100 text-primary-800 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Priority <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort('gap')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors inline-flex items-center gap-1 ${
                sortField === 'gap'
                  ? 'bg-primary-100 text-primary-800 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Gap Size <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => toggleSort('skill')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors inline-flex items-center gap-1 ${
                sortField === 'skill'
                  ? 'bg-primary-100 text-primary-800 font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Name <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="skill-gaps-list">
          {sortedGaps.map((item, idx) => {
            const gap = Math.max(0, item.required_level - item.current_level);
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-200 transition-colors shadow-2xs space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <h5 className="font-bold text-gray-900 text-sm">{item.skill}</h5>
                  {getPriorityBadge(item.priority)}
                </div>

                {/* Level Progress Bars */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      Current: <strong className="text-gray-900">{item.current_level} / 5</strong>
                    </span>
                    <span>
                      Target: <strong className="text-rose-600">{item.required_level} / 5</strong>
                    </span>
                    <span className="font-semibold text-amber-700">
                      Gap: +{gap}
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-primary-600 h-2 transition-all duration-300"
                      style={{ width: `${(item.current_level / 5) * 100}%` }}
                      title={`Current Level: ${item.current_level}/5`}
                    ></div>
                    <div
                      className="bg-rose-300 h-2 transition-all duration-300 opacity-60"
                      style={{ width: `${(gap / 5) * 100}%` }}
                      title={`Gap to acquire: +${gap}`}
                    ></div>
                  </div>
                </div>

                {/* Why It Matters */}
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-700">Placement relevance: </span>
                  {item.why_it_matters}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
