import React from 'react';
import { Github, Globe, Linkedin, Sparkles } from 'lucide-react';
import { OnboardingDraft } from '../../../types';

interface Step7Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  setError: (err: string | null) => void;
}

export const Step7LinksGoals: React.FC<Step7Props> = ({
  draft,
  updateDraft,
  onSubmit,
  onBack,
  submitting,
  setError,
}) => {
  const { links } = draft;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step 7: Professional Links & Career Goal</h3>
        <p className="text-sm text-gray-500 mt-1">
          Provide your profile links and summarize what you want to achieve through this career simulation.
        </p>
      </div>

      <div className="space-y-4">
        {/* LinkedIn */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
          <div className="relative rounded-md shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Linkedin className="h-4 w-4" />
            </div>
            <input
              type="url"
              value={links.linkedin_url}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  links: { ...d.links, linkedin_url: e.target.value },
                }))
              }
              placeholder="https://linkedin.com/in/username"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Profile URL</label>
          <div className="relative rounded-md shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Github className="h-4 w-4" />
            </div>
            <input
              type="url"
              value={links.github_url}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  links: { ...d.links, github_url: e.target.value },
                }))
              }
              placeholder="https://github.com/username"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Personal Portfolio / Website</label>
          <div className="relative rounded-md shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Globe className="h-4 w-4" />
            </div>
            <input
              type="url"
              value={links.portfolio_url}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  links: { ...d.links, portfolio_url: e.target.value },
                }))
              }
              placeholder="https://yourportfolio.dev"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Preferred Work Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Work Style</label>
          <select
            value={links.preferred_work_style}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                links: { ...d.links, preferred_work_style: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="Hybrid">Hybrid (Bangalore / Pune / Hyderabad office + WFH)</option>
            <option value="In-office">In-Office (Campus Placement standard)</option>
            <option value="Remote">Fully Remote</option>
          </select>
        </div>

        {/* Career Goal Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Career Goal & Dream Role Statement
          </label>
          <textarea
            rows={3}
            value={links.career_goal_text}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                links: { ...d.links, career_goal_text: e.target.value },
              }))
            }
            placeholder="e.g. Aiming for an SDE-1 backend or full-stack role in a high-growth product startup or Tier-1 MNC during 7th semester campus placements..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            This statement directly informs the AI simulation engine in Phase 2.
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          &larr; Back
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-7 py-3 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {submitting ? 'Registering & Building Profile...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
};
