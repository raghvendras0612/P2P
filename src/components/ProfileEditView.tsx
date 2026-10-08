import React from 'react';
import { StudentProfile } from '../types';
import { OnboardingWizard } from './OnboardingWizard';

interface ProfileEditViewProps {
  profile: StudentProfile;
  onUpdate: (updated: StudentProfile) => void;
}

export const ProfileEditView: React.FC<ProfileEditViewProps> = ({ profile, onUpdate }) => {
  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 mb-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Edit Career ID Profile ({profile.careerId})
        </h2>
        <p className="text-xs text-slate-500">
          Updating your skills, CGPA, or hours/week will dynamically recalculate your simulation roadmaps.
        </p>
      </div>
      <OnboardingWizard initialProfile={profile} onComplete={onUpdate} />
    </div>
  );
};
