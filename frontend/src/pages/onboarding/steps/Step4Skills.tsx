import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { api } from '../../../api/client';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { OnboardingDraft, SelfSkillLevel, Skill } from '../../../types';

interface Step4Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  onBack: () => void;
  setError: (err: string | null) => void;
}

export const Step4Skills: React.FC<Step4Props> = ({
  draft,
  updateDraft,
  onNext,
  onBack,
  setError,
}) => {
  const { skills: selectedSkills } = draft;
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        const data = await api.catalog.getSkills();
        if (mounted) setCatalog(data);
      } catch (err) {
        console.error('Failed to load skills catalog:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set).sort()];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((skill) => {
      const matchesCategory =
        selectedCategory === 'All' || skill.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        skill.name.toLowerCase().includes(term) ||
        (skill.aliases && skill.aliases.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [catalog, selectedCategory, searchTerm]);

  const isSelected = (skillId?: number, name?: string) => {
    return selectedSkills.some(
      (s) => (skillId && s.skill_id === skillId) || (name && s.skill_name.toLowerCase() === name.toLowerCase())
    );
  };

  const handleToggleSkill = (skill: Skill) => {
    setError(null);
    if (isSelected(skill.id)) {
      updateDraft((d) => ({
        ...d,
        skills: d.skills.filter((s) => s.skill_id !== skill.id),
      }));
    } else {
      updateDraft((d) => ({
        ...d,
        skills: [
          ...d.skills,
          {
            skill_id: skill.id,
            skill_name: skill.name,
            category: skill.category,
            self_level: 2, // Default to Intermediate
          },
        ],
      }));
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (isSelected(undefined, trimmed)) {
      setError(`"${trimmed}" is already added to your skills.`);
      return;
    }

    updateDraft((d) => ({
      ...d,
      skills: [
        ...d.skills,
        {
          custom_skill_name: trimmed,
          skill_name: trimmed,
          category: selectedCategory === 'All' ? 'Other' : selectedCategory,
          self_level: 2,
        },
      ],
    }));
    setCustomInput('');
    setError(null);
  };

  const handleLevelChange = (index: number, level: SelfSkillLevel) => {
    updateDraft((d) => {
      const updated = [...d.skills];
      updated[index] = { ...updated[index], self_level: level };
      return { ...d, skills: updated };
    });
  };

  const handleRemoveSkill = (index: number) => {
    updateDraft((d) => ({
      ...d,
      skills: d.skills.filter((_, i) => i !== index),
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedSkills.length === 0) {
      setError('Please select or add at least one technical skill you have learned.');
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step 4: Claim Your Technical Skills</h3>
        <p className="text-sm text-gray-500 mt-1">
          Pick everything you currently know or are studying. In Phase 4, you can take diagnostic tests to verify them!
        </p>
      </div>

      {/* Selected skills list with self-rating controls */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Your Chosen Skills ({selectedSkills.length})
        </label>
        {selectedSkills.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-sm text-gray-400 bg-white">
            No skills selected yet. Choose from the catalog below or add a custom skill.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {selectedSkills.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-xs text-sm"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-gray-900 truncate">{s.skill_name}</div>
                  <div className="text-xs text-gray-400">{s.category || 'General'}</div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* Rating Selector */}
                  <div className="inline-flex rounded-md shadow-xs bg-gray-100 p-0.5 text-xs">
                    {(
                      [
                        { level: 1, label: 'Beg' },
                        { level: 2, label: 'Int' },
                        { level: 3, label: 'Adv' },
                      ] as const
                    ).map((tier) => (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => handleLevelChange(idx, tier.level)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          s.self_level === tier.level
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Search & Filter */}
      <div className="pt-2 border-t border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills (e.g. Python, React, DSA, Docker)..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Add custom skill input */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              placeholder="Custom skill..."
              className="w-36 sm:w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skill Chips from Catalog */}
        {loading ? (
          <LoadingSpinner message="Loading skills catalog..." size="sm" />
        ) : (
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 bg-gray-50/50 rounded-lg border border-gray-100">
            {filteredCatalog.map((skill) => {
              const active = isSelected(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleToggleSkill(skill)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-primary-100 border-primary-500 text-primary-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {skill.name}
                  {active && <X className="w-3 h-3 ml-1.5 text-primary-600" />}
                </button>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="w-full text-center py-4 text-xs text-gray-400">
                No matching catalog skills found. Use the "Add" button above to add custom skills!
              </div>
            )}
          </div>
        )}
      </div>

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
          Next: Career Interests &rarr;
        </button>
      </div>
    </form>
  );
};
