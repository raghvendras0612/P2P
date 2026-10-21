import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickActionChipsProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  'Explain my biggest skill gap',
  'What should I do this week?',
  'Review my progress',
  'Prepare me for placements in 3 months',
  'Why this path over the others?',
];

export const QuickActionChips: React.FC<QuickActionChipsProps> = ({
  onSelectAction,
  disabled = false,
}) => {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-2xs font-semibold text-gray-500 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary-500" />
        <span>Quick Questions:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(action)}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-gray-200 transition-colors disabled:opacity-40 text-left cursor-pointer"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};
