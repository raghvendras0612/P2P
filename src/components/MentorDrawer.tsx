import React, { useState, useEffect, useRef } from 'react';
import { MentorChatMessage, StudentProfile, SimulationResult } from '../types';
import { MENTOR_STARTER_PROMPTS } from '../data/constants';
import { MessageSquare, Send, X, Bot, Sparkles, User, Minimize2 } from 'lucide-react';

interface MentorDrawerProps {
  profile: StudentProfile;
  simulation: SimulationResult | null;
  demoMode: boolean;
  presetPrompt?: string | null;
  onClearPresetPrompt?: () => void;
}

export const MentorDrawer: React.FC<MentorDrawerProps> = ({
  profile,
  simulation,
  demoMode,
  presetPrompt,
  onClearPresetPrompt
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MentorChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('career_sim_mentor_chat');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading chat history', e);
    }
    return [
      {
        id: 'm-welcome',
        role: 'model',
        content: `Namaste ${profile.name}! I am your AI Career Mentor. I've analyzed your ${profile.branch} (Year ${profile.yearOfStudy}, CGPA ${profile.cgpa}, ${profile.hoursPerWeek} hrs/wk) profile. Ask me anything about bridging your AI/ML skill gaps or cracking campus placements!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'How to bridge my AI/ML gaps?',
          'Prepare for campus placements?'
        ]
      }
    ];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (presetPrompt) {
      setIsOpen(true);
      handleSendMessage(presetPrompt);
      if (onClearPresetPrompt) onClearPresetPrompt();
    }
  }, [presetPrompt]);

  useEffect(() => {
    try {
      localStorage.setItem('career_sim_mentor_chat', JSON.stringify(messages.slice(-10)));
    } catch (e) {
      console.warn('Error saving chat history', e);
    }
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: MentorChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (demoMode) {
        setTimeout(() => {
          let reply = `Great question regarding ${profile.branch} roadmap! For campus placement drives in your 7th semester, companies test: 1) Core DSA (Striver's SDE sheet arrays, strings, trees), 2) CS Fundamentals (OS, DBMS, CN), and 3) 1 high-quality full-stack or ML project where you can explain database indexing and architectural trade-offs. Spend 8 hrs/week on DSA and 7 hrs/week on your capstone project.`;
          if (query.toLowerCase().includes('ai/ml')) {
            reply = `To bridge your AI/ML gaps while keeping your 8.4 CGPA safe: 1) Complete fast.ai Practical Deep Learning (4 hrs/week), 2) Implement 1 RAG project using ChromaDB & LangChain, and 3) Do not skip DSA in Python—Tier 1 companies like Adobe, Microsoft, and high-paying startups test LeetCode medium questions first before discussing models!`;
          } else if (query.toLowerCase().includes('campus')) {
            reply = `For Indian campus placements: 1) Maintain CGPA above 8.0 for Day-1 dream companies (10-25 LPA), 2) Solve 200+ LeetCode problems (focus on Arrays, Linked Lists, Binary Trees, and DP), 3) Deploy your Campus Placement Portal with real authentication on your resume.`;
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `m-${Date.now()}`,
              role: 'model',
              content: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestedActions: [
                'How to design a scalable resume project?',
                'Which companies offer off-campus internships?'
              ]
            }
          ]);
          setIsLoading(false);
        }, 500);
        return;
      }

      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          simulationSummary: simulation
            ? {
                bestFit: simulation.paths?.[0]?.title || simulation.full_stack?.title || 'Full Stack Developer',
                full_stack_score: simulation.full_stack?.matchScore || 82,
                ai_ml_score: simulation.ai_ml?.matchScore || 74,
                data_science_score: simulation.data_science?.matchScore || 78,
                data_engineering_score: simulation.data_engineering?.matchScore || 70
              }
            : null,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          content: data.reply || 'Focus on consistent problem solving and deploying clean portfolio code.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: data.suggestedActions || []
        }
      ]);
    } catch (err) {
      console.warn('Mentor call failed, using fallback:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          content: `With ${profile.hoursPerWeek} hours available each week, the highest return on investment for Indian campus placements is completing 150-200 LeetCode problems and deploying your placement portal on a live Vercel/Render URL. Keep your CGPA above 8.0 for dream company cutoffs.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* FLOATING FABRIC SPEECH BUBBLE BUTTON (Exactly as in Reference Image) */}
      {!isOpen && (
        <div className="relative group">
          {/* Quick teaser preview card */}
          <div className="absolute bottom-16 right-0 w-72 p-3 rounded-2xl bg-[#1e293b]/95 border-2 border-dashed border-purple-400 text-white shadow-2xl backdrop-blur-md hidden sm:block">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">💬</span>
              <span className="text-xs font-black text-purple-300">AI Career Mentor</span>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => handleSendMessage('How to bridge my AI/ML gaps?')}
                className="w-full text-left p-1.5 text-[11px] rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 hover:bg-purple-900/60 transition-colors truncate block"
              >
                • How to bridge my AI/ML gaps?
              </button>
              <button
                onClick={() => handleSendMessage('Prepare for campus placements?')}
                className="w-full text-left p-1.5 text-[11px] rounded-lg bg-pink-950/60 border border-pink-500/40 text-pink-200 hover:bg-pink-900/60 transition-colors truncate block"
              >
                • Prepare for campus placements?
              </button>
            </div>
          </div>

          {/* Floating Circle Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-600 border-2 border-dashed border-pink-300 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(168,85,247,0.6)] hover:scale-110 active:scale-95 transition-all"
            title="Open AI Career Mentor"
          >
            <MessageSquare className="w-6 h-6 fill-white" />
          </button>
        </div>
      )}

      {/* FLOATING STITCHED CHAT DRAWER */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] max-h-[85vh] bg-[#101b2b] rounded-3xl border-2 border-dashed border-purple-400 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header with Cute Robot Avatar */}
          <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              {/* Cute Stitched Robot Avatar with Glowing Antenna */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
                <div className="absolute -top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-ping"></div>
              </div>

              <div>
                <h3 className="text-xs font-black tracking-wide text-white flex items-center gap-1.5 font-mono">
                  💬 AI Career Mentor
                </h3>
                <p className="text-[10px] text-purple-200 truncate">
                  Targeted for {profile.name} ({profile.branch}, Yr {profile.yearOfStudy})
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/70">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[82%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-purple-600 text-white rounded-tr-none border border-purple-400'
                          : 'bg-[#18273d] border border-dashed border-purple-400/50 text-slate-100 rounded-tl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>

                    <span className="text-[9px] text-slate-400 px-1 block">
                      {msg.timestamp}
                    </span>

                    {/* Follow-up suggestion pills */}
                    {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {msg.suggestedActions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleSendMessage(action)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-dashed border-purple-400 transition-colors text-left"
                          >
                            ↳ {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-300 pl-9">
                <Bot className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Crafting India placement guidance...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* STITCHED PROMPT PILLS (From Reference Image) */}
          <div className="p-3 bg-[#132033] border-t border-purple-500/30 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Quick Inquiries:
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleSendMessage('How to bridge my AI/ML gaps?')}
                className="w-full text-left px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-purple-900/60 hover:from-blue-800/80 hover:to-purple-800/80 border-2 border-dashed border-cyan-400 text-cyan-200 text-xs font-bold transition-all"
              >
                How to bridge my AI/ML gaps?
              </button>
              <button
                onClick={() => handleSendMessage('Prepare for campus placements?')}
                className="w-full text-left px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800/80 hover:to-pink-800/80 border-2 border-dashed border-pink-400 text-pink-200 text-xs font-bold transition-all"
              >
                Prepare for campus placements?
              </button>
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about placement cutoffs, DSA, projects..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
