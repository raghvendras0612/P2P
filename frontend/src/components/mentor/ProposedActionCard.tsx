import React, { useState } from 'react';
import { Check, CheckCircle2, FolderGit2, ListTodo, Loader2, Plus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ProposedAction } from '../../types';

interface ProposedActionCardProps {
  action: ProposedAction;
  careerPathSlug?: string;
  onAdded?: () => void;
}

export const ProposedActionCard: React.FC<ProposedActionCardProps> = ({
  action,
  careerPathSlug,
  onAdded,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isProject = action.type === 'add_project';

  const handleConfirm = async () => {
    try {
      setIsAdding(true);
      setFeedback(null);
      const res = await apiClient.mentor.confirmAction({
        type: action.type,
        title: action.title,
        description: action.description,
        career_path_slug: careerPathSlug,
      });

      setIsAdded(true);
      setFeedback(res.message);
      if (onAdded) onAdded();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to add action.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-3 bg-white border border-primary-200 rounded-xl p-3.5 shadow-xs transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isProject
                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                : 'bg-primary-50 text-primary-600 border border-primary-200'
            }`}
          >
            {isProject ? <FolderGit2 className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wider ${
                  isProject ? 'bg-purple-100 text-purple-800' : 'bg-primary-100 text-primary-800'
                }`}
              >
                {isProject ? 'Suggested Project' : 'Actionable Task'}
              </span>
            </div>
            <h5 className="text-xs font-bold text-gray-900 mt-1">{action.title}</h5>
            {action.description && (
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{action.description}</p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {isAdded ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Added
            </span>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={isAdding}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-xs"
              title="Add this item to your progress roadmap"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Progress
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-2 text-2xs flex items-center gap-1 ${
            isAdded ? 'text-emerald-700' : 'text-red-600'
          }`}
        >
          {isAdded && <CheckCircle2 className="w-3 h-3" />}
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
