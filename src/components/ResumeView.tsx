import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { FileText, Download, Sparkles, Printer, Layers, CheckCircle2, Award, Briefcase, GraduationCap, FolderGit2 } from 'lucide-react';

interface ResumeViewProps {
  profile: StudentProfile;
  demoMode: boolean;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ profile, demoMode }) => {
  const [template, setTemplate] = useState<'modern' | 'classic'>('modern');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedSummary, setPolishedSummary] = useState<string | null>(null);
  const [polishedBullets, setPolishedBullets] = useState<Record<string, string[]>>({});

  const handlePrint = () => {
    window.print();
  };

  const handleAIPolish = async () => {
    setIsPolishing(true);
    try {
      if (demoMode) {
        setTimeout(() => {
          setPolishedSummary(
            `Impact-focused ${profile.branch} engineering student at ${profile.college || 'Engineering College'} with ${profile.cgpa} CGPA and proven technical execution across scalable web architecture and algorithmic problem solving. Experienced in developing full-stack applications with sub-100ms API latency and managing cross-functional technical workflows.`
          );
          setPolishedBullets({
            'Campus Placement Portal': [
              'Architected full-stack recruitment tracking system supporting 500+ active user sessions with sub-100ms API response latency.',
              'Engineered normalized PostgreSQL relational schemas and implemented JWT authentication with automated token rotation.',
              'Integrated automated role-based access control (RBAC), reducing administrative screening overhead by 40%.'
            ]
          });
          setIsPolishing(false);
        }, 600);
        return;
      }

      const res = await fetch('/api/resume/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targetPath: 'software_engineering'
        })
      });
      const data = await res.json();
      if (data.summary) {
        setPolishedSummary(data.summary);
      }
      if (Array.isArray(data.projectBulletPoints)) {
        const bulletMap: Record<string, string[]> = {};
        data.projectBulletPoints.forEach((p: any) => {
          if (p.name && Array.isArray(p.bullets)) {
            bulletMap[p.name] = p.bullets;
          }
        });
        setPolishedBullets(bulletMap);
      }
    } catch (e) {
      console.warn('Resume polish error:', e);
      setPolishedSummary(
        `High-performing ${profile.branch} candidate (CGPA ${profile.cgpa}) with strong foundation in DSA and modern application development.`
      );
    } finally {
      setIsPolishing(false);
    }
  };

  // Group skills by level
  const advancedSkills = profile.skills.filter((s) => s.level === 'Advanced');
  const intermediateSkills = profile.skills.filter((s) => s.level === 'Intermediate');
  const beginnerSkills = profile.skills.filter((s) => s.level === 'Beginner');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Live ATS Resume Builder
          </h2>
          <p className="text-xs text-slate-500">
            Dynamically syncs with your Career ID profile, projects, and verified skill badges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Template Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setTemplate('modern')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                template === 'modern'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Modern Tech
            </button>
            <button
              onClick={() => setTemplate('classic')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                template === 'classic'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Classic Ivy
            </button>
          </div>

          {/* AI Polish Button */}
          <button
            onClick={handleAIPolish}
            disabled={isPolishing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isPolishing ? 'Polishing...' : 'AI Polish'}</span>
          </button>

          {/* Download / Print PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-md transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* RESUME PAPER CONTAINER */}
      <div
        id="resume-printable-area"
        className={`bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-200 max-w-4xl mx-auto ${
          template === 'classic' ? 'font-serif' : 'font-sans'
        }`}
        style={{ minHeight: '1050px' }}
      >
        {/* HEADER SECTION */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            {profile.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700 mt-1 font-medium">
            <span>{profile.branch} Engineering (Year {profile.yearOfStudy})</span>
            <span>•</span>
            <span>{profile.college || 'Engineering Institute'}</span>
            <span>•</span>
            <span className="font-bold">CGPA: {profile.cgpa} / 10.0</span>
            <span>•</span>
            <span className="font-mono">{profile.careerId}</span>
          </div>
        </div>

        {/* PROFESSIONAL SUMMARY */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed text-justify">
            {polishedSummary ||
              (profile.name === 'Aarav Sharma'
                ? 'Second-year CSE student with working knowledge of Python, HTML/CSS and SQL, building toward a full stack developer role. Built small web apps and took part in a college hackathon.'
                : `Analytical and result-oriented ${profile.branch} student at ${profile.college || 'Engineering Institute'} maintaining a ${profile.cgpa} CGPA. Proficient in algorithmic problem solving and modern full-stack development.`)}
          </p>
        </div>

        {/* EDUCATION & ACADEMIC STANDING */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Education & Academic Standing
          </h2>
          <div className="space-y-1.5 text-xs text-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-slate-900">Bachelor of Technology ({profile.branch})</strong>
                <p className="text-slate-600">{profile.college || 'Engineering College'}</p>
              </div>
              <div className="text-right">
                <span className="font-bold">CGPA: {profile.cgpa} / 10.0</span>
                <p className="text-slate-500">Graduating Year {2024 + (4 - profile.yearOfStudy + 1)}</p>
              </div>
            </div>

            {(profile.twelfthPercentage || profile.tenthPercentage) && (
              <div className="text-[11px] text-slate-600 pt-1 flex gap-4">
                {profile.twelfthPercentage && (
                  <span>12th Standard (Higher Secondary): <strong>{profile.twelfthPercentage}%</strong></span>
                )}
                {profile.tenthPercentage && (
                  <span>10th Standard (Secondary): <strong>{profile.tenthPercentage}%</strong></span>
                )}
                {profile.diploma && <span>Diploma: <strong>{profile.diploma}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* TECHNICAL SKILLS */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Technical Competencies
          </h2>
          <div className="space-y-1.5 text-xs text-slate-800">
            {advancedSkills.length > 0 && (
              <div className="flex items-start">
                <span className="font-bold w-32 flex-shrink-0">Proficient:</span>
                <span className="text-slate-700">
                  {advancedSkills.map((s) => `${s.name}${s.verified ? ' [Verified]' : ''}`).join(', ')}
                </span>
              </div>
            )}
            {intermediateSkills.length > 0 && (
              <div className="flex items-start">
                <span className="font-bold w-32 flex-shrink-0">Familiar / Working:</span>
                <span className="text-slate-700">
                  {intermediateSkills.map((s) => `${s.name}${s.verified ? ' [Verified]' : ''}`).join(', ')}
                </span>
              </div>
            )}
            {beginnerSkills.length > 0 && (
              <div className="flex items-start">
                <span className="font-bold w-32 flex-shrink-0">Foundational:</span>
                <span className="text-slate-700">
                  {beginnerSkills.map((s) => s.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KEY PROJECTS */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Key Technical Projects
            </h2>
            <div className="space-y-3 text-xs text-slate-800">
              {profile.projects.map((proj) => {
                const customBullets = polishedBullets[proj.name];
                return (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{proj.name}</strong>
                        <span className="text-[11px] text-slate-600 font-mono">
                          | {proj.techStack.join(', ')}
                        </span>
                      </div>
                      {proj.link && (
                        <span className="text-[10px] text-indigo-700 underline">{proj.link}</span>
                      )}
                    </div>

                    {customBullets ? (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {customBullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-700 pl-2 border-l border-slate-300">
                        {proj.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INTERNSHIPS & EXPERIENCE */}
        {profile.internships && profile.internships.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Practical Experience & Internships
            </h2>
            <div className="space-y-2.5 text-xs text-slate-800">
              {profile.internships.map((intern) => (
                <div key={intern.id} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{intern.role} — {intern.company}</span>
                    <span className="text-slate-600 font-medium text-[11px]">{intern.duration}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{intern.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS & CERTIFICATIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {profile.achievements && profile.achievements.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Honors & Achievements
              </h2>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700">
                {profile.achievements.map((ach, idx) => (
                  <li key={idx}>{ach}</li>
                ))}
              </ul>
            </div>
          )}

          {profile.certifications && profile.certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Certifications
              </h2>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700">
                {profile.certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
