import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { OnboardingDraft } from '../../../types';

interface Step1Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  setError: (err: string | null) => void;
}

export const Step1Account: React.FC<Step1Props> = ({ draft, updateDraft, onNext, setError }) => {
  const [showPass, setShowPass] = useState(false);
  const { email, password, confirmPassword } = draft.account;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleNext} noValidate className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Step 1: Create Your Account</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sign up with your primary email to begin simulating placement tracks.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  account: { ...d.account, email: e.target.value },
                }))
              }
              placeholder="e.g. rahul.sharma@nitk.edu.in"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  account: { ...d.account, password: e.target.value },
                }))
              }
              placeholder="Minimum 8 characters"
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassword || ''}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  account: { ...d.account, confirmPassword: e.target.value },
                }))
              }
              placeholder="Re-enter password"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          Next: Academic Basics &rarr;
        </button>
      </div>
    </form>
  );
};
