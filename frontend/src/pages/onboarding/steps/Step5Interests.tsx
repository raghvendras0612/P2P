import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../../api/client';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Interest, OnboardingDraft } from '../../../types';

interface Step5Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  onBack: () => void;
  setError: (err: string | null) => void;
}

export const Step5Interests: React.FC<Step5Props> = ({
  draft,
  updateDraft,
  onNext,
  onBack,
  setError,
}) => {
  const { interest_ids: selectedIds } = draft;
  const [catalog, setCatalog] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchInterests = async () => {
      try {
        const data = await api.catalog.getInterests();
        if (mounted) setCatalog(data);
      } catch (err) {
        console.error('Failed to load interests catalog:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInterests();
    return () => {
      mounted = false;
    };
  }, []);

  const groupedInterests = useMemo(() => {
    const groups: { [key: string]: Interest[] } = {};
    catalog.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = [];
      }
      groups[item.group].push(item);
    });
    return groups;
  }, [catalog]);

  const handleToggle = (id: number) => {
    setError(null);
    updateDraft((d) => {
      const exists = d.interest_ids.includes(id);
      return {
        ...d,
        interest_ids: exists
          ? d.interest_ids.filter((i) => i !== id)
          : [...d.interest_ids, id],
      };
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedIds.length === 0) {
      setError('Please select at least one interest area to help the AI simulate your path.');
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step 5: Career & Technical Interests</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select what excites you most. We will use these to suggest your 3 realistic career simulation tracks.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading interest checklist..." size="md" />
      ) : (
        <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
          {Object.entries(groupedInterests).map(([groupName, items]) => (
            <div key={groupName} className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {groupName}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-primary-50 border-primary-400 text-primary-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}} // Handled by label click
                        className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2.5 text-xs font-medium leading-relaxed select-none">
                        {item.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
        >
          &larr; Back
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm"
        >
          Next: Projects & Experience &rarr;
        </button>
      </div>
    </form>
  );
};
