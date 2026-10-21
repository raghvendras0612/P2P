import React from 'react';
import {
  Award,
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  ListChecks,
  Sparkles,
  X,
} from 'lucide-react';
import { SimulatedPath } from '../../types';

interface ChoosePathModalProps {
  path: SimulatedPath | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ChoosePathModal: React.FC<ChoosePathModalProps> = ({
  path,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !path) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-path-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 id="choose-path-modal-title" className="text-lg font-bold text-gray-900">
                Choose This Career Track
              </h3>
              <p className="text-xs text-gray-500">
                Align your entire preparation dashboard to this target
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Path Highlights */}
        <div className="bg-primary-50/40 rounded-xl p-4 border border-primary-100 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-sm">{path.title}</h4>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              {path.fit_score}% Fit
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{path.summary}</p>
        </div>

        {/* Personalization Impact Callout */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            What happens when you select this track:
          </h5>

          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <Compass className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
              <span>
                <strong>Roadmap Alignment:</strong> Your dashboard homepage will track milestones and checkpoints specifically for {path.title}.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <ListChecks className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <span>
                <strong>Skill Gap Bridging:</strong> Upcoming diagnostic tests will focus on this path's {path.skill_gaps.length} critical skills.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                <strong>Targeted Resume:</strong> The ATS resume builder will emphasize projects and competencies relevant to this role.
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <Bot className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <span>
                <strong>Specialized AI Mentor:</strong> Your AI chat mentor will answer interview prep questions calibrated to this track.
              </span>
            </li>
          </ul>

          <p className="text-2xs text-gray-500 italic pt-1">
            * You can switch your selected path or re-simulate at any time with no penalties.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Activating Path...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Adapt Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
