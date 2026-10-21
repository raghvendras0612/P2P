import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  HelpCircle,
  LogOut,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { ActiveTestSessionRead, TestResultResponse } from '../../types';

interface TestRunnerProps {
  session: ActiveTestSessionRead;
  onFinish: (result: TestResultResponse) => void;
  onCancel: () => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  session,
  onFinish,
  onCancel,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>(() => {
    const init: Record<number, string[]> = {};
    session.questions.forEach((q) => {
      if (q.selected_option_ids && q.selected_option_ids.length > 0) {
        init[q.id] = q.selected_option_ids;
      }
    });
    return init;
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(session.remaining_seconds);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(session.tab_switch_count);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = session.questions[currentIdx];
  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(answers).filter((k) => (answers[Number(k)] || []).length > 0).length;

  // Ref to hold answers for auto-submission on timer expiry
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // 1. Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session.attempt_id]);

  const handleAutoSubmitOnExpiry = async () => {
    setIsSubmitting(true);
    try {
      const result = await api.tests.submitTest(session.attempt_id);
      onFinish(result);
    } catch (err: any) {
      setSubmitError(err.message || 'Error auto-submitting expired test.');
      setIsSubmitting(false);
    }
  };

  // 2. Anti-cheat tab switch monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordTabSwitchEvent();
      }
    };

    const handleWindowBlur = () => {
      recordTabSwitchEvent();
    };

    const recordTabSwitchEvent = () => {
      setTabSwitchCount((prev) => prev + 1);
      setShowTabWarning(true);
      // Fire-and-forget sync to backend
      api.tests.recordTabSwitch(session.attempt_id).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [session.attempt_id]);

  // 3. Option Selection & Incremental Autosave
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;

    let updatedList: string[];
    const existing = answers[currentQuestion.id] || [];

    if (currentQuestion.question_type === 'multiple_choice') {
      if (existing.includes(optionId)) {
        updatedList = existing.filter((id) => id !== optionId);
      } else {
        updatedList = [...existing, optionId];
      }
    } else {
      // Single choice or code snippet output
      updatedList = [optionId];
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedList,
    }));

    // Trigger async save
    setSaveStatus('saving');
    api.tests
      .saveAnswer(session.attempt_id, {
        question_id: currentQuestion.id,
        selected_option_ids: updatedList,
      })
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      })
      .catch(() => {
        setSaveStatus('error');
      });
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = remainingSeconds <= 300; // <= 5 minutes

  const handleSubmitConfirmed = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.tests.submitTest(session.attempt_id);
      onFinish(result);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assessment.');
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* Top Test Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Exit assessment (timer continues running)"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-base">
                {session.skill_name}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                Industry Assessment
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Pass mark: {session.pass_mark_percentage}% &bull; Weighted scoring
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-4">
          {/* Autosave Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 animate-pulse font-medium">Autosaving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Progress saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-600 font-medium">Sync error</span>
            )}
          </div>

          {/* Tab Switch Warning pill */}
          {tabSwitchCount > 0 && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>{tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}</span>
            </div>
          )}

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isLowTime
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-gray-100 border-gray-300 text-gray-800'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600' : 'text-gray-500'}`} />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Finish Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Finish Test</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Tab Switch Warning Banner (if triggered) */}
      {showTabWarning && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Warning: Assessment tab lost focus! Tab switches are logged and audited on your scorecard ({tabSwitchCount} recorded).
            </span>
          </div>
          <button
            onClick={() => setShowTabWarning(false)}
            className="text-white hover:text-amber-100 text-xs underline font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body: Question on left, Palette on right */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left: Active Question Card */}
        <div className="flex-1 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex-1 flex flex-col">
            {/* Question Sub-header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 font-extrabold flex items-center justify-center text-sm border border-primary-200">
                  {currentQuestion?.question_order || currentIdx + 1}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Question {currentIdx + 1} of {totalQuestions}
                </span>
                <span className="text-gray-300">&bull;</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">
                  {currentQuestion?.subtopic_tag}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Difficulty:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span
                      key={d}
                      className={`w-2 h-2 rounded-full ${
                        d <= (currentQuestion?.difficulty || 1)
                          ? 'bg-primary-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4 flex-1">
              <p className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed">
                {currentQuestion?.question_text}
              </p>

              {/* Code Snippet (if present) */}
              {currentQuestion?.code_snippet && (
                <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                  <div className="bg-gray-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      {currentQuestion.code_language || 'code'}
                    </span>
                  </div>
                  <pre className="p-4 text-gray-100 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                    <code>{currentQuestion.code_snippet}</code>
                  </pre>
                </div>
              )}

              {/* Multiple Choice instructions */}
              {currentQuestion?.question_type === 'multiple_choice' && (
                <p className="text-xs font-semibold text-primary-700 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Select all options that apply.
                </p>
              )}

              {/* Options List */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion?.options.map((opt) => {
                  const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                  const isMulti = currentQuestion.question_type === 'multiple_choice';

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/40 text-primary-950 font-medium shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-sm flex items-center justify-center shrink-0 mt-0.5 border ${
                          isMulti ? 'rounded-md' : 'rounded-full'
                        } ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 text-sm leading-relaxed">
                        <span className="font-bold mr-2 text-gray-400">{opt.id}.</span>
                        <span>{opt.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav Buttons */}
            <div className="border-t border-gray-100 pt-5 mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-gray-400">
                {answeredCount} of {totalQuestions} answered
              </div>

              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Review & Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Palette */}
        <div className="w-full lg:w-72 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Question Palette</h3>

            {/* Grid of 25 questions */}
            <div className="grid grid-cols-5 gap-2">
              {session.questions.map((q, idx) => {
                const isAnswered = (answers[q.id] || []).length > 0;
                const isCurrent = idx === currentIdx;

                let btnClasses = 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
                if (isCurrent) {
                  btnClasses = 'border-primary-600 bg-primary-600 text-white font-bold shadow-xs';
                } else if (isAnswered) {
                  btnClasses =
                    'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center transition-all ${btnClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-primary-600 border border-primary-600" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-gray-50 border border-gray-200" />
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </div>

          {/* Assessment Integrity Notice */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-xs text-gray-500 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span>Proctored Diagnostic</span>
            </div>
            <p className="leading-relaxed">
              Questions are ordered easy-to-hard. Answer explanations and verification badges will be
              unlocked upon submission.
            </p>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Submit Assessment?</h3>
                <p className="text-xs text-gray-500">Grading is instant and irreversible</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Total Questions:</span>
                <span className="font-bold">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Unanswered:</span>
                <span className="font-bold">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  You have {totalQuestions - answeredCount} unanswered questions. Unanswered
                  questions will receive 0 points.
                </span>
              </div>
            )}

            {submitError && (
              <p className="text-xs text-rose-600 font-semibold">{submitError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmitConfirmed}
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                {isSubmitting ? 'Grading...' : 'Confirm & Finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
