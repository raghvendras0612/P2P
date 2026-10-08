import React, { useState } from 'react';
import {
  StudentProfile,
  SkillItem,
  SkillLevel,
  BranchOption,
  StudentProject,
  StudentInternship
} from '../types';
import { PRESET_SKILLS, PRESET_INTERESTS, DEMO_STUDENT_PROFILE } from '../data/constants';
import {
  User,
  GraduationCap,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Trophy,
  Award,
  Layers,
  ChevronRight,
  HelpCircle,
  FileCode2,
  FolderPlus
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile | null;
  onTriggerBookAnimation?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  initialProfile,
  onTriggerBookAnimation
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState(initialProfile?.name || '');
  const [college, setCollege] = useState(initialProfile?.college || '');
  const [branch, setBranch] = useState<BranchOption>(initialProfile?.branch || 'CSE');
  const [yearOfStudy, setYearOfStudy] = useState<number>(initialProfile?.yearOfStudy || 3);
  const [cgpa, setCgpa] = useState<number>(initialProfile?.cgpa ?? 8.2);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(initialProfile?.hoursPerWeek || 15);

  // Step 2: Skills
  const [skills, setSkills] = useState<SkillItem[]>(
    initialProfile?.skills || [
      { name: 'JavaScript', level: 'Advanced' },
      { name: 'Python', level: 'Intermediate' },
      { name: 'React', level: 'Intermediate' },
      { name: 'DSA', level: 'Intermediate' },
      { name: 'SQL', level: 'Intermediate' }
    ]
  );
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillLevel, setCustomSkillLevel] = useState<SkillLevel>('Intermediate');
  const [skillFilter, setSkillFilter] = useState('');

  // Step 3: Interests
  const [interests, setInterests] = useState<string[]>(
    initialProfile?.interests || ['Web Apps & Full Stack', 'Generative AI & LLMs', 'High-Growth Startups']
  );

  // Step 4: Background
  const [tenthPercentage, setTenthPercentage] = useState<number | undefined>(
    initialProfile?.tenthPercentage ?? 92.0
  );
  const [twelfthPercentage, setTwelfthPercentage] = useState<number | undefined>(
    initialProfile?.twelfthPercentage ?? 89.5
  );
  const [diploma, setDiploma] = useState<string>(initialProfile?.diploma || '');

  // Add-more lists
  const [certifications, setCertifications] = useState<string[]>(
    initialProfile?.certifications || ['NPTEL Data Structures & Algorithms', 'Coursera Meta Front-End Certification']
  );
  const [newCert, setNewCert] = useState('');

  const [projects, setProjects] = useState<StudentProject[]>(
    initialProfile?.projects || [
      {
        id: 'p1',
        name: 'Campus Placement Portal',
        description: 'Full stack placement manager with company job postings, automated resume screening, and student portal.',
        techStack: ['React', 'Node.js', 'PostgreSQL'],
        link: 'https://github.com/example/campus-portal'
      }
    ]
  );
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projLink, setProjLink] = useState('');

  const [internships, setInternships] = useState<StudentInternship[]>(
    initialProfile?.internships || []
  );
  const [internRole, setInternRole] = useState('');
  const [internCompany, setInternCompany] = useState('');
  const [internDuration, setInternDuration] = useState('');
  const [internDesc, setInternDesc] = useState('');

  const [achievements, setAchievements] = useState<string[]>(
    initialProfile?.achievements || ['LeetCode 200+ Questions Solved', 'State Hackathon Top 5 Finalist']
  );
  const [newAchievement, setNewAchievement] = useState('');

  // Quick Demo Pre-fill
  const handleLoadDemo = () => {
    setName(DEMO_STUDENT_PROFILE.name);
    setCollege(DEMO_STUDENT_PROFILE.college);
    setBranch(DEMO_STUDENT_PROFILE.branch);
    setYearOfStudy(DEMO_STUDENT_PROFILE.yearOfStudy);
    setCgpa(DEMO_STUDENT_PROFILE.cgpa);
    setHoursPerWeek(DEMO_STUDENT_PROFILE.hoursPerWeek);
    setSkills(DEMO_STUDENT_PROFILE.skills);
    setInterests(DEMO_STUDENT_PROFILE.interests);
    setTenthPercentage(DEMO_STUDENT_PROFILE.tenthPercentage);
    setTwelfthPercentage(DEMO_STUDENT_PROFILE.twelfthPercentage);
    setCertifications(DEMO_STUDENT_PROFILE.certifications);
    setProjects(DEMO_STUDENT_PROFILE.projects);
    setInternships(DEMO_STUDENT_PROFILE.internships);
    setAchievements(DEMO_STUDENT_PROFILE.achievements);
  };

  // Skill Management
  const handleTogglePresetSkill = (presetName: string) => {
    const existing = skills.find((s) => s.name.toLowerCase() === presetName.toLowerCase());
    if (existing) {
      setSkills(skills.filter((s) => s.name.toLowerCase() !== presetName.toLowerCase()));
    } else {
      setSkills([...skills, { name: presetName, level: 'Intermediate' }]);
    }
  };

  const handleUpdateSkillLevel = (skillName: string, level: SkillLevel) => {
    setSkills(
      skills.map((s) => (s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, level } : s))
    );
  };

  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSkillName.trim()) return;
    const trimmed = customSkillName.trim();
    if (!skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, { name: trimmed, level: customSkillLevel }]);
    }
    setCustomSkillName('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()));
  };

  // Interests Management
  const handleToggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  // Add More Helpers
  const handleAddCert = () => {
    if (newCert.trim()) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert('');
    }
  };

  const handleAddProject = () => {
    if (projName.trim()) {
      setProjects([
        ...projects,
        {
          id: `p-${Date.now()}`,
          name: projName.trim(),
          description: projDesc.trim(),
          techStack: projStack
            ? projStack.split(',').map((t) => t.trim()).filter(Boolean)
            : ['React', 'JavaScript'],
          link: projLink.trim()
        }
      ]);
      setProjName('');
      setProjDesc('');
      setProjStack('');
      setProjLink('');
    }
  };

  const handleAddInternship = () => {
    if (internRole.trim() && internCompany.trim()) {
      setInternships([
        ...internships,
        {
          id: `i-${Date.now()}`,
          role: internRole.trim(),
          company: internCompany.trim(),
          duration: internDuration.trim() || '2 months',
          description: internDesc.trim()
        }
      ]);
      setInternRole('');
      setInternCompany('');
      setInternDuration('');
      setInternDesc('');
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  // Final Submission
  const handleFinish = () => {
    if (!name.trim()) {
      alert('Please enter your name.');
      setStep(1);
      return;
    }

    // Generate random 4-digit Career ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const careerId = initialProfile?.careerId || `CSP-${randomNum}`;

    const profile: StudentProfile = {
      careerId,
      name: name.trim(),
      college: college.trim() || 'Engineering College',
      branch,
      yearOfStudy,
      cgpa: Number(cgpa) || 8.0,
      hoursPerWeek: Number(hoursPerWeek) || 15,
      skills,
      interests,
      tenthPercentage: tenthPercentage ? Number(tenthPercentage) : undefined,
      twelfthPercentage: twelfthPercentage ? Number(twelfthPercentage) : undefined,
      diploma: diploma.trim() || undefined,
      certifications,
      projects,
      internships,
      achievements,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onComplete(profile);
  };

  // Step Validation
  const canProceedStep1 = name.trim().length > 1;
  const canProceedStep2 = skills.length >= 2;
  const canProceedStep3 = interests.length >= 1;

  const totalSteps = 4;
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Hero Card with Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Career ID Setup Wizard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create Your Career ID
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tell us about your engineering branch, technical skills, and background to simulate three high-impact futures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onTriggerBookAnimation && (
              <button
                type="button"
                onClick={onTriggerBookAnimation}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 hover:from-amber-500/30 hover:to-blue-500/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition-all shadow-sm active:scale-95"
                title="Preview 3D Magical Tome Loading Animation (from video)"
              >
                <span className="text-sm animate-pulse">📖</span>
                <span>Preview 3D Loading Animation</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 hover:from-amber-500/20 hover:to-blue-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm"
              title="Pre-fill with Deepak Kumar (3rd Year CSE, 8.4 CGPA, 15 hrs/wk)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Demo Profile</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>
              Step {step} of {totalSteps}:{' '}
              {step === 1 && 'Basics & Academics'}
              {step === 2 && 'Technical Skills & Ratings'}
              {step === 3 && 'Career Interests'}
              {step === 4 && 'Background & Achievements'}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { num: 1, label: '1. Basics' },
              { num: 2, label: '2. Skills' },
              { num: 3, label: '3. Interests' },
              { num: 4, label: '4. Background' }
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`text-left text-xs font-medium py-1 px-2 rounded-lg transition-colors ${
                  step === s.num
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40'
                    : step > s.num
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {step > s.num ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <span
                      className={`w-3.5 h-3.5 rounded-full text-[10px] flex items-center justify-center ${
                        step === s.num
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s.num}
                    </span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Step Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Step 1: Basic Information & Academic Standing
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your college year, branch, and CGPA define your immediate eligibility for Day-1 dream companies and internship windows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Deepak Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* College / University */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  College / University <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology, Trichy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Engineering Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Engineering Branch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as BranchOption)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="CSE">Computer Science & Engineering (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics & Communication (ECE)</option>
                  <option value="EE">Electrical & Electronics (EE)</option>
                  <option value="ME">Mechanical Engineering (ME)</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Other">Other Branch</option>
                </select>
                {branch !== 'CSE' && branch !== 'IT' && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Non-CS/IT branch detected: The simulator will emphasize portfolio proof and coding rounds for campus eligibility.
                  </p>
                )}
              </div>

              {/* Year of Study */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Year of Study <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setYearOfStudy(yr)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        yearOfStudy === yr
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Year {yr}
                      <span className="block text-[10px] font-normal opacity-80">
                        {yr === 1 && 'Freshman'}
                        {yr === 2 && 'Sophomore'}
                        {yr === 3 && 'Pre-Final'}
                        {yr === 4 && 'Final Year'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CGPA Slider & Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    College CGPA <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {cgpa.toFixed(1)} / 10.0
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="10.0"
                  step="0.1"
                  value={cgpa}
                  onChange={(e) => setCgpa(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>6.0 (Mass eligibility)</span>
                  <span>7.5 (Product cutoff)</span>
                  <span>8.5+ (Dream shortlist)</span>
                </div>
              </div>

              {/* Hours per week available */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hours Per Week Available <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {hoursPerWeek} hrs/week
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ~{(hoursPerWeek / 7).toFixed(1)} hrs/day. The 30-day action plan will adapt its schedule to match this commitment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SKILLS CHIP PICKER & SELF-RATING */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-600" />
                Step 2: Technical Skills & Self-Ratings
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select your existing skills and rate your current confidence. The simulator calculates gap analysis against target industry requirements.
              </p>
            </div>

            {/* Custom Skill Adder */}
            <form onSubmit={handleAddCustomSkill} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  placeholder="Type a skill (e.g. Next.js, Redis, AWS, Flutter, Solitude...)"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={customSkillLevel}
                  onChange={(e) => setCustomSkillLevel(e.target.value as SkillLevel)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Skill
                </button>
              </div>
            </form>

            {/* Selected Skills Chips with Level Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Your Selected Skills ({skills.length}):
                </span>
                <span className="text-[11px] text-slate-500">Click a level badge to adjust proficiency</span>
              </div>

              {skills.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                  No skills selected yet. Click any preset chip below or add custom skills.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill) => {
                    const levelColors =
                      skill.level === 'Advanced'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60'
                        : skill.level === 'Intermediate'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/60'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60';

                    return (
                      <div
                        key={skill.name}
                        className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-300"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {skill.name}
                        </span>

                        {/* Level Switcher */}
                        <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
                          {(['Beginner', 'Intermediate', 'Advanced'] as SkillLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateSkillLevel(skill.name, lvl)}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-all ${
                                skill.level === lvl
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={`Set ${skill.name} to ${lvl}`}
                            >
                              {lvl[0]}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                          title={`Remove ${skill.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preset Skills Library */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quick Select from Presets:
                </span>
                <input
                  type="text"
                  placeholder="Filter presets..."
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.filter((p) =>
                  p.toLowerCase().includes(skillFilter.toLowerCase())
                ).map((preset) => {
                  const isSelected = skills.some(
                    (s) => s.name.toLowerCase() === preset.toLowerCase()
                  );
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleTogglePresetSkill(preset)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                      }`}
                    >
                      {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INTERESTS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Step 3: Domains & Career Interests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose the technical fields that excite you most. The simulator calculates role affinity and customizes recommended projects.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-semibold">{interest}</span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: BACKGROUND & ACHIEVEMENTS */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Step 4: Background, Projects & Achievements
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Prior qualifications, certifications, hackathons, and deployed projects. The simulator marks matching milestones as already &quot;Achieved&quot;!
              </p>
            </div>

            {/* Academics: 10th, 12th, Diploma */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  10th Board %
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={tenthPercentage ?? ''}
                  onChange={(e) => setTenthPercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g. 92.5"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  12th Board %
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={twelfthPercentage ?? ''}
                  onChange={(e) => setTwelfthPercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g. 89.0"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Diploma (If applicable)
                </label>
                <input
                  type="text"
                  value={diploma}
                  onChange={(e) => setDiploma(e.target.value)}
                  placeholder="e.g. Polytech CSE"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Projects Add-More List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-indigo-600" />
                  Projects Built ({projects.length})
                </span>
                <span className="text-[11px] text-slate-500">Demonstrates practical coding proof</span>
              </div>

              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 text-[10px] rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjects(projects.filter((x) => x.id !== p.id))}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Project Name (e.g. Real-Time Chat App)"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack (comma separated, e.g. React, Node, SQL)"
                    value={projStack}
                    onChange={(e) => setProjStack(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <input
                  type="text"
                  placeholder="One-line description of what it does..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                >
                  + Add Project to Profile
                </button>
              </div>
            </div>

            {/* Certifications & Achievements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Certifications */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Certifications ({certifications.length})
                </span>
                <div className="space-y-1.5">
                  {certifications.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="truncate">{c}</span>
                      <button
                        type="button"
                        onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-500 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add certification (e.g. AWS Cloud, NPTEL)"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Achievements & Hackathons */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-indigo-500" />
                  Achievements & Competitions ({achievements.length})
                </span>
                <div className="space-y-1.5">
                  {achievements.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="truncate">{a}</span>
                      <button
                        type="button"
                        onClick={() => setAchievements(achievements.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-500 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add achievement (e.g. Hackathon Top 3, LeetCode 200)"
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              step === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Generate Career ID & Simulate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
