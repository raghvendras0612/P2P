import React, { useState, useMemo } from 'react';
import { QuizQuestion, StudentProfile, SkillScore, SkillItem, SkillLevel } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
  ArrowRight,
  Award,
  ChevronDown,
  Code2,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import {
  LANGUAGE_TEST_OPTIONS,
  COMPREHENSIVE_QUESTION_BANK,
  getQuestionsForLanguage
} from '../data/diagnosticQuestionBank';

interface ReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: QuizQuestion[];
  profile: StudentProfile;
  onVerificationComplete: (updatedSkills: SkillItem[], verifiedScores: SkillScore[]) => void;
}

export const ReadinessModal: React.FC<ReadinessModalProps> = ({
  isOpen,
  onClose,
  questions: initialQuestions,
  profile,
  onVerificationComplete
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [skillScores, setSkillScores] = useState<SkillScore[]>([]);

  // Compute active question bank based on selected language test
  const activeQuestions: QuizQuestion[] = useMemo(() => {
    if (selectedLanguage === 'all') {
      if (initialQuestions && initialQuestions.length > 0) {
        return initialQuestions;
      }
      return COMPREHENSIVE_QUESTION_BANK;
    }
    return getQuestionsForLanguage(selectedLanguage);
  }, [selectedLanguage, initialQuestions]);

  if (!isOpen) return null;

  const totalQuestions = activeQuestions.length || 1;
  const currentQ = activeQuestions[currentIdx] || activeQuestions[0] || {
    id: 'fallback-1',
    skill: 'General',
    question: 'Select a language test from the dropdown above to begin.',
    options: ['Continue'],
    correctOptionIndex: 0
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setIsCompleted(false);
  };

  const handleSelectOption = (optionIdx: number) => {
    if (selectedAnswers[currentQ.id] !== undefined) return; // already answered
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optionIdx
    });
    setShowExplanation({
      ...showExplanation,
      [currentQ.id]: true
    });
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishEvaluation();
    }
  };

  const finishEvaluation = () => {
    let totalCorrect = 0;
    const scoresBySkill: Record<string, { correct: number; total: number }> = {};

    activeQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) totalCorrect++;

      const skillName = q.skill || (selectedLanguage !== 'all' ? selectedLanguage : 'General');
      if (!scoresBySkill[skillName]) {
        scoresBySkill[skillName] = { correct: 0, total: 0 };
      }
      scoresBySkill[skillName].total += 1;
      if (isCorrect) scoresBySkill[skillName].correct += 1;
    });

    const evaluatedScores: SkillScore[] = [];
    const skillNamesToUpdate = Object.keys(scoresBySkill);
    const updatedSkills: SkillItem[] = [...(profile?.skills || [])];

    skillNamesToUpdate.forEach((sName) => {
      const stat = scoresBySkill[sName];
      const accuracy = stat.total > 0 ? stat.correct / stat.total : 0.5;
      const scoreVal = parseFloat((accuracy * 2.0 + 3.0).toFixed(1)); // 3.0 to 5.0
      const isVerified = accuracy >= 0.5;
      const adjLevel: SkillLevel = accuracy >= 0.8 ? 'Advanced' : accuracy >= 0.4 ? 'Intermediate' : 'Beginner';

      evaluatedScores.push({
        skill: sName,
        score: scoreVal,
        previousLevel: updatedSkills.find(s => s.name.toLowerCase() === sName.toLowerCase())?.level || 'Beginner',
        adjustedLevel: adjLevel,
        verified: isVerified,
        feedback: isVerified
          ? `Verified proficiency in ${sName} assessment (${stat.correct}/${stat.total} correct).`
          : `Reviewed fundamentals in ${sName} (${stat.correct}/${stat.total} correct). Extra practice recommended.`
      });

      const existingIdx = updatedSkills.findIndex(s => s.name.toLowerCase() === sName.toLowerCase());
      if (existingIdx >= 0) {
        updatedSkills[existingIdx] = {
          ...updatedSkills[existingIdx],
          verified: isVerified,
          score: scoreVal,
          level: adjLevel
        };
      } else {
        updatedSkills.push({
          name: sName,
          level: adjLevel,
          verified: isVerified,
          score: scoreVal
        });
      }
    });

    setSkillScores(evaluatedScores);
    setIsCompleted(true);
    onVerificationComplete(updatedSkills, evaluatedScores);
  };

  const handleRetakeOrSwitch = (newLang?: string) => {
    if (newLang) {
      setSelectedLanguage(newLang);
    }
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-2xl w-full border-2 border-indigo-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Skill Readiness Verification
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/50">
                  Interactive Test
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Diagnostic questions mapped to your self-rated skill stack
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            title="Close test"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {!isCompleted ? (
            <>
              {/* Question Progress & Language Test Selector (IN PLACE OF SKILL) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-400 border-b border-slate-800 pb-3">
                {/* Question Count & Level Indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-bold">
                    Question {currentIdx + 1} of {totalQuestions}
                  </span>
                  {currentQ.level && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-indigo-800/60 uppercase">
                      {currentQ.level}
                    </span>
                  )}
                </div>

                {/* IN PLACE OF SKILL: LANGUAGE TEST DROPDOWN BOX */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="language-test-dropdown"
                    className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shrink-0"
                  >
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden xs:inline">Test Language:</span>
                  </label>
                  <div className="relative inline-block">
                    <select
                      id="language-test-dropdown"
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl bg-slate-800/90 hover:bg-slate-750 text-cyan-300 border-2 border-cyan-500/50 hover:border-cyan-400 shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer transition-all"
                      title="Choose any language or technical skill test to verify"
                    >
                      {LANGUAGE_TEST_OPTIONS.map((opt) => (
                        <option
                          key={opt.id}
                          value={opt.id}
                          className="bg-slate-900 text-slate-100 py-1"
                        >
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Active Skill Category Sub-badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Currently Assessing:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {currentQ.skill}
                  </span>
                </div>
                <span className="text-slate-400">
                  {Math.round(((currentIdx + 1) / totalQuestions) * 100)}% Complete
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.id] === optIdx;
                    const isAnswered = selectedAnswers[currentQ.id] !== undefined;
                    const isCorrect = currentQ.correctOptionIndex === optIdx;

                    let btnClass = 'border-slate-800 hover:border-indigo-400 bg-slate-800/60 hover:bg-slate-800 text-slate-200';
                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = 'border-emerald-500/80 bg-emerald-950/50 text-emerald-200 font-semibold shadow-inner';
                      } else if (isSelected) {
                        btnClass = 'border-rose-500/80 bg-rose-950/50 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${btnClass}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-slate-700/60 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300 shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isAnswered && (
                          <div className="shrink-0 mt-0.5">
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Concept Explanation Box after answering */}
                {showExplanation[currentQ.id] && currentQ.explanation && (
                  <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Interview Concept Key:</span>
                    </div>
                    <p className="leading-relaxed text-slate-200">{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  Assessment Complete!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your skill ratings for{' '}
                  <span className="text-cyan-300 font-bold">
                    {selectedLanguage === 'all' ? 'All Selected Tech' : selectedLanguage}
                  </span>{' '}
                  have been verified and automatically calibrated in your career roadmap.
                </p>
              </div>

              {/* Verified Badges List */}
              <div className="space-y-2.5 text-left pt-2">
                {skillScores.map((sc) => (
                  <div
                    key={sc.skill}
                    className="p-4 rounded-2xl border border-slate-800 bg-slate-800/60 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{sc.skill}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                          Verified ✓
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {sc.adjustedLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{sc.feedback}</p>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <span className="text-base font-black text-cyan-400 font-mono">
                        {sc.score} / 5.0
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Switcher to Choose Another Test */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Test Another Language or Skill:</h4>
                  <p className="text-[11px] text-slate-400">Select any language below to verify another domain.</p>
                </div>
                <div className="relative shrink-0">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleRetakeOrSwitch(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-800 text-cyan-300 border-2 border-cyan-500/50 shadow-md focus:outline-none cursor-pointer"
                  >
                    {LANGUAGE_TEST_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedAnswers[currentQ.id] === undefined}
                onClick={handleNext}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all ${
                  selectedAnswers[currentQ.id] === undefined
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg active:scale-95'
                }`}
              >
                <span>{currentIdx < totalQuestions - 1 ? 'Next Question' : 'View Verified Scores'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleRetakeOrSwitch()}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake This Test</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg transition-all"
              >
                Apply to Roadmap & Finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
