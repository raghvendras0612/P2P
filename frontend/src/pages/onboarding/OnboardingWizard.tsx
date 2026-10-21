import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/common/Alert';
import { OnboardingDraft } from '../../types';
import { Step1Account } from './steps/Step1Account';
import { Step2Basics } from './steps/Step2Basics';
import { Step3Education } from './steps/Step3Education';
import { Step4Skills } from './steps/Step4Skills';
import { Step5Interests } from './steps/Step5Interests';
import { Step6Projects } from './steps/Step6Projects';
import { Step7LinksGoals } from './steps/Step7LinksGoals';

const DRAFT_STORAGE_KEY = 'career_path_onboarding_draft_v1';

const INITIAL_DRAFT: OnboardingDraft = {
  step: 1,
  account: {
    email: '',
    password: '',
    confirmPassword: '',
  },
  basics: {
    full_name: '',
    phone: '',
    college: '',
    branch: '',
    year_of_study: 3,
    expected_graduation_year: new Date().getFullYear() + 1,
    cgpa: 8.0,
    city: '',
    state: 'Karnataka',
  },
  education: [
    {
      level: '10th',
      institution_name: '',
      board_or_university: 'CBSE',
      passing_year: new Date().getFullYear() - 4,
      percentage: 85.0,
    },
    {
      level: '12th',
      institution_name: '',
      board_or_university: 'CBSE',
      passing_year: new Date().getFullYear() - 2,
      percentage: 85.0,
    },
  ],
  skills: [],
  interest_ids: [],
  projects: [],
  experiences: [],
  links: {
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    career_goal_text: '',
    preferred_work_style: 'Hybrid',
  },
};

export const OnboardingWizard: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_DRAFT;
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // storage unavailable
    }
  }, [draft]);

  const stepTitles = [
    'Account',
    'Basics',
    'Education',
    'Skills',
    'Interests',
    'Projects',
    'Goals & Links',
  ];

  const handleNext = () => {
    setError(null);
    setDraft((d) => ({ ...d, step: Math.min(d.step + 1, 7) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError(null);
    setDraft((d) => ({ ...d, step: Math.max(d.step - 1, 1) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const cleanPhone = draft.basics.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

      const payload = {
        email: draft.account.email.trim(),
        password: draft.account.password,
        profile: {
          full_name: draft.basics.full_name.trim(),
          phone: cleanPhone,
          college: draft.basics.college.trim(),
          branch: draft.basics.branch.trim(),
          year_of_study: Number(draft.basics.year_of_study),
          expected_graduation_year: Number(draft.basics.expected_graduation_year),
          cgpa: Number(draft.basics.cgpa),
          city: draft.basics.city.trim(),
          state: draft.basics.state.trim(),
          linkedin_url: draft.links.linkedin_url.trim() || null,
          github_url: draft.links.github_url.trim() || null,
          portfolio_url: draft.links.portfolio_url.trim() || null,
          career_goal_text: draft.links.career_goal_text.trim() || null,
          preferred_work_style: draft.links.preferred_work_style || null,
        },
        education: draft.education.map((e) => ({
          level: e.level,
          institution_name: e.institution_name.trim(),
          board_or_university: e.board_or_university.trim(),
          passing_year: Number(e.passing_year),
          percentage: Number(e.percentage),
        })),
        skills: draft.skills.map((s) => ({
          skill_id: s.skill_id,
          custom_skill_name: s.custom_skill_name,
          category: s.category,
          self_level: s.self_level,
        })),
        interest_ids: draft.interest_ids,
        projects: draft.projects
          .filter((p) => p.title.trim() && p.description.trim())
          .map((p) => ({
            title: p.title.trim(),
            description: p.description.trim(),
            tech_stack: p.tech_stack.trim(),
            link: p.link?.trim() || null,
          })),
        experiences: draft.experiences
          .filter((exp) => exp.title.trim())
          .map((exp) => ({
            type: exp.type,
            title: exp.title.trim(),
            organization: exp.organization?.trim() || null,
            description: exp.description?.trim() || null,
            date_or_duration: exp.date_or_duration?.trim() || null,
            link: exp.link?.trim() || null,
          })),
      };

      await register(payload);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white shadow-sm mb-1">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Career Path Simulator
          </h2>
          <p className="text-sm text-gray-500">
            Engineered for Indian engineering students to calibrate placement readiness and target career paths.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Step Progress Bar */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
                Step {draft.step} of 7: {stepTitles[draft.step - 1]}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {Math.round((draft.step / 7) * 100)}% Completed
              </span>
            </div>
            {/* Progress Bar line */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${(draft.step / 7) * 100}%` }}
              />
            </div>
            {/* Step navigation dots */}
            <div className="hidden sm:flex justify-between mt-3 text-xs text-gray-400">
              {stepTitles.map((title, i) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    // Only allow jumping back to previous steps
                    if (i + 1 < draft.step) {
                      setError(null);
                      setDraft((d) => ({ ...d, step: i + 1 }));
                    }
                  }}
                  disabled={i + 1 > draft.step}
                  className={`transition-colors ${
                    i + 1 === draft.step
                      ? 'font-bold text-primary-700'
                      : i + 1 < draft.step
                      ? 'text-gray-600 hover:text-gray-900 cursor-pointer'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {i + 1}. {title}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            {draft.step === 1 && (
              <Step1Account
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                setError={setError}
              />
            )}
            {draft.step === 2 && (
              <Step2Basics
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                onBack={handleBack}
                setError={setError}
              />
            )}
            {draft.step === 3 && (
              <Step3Education
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                onBack={handleBack}
                setError={setError}
              />
            )}
            {draft.step === 4 && (
              <Step4Skills
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                onBack={handleBack}
                setError={setError}
              />
            )}
            {draft.step === 5 && (
              <Step5Interests
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                onBack={handleBack}
                setError={setError}
              />
            )}
            {draft.step === 6 && (
              <Step6Projects
                draft={draft}
                updateDraft={setDraft}
                onNext={handleNext}
                onBack={handleBack}
                setError={setError}
              />
            )}
            {draft.step === 7 && (
              <Step7LinksGoals
                draft={draft}
                updateDraft={setDraft}
                onSubmit={handleSubmit}
                onBack={handleBack}
                submitting={submitting}
                setError={setError}
              />
            )}
          </div>
        </div>

        {/* Existing account link */}
        <div className="text-center text-sm text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
