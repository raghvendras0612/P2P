import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EducationEntry, OnboardingDraft } from '../../../types';

interface Step3Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  onBack: () => void;
  setError: (err: string | null) => void;
}

const COMMON_BOARDS = ['CBSE', 'ICSE / ISC', 'State Board', 'IB / Cambridge', 'Other'];

export const Step3Education: React.FC<Step3Props> = ({
  draft,
  updateDraft,
  onNext,
  onBack,
  setError,
}) => {
  const { education } = draft;

  const handleAddEntry = () => {
    const newEntry: EducationEntry = {
      level: '12th',
      institution_name: '',
      board_or_university: 'CBSE',
      passing_year: new Date().getFullYear() - 2,
      percentage: 85.0,
    };
    updateDraft((d) => ({
      ...d,
      education: [...d.education, newEntry],
    }));
  };

  const handleRemoveEntry = (index: number) => {
    if (education.length <= 1) {
      setError('At least one education record is required.');
      return;
    }
    updateDraft((d) => ({
      ...d,
      education: d.education.filter((_, i) => i !== index),
    }));
  };

  const handleFieldChange = (index: number, field: keyof EducationEntry, value: any) => {
    updateDraft((d) => {
      const updated = [...d.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...d, education: updated };
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (education.length === 0) {
      setError('Please add at least one education record (e.g., 10th or 12th).');
      return;
    }

    for (let i = 0; i < education.length; i++) {
      const entry = education[i];
      if (!entry.institution_name.trim()) {
        setError(`Please specify the school/college name for entry #${i + 1} (${entry.level}).`);
        return;
      }
      if (!entry.board_or_university.trim()) {
        setError(`Please specify the Board or University for entry #${i + 1}.`);
        return;
      }
      const pct = Number(entry.percentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setError(`Percentage for entry #${i + 1} must be between 0.00 and 100.00%.`);
        return;
      }
    }

    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Step 3: Education History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Indian campus placements require 10th and 12th/Diploma academic records for cutoff shortlisting.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddEntry}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Degree / School
        </button>
      </div>

      <div className="space-y-4">
        {education.map((entry, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3 relative"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-semibold text-sm text-gray-800">
                Record #{idx + 1}: {entry.level || 'Education Entry'}
              </span>
              {education.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove this record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Level */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Standard / Degree</label>
                <select
                  value={entry.level}
                  onChange={(e) => handleFieldChange(idx, 'level', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="10th">Class 10th (Secondary)</option>
                  <option value="12th">Class 12th (Senior Secondary)</option>
                  <option value="Diploma">Polytechnic / Diploma</option>
                  <option value="Undergraduate">Undergraduate (B.Tech / B.E.)</option>
                </select>
              </div>

              {/* Institution Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">School / College Name</label>
                <input
                  type="text"
                  required
                  value={entry.institution_name}
                  onChange={(e) => handleFieldChange(idx, 'institution_name', e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Board / University */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Board / University</label>
                <input
                  type="text"
                  list={`boards-${idx}`}
                  required
                  value={entry.board_or_university}
                  onChange={(e) => handleFieldChange(idx, 'board_or_university', e.target.value)}
                  placeholder="e.g. CBSE, ICSE"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <datalist id={`boards-${idx}`}>
                  {COMMON_BOARDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Passing Year</label>
                <input
                  type="number"
                  required
                  min={1990}
                  max={2035}
                  value={entry.passing_year}
                  onChange={(e) => handleFieldChange(idx, 'passing_year', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  required
                  value={entry.percentage}
                  onChange={(e) => handleFieldChange(idx, 'percentage', Number(e.target.value))}
                  placeholder="e.g. 91.5"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        ))}
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
          Next: Technical Skills &rarr;
        </button>
      </div>
    </form>
  );
};
