import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bot,
  Compass,
  FileText,
  LucideIcon,
  ShieldCheck,
} from 'lucide-react';
import { useSelectedPath } from '../context/SelectedPathContext';

interface PlaceholderViewProps {
  icon: LucideIcon;
  phase: string;
  title: string;
  description: string;
  features: string[];
}

const PlaceholderCard: React.FC<PlaceholderViewProps> = ({
  icon: Icon,
  phase,
  title,
  description,
  features,
}) => {
  const { selectedPath } = useSelectedPath();

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200">
          <Icon className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-800">
            {phase}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-3">{title}</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">{description}</p>
        </div>

        {/* Selected Path Personalization Contract Callout */}
        {selectedPath ? (
          <div className="bg-primary-50/50 border border-primary-200 p-3.5 rounded-xl text-xs text-primary-950 max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-left">
              <Compass className="w-4 h-4 text-primary-600 shrink-0" />
              <div>
                <span className="font-bold">Aligned to Active Track: </span>
                <span className="font-semibold text-primary-900">{selectedPath.career_path.name}</span>
              </div>
            </div>
            {selectedPath.simulated_path?.fit_score && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                <Award className="w-3 h-3 text-emerald-600" />
                {selectedPath.simulated_path.fit_score}% Fit
              </span>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 p-3.5 rounded-xl text-xs text-gray-600 max-w-lg mx-auto flex items-center justify-between gap-3">
            <span className="text-left">
              No active track selected. Select one in <strong className="text-gray-900">My Paths</strong> to auto-align this module.
            </span>
            <Link
              to="/paths"
              className="px-2.5 py-1 bg-primary-600 text-white rounded-md text-2xs font-bold hover:bg-primary-700 shrink-0"
            >
              Choose Track &rarr;
            </Link>
          </div>
        )}

        <div className="text-left bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-lg mx-auto space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Planned Deliverables
          </h4>
          <ul className="space-y-2 text-xs text-gray-700">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const MyPathsPlaceholder: React.FC = () => (
  <PlaceholderCard
    icon={Compass}
    phase="Coming in Phase 3"
    title="My Career Paths & Roadmaps"
    description="Compare 3 realistic AI simulations, explore year-by-year milestones, and select your target path."
    features={[
      'Side-by-side comparison of 3 simulated engineering careers',
      'Target track selection that personalizes your entire dashboard',
      'Year-by-year milestone checklist and skill gap analyzer',
      '30-day kickoff action plan with curated open source projects',
    ]}
  />
);

export const SkillTestsPlaceholder: React.FC = () => (
  <PlaceholderCard
    icon={ShieldCheck}
    phase="Coming in Phase 4"
    title="Skill Tests & Diagnostic Challenges"
    description="Verify what you claim to know through timed coding challenges and conceptual diagnostics."
    features={[
      'Diagnostic MCQs and practical coding tests per skill',
      'Instant transition from "Claimed" to "Verified" status',
      'Detailed skill gap breakdown with targeted study guides',
      'Verified score badges that back your resume claims with proof',
    ]}
  />
);

export const ResumePlaceholder: React.FC = () => (
  <PlaceholderCard
    icon={FileText}
    phase="Coming in Phase 4"
    title="Auto-Built ATS Resume Generator"
    description="Export a verified, ATS-optimized single-page PDF resume built directly from your verified skills and projects."
    features={[
      'ATS-tested single-page resume layout optimized for Indian campus drives',
      'Automatic highlights for all verified skills with score proofs',
      'Dynamic project bullets and education percentage tables',
      'One-click PDF download formatted to modern recruiter standards',
    ]}
  />
);

export const MentorPlaceholder: React.FC = () => (
  <PlaceholderCard
    icon={Bot}
    phase="Coming in Phase 5"
    title="AI Placement Mentor Chat"
    description="Your 24/7 personal tech mentor powered by Gemini Pro, context-aware of your selected track."
    features={[
      'Mock technical interviews tailored to your target company drives',
      'Architecture review and coding feedback for your portfolio projects',
      'DSA roadmap guidance and curated placement problem lists',
      'Company-specific interview pattern analysis (TCS, Infosys, Amazon, Startups)',
    ]}
  />
);
