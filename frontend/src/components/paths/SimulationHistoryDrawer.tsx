import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Sparkles,
  X,
} from 'lucide-react';
import { SimulationDetail } from '../../types';

interface SimulationHistoryDrawerProps {
  isOpen: boolean;
  history: SimulationDetail[];
  currentSimulationId?: number | null;
  onClose: () => void;
  onSelectSimulation: (simulation: SimulationDetail) => void;
}

export const SimulationHistoryDrawer: React.FC<SimulationHistoryDrawerProps> = ({
  isOpen,
  history,
  currentSimulationId,
  onClose,
  onSelectSimulation,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-2xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary-600" />
              <h3 id="history-drawer-title" className="text-base font-bold text-gray-900">
                Simulation History ({history.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* History List */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 space-y-2">
                <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold">No simulation history yet</p>
                <p className="text-xs text-gray-400">
                  Run your first career simulation to generate and track paths.
                </p>
              </div>
            ) : (
              history.map((sim) => {
                const isCurrent = sim.id === currentSimulationId;
                const formattedDate = new Date(sim.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sim.id}
                    className={`rounded-xl border p-4 transition-all space-y-3 ${
                      isCurrent
                        ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {sim.mode} Mode
                          </span>
                          <span className="text-2xs font-mono text-gray-400">
                            v{sim.prompt_version}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-primary-100 text-primary-800 border border-primary-200">
                          <CheckCircle2 className="w-3 h-3 text-primary-600" />
                          Viewing
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSimulation(sim);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-md text-xs font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 border border-primary-200 inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Load</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Path Snapshots */}
                    <div className="space-y-1.5 pt-1">
                      {sim.output?.paths?.map((p) => (
                        <div
                          key={p.path_slug}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-gray-50 border border-gray-100"
                        >
                          <span className="font-medium text-gray-800 line-clamp-1">{p.title}</span>
                          <span className="font-bold text-emerald-700 text-2xs shrink-0 ml-2">
                            {p.fit_score}% Fit
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Comparison note if present */}
                    {sim.comparison && (
                      <div className="text-2xs text-indigo-700 bg-indigo-50/60 p-2 rounded border border-indigo-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>What-If Re-simulation Delta Computed</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
