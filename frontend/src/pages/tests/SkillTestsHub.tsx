import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Clock,
  Compass,
  ExternalLink,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSelectedPath } from '../../context/SelectedPathContext';
import {
  ActiveTestSessionRead,
  ClaimedSkillTestEligibility,
  TestResultResponse,
} from '../../types';
import { TestRunner } from './TestRunner';
import { TestScorecardModal } from './TestScorecardModal';

export const SkillTestsHub: React.FC = () => {
  const { selectedPath } = useSelectedPath();

  const [skills, setSkills] = useState<ClaimedSkillTestEligibility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active testing session state
  const [activeSession, setActiveSession] = useState<ActiveTestSessionRead | null>(null);
  const [isStartingSkillId, setIsStartingSkillId] = useState<number | null>(null);

  // Scorecard modal state
  const [scorecardAttemptId, setScorecardAttemptId] = useState<number | null>(null);
  const [scorecardResult, setScorecardResult] = useState<TestResultResponse | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState<boolean>(false);

  const fetchEligibility = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.tests.getEligibility();
      setSkills(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill test data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
  }, []);

  // Check for any skill with an active in-progress attempt
  const inProgressSkill = useMemo(() => {
    return skills.find((s) => s.active_attempt_id != null);
  }, [skills]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => set.add(s.category));
    return ['All', ...Array.from(set)];
  }, [skills]);

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) {
        return false;
      }
      if (showRecommendedOnly && !s.is_priority_for_selected_path) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [skills, selectedCategory, showRecommendedOnly, searchQuery]);

  // Counts
  const verifiedCount = skills.filter((s) => s.status === 'verified').length;
  const cooldownCount = skills.filter((s) => !s.can_take_test && !s.active_attempt_id).length;

  const handleStartOrResume = async (skill: ClaimedSkillTestEligibility) => {
    try {
      setIsStartingSkillId(skill.skill_id);
      const sessionData = await api.tests.startTest(skill.skill_id);
      setActiveSession(sessionData);
    } catch (err: any) {
      alert(err.message || 'Failed to launch test session.');
    } finally {
      setIsStartingSkillId(null);
    }
  };

  const formatCooldown = (seconds: number) => {
    const hours = Math.ceil(seconds / 3600);
    if (hours >= 24) {
      const days = Math.ceil(hours / 24);
      return `${days}d cooldown`;
    }
    return `${hours}h cooldown`;
  };

  // If a test runner session is currently active, render it full view!
  if (activeSession) {
    return (
      <TestRunner
        session={activeSession}
        onFinish={(result) => {
          setActiveSession(null);
          setScorecardResult(result);
          setScorecardAttemptId(result.attempt_id);
          fetchEligibility();
        }}
        onCancel={() => {
          setActiveSession(null);
          fetchEligibility();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
              Technical Verification
            </span>
            {selectedPath && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-600" />
                Targeting: {selectedPath.career_path.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
            Skill Tests & Verification
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Verify your claimed technical skills through AI-generated diagnostic tests. Verified
            credentials carry heavy weight on your ATS Resume and calibrate your Career Roadmap.
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Claimed
            </span>
            <span className="text-xl font-extrabold text-gray-900">{skills.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Verified
            </span>
            <span className="text-xl font-extrabold text-emerald-700">{verifiedCount}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-xs text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
              In Cooldown
            </span>
            <span className="text-xl font-extrabold text-amber-700">{cooldownCount}</span>
          </div>
        </div>
      </div>

      {/* In-Progress Test Banner Alert */}
      {inProgressSkill && (
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                Active Assessment
              </span>
              <h3 className="text-lg font-extrabold mt-1">
                You have an in-progress test for {inProgressSkill.name}!
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                The 45-minute server timer is currently ticking. Resume immediately to submit your
                answers.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleStartOrResume(inProgressSkill)}
            disabled={isStartingSkillId === inProgressSkill.skill_id}
            className="px-5 py-2.5 bg-white text-primary-900 hover:bg-gray-100 rounded-xl text-xs font-bold shadow-md transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-primary-900" />
            <span>Resume Assessment</span>
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search claimed skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Recommended Filter Checkbox */}
          {selectedPath && (
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRecommendedOnly}
                onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded-sm border-gray-300 focus:ring-primary-500"
              />
              <span className="flex items-center gap-1 text-primary-800 font-semibold">
                <Compass className="w-3.5 h-3.5 text-primary-600" />
                Show Recommended for {selectedPath.career_path.name} only
              </span>
            </label>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner message="Loading claimed skills and test eligibility..." size="lg" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchEligibility}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-4">
          <Award className="w-12 h-12 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-gray-900">No matching skills found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {skills.length === 0
                ? 'You have not claimed any skills yet. Head over to your profile to claim your technical skills!'
                : 'No skills match your active category or search filter.'}
            </p>
          </div>
          {skills.length === 0 && (
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700"
            >
              <span>Add Skills in Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => {
            const isStarting = isStartingSkillId === skill.skill_id;
            const hasActiveAttempt = skill.active_attempt_id != null;

            return (
              <div
                key={skill.skill_id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  skill.status === 'verified'
                    ? 'border-emerald-200/90'
                    : skill.is_priority_for_selected_path
                    ? 'border-primary-200 ring-1 ring-primary-100'
                    : 'border-gray-200'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {skill.category}
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                        {skill.name}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {skill.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lvl {skill.verified_level || 1} Verified</span>
                        </span>
                      ) : skill.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Needs Revision</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          <Award className="w-3.5 h-3.5 text-gray-500" />
                          <span>Self-Claimed (Lvl {skill.self_level})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority Tag */}
                  {skill.is_priority_for_selected_path && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary-50 text-primary-800 border border-primary-200">
                      <Sparkles className="w-3 h-3 text-primary-600" />
                      <span>Recommended for Career Path</span>
                    </div>
                  )}

                  {/* Verification detail */}
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Claimed Level:</span>
                      <span className="font-semibold text-gray-800">
                        Level {skill.self_level} (
                        {skill.self_level === 3
                          ? 'Advanced'
                          : skill.self_level === 2
                          ? 'Intermediate'
                          : 'Beginner'}
                        )
                      </span>
                    </div>
                    {skill.verified_level_name && (
                      <div className="flex justify-between text-emerald-800 font-semibold">
                        <span>Verified Level:</span>
                        <span>{skill.verified_level_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button Area */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  {hasActiveAttempt ? (
                    <button
                      onClick={() => handleStartOrResume(skill)}
                      disabled={isStarting}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isStarting ? 'Resuming...' : 'Resume Test In Progress'}</span>
                    </button>
                  ) : !skill.can_take_test ? (
                    <div className="space-y-1">
                      <button
                        disabled
                        className="w-full py-2.5 px-4 bg-gray-100 border border-gray-200 text-gray-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatCooldown(skill.cooldown_remaining_seconds)}</span>
                      </button>
                      <p className="text-[11px] text-center text-gray-400">
                        7-day cooldown prevents cramming
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartOrResume(skill)}
                      disabled={isStarting}
                      className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isStarting ? 'Generating Test...' : 'Take 25-Q Assessment'}</span>
                    </button>
                  )}

                  {/* Past Scorecard button (if tested) */}
                  {(skill.status === 'verified' || skill.status === 'failed') && (
                    <button
                      onClick={() => {
                        // Launch modal with attempt id query
                        // If we don't have the explicit attempt id on the card, we can start/view
                        // Or we can view the last test attempt
                        // We will set scorecardAttemptId to 0 to trigger fetching or we pass it
                        // Let's call startTest to get result if verified, or store last attempt id
                        handleStartOrResume(skill);
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      Test Again or View History
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scorecard Modal */}
      {scorecardAttemptId && (
        <TestScorecardModal
          attemptId={scorecardAttemptId}
          initialResult={scorecardResult}
          onClose={() => {
            setScorecardAttemptId(null);
            setScorecardResult(null);
          }}
        />
      )}
    </div>
  );
};
