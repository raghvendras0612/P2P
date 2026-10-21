import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSelectedPath } from '../../context/SelectedPathContext';
import { ResumePreviewData } from '../../types';

export const ResumeStudio: React.FC = () => {
  const { selectedPath } = useSelectedPath();

  const [data, setData] = useState<ResumePreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editable summary state
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);
  const [customSummary, setCustomSummary] = useState<string>('');
  const [isSavingSummary, setIsSavingSummary] = useState<boolean>(false);

  // Tailoring state
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [tailorSuccessMsg, setTailorSuccessMsg] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const fetchResumeData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.resume.get();
      setData(res);
      setCustomSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load ATS resume data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, []);

  const handleTemplateChange = async (
    template: 'minimal_ats' | 'classic_single' | 'modern_compact'
  ) => {
    if (!data) return;
    try {
      const updated = await api.resume.updateSettings({ template_name: template });
      setData(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update template.');
    }
  };

  const handleToggleUnverified = async (checked: boolean) => {
    if (!data) return;
    try {
      const updated = await api.resume.updateSettings({
        include_unverified_skills: checked,
      });
      setData(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update skill settings.');
    }
  };

  const handleSaveSummary = async () => {
    if (!data) return;
    try {
      setIsSavingSummary(true);
      const updated = await api.resume.updateSettings({
        custom_summary: customSummary,
      });
      setData(updated);
      setIsEditingSummary(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save summary.');
    } finally {
      setIsSavingSummary(false);
    }
  };

  const handleAITailor = async () => {
    try {
      setIsTailoring(true);
      setTailorSuccessMsg(null);
      const res = await api.resume.tailor(selectedPath?.career_path.slug);
      setCustomSummary(res.tailored_summary);
      setTailorSuccessMsg(
        `Tailored summary generated for ${res.target_role_title || 'selected track'}!`
      );
      // Re-fetch entire preview to update strength checklist
      const refreshed = await api.resume.get();
      setData(refreshed);
      setTimeout(() => setTailorSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to tailor resume.');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingFormat('pdf');
      const blob = await api.resume.downloadPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.full_name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadMarkdown = async () => {
    try {
      setDownloadingFormat('markdown');
      const md = await api.resume.downloadMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.full_name.replace(/\s+/g, '_')}_Resume.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download Markdown.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setDownloadingFormat('json');
      const json = await api.resume.downloadJson();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.full_name.replace(/\s+/g, '_')}_Resume.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download JSON.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleCopyText = () => {
    if (!data) return;
    const textLines = [
      data.full_name,
      `${data.email} | ${data.phone} | ${data.city}, ${data.state}`,
      data.target_role_title ? `TARGET ROLE: ${data.target_role_title}` : '',
      '',
      'PROFESSIONAL SUMMARY',
      data.summary,
      '',
      'TECHNICAL SKILLS (VERIFIED)',
      data.verified_skills
        .map((s) => `${s.name} (${s.verified_level_name || 'Verified'})`)
        .join(', '),
      '',
      'PROJECTS',
      ...data.projects.map((p) => `${p.title} (${p.tech_stack}): ${p.description}`),
      '',
      'EDUCATION',
      ...data.education.map(
        (e) => `${e.level}: ${e.institution_name} (${e.passing_year}) - ${e.percentage}%`
      ),
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingSpinner message="Preparing your ATS Resume Studio..." size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold">Resume Studio Error</h3>
        <p className="text-sm">{error || 'Unable to build resume data.'}</p>
        <button
          onClick={fetchResumeData}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
              ATS Resume Studio
            </span>
            {selectedPath && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-600" />
                Target: {selectedPath.career_path.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
            ATS Resume Builder & Exporter
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Automatically built from your verified skills and education. Export server-generated ATS
            compliant PDFs with zero parsing issues.
          </p>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingFormat === 'pdf'}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            disabled={downloadingFormat === 'markdown'}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download formatted Markdown for GitHub profile"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Markdown</span>
          </button>

          <button
            onClick={handleDownloadJson}
            disabled={downloadingFormat === 'json'}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download structured JSON"
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            onClick={handleCopyText}
            className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Copy plain text"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls & Scoring Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Resume Strength Checklist Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  ATS Scorecard
                </span>
                <h3 className="font-extrabold text-gray-900 text-base mt-0.5">
                  Resume Strength Score
                </h3>
              </div>

              <div className="flex items-baseline gap-1 bg-primary-50 text-primary-700 px-3.5 py-1.5 rounded-xl border border-primary-200">
                <span className="text-2xl font-black">{data.strength_score}</span>
                <span className="text-xs font-bold text-primary-500">/ 100</span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              {data.strength_checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span
                      className={`font-semibold ${
                        item.passed ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {item.item}
                    </span>
                    {!item.passed && item.tip && (
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        Tip: {item.tip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. ATS Template Switcher */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">ATS Format Template</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'minimal_ats',
                  name: 'Minimal ATS',
                  desc: 'Clean monochrome single-column',
                },
                {
                  id: 'classic_single',
                  name: 'Classic Single',
                  desc: 'Formal serif headers standard',
                },
                {
                  id: 'modern_compact',
                  name: 'Modern Compact',
                  desc: 'High-density modern layout',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateChange(t.id as any)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    data.selected_template === t.id
                      ? 'border-primary-600 bg-primary-50/40 text-primary-950 font-semibold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <span className="block text-xs font-bold">{t.name}</span>
                  <span className="block text-[11px] text-gray-400 mt-1 leading-snug">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. AI Tailoring & Career Track Alignment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm">Role-Specific Tailoring</h3>
              </div>

              {selectedPath && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedPath.career_path.name}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Align your professional summary directly with Indian recruiters looking for{' '}
              {data.target_role_title || selectedPath?.career_path.name || 'engineering candidates'}.
            </p>

            <button
              onClick={handleAITailor}
              disabled={isTailoring}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isTailoring
                  ? 'Generating Tailored Summary...'
                  : selectedPath
                  ? `Tailor for ${selectedPath.career_path.name}`
                  : 'Tailor for Engineering Roles'}
              </span>
            </button>

            {tailorSuccessMsg && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{tailorSuccessMsg}</span>
              </p>
            )}

            {/* Editable Summary area */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Summary Text</span>
                {!isEditingSummary ? (
                  <button
                    onClick={() => setIsEditingSummary(true)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingSummary(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSummary}
                      disabled={isSavingSummary}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingSummary ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditingSummary ? (
                <textarea
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed italic border border-gray-100">
                  "{data.summary}"
                </p>
              )}
            </div>
          </div>

          {/* 4. Verified Skills & Filter Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Skills Verification Filter</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verified skills carry 3x recruiter weight
                </p>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.include_unverified_skills}
                  onChange={(e) => handleToggleUnverified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Skills:
                </span>
                <span className="font-bold text-gray-900">{data.verified_skills.length}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Self-Reported Skills:</span>
                <span className="text-gray-700">
                  {data.include_unverified_skills
                    ? `${data.unverified_skills.length} (Included)`
                    : `${data.unverified_skills.length} (Suppressed)`}
                </span>
              </div>
            </div>

            {/* Verified skill badges list */}
            {data.verified_skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                {data.verified_skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>
                      {s.name} ({s.verified_level_name || 'Verified'})
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Zero skills verified yet. Take technical assessments in the{' '}
                  <span className="font-bold">Skill Tests</span> tab to earn verified badges.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Live ATS Resume Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden font-sans">
            {/* Resume Sheet Preview Container (Mimics 8.5x11 / A4 Page) */}
            <div className="p-8 sm:p-12 space-y-6 text-gray-900 bg-white min-h-[750px]">
              {/* Header / Contact Section */}
              <div className="text-center border-b border-gray-200 pb-5 space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-gray-900">
                  {data.full_name}
                </h2>

                {data.target_role_title && (
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700">
                    {data.target_role_title}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    {data.email}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {data.phone}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {data.city}, {data.state}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-primary-600 font-medium pt-1">
                  {data.linkedin_url && (
                    <span className="flex items-center gap-1">
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </span>
                  )}
                  {data.github_url && (
                    <span className="flex items-center gap-1">
                      <Github className="w-3 h-3" /> GitHub
                    </span>
                  )}
                  {data.portfolio_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Portfolio
                    </span>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">
                  Professional Summary
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed text-justify">
                  {data.summary}
                </p>
              </div>

              {/* Technical Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">
                  Technical Skills
                </h3>

                {/* Verified technical skills */}
                {data.verified_skills.length > 0 && (
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-gray-900">
                      Verified Technical Competencies:{' '}
                    </span>
                    <span className="text-gray-700">
                      {data.verified_skills
                        .map(
                          (s) =>
                            `${s.name} [Verified${
                              s.verified_level_name ? ` - ${s.verified_level_name}` : ''
                            }]`
                        )
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Self reported skills (if toggle is on) */}
                {data.include_unverified_skills && data.unverified_skills.length > 0 && (
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold text-gray-600">Additional Skills:{' '}</span>
                    <span className="text-gray-600">
                      {data.unverified_skills.map((s) => s.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Projects */}
              {data.projects.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">
                    Technical Projects
                  </h3>
                  <div className="space-y-3">
                    {data.projects.map((proj, idx) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>
                            {proj.title}{' '}
                            <span className="font-normal text-gray-500">
                              | {proj.tech_stack}
                            </span>
                          </span>
                          {proj.link && (
                            <span className="text-primary-600 font-mono text-[11px]">
                              {proj.link.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience / Hackathons / Internships */}
              {data.experiences.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">
                    Experience & Practical Achievements
                  </h3>
                  <div className="space-y-3">
                    {data.experiences.map((exp, idx) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <div className="flex justify-between font-bold text-gray-900">
                          <span>
                            {exp.title}{' '}
                            {exp.organization && (
                              <span className="font-normal text-gray-500">
                                &bull; {exp.organization}
                              </span>
                            )}
                          </span>
                          {exp.date_or_duration && (
                            <span className="text-gray-400 font-normal">
                              {exp.date_or_duration}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {data.education.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">
                    Education
                  </h3>
                  <div className="space-y-2">
                    {data.education.map((edu, idx) => (
                      <div key={idx} className="text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{edu.institution_name}</span>
                          <span className="text-gray-500 block">
                            {edu.level} &bull; {edu.board_or_university}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{edu.percentage}%</span>
                          <span className="text-gray-400 block">{edu.passing_year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Preview Footer info bar */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ATS Machine-Readable Layout &bull; Standard Single Column Flow
              </span>
              <span className="font-mono text-[11px]">Format: {data.selected_template}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
