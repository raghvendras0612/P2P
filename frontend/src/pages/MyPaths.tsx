import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  DollarSign,
  FolderGit2,
  History,
  Layers,
  Printer,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChoosePathModal } from '../components/paths/ChoosePathModal';
import { FirstMonthBoard } from '../components/paths/FirstMonthBoard';
import { ProjectsShowcase } from '../components/paths/ProjectsShowcase';
import { SimulationHistoryDrawer } from '../components/paths/SimulationHistoryDrawer';
import { SkillGapRadar } from '../components/paths/SkillGapRadar';
import { TrackOverviewCompare } from '../components/paths/TrackOverviewCompare';
import { VisualTimeline } from '../components/paths/VisualTimeline';
import { WhatIfDiffModal } from '../components/paths/WhatIfDiffModal';
import { useAuth } from '../context/AuthContext';
import { useSelectedPath } from '../context/SelectedPathContext';
import {
  SimulatedPath,
  SimulationDetail,
} from '../types';

export const MyPaths: React.FC = () => {
  const { profile } = useAuth();
  const { selectedPath, selectPath } = useSelectedPath();

  // Loading & Data State
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<SimulationDetail[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationDetail | null>(null);

  // Simulation execution / polling state
  const [submitting, setSubmitting] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mode Selection (Auto vs Custom)
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [customSlugs, setCustomSlugs] = useState<string[]>([]);

  // Tab State: 0 = "Overview / Compare", 1 = Path 0, 2 = Path 1, 3 = Path 2
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'roadmap' | 'skills' | 'projects' | 'first_month' | 'resources' | 'market'>('roadmap');

  const updateTab = (newTab: number) => {
    setActiveTab(newTab);
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 0) {
      nextParams.set('tab', 'overview');
    } else if (activeSimulation?.output?.paths?.[newTab - 1]) {
      nextParams.set('tab', activeSimulation.output.paths[newTab - 1].path_slug);
    } else {
      nextParams.set('tab', String(newTab));
    }
    setSearchParams(nextParams, { replace: true });
  };

  const updateSubTab = (newSubTab: 'roadmap' | 'skills' | 'projects' | 'first_month' | 'resources' | 'market') => {
    setActiveSubTab(newSubTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('subtab', newSubTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIdx: number, totalTabs: number) => {
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (currentIdx + 1) % totalTabs;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (currentIdx - 1 + totalTabs) % totalTabs;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = totalTabs - 1;
    } else {
      return;
    }
    updateTab(nextIdx);
    setTimeout(() => {
      const tabId = nextIdx === 0 ? 'tab-overview' : `tab-${activeSimulation?.output?.paths?.[nextIdx - 1]?.path_slug}`;
      document.getElementById(tabId)?.focus();
    }, 10);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'overview' || tabParam === '0') {
        setActiveTab(0);
      } else if (activeSimulation?.output?.paths) {
        const foundIdx = activeSimulation.output.paths.findIndex(
          (p) => p.path_slug === tabParam
        );
        if (foundIdx !== -1) {
          setActiveTab(foundIdx + 1);
        } else {
          const num = parseInt(tabParam, 10);
          if (!isNaN(num) && num >= 0 && num <= activeSimulation.output.paths.length) {
            setActiveTab(num);
          }
        }
      }
    }

    const subTabParam = searchParams.get('subtab');
    if (
      subTabParam &&
      ['roadmap', 'skills', 'projects', 'first_month', 'resources', 'market'].includes(subTabParam)
    ) {
      setActiveSubTab(subTabParam as any);
    }
  }, [searchParams, activeSimulation]);

  // Modals & Drawers
  const [isChooseModalOpen, setIsChooseModalOpen] = useState(false);
  const [pathToChoose, setPathToChoose] = useState<SimulatedPath | null>(null);
  const [isChoosingSubmitting, setIsChoosingSubmitting] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);

  const catalogSlugs = [
    { slug: 'full-stack-developer', name: 'Full Stack Developer' },
    { slug: 'devops-cloud-engineer', name: 'DevOps & Cloud Engineer' },
    { slug: 'data-engineer', name: 'Data Engineer' },
    { slug: 'ai-ml-engineer', name: 'AI / ML Engineer' },
    { slug: 'cybersecurity-analyst', name: 'Cybersecurity Analyst' },
    { slug: 'data-analyst-scientist', name: 'Data Analyst / Scientist' },
    { slug: 'product-manager-apm', name: 'Associate Product Manager (APM)' },
    { slug: 'ui-ux-designer', name: 'UI / UX Designer' },
    { slug: 'mobile-app-developer', name: 'Mobile App Developer' },
  ];

  // Load history on mount
  const fetchSimulations = async () => {
    try {
      setLoadingHistory(true);
      const hist = await api.simulations.getHistory();
      setHistory(hist);
      if (hist.length > 0) {
        const latest = await api.simulations.getDetail(hist[0].id);
        setActiveSimulation(latest);
      }
    } catch (err: any) {
      console.error('Failed to load simulations history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

  // Polling Job State Machine
  useEffect(() => {
    if (!pollingJobId) return;

    let isPolling = true;
    const interval = setInterval(async () => {
      try {
        const check = await api.simulations.getJobStatus(pollingJobId);
        if (!isPolling) return;

        setJobStatus(check.status);

        if (check.status === 'succeeded' && check.simulation_id) {
          clearInterval(interval);
          setPollingJobId(null);
          setSubmitting(false);

          const sim = await api.simulations.getDetail(check.simulation_id);
          setActiveSimulation(sim);
          setActiveTab(0); // Show overview
          setSuccessMessage('Career paths successfully simulated by Google Gemini Pro!');
          fetchSimulations();
        } else if (check.status === 'failed') {
          clearInterval(interval);
          setPollingJobId(null);
          setSubmitting(false);
          setError(check.error_message || 'Career simulation failed. Please try again.');
        }
      } catch (err: any) {
        clearInterval(interval);
        setPollingJobId(null);
        setSubmitting(false);
        setError(err.message || 'Error checking simulation job status.');
      }
    }, 2000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [pollingJobId]);

  // Handler: Start Simulation
  const handleStartSimulation = async () => {
    if (submitting) return; // Double-click guard
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const payload: { mode: 'auto' | 'custom'; custom_path_slugs?: string[] } = { mode };
      if (mode === 'custom') {
        if (customSlugs.length === 0) {
          setError('Please select at least one career path to explore in custom mode.');
          setSubmitting(false);
          return;
        }
        payload.custom_path_slugs = customSlugs;
      }

      const res = await api.simulations.create(payload);
      setPollingJobId(res.job_id);
      setJobStatus(res.status);
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to initialize simulation.');
    }
  };

  const toggleCustomSlug = (slug: string) => {
    if (customSlugs.includes(slug)) {
      setCustomSlugs(customSlugs.filter((s) => s !== slug));
    } else {
      if (customSlugs.length >= 3) {
        setCustomSlugs([...customSlugs.slice(1), slug]);
      } else {
        setCustomSlugs([...customSlugs, slug]);
      }
    }
  };

  // Handler: Path Selection
  const handleOpenChooseModal = (path: SimulatedPath) => {
    setPathToChoose(path);
    setIsChooseModalOpen(true);
  };

  const handleConfirmChoosePath = async () => {
    if (!pathToChoose || !activeSimulation || isChoosingSubmitting || submitting) return;
    setIsChoosingSubmitting(true);
    try {
      await selectPath(pathToChoose.path_slug, activeSimulation.id);
      setIsChooseModalOpen(false);
      setSuccessMessage(`"${pathToChoose.title}" is now your active career path! Your Dashboard has adapted.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save chosen career path.');
    } finally {
      setIsChoosingSubmitting(false);
    }
  };

  // Active path slug from context
  const activeSelectedSlug = selectedPath?.career_path?.slug;

  const currentYearOfStudy = profile?.year_of_study || 3;

  if (loadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500 font-medium">Loading your career simulations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="my-paths-page">
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Simulation Engine &bull; Phase 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            My Simulated Career Tracks
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Compare 3 AI-projected career paths calibrated to Indian campus placement realities. Pick your active track to personalize your preparation roadmap.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            type="button"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <History className="w-4 h-4 mr-1.5 text-gray-500" />
            <span>History ({history.length})</span>
          </button>

          {activeSimulation && (
            <>
              <button
                type="button"
                onClick={() => setIsWhatIfModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 border border-purple-200 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors shadow-2xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
                <span>What-If Re-simulate</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
                title="Print your roadmap"
              >
                <Printer className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>Print Roadmap</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 mr-1.5" />
                <span>Run New Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Mode Toggle & Custom Path Chips (Shown when running or tweaking) */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Engine Mode:
          </span>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
            <button
              type="button"
              onClick={() => setMode('auto')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                mode === 'auto'
                  ? 'bg-white text-primary-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Automatic AI Discovery
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                mode === 'custom'
                  ? 'bg-white text-primary-700 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Target Selection
            </button>
          </div>
        </div>

        {mode === 'custom' && (
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {catalogSlugs.map((item) => {
              const isSelected = customSlugs.includes(item.slug);
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => toggleCustomSlug(item.slug)}
                  className={`px-2.5 py-1 rounded-md text-2xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-700'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {item.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Polling / Running State Indicator */}
      {submitting && (
        <div className="bg-primary-50/50 border border-primary-200 rounded-2xl p-8 text-center space-y-4 animate-pulse print:hidden">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              Generating 3 Realistic Career Paths...
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto">
              Our AI engine is analyzing your skills, year of study (Year {currentYearOfStudy}), and campus placement criteria.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-primary-800 text-xs font-semibold border border-primary-200">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping"></span>
            <span>Status: {jobStatus || 'Processing in background...'}</span>
          </div>
        </div>
      )}

      {/* Main Results Experience */}
      {activeSimulation ? (
        <div className="space-y-6">
          {/* Main Navigation Tabs */}
          <div className="border-b border-gray-200 flex flex-wrap gap-2 overflow-x-auto print:hidden" role="tablist" aria-label="Career path simulation tabs">
            {/* Tab 0: Overview / Compare */}
            <button
              type="button"
              role="tab"
              id="tab-overview"
              aria-controls="panel-overview"
              aria-selected={activeTab === 0}
              tabIndex={activeTab === 0 ? 0 : -1}
              onClick={() => updateTab(0)}
              onKeyDown={(e) => handleTabKeyDown(e, 0, (activeSimulation.output?.paths?.length || 0) + 1)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 0
                  ? 'border-primary-600 text-primary-600 bg-primary-50/20'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview & Compare</span>
            </button>

            {/* Tabs 1, 2, 3: Individual Simulated Tracks */}
            {activeSimulation.output?.paths?.map((path, idx) => {
              const tabIdx = idx + 1;
              const isSelected = activeSelectedSlug === path.path_slug;
              const totalTabs = (activeSimulation.output?.paths?.length || 0) + 1;

              return (
                <button
                  key={path.path_slug}
                  type="button"
                  role="tab"
                  id={`tab-${path.path_slug}`}
                  aria-controls={`panel-${path.path_slug}`}
                  aria-selected={activeTab === tabIdx}
                  tabIndex={activeTab === tabIdx ? 0 : -1}
                  onClick={() => updateTab(tabIdx)}
                  onKeyDown={(e) => handleTabKeyDown(e, tabIdx, totalTabs)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tabIdx
                      ? 'border-primary-600 text-primary-600 bg-primary-50/20'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{path.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-2xs font-extrabold bg-emerald-100 text-emerald-800">
                    {path.fit_score}%
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary-600" title="Active Selection"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 0 CONTENT: Overview & Compare */}
          {activeTab === 0 && (
            <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
              <ErrorBoundary>
                <TrackOverviewCompare
                  output={activeSimulation.output}
                  activePathSlug={activeSelectedSlug}
                  onSelectPathTab={(index) => updateTab(index)}
                  onChoosePath={(path) => handleOpenChooseModal(path)}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* TABS 1, 2, 3 CONTENT: Deep Dive into a Single Path */}
          {activeTab > 0 && activeSimulation.output?.paths?.[activeTab - 1] && (() => {
            const path = activeSimulation.output.paths[activeTab - 1];
            const isSelected = activeSelectedSlug === path.path_slug;

            return (
              <div className="space-y-6">
                {/* Track Hero Banner */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200">
                        Option {activeTab} of 3
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Award className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                        {path.fit_score}% Profile Fit
                      </span>
                      {isSelected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600 text-white shadow-2xs">
                          Active Chosen Track
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">
                          Simulated Candidate
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                      {path.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
                      {path.summary}
                    </p>
                  </div>

                  {/* Choose Path Action */}
                  <div className="shrink-0 print:hidden">
                    {isSelected ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Active Path on Dashboard</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenChooseModal(path)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Choose This Path</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs Navigation */}
                <div className="bg-gray-100 p-1 rounded-xl flex flex-wrap gap-1 print:hidden" role="tablist" aria-label="Path detail sections">
                  <button
                    type="button"
                    onClick={() => updateSubTab('roadmap')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'roadmap'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Visual Roadmap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSubTab('skills')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'skills'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Skill Gap Radar ({path.skill_gaps.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSubTab('projects')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'projects'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>Projects ({path.projects_to_build.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSubTab('first_month')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'first_month'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>30-Day Sprint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSubTab('resources')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'resources'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Resources ({path.resources?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSubTab('market')}
                    className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeSubTab === 'market'
                        ? 'bg-white text-primary-700 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Market & Risks</span>
                  </button>
                </div>

                {/* Sub-Tab Panels */}
                <div className="pt-2">
                  <ErrorBoundary>
                    {/* Panel: Roadmap */}
                  {activeSubTab === 'roadmap' && (
                    <VisualTimeline
                      milestones={path.yearly_milestones}
                      currentYearOfStudy={currentYearOfStudy}
                      pathSlug={path.path_slug}
                    />
                  )}

                  {/* Panel: Skill Gaps */}
                  {activeSubTab === 'skills' && (
                    <SkillGapRadar
                      skillGaps={path.skill_gaps}
                      pathTitle={path.title}
                    />
                  )}

                  {/* Panel: Projects */}
                  {activeSubTab === 'projects' && (
                    <ProjectsShowcase
                      projects={path.projects_to_build}
                      pathSlug={path.path_slug}
                    />
                  )}

                  {/* Panel: First Month */}
                  {activeSubTab === 'first_month' && (
                    <FirstMonthBoard
                      firstMonthPlan={path.first_month_plan}
                      pathSlug={path.path_slug}
                    />
                  )}

                  {/* Panel: Market & Risks */}
                  {activeSubTab === 'market' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-2xs">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          Indian Job Market Placement Calibration
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Realistic compensation and hiring realities across Tier 1/2/3 campus placements and off-campus recruitment in India.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-2xs font-bold uppercase text-gray-400">
                            Estimated Fresher CTC (INR LPA):
                          </span>
                          <p className="text-lg font-mono font-bold text-gray-900">
                            {path.india_market_notes.salary_range_lpa}
                          </p>
                          <span className="text-2xs text-gray-500 italic block">
                            * Approximate campus & off-campus fresher bracket.
                          </span>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-2xs font-bold uppercase text-gray-400">
                            Industry Demand Outlook:
                          </span>
                          <p className="text-sm font-semibold text-gray-900">
                            {path.india_market_notes.demand_outlook}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                          <span className="text-2xs font-bold uppercase text-gray-400">
                            Target Company Categories:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {path.india_market_notes.company_types.map((type, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md bg-white text-gray-800 text-xs font-medium border border-gray-200"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                          <span className="text-2xs font-bold uppercase text-gray-400">
                            Typical Entry-Level Job Titles:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {path.india_market_notes.typical_roles.map((role, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md bg-white text-gray-800 text-xs font-medium border border-gray-200"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Caveats & Placement Realities */}
                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>Placement Realities & Caveats</span>
                        </div>
                        <p className="leading-relaxed text-2xs">
                          Salaries at Indian colleges vary significantly between Day 1 mass recruiters (service MNCs), Tier-2 product startups, and Tier-1 off-campus drives. Your CGPA ({profile?.cgpa || 'N/A'}) acts as a primary eligibility filter in campus on-campus drives, while your GitHub portfolio and DSA interview problem solving determine off-campus product conversions.
                        </p>
                      </div>

                      {/* Critical Market Risks & Friction Points */}
                      {path.risks_and_tradeoffs && path.risks_and_tradeoffs.length > 0 && (
                        <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-200 space-y-3">
                          <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>Identified Market Risks & Career Friction Points</span>
                          </div>
                          <ul className="space-y-2 text-xs text-rose-950">
                            {path.risks_and_tradeoffs.map((risk, rIdx) => (
                              <li
                                key={rIdx}
                                className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-rose-100"
                              >
                                <span className="text-rose-600 font-bold">&bull;</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Panel: Resources */}
                  {activeSubTab === 'resources' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-2xs">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary-600" />
                          Curated Learning Resources & Documentation
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Recommended high-signal documentation, platforms, and courses to bridge your skill gaps for this track.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(path.resources || []).map((res, rIdx) => (
                          <div
                            key={rIdx}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {res.type}
                                </span>
                                <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {res.cost}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900">{res.name}</h4>
                              <p className="text-xs text-gray-600 leading-relaxed">{res.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </ErrorBoundary>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          title="No Career Simulation Generated Yet"
          description="Click 'Run New Simulation' above to let our AI simulate 3 realistic career paths tailored to your skills and college branch."
          actionText="Run Automatic Simulation"
          onAction={handleStartSimulation}
        />
      )}

      {/* Confirmation Modal */}
      <ChoosePathModal
        path={pathToChoose}
        isOpen={isChooseModalOpen}
        isSubmitting={isChoosingSubmitting}
        onClose={() => setIsChooseModalOpen(false)}
        onConfirm={handleConfirmChoosePath}
      />

      {/* History Drawer */}
      <SimulationHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        history={history}
        currentSimulationId={activeSimulation?.id}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectSimulation={(sim) => {
          setActiveSimulation(sim);
          setActiveTab(0);
        }}
      />

      {/* What-If Re-Simulation Modal */}
      <WhatIfDiffModal
        isOpen={isWhatIfModalOpen}
        baselineSimulation={activeSimulation}
        onClose={() => setIsWhatIfModalOpen(false)}
        onSimulationUpdated={(newSim) => {
          setActiveSimulation(newSim);
          setActiveTab(0);
          fetchSimulations();
          setSuccessMessage('What-If simulation applied! Review the updated paths and score deltas.');
        }}
      />
    </div>
  );
};
