import React from 'react';
import { OnboardingDraft } from '../../../types';

interface Step2Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  onBack: () => void;
  setError: (err: string | null) => void;
}

const COMMON_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Artificial Intelligence & Data Science',
  'Other / Interdisciplinary',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi NCR', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

export const Step2Basics: React.FC<Step2Props> = ({
  draft,
  updateDraft,
  onNext,
  onBack,
  setError,
}) => {
  const { basics } = draft;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!basics.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    // Phone validation: Indian 10-digit mobile
    const cleanPhone = basics.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    if (!basics.college.trim()) {
      setError('College / University name is required.');
      return;
    }

    if (!basics.branch.trim()) {
      setError('Engineering branch is required.');
      return;
    }

    const cgpaNum = Number(basics.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError('CGPA must be between 0.00 and 10.00 on a 10-point scale.');
      return;
    }

    if (!basics.city.trim() || !basics.state.trim()) {
      setError('City and State are required.');
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleNext} noValidate className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step 2: Academic & Personal Basics</h3>
        <p className="text-sm text-gray-500 mt-1">
          These details calibrate your current year standing and campus placement requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={basics.full_name}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, full_name: e.target.value },
              }))
            }
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (India)</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              value={basics.phone}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  basics: { ...d.basics, phone: e.target.value },
                }))
              }
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* College */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">College / University</label>
          <input
            type="text"
            required
            value={basics.college}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, college: e.target.value },
              }))
            }
            placeholder="e.g. National Institute of Technology Karnataka (NITK)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch / Specialization</label>
          <input
            type="text"
            list="branches-list"
            required
            value={basics.branch}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, branch: e.target.value },
              }))
            }
            placeholder="Select or type branch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
          <datalist id="branches-list">
            {COMMON_BRANCHES.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        {/* Year of study */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Year of Study</label>
          <select
            value={basics.year_of_study}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, year_of_study: Number(e.target.value) },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value={1}>1st Year (Freshman)</option>
            <option value={2}>2nd Year (Sophomore)</option>
            <option value={3}>3rd Year (Pre-final Year)</option>
            <option value={4}>4th Year (Final Year)</option>
          </select>
        </div>

        {/* Expected Graduation Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Year</label>
          <input
            type="number"
            required
            min={2024}
            max={2032}
            value={basics.expected_graduation_year}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, expected_graduation_year: Number(e.target.value) },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* CGPA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current B.Tech CGPA <span className="text-gray-400 font-normal">(0.00 - 10.00)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={10}
            required
            value={basics.cgpa}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, cgpa: Number(e.target.value) },
              }))
            }
            placeholder="e.g. 8.45"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current City</label>
          <input
            type="text"
            required
            value={basics.city}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, city: e.target.value },
              }))
            }
            placeholder="e.g. Bengaluru, Pune, Delhi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={basics.state}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                basics: { ...d.basics, state: e.target.value },
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
          Next: Education History &rarr;
        </button>
      </div>
    </form>
  );
};
