import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, RotateCcw, ChevronRight, Clock } from 'lucide-react';

interface MagicalBookLoaderProps {
  studentName?: string;
  statusText?: string;
  durationSeconds?: number;
  mode?: 'simulation' | 'edit_profile';
  onFinish?: () => void;
}

export const MagicalBookLoader: React.FC<MagicalBookLoaderProps> = ({
  studentName = 'Student',
  statusText,
  durationSeconds = 8,
  mode = 'simulation',
  onFinish
}) => {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'flying'>('closed');
  const [progressMsg, setProgressMsg] = useState('Consulting the Grimoire of Engineering Futures...');
  const [percent, setPercent] = useState<number>(5);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const timeoutsRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAnimation = () => {
    clearAllTimers();
    setPhase('closed');
    setSecondsRemaining(durationSeconds);

    const isEditProfile = mode === 'edit_profile';

    if (isEditProfile) {
      setProgressMsg('Consulting the Grimoire of Career Configurations...');
      setPercent(8);
    } else {
      setProgressMsg('Consulting the Grimoire of Engineering Futures...');
      setPercent(10);
    }

    // Dynamic phase checkpoints calibrated for durationSeconds (e.g. 8 seconds)
    const tOpening = (durationSeconds * 1000) * 0.18; // ~1.44s
    const tFlying = (durationSeconds * 1000) * 0.42;  // ~3.36s
    const tLate = (durationSeconds * 1000) * 0.72;    // ~5.76s
    const tFinal = (durationSeconds * 1000) * 0.92;   // ~7.36s
    const tDone = durationSeconds * 1000;             // 8.0s

    const t1 = window.setTimeout(() => {
      setPhase('opening');
      setProgressMsg(
        isEditProfile
          ? 'Retrieving academic transcript, CGPA & 24+ skill benchmarks...'
          : 'Deciphering academic transcripts & technical skills...'
      );
    }, tOpening);

    const t2 = window.setTimeout(() => {
      setPhase('flying');
      setProgressMsg(
        isEditProfile
          ? `Decrypting Career ID parameters & milestone matrices for ${studentName}...`
          : `Unfolding three distinct futures for ${studentName}...`
      );
    }, tFlying);

    const t3 = window.setTimeout(() => {
      setProgressMsg(
        isEditProfile
          ? 'Synchronizing semester roadmap modules & elective skill gaps...'
          : 'Synthesizing roadmaps, skill gaps & first 30-day blueprints...'
      );
    }, tLate);

    const t4 = window.setTimeout(() => {
      setProgressMsg(
        isEditProfile
          ? 'Finalizing Career ID editor interface... Ready!'
          : 'Three futures materialized! Ready to explore.'
      );
    }, tFinal);

    const tEnd = window.setTimeout(() => {
      setPercent(100);
      setSecondsRemaining(0);
      if (onFinish) {
        onFinish();
      }
    }, tDone);

    timeoutsRef.current = [t1, t2, t3, t4, tEnd];

    // Smooth counter & percentage updater
    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (durationSeconds * 1000), 1);
      const remaining = Math.max(0, durationSeconds - (elapsed / 1000));
      setSecondsRemaining(Math.ceil(remaining));
      setPercent(Math.min(99, Math.round(progress * 100)));
    }, 100);
  };

  useEffect(() => {
    startAnimation();
    return () => clearAllTimers();
  }, [studentName, durationSeconds, mode]);

  // Generate 24 floating parchment sheets flying forward like in the video tunnel
  const flyingPages = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i / 24) * 360;
    const distance = 90 + (i % 5) * 45;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance * 4;
    const y = Math.sin(rad) * distance * 2.8;
    const delay = (i * 0.14) % 2.4;
    const rotX = -30 + ((i * 37) % 70);
    const rotY = -40 + ((i * 47) % 80);
    const rotZ = ((i * 53) % 180) - 90;

    return {
      id: i,
      x: `${x}px`,
      y: `${y}px`,
      rotX: `${rotX}deg`,
      rotY: `${rotY}deg`,
      rotZ: `${rotZ}deg`,
      delay: `${delay}s`,
      duration: `${2.1 + (i % 3) * 0.35}s`
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl overflow-hidden select-none animate-fadeIn">
      {/* Top Action Controls: Replay, Timer Badge & Close Buttons */}
      <div className="absolute top-5 right-5 z-50 flex items-center gap-3">
        {/* 8-Second Countdown Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold shadow-md">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>{secondsRemaining}s left</span>
        </div>

        <button
          onClick={startAnimation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold transition-all shadow-md active:scale-95"
          title="Replay 8-second animation from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay ({durationSeconds}s)</span>
        </button>

        {onFinish && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-extrabold transition-all shadow-lg active:scale-95"
            title="Skip animation and proceed"
          >
            <X className="w-4 h-4" />
            <span>Skip ({secondsRemaining}s)</span>
          </button>
        )}
      </div>

      {/* Mystical Background Nebula Portal */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-purple-950/60 to-slate-950 pointer-events-none" />

      {/* Central Glowing Mystic Portal / Star */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.85) 0%, rgba(168, 85, 247, 0.55) 35%, rgba(59, 130, 246, 0.2) 65%, transparent 80%)',
          animation: 'portalPulse 3s ease-in-out infinite'
        }}
      />

      {/* 3D SCENE CONTAINER */}
      <div className="relative w-80 h-96 perspective-1000 flex items-center justify-center">
        {/* THE FANTASY TOME / SPELLBOOK */}
        <div
          className="relative w-56 h-72 transition-all duration-1000 ease-out preserve-3d"
          style={{
            transform:
              phase === 'closed'
                ? 'scale(0.95)'
                : phase === 'opening'
                ? 'scale(1.08) translateY(-12px)'
                : 'scale(1.18) translateZ(-120px)'
          }}
        >
          {/* Back Cover & Spine (Gold Filigree and Blue Leather) */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 shadow-2xl border-4 border-amber-300/80"
            style={{ transform: 'translateZ(-16px)' }}
          >
            {/* Spine bands */}
            <div className="absolute left-0 top-6 bottom-6 w-8 bg-gradient-to-r from-blue-950 via-slate-800 to-blue-950 rounded-l-xl border-r-2 border-amber-300">
              <div className="h-4 w-full bg-amber-400 my-4 border-y border-amber-200"></div>
              <div className="h-4 w-full bg-amber-400 my-8 border-y border-amber-200"></div>
              <div className="h-4 w-full bg-amber-400 my-8 border-y border-amber-200"></div>
            </div>
          </div>

          {/* Golden / Parchment Paper Stack Side */}
          <div className="absolute top-2 bottom-2 right-1 w-8 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-100 border-l border-amber-700 shadow-inner rounded-r-md"></div>

          {/* FLIPPING PARCHMENT SHEET 1 (Turns left) */}
          <div
            className="absolute inset-1 rounded-xl bg-[#faeed8] border border-amber-800/40 shadow-md p-3 text-amber-950 flex flex-col justify-between origin-left transition-transform duration-1000 ease-out preserve-3d"
            style={{
              transform: phase === 'closed' ? 'rotateY(0deg)' : 'rotateY(-155deg)',
              transformOrigin: 'left center',
              zIndex: 10
            }}
          >
            <div className="h-full border border-amber-900/20 rounded p-2 flex flex-col justify-between">
              <div className="text-[8px] font-mono font-bold text-amber-900 uppercase tracking-widest text-center">
                {mode === 'edit_profile' ? 'Profile Blueprint' : 'Engineering Archetypes'}
              </div>
              <div className="space-y-1">
                <div className="w-full h-1 bg-amber-900/20 rounded"></div>
                <div className="w-3/4 h-1 bg-amber-900/20 rounded"></div>
                <div className="w-5/6 h-1 bg-amber-900/20 rounded"></div>
              </div>
              <div className="text-[7px] text-center text-amber-800 font-mono">
                {mode === 'edit_profile' ? 'Career ID Sync' : 'Three Distinct Paths'}
              </div>
            </div>
          </div>

          {/* FLIPPING PARCHMENT SHEET 2 (Turns middle) */}
          <div
            className="absolute inset-1 rounded-xl bg-[#f5e4c4] border border-amber-800/40 shadow-md p-3 text-amber-950 flex flex-col justify-between origin-left transition-transform duration-1200 ease-out preserve-3d"
            style={{
              transform: phase === 'closed' ? 'rotateY(0deg)' : 'rotateY(-85deg)',
              transformOrigin: 'left center',
              zIndex: 12
            }}
          >
            <div className="h-full border border-amber-900/20 rounded p-2 flex flex-col justify-center items-center">
              <span className="text-2xl animate-spin">✦</span>
              <span className="text-[8px] font-mono text-amber-900 mt-1 font-bold">
                {mode === 'edit_profile' ? 'Loading Parameters' : 'Mapping Timeline'}
              </span>
            </div>
          </div>

          {/* FRONT COVER (Flips open leftwards like in the video) */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 border-4 border-amber-400 shadow-2xl p-4 flex flex-col items-center justify-between origin-left transition-all duration-1000 ease-in-out preserve-3d"
            style={{
              transform: phase === 'closed' ? 'rotateY(0deg)' : 'rotateY(-175deg)',
              backfaceVisibility: 'hidden',
              zIndex: 20
            }}
          >
            {/* Ornate Gold Border Filigree */}
            <div className="w-full h-full rounded-xl border-2 border-amber-300/70 p-2 flex flex-col items-center justify-between relative bg-gradient-to-b from-blue-950/70 to-indigo-950/90">
              {/* Corner Gems */}
              <div className="w-4 h-4 bg-amber-300 rotate-45 absolute top-1 left-1 shadow-sm"></div>
              <div className="w-4 h-4 bg-amber-300 rotate-45 absolute top-1 right-1 shadow-sm"></div>
              <div className="w-4 h-4 bg-amber-300 rotate-45 absolute bottom-1 left-1 shadow-sm"></div>
              <div className="w-4 h-4 bg-amber-300 rotate-45 absolute bottom-1 right-1 shadow-sm"></div>

              {/* Gold Filigree Header */}
              <div className="text-[9px] font-mono tracking-widest text-amber-200/90 uppercase font-black pt-1">
                ✦ {mode === 'edit_profile' ? 'PROFILE CONFIGURATOR' : 'CHRONICLE OF FUTURES'} ✦
              </div>

              {/* Glowing Center Diamond Jewel (exactly as in the reference video) */}
              <div className="my-auto relative flex items-center justify-center">
                <div className="w-20 h-20 bg-amber-400 rotate-45 rounded-lg flex items-center justify-center shadow-lg border-2 border-amber-200">
                  <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-[0_0_25px_#38bdf8] animate-pulse">
                    <div className="w-6 h-6 bg-white/90 rotate-45 shadow-[0_0_15px_white]"></div>
                  </div>
                </div>
              </div>

              {/* Gold Rune Inscriptions */}
              <div className="text-[8px] font-mono tracking-wider text-cyan-300 uppercase font-bold pb-1">
                {mode === 'edit_profile' ? 'CAREER ID EDITOR' : 'CAREER PATH SIMULATOR'}
              </div>
            </div>
          </div>

          {/* BASE PARCHMENT BED (revealed when cover flips open) */}
          <div
            className={`absolute inset-1 rounded-xl bg-[#f5e6ca] border border-amber-800 shadow-2xl p-4 text-amber-950 flex flex-col justify-between transition-opacity duration-700 ${
              phase === 'closed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Weathered edge look */}
            <div className="border border-amber-900/20 h-full rounded p-3 flex flex-col justify-between bg-[radial-gradient(#eedcb8_1px,transparent_1px)] [background-size:12px_12px]">
              <div className="text-center border-b border-amber-800/30 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-900">
                  {mode === 'edit_profile' ? 'Career ID Customizer' : 'Chapter of Pathways'}
                </span>
                <h4 className="text-xs font-black text-amber-950">
                  {studentName}&apos;s Trajectory
                </h4>
              </div>

              {/* Glowing Rune Core in Center */}
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center animate-ping">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>

              <div className="text-[9px] font-mono text-center text-amber-800/80 font-bold">
                {mode === 'edit_profile' ? 'Academics · Skills · Achievements' : 'Full Stack · AI/ML · Data Science'}
              </div>
            </div>
          </div>
        </div>

        {/* SWIRLING FLYING PARCHMENT PAGES (flying directly toward camera, matching the video tunnel) */}
        {phase === 'flying' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {flyingPages.map((p) => (
              <div
                key={p.id}
                className="absolute w-20 h-28 sm:w-28 sm:h-36 bg-[#f7eedc] rounded-md border border-amber-800/40 shadow-2xl p-2 text-[8px] text-amber-900 overflow-hidden"
                style={{
                  '--fly-x': p.x,
                  '--fly-y': p.y,
                  '--rot-x': p.rotX,
                  '--rot-y': p.rotY,
                  '--rot-z': p.rotZ,
                  animation: `flyForwardSwirl ${p.duration} cubic-bezier(0.15, 0.85, 0.35, 1.2) infinite`,
                  animationDelay: p.delay,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5), inset 0 0 10px rgba(180, 140, 90, 0.4)'
                } as any}
              >
                {/* Weathered Lines on flying sheets */}
                <div className="w-full h-1.5 bg-amber-900/30 rounded mb-1.5"></div>
                <div className="w-3/4 h-1 bg-amber-900/20 rounded mb-1"></div>
                <div className="w-5/6 h-1 bg-amber-900/20 rounded mb-1"></div>
                <div className="w-2/3 h-1 bg-amber-900/20 rounded mb-1"></div>
                <div className="mt-2 w-8 h-8 rounded-full border border-amber-900/20 flex items-center justify-center text-[7px] text-amber-800">
                  📜
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBTITLE & PROGRESS STATUS TEXT */}
      <div className="relative z-10 mt-8 text-center px-4 max-w-md space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>
            {mode === 'edit_profile'
              ? 'Opening Career ID Configuration (8 Seconds)'
              : 'Gemini AI Career Simulator Engine'}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
          {progressMsg}
        </h3>

        <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
          {mode === 'edit_profile'
            ? 'Preparing all editable fields: Branch, CGPA, weekly study hours, preset & custom skill ratings, and achievements.'
            : 'Synthesizing Indian placement benchmarks, CGPA cutoffs, and week-by-week roadmaps...'}
        </p>

        {/* Needle & Thread Loading Progress Bar with dynamic percentage and 8-second counter */}
        <div className="w-64 sm:w-80 mx-auto space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono text-cyan-300 font-bold px-1">
            <span>{mode === 'edit_profile' ? 'Loading Profile Editor' : 'Simulating Pathways'}</span>
            <span>{percent}% ({secondsRemaining}s)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>

        {onFinish && (
          <button
            onClick={onFinish}
            className="mt-4 px-4 py-1.5 text-xs font-extrabold text-cyan-400 hover:text-white underline transition-colors flex items-center gap-1 mx-auto"
          >
            <span>{mode === 'edit_profile' ? 'Skip to Profile Editor' : 'Skip to Dashboard'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
