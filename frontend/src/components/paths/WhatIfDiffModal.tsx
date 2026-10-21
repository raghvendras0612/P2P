import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { SimulationComparisonSummary, SimulationDetail } from '../../types';

interface WhatIfDiffModalProps {
  isOpen: boolean;
  baselineSimulation: SimulationDetail | null;
  onClose: () => void;
  onSimulationUpdated: (newSim: SimulationDetail) => void;
}

const PRESET_WHAT_IF_SKILLS = [
  { name: 'Docker & Containers', category: 'DevOps' },
  { name: 'System Design & Distributed Caching', category: 'Backend' },
  { name: 'Kubernetes Orchestration', category: 'DevOps' },
  { name: 'AWS Cloud Architecture', category: 'Cloud' },
  { name: 'Apache Kafka & Event Streaming', category: 'Backend' },
  { name: 'GraphQL & Apollo', category: 'Backend' },
  { name: 'PyTorch & Deep Learning', category: 'AI/ML' },
  { name: 'Next.js & Server Components', category: 'Frontend' },
  { name: 'PostgreSQL Advanced Indexing', category: 'Database' },
  { name: 'DSA & LeetCode Hard Patterns', category: 'Core' },
];

export const WhatIfDiffModal: React.FC<WhatIfDiffModalProps> = ({
  isOpen,
  baselineSimulation,
  onClose,
  onSimulationUpdated,
}) => {
  const [selectedSkills, setSelectedSkills] = useState<{ skill_name: string; self_level: number; category: string }[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customLevel] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<SimulationComparisonSummary | null>(null);
  const [newSimulation, setNewSimulation] = useState<SimulationDetail | null>(null);

  if (!isOpen || !baselineSimulation) return null;

  const togglePresetSkill = (preset: { name: string; category: string }) => {
    const exists = selectedSkills.find((s) => s.skill_name === preset.name);
    if (exists) {
      setSelectedSkills(selectedSkills.filter((s) => s.skill_name !== preset.name));
    } else {
      setSelectedSkills([
        ...selectedSkills,
        { skill_name: preset.name, self_level: 3, category: preset.category },
      ]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkill.trim()) return;
    if (selectedSkills.some((s) => s.skill_name.toLowerCase() === customSkill.trim().toLowerCase())) return;

    setSelectedSkills([
      ...selectedSkills,
      { skill_name: customSkill.trim(), self_level: customLevel, category: 'Custom' },
    ]);
    setCustomSkill('');
  };

  const handleRunWhatIf = async () => {
    if (selectedSkills.length === 0) {
      setError('Please add at least one skill to simulate your "What-If" scenario.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setComparisonResult(null);

    try {
      const res = await api.simulations.resimulate(baselineSimulation.id, {
        what_if_added_skills: selectedSkills,
      });

      // Poll until succeeded
      let jobStatus = res.status;
      let finalSimId = res.simulation_id;
      const startTime = Date.now();

      while (jobStatus === 'queued' || jobStatus === 'running') {
        if (Date.now() - startTime > 45000) {
          throw new Error('Simulation timed out. Please try again.');
        }
        await new Promise((r) => setTimeout(r, 2000));
        const check = await api.simulations.getJobStatus(res.job_id);
        jobStatus = check.status;
        finalSimId = check.simulation_id;
        if (jobStatus === 'failed') {
          throw new Error(check.error_message || 'What-If Re-simulation failed');
        }
      }

      if (finalSimId) {
        const fullNewSim = await api.simulations.getDetail(finalSimId);
        setNewSimulation(fullNewSim);
        if (fullNewSim.comparison) {
          setComparisonResult(fullNewSim.comparison);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to execute What-If simulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = () => {
    if (newSimulation) {
      onSimulationUpdated(newSimulation);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="what-if-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="what-if-modal-title" className="text-lg font-bold text-gray-900">
                "What If I Learn..." Career Experiment
              </h3>
              <p className="text-xs text-gray-500">
                Explore how learning new technologies shifts your fit scores and bridges skill gaps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* If Comparison Result Exists, Show Diff View */}
        {comparisonResult ? (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Re-simulation Complete & Compared!</span>
              </div>
              <p className="text-2xs leading-relaxed">{comparisonResult.notes}</p>
            </div>

            {/* Fit Score Changes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                Fit Score Impact (Deltas)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(comparisonResult.fit_score_changes || {}).map(([slug, delta]) => (
                  <div
                    key={slug}
                    className="p-3 rounded-lg border bg-white flex flex-col justify-between"
                  >
                    <span className="text-2xs font-bold text-gray-600 capitalize truncate">
                      {slug.replace(/-/g, ' ')}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {delta >= 0 ? (
                        <>
                          <ArrowUpRight className="w-4 h-4 text-emerald-600 font-bold" />
                          <span className="text-sm font-extrabold text-emerald-700">+{delta}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4 text-rose-600 font-bold" />
                          <span className="text-sm font-extrabold text-rose-700">{delta}%</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closed Gaps */}
            {comparisonResult.closed_skill_gaps && comparisonResult.closed_skill_gaps.length > 0 && (
              <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <span className="text-2xs font-bold text-emerald-900 uppercase tracking-wider">
                  Skill Gaps Closed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {comparisonResult.closed_skill_gaps.map((g, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white text-emerald-800 text-2xs font-semibold border border-emerald-200"
                    >
                      ✓ {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setComparisonResult(null);
                  setNewSimulation(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Try Another Scenario
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
              >
                Apply & View New Simulation
              </button>
            </div>
          </div>
        ) : (
          /* Form to Pick Skills */
          <div className="space-y-5">
            {/* Preset Skill Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                <span>Select Target Technologies to Acquire:</span>
                <span className="text-2xs text-gray-400 font-normal">
                  {selectedSkills.length} selected
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {PRESET_WHAT_IF_SKILLS.map((preset) => {
                  const isSelected = selectedSkills.some((s) => s.skill_name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => togglePresetSkill(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span>{preset.name}</span>
                      {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleAddCustom} className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Or Add a Custom Skill:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="e.g. Flutter, Go, LangChain..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!customSkill.trim()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Selected Skills Chips */}
            {selectedSkills.length > 0 && (
              <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 space-y-2">
                <span className="text-2xs font-bold text-purple-900 uppercase tracking-wider">
                  Skills Being Evaluated in this Simulation:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-purple-200 text-purple-900 text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <span>{s.skill_name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSkills(selectedSkills.filter((item) => item.skill_name !== s.skill_name))
                        }
                        className="text-purple-400 hover:text-purple-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRunWhatIf}
                disabled={isSubmitting || selectedSkills.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Simulating What-If Scenario...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run What-If Re-Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
