import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { MentorChat } from './pages/mentor/MentorChat';
import { MyPaths } from './pages/MyPaths';
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard';
import { Profile } from './pages/Profile';
import { ResumeStudio } from './pages/resume/ResumeStudio';
import { SkillTestsHub } from './pages/tests/SkillTestsHub';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<OnboardingWizard />} />

        {/* Protected Authenticated Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/paths" element={<MyPaths />} />
          <Route path="/tests" element={<SkillTestsHub />} />
          <Route path="/resume" element={<ResumeStudio />} />
          <Route path="/mentor" element={<MentorChat />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
