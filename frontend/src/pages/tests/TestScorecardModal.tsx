import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TestResultResponse } from '../../types';

interface TestScorecardModalProps {
  attemptId: number;
  initialResult?: TestResultResponse | null;
  onClose: () => void;
}

export const TestScorecardModal: React.FC<TestScorecardModalProps> = ({
  attemptId,
  initialResult,
  onClose,
}) => {
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResultResponse | null>(initialResult || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialResult);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedReview, setShowDetailedReview] = useState<boolean>(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!initialResult) {
      const fetchResult = async () => {
        try {
          setIsLoading(true);
          const data = await api.tests.getResults(attemptId);
          setResult(data);
        } catch (err: any) {
          setError(err.message || 'Failed to load test scorecard.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchResult();
    }
  }, [attemptId, initialResult]);

  const toggleQuestionExpand = (qId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const expandAllQuestions = () => {
    if (!result?.questions_review) return;
    const allExpanded: Record<number, boolean> = {};
    result.questions_review.forEach((q) => {
      allExpanded[q.question_id] = true;
    });
    setExpandedQuestions(allExpanded);
  };

  const collapseAllQuestions = () => {
    setExpandedQuestions({});
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <LoadingSpinner message="Calculating scorecard and generating feedback..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">Scorecard Error</h3>
          <p className="text-sm text-gray-600">{error || 'Unable to retrieve test results.'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div
          className={`p-6 border-b flex items-center justify-between text-white ${
            result.passed
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-amber-600 to-orange-700'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
              {result.passed ? (
                <ShieldCheck className="w-8 h-8 text-white" />
              ) : (
                <AlertCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20">
                  {result.passed ? 'Skill Verified' : 'Assessment Result'}
                </span>
                {result.verified_level && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/30 text-white">
                    Level {result.verified_level}: {result.verified_level_name}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mt-1">
                {result.skill_name} Technical Assessment
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close scorecard"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Score Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Score</span>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {result.score_percentage}%
              </p>
              <span
                className={`inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
                  result.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {result.passed ? 'Pass (>= 60%)' : 'Did Not Pass'}
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Points</span>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {result.earned_points.toFixed(1)} / {result.total_points.toFixed(1)}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">Weighted by difficulty</span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Verified Level</span>
              <p className="text-2xl font-extrabold text-primary-600 mt-1">
                {result.verified_level ? `Lvl ${result.verified_level}` : 'None'}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">
                {result.verified_level_name || 'Needs revision'}
              </span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Integrity</span>
              <p className="text-2xl font-extrabold text-gray-900 mt-1 flex items-center justify-center gap-1">
                {result.tab_switch_count === 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-lg">
                    <ShieldCheck className="w-5 h-5" /> Clean
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 text-lg">
                    <ShieldAlert className="w-5 h-5" /> {result.tab_switch_count} switches
                  </span>
                )}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">Tab switch monitor</span>
            </div>
          </div>

          {/* AI Insights & Feedback */}
          <div className="bg-primary-50/50 border border-primary-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary-700" />
              <h3 className="font-bold text-gray-900 text-sm">Diagnostic Insights & Advice</h3>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            {/* Strengths & Weaknesses chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-primary-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Strengths
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {result.strengths.length > 0 ? (
                    result.strengths.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">
                      No subtopics reached 70% threshold.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Areas to Revise
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {result.weaknesses.length > 0 ? (
                    result.weaknesses.map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-md border border-amber-200"
                      >
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 italic">
                      Zero major weaknesses identified! Solid baseline across topics.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subtopic Accuracy breakdown */}
          {Object.keys(result.accuracy_by_subtopic).length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Performance by Subtopic
              </h4>
              <div className="space-y-2.5">
                {Object.entries(result.accuracy_by_subtopic).map(([sub, acc]) => (
                  <div key={sub} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700">{sub}</span>
                      <span
                        className={
                          acc >= 70
                            ? 'text-emerald-700 font-bold'
                            : acc >= 50
                            ? 'text-amber-700'
                            : 'text-rose-700 font-bold'
                        }
                      >
                        {acc}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          acc >= 70
                            ? 'bg-emerald-500'
                            : acc >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, Math.min(100, acc))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review Section */}
          {result.questions_review && result.questions_review.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-600" />
                  <h4 className="font-bold text-gray-900 text-sm">
                    Detailed Question Review ({result.questions_review.length} Questions)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAllQuestions}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800"
                  >
                    Expand All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={collapseAllQuestions}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Collapse All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setShowDetailedReview(!showDetailedReview)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 ml-2"
                  >
                    {showDetailedReview ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {showDetailedReview && (
                <div className="divide-y divide-gray-200 max-h-[480px] overflow-y-auto p-4 space-y-4">
                  {result.questions_review.map((q) => {
                    const isExpanded = !!expandedQuestions[q.question_id];
                    return (
                      <div
                        key={q.question_id}
                        className={`rounded-xl border p-4 transition-all ${
                          q.is_correct
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        {/* Question summary row */}
                        <div
                          className="flex items-start justify-between gap-3 cursor-pointer select-none"
                          onClick={() => toggleQuestionExpand(q.question_id)}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                                q.is_correct
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {q.question_order}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-gray-100 text-gray-700">
                                  {q.subtopic_tag}
                                </span>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                                    q.is_correct
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {q.is_correct
                                    ? `+${q.points_earned.toFixed(1)} pts (Correct)`
                                    : `0 / ${q.points_possible.toFixed(1)} pts (Incorrect)`}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mt-1.5">
                                {q.question_text}
                              </p>
                            </div>
                          </div>

                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {/* Optional Code Snippet */}
                        {q.code_snippet && (
                          <div className="mt-3 ml-9">
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-gray-800">
                              <code>{q.code_snippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Expanded Option Breakdown & Explanation */}
                        {isExpanded && (
                          <div className="mt-4 ml-9 space-y-3 pt-3 border-t border-gray-200/80">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                              Options & Answers
                            </span>
                            <div className="space-y-1.5">
                              {q.options.map((opt) => {
                                const isUserSelected = q.user_selected.includes(opt.id);
                                const isCorrectOpt = q.correct_answers.includes(opt.id);

                                let optClasses = 'border-gray-200 bg-white text-gray-700';
                                if (isCorrectOpt) {
                                  optClasses =
                                    'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                                } else if (isUserSelected && !isCorrectOpt) {
                                  optClasses =
                                    'border-rose-500 bg-rose-50 text-rose-950 line-through';
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${optClasses}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold uppercase tracking-wider text-gray-400 w-5">
                                        {opt.id}.
                                      </span>
                                      <span>{opt.text}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isCorrectOpt && (
                                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                                          <CheckCircle2 className="w-4 h-4" /> Correct Answer
                                        </span>
                                      )}
                                      {isUserSelected && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                            isCorrectOpt
                                              ? 'bg-emerald-200 text-emerald-900'
                                              : 'bg-rose-200 text-rose-900'
                                          }`}
                                        >
                                          Your Choice
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Detailed Explanation */}
                            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-950 space-y-1">
                              <span className="font-bold flex items-center gap-1 text-blue-900">
                                <HelpCircle className="w-3.5 h-3.5" /> Explanation
                              </span>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {result.passed ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> This verified skill has been automatically
                synchronized to your ATS Resume.
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" /> Cooldown active for 7 days before you can retake this
                assessment.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {result.passed && (
              <button
                onClick={() => {
                  onClose();
                  navigate('/resume');
                }}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>View on ATS Resume</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
