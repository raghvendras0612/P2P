import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  SimulationResult,
  QuizQuestion,
  SkillItem,
  SkillScore
} from './types';
import { Navbar } from './components/Navbar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SimulationView } from './components/SimulationView';
import { TextileDashboard } from './components/TextileDashboard';
import { MagicalBookLoader } from './components/MagicalBookLoader';
import { ReadinessModal } from './components/ReadinessModal';
import { MentorDrawer } from './components/MentorDrawer';
import { ResumeView } from './components/ResumeView';
import { ProfileEditView } from './components/ProfileEditView';
import { DEMO_STUDENT_PROFILE } from './data/constants';

export default function App() {
  // 1. Profile State - defaults to DEMO_STUDENT_PROFILE if not yet created so judges immediately see the reference UI!
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('career_sim_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading profile from localStorage', e);
    }
    // Default to the reference demo profile (Deepak Kumar, 3rd year CSE, 8.4 CGPA)
    return DEMO_STUDENT_PROFILE;
  });

  // 2. Simulation State
  const [simulation, setSimulation] = useState<SimulationResult | null>(() => {
    try {
      const saved = localStorage.getItem('career_sim_simulation');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading simulation from localStorage', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'simulator' | 'readiness' | 'resume' | 'profile'>('simulator');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showBookLoaderManual, setShowBookLoaderManual] = useState<boolean>(false);
  const [loaderMode, setLoaderMode] = useState<'simulation' | 'edit_profile'>('simulation');
  const [loaderDuration, setLoaderDuration] = useState<number>(8);
  const [detailedRoadmapPath, setDetailedRoadmapPath] = useState<'full_stack' | 'ai_ml' | 'data_science' | 'data_engineering' | null>(null);

  // Trigger 8-second Magical Book Loading Animation when Edit Profile is clicked
  const handleEditProfileClick = () => {
    setActiveTab('profile');
    setLoaderMode('edit_profile');
    setLoaderDuration(8);
    setShowBookLoaderManual(true);
  };

  const [demoMode, setDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('career_sim_demomode') === 'true';
  });

  // 4. Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('career_sim_darkmode');
    return saved ? saved === 'true' : true; // Default dark denim
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('career_sim_darkmode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('career_sim_demomode', String(demoMode));
  }, [demoMode]);

  // Initial simulation fetch if not yet loaded
  useEffect(() => {
    if (profile && !simulation) {
      runSimulation(profile);
    }
  }, []);

  // 5. Readiness Modal State
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);
  const [readinessQuestions, setReadinessQuestions] = useState<QuizQuestion[]>([]);

  // Simulation Runner with Magical Book Animation
  const runSimulation = async (targetProfile: StudentProfile) => {
    setIsSimulating(true);
    try {
      if (demoMode) {
        const res = await fetch('/api/sample');
        const data = await res.json();
        const pList = data.paths || [];
        const pMap = Object.fromEntries(pList.map((p: any) => [p.id, p]));
        const result: SimulationResult = {
          fallback: true,
          generatedFor: targetProfile.name,
          paths: pList,
          full_stack: pMap.full_stack,
          ai_ml: pMap.ai_ml,
          data_science: pMap.data_science,
          data_engineering: pMap.data_engineering,
          generatedAt: new Date().toISOString()
        };
        // Give time to enjoy the 3D book opening and flying pages animation
        setTimeout(() => {
          setSimulation(result);
          localStorage.setItem('career_sim_simulation', JSON.stringify(result));
          setIsSimulating(false);
        }, 2400);
      } else {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProfile)
        });
        const data = await res.json();
        const pList = data.paths || [];
        const pMap = Object.fromEntries(pList.map((p: any) => [p.id, p]));
        const result: SimulationResult = {
          fallback: data.fallback ?? false,
          generatedFor: targetProfile.name,
          paths: pList,
          full_stack: data.full_stack || pMap.full_stack,
          ai_ml: data.ai_ml || pMap.ai_ml,
          data_science: data.data_science || pMap.data_science,
          data_engineering: data.data_engineering || pMap.data_engineering,
          generatedAt: new Date().toISOString()
        };
        setTimeout(() => {
          setSimulation(result);
          localStorage.setItem('career_sim_simulation', JSON.stringify(result));
          setIsSimulating(false);
        }, 2200);
      }
    } catch (err) {
      console.warn('Simulation call failed, loading fallback:', err);
      try {
        const res = await fetch('/api/sample');
        const data = await res.json();
        const pList = data.paths || [];
        const pMap = Object.fromEntries(pList.map((p: any) => [p.id, p]));
        const fallbackResult: SimulationResult = {
          fallback: true,
          generatedFor: targetProfile.name,
          paths: pList,
          full_stack: pMap.full_stack,
          ai_ml: pMap.ai_ml,
          data_science: pMap.data_science,
          data_engineering: pMap.data_engineering,
          generatedAt: new Date().toISOString()
        };
        setTimeout(() => {
          setSimulation(fallbackResult);
          localStorage.setItem('career_sim_simulation', JSON.stringify(fallbackResult));
          setIsSimulating(false);
        }, 2200);
      } catch (innerErr) {
        setIsSimulating(false);
      }
    }
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    localStorage.setItem('career_sim_profile', JSON.stringify(newProfile));
    localStorage.setItem('career_sim_career_id', newProfile.careerId);
    setActiveTab('simulator');
    runSimulation(newProfile);
  };

  // Open Readiness Quiz
  const handleOpenReadiness = async () => {
    if (!profile) return;
    try {
      const res = await fetch('/api/readiness/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      setReadinessQuestions(data.questions || []);
    } catch (e) {
      try {
        const res = await fetch('/api/sample');
        const data = await res.json();
        setReadinessQuestions(data.readinessQuestions || []);
      } catch (err) {
        console.error(err);
      }
    }
    setIsReadinessOpen(true);
  };

  // Verification Completed Handler
  const handleVerificationComplete = async (updatedSkills: SkillItem[], verifiedScores: SkillScore[]) => {
    if (!profile) return;
    const updatedProfile: StudentProfile = {
      ...profile,
      skills: updatedSkills,
      updatedAt: new Date().toISOString()
    };
    setProfile(updatedProfile);
    localStorage.setItem('career_sim_profile', JSON.stringify(updatedProfile));

    try {
      const res = await fetch('/api/roadmap/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: updatedProfile,
          verifiedSkills: verifiedScores
        })
      });
      const adjustedSim = await res.json();
      if (adjustedSim.full_stack) {
        setSimulation(adjustedSim);
        localStorage.setItem('career_sim_simulation', JSON.stringify(adjustedSim));
      }
    } catch (e) {
      console.warn('Failed to adjust roadmap:', e);
    }
  };

  // Reset Profile
  const handleResetProfile = () => {
    if (confirm('Create a new Career ID? Your current profile will be reset.')) {
      localStorage.removeItem('career_sim_profile');
      localStorage.removeItem('career_sim_simulation');
      localStorage.removeItem('career_sim_career_id');
      localStorage.removeItem('career_sim_mentor_chat');
      setProfile(null);
      setSimulation(null);
      setActiveTab('simulator');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-5 md:p-8 flex items-center justify-center font-sans antialiased text-slate-100">
      {/* MAGICAL SPELLBOOK / PARCHMENT LOADING ANIMATION (From Video) */}
      {(isSimulating || showBookLoaderManual) && (
        <MagicalBookLoader
          studentName={profile?.name || 'Student'}
          durationSeconds={loaderMode === 'edit_profile' ? 8 : (isSimulating ? 3 : 8)}
          mode={loaderMode}
          onFinish={() => {
            setShowBookLoaderManual(false);
            setIsSimulating(false);
            setLoaderMode('simulation');
          }}
        />
      )}

      {/* OUTSIDE HANDCRAFTED EMBROIDERED FRAME (From Reference Image) */}
      <div className="w-full max-w-[1440px] bg-denim rounded-[32px] p-4 sm:p-7 md:p-9 stitched-frame relative overflow-hidden shadow-2xl flex flex-col gap-6">
        {/* Needlework Corner Embellishments */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none"></div>
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-pink-400 pointer-events-none"></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-yellow-400 pointer-events-none"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none"></div>

        {/* Top Header Strip */}
        <Navbar
          profile={profile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          demoMode={demoMode}
          setDemoMode={setDemoMode}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onReset={handleResetProfile}
          onOpenReadiness={handleOpenReadiness}
          onTriggerBookAnimation={() => {
            setLoaderMode('simulation');
            setShowBookLoaderManual(true);
          }}
          onEditProfile={handleEditProfileClick}
        />

        {/* MAIN BODY AREA */}
        <main className="w-full">
          {!profile ? (
            /* Show Wizard if user resets or starts from scratch */
            <OnboardingWizard
              onComplete={handleOnboardingComplete}
              onTriggerBookAnimation={() => {
                setLoaderMode('simulation');
                setShowBookLoaderManual(true);
              }}
            />
          ) : (
            <>
              {activeTab === 'simulator' && (
                <>
                  {/* Flagship Stitched Textile Canvas Dashboard (From User Image) */}
                  <TextileDashboard
                    simulation={simulation}
                    profile={profile}
                    isLoading={isSimulating}
                    onOpenRoadmapDetails={(pathId) => {
                      setDetailedRoadmapPath(pathId);
                    }}
                    onOpenReadiness={handleOpenReadiness}
                    onOpenMentorPrompt={(prompt) => {
                      // Trigger mentor prompt
                    }}
                    onUpdateSkills={(newSkills) => {
                      const updated: StudentProfile = { ...profile, skills: newSkills };
                      setProfile(updated);
                      localStorage.setItem('career_sim_profile', JSON.stringify(updated));
                    }}
                    onTriggerBookAnimation={() => {
                      setLoaderMode('simulation');
                      setShowBookLoaderManual(true);
                    }}
                    onEditProfile={handleEditProfileClick}
                  />

                  {/* Expanded Detail Modal / Drawer if user clicks "View Roadmap" */}
                  {detailedRoadmapPath && simulation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-3xl border-2 border-dashed border-cyan-400 shadow-2xl p-6 relative">
                        <button
                          onClick={() => setDetailedRoadmapPath(null)}
                          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-slate-700"
                        >
                          ✕
                        </button>
                        <SimulationView
                          simulation={simulation}
                          profile={profile}
                          isLoading={false}
                          onRunSimulation={() => runSimulation(profile)}
                          onOpenReadiness={handleOpenReadiness}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'readiness' && (
                <div className="bg-slate-900/90 rounded-3xl p-6 border-2 border-dashed border-emerald-400">
                  <div className="max-w-2xl mx-auto text-center space-y-4 py-8">
                    <span className="text-4xl">🛡️</span>
                    <h2 className="text-2xl font-black text-white">Diagnostic Skill Readiness Verification</h2>
                    <p className="text-xs text-slate-300">
                      Answer 6 targeted technical questions to verify your self-ratings and automatically update roadmap milestones.
                    </p>
                    <button
                      onClick={handleOpenReadiness}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-700/40"
                    >
                      Launch Verification Quiz Now
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'resume' && (
                <ResumeView profile={profile} demoMode={demoMode} />
              )}

              {activeTab === 'profile' && (
                <ProfileEditView
                  profile={profile}
                  onUpdate={(up) => {
                    setProfile(up);
                    localStorage.setItem('career_sim_profile', JSON.stringify(up));
                    runSimulation(up);
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Readiness Quiz Modal */}
        {profile && (
          <ReadinessModal
            isOpen={isReadinessOpen}
            onClose={() => setIsReadinessOpen(false)}
            questions={readinessQuestions}
            profile={profile}
            onVerificationComplete={handleVerificationComplete}
          />
        )}

        {/* Floating AI Career Mentor Chat Widget (With Robot Avatar) */}
        {profile && (
          <MentorDrawer
            profile={profile}
            simulation={simulation}
            demoMode={demoMode}
          />
        )}
      </div>
    </div>
  );
}
