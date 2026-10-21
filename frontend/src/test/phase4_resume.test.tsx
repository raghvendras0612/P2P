import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { SelectedPathProvider } from '../context/SelectedPathContext';
import { ResumeStudio } from '../pages/resume/ResumeStudio';
import { ResumePreviewData } from '../types';

vi.mock('../api/client', () => ({
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn().mockReturnValue('mock-token'),
  api: {
    auth: {
      me: vi.fn().mockResolvedValue({
        user: { id: 1, email: 'student@example.com' },
        profile: {
          full_name: 'Aditya Sharma',
          college: 'IIT Madras',
          branch: 'Computer Science',
          year_of_study: 3,
          cgpa: 8.9,
        },
        selected_path: null,
      }),
      refresh: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
    },
    profile: {
      getSelectedPath: vi.fn().mockResolvedValue({ selected_path: null }),
    },
    resume: {
      get: vi.fn(),
      updateSettings: vi.fn(),
      tailor: vi.fn(),
      downloadPdf: vi.fn(),
      downloadMarkdown: vi.fn(),
      downloadJson: vi.fn(),
    },
  },
}));

const mockResumeData: ResumePreviewData = {
  user_id: 1,
  full_name: 'Aditya Sharma',
  email: 'aditya@example.com',
  phone: '+91 9876543210',
  city: 'Chennai',
  state: 'Tamil Nadu',
  college: 'IIT Madras',
  branch: 'Computer Science',
  year_of_study: 3,
  expected_graduation_year: 2026,
  cgpa: 8.9,
  linkedin_url: 'https://linkedin.com/in/aditya',
  github_url: 'https://github.com/aditya',
  portfolio_url: null,
  target_role_title: 'Full Stack Engineer',
  summary:
    'Dedicated Computer Science undergraduate with proven experience building distributed backend APIs and frontend React architectures.',
  verified_skills: [
    {
      name: 'Python',
      category: 'Languages',
      verified_level: 3,
      verified_level_name: 'Advanced',
    },
    {
      name: 'FastAPI',
      category: 'Frameworks',
      verified_level: 2,
      verified_level_name: 'Intermediate',
    },
  ],
  unverified_skills: [{ name: 'Docker', category: 'DevOps', self_level: 2 }],
  projects: [
    {
      title: 'Distributed Task Queue',
      description: 'Built an asynchronous task queue with Redis and FastAPI.',
      tech_stack: 'Python, FastAPI, Redis',
      link: 'https://github.com/aditya/queue',
      start_date: null,
      end_date: null,
    },
  ],
  experiences: [],
  education: [
    {
      level: 'Undergraduate',
      institution_name: 'IIT Madras',
      board_or_university: 'IITM',
      passing_year: 2026,
      percentage: 89.0,
    },
  ],
  selected_template: 'minimal_ats',
  include_unverified_skills: true,
  strength_score: 85,
  strength_checklist: [
    {
      item: 'At least 2 verified skills',
      passed: true,
      tip: '',
    },
    {
      item: 'Project with repository link',
      passed: true,
      tip: '',
    },
    {
      item: 'Target role identified',
      passed: true,
      tip: '',
    },
  ],
};

const renderResumeStudio = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SelectedPathProvider>
          <ResumeStudio />
        </SelectedPathProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Phase 4: Resume Studio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.resume.get).mockResolvedValue(mockResumeData);
    vi.mocked(api.resume.updateSettings).mockImplementation(async (settings) => ({
      ...mockResumeData,
      selected_template: settings.template_name || mockResumeData.selected_template,
      include_unverified_skills:
        settings.include_unverified_skills !== undefined
          ? settings.include_unverified_skills
          : mockResumeData.include_unverified_skills,
    }));
  });

  it('renders candidate profile, verified skills, and strength score', async () => {
    renderResumeStudio();

    await waitFor(() => {
      expect(screen.getByText('Aditya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument();
    });

    // Strength score
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('At least 2 verified skills')).toBeInTheDocument();

    // Verified skills in preview
    expect(screen.getByText(/Python \[Verified - Advanced\]/i)).toBeInTheDocument();
  });

  it('allows switching ATS templates', async () => {
    renderResumeStudio();

    await waitFor(() => {
      expect(screen.getByText('Classic Single')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Classic Single'));

    await waitFor(() => {
      expect(api.resume.updateSettings).toHaveBeenCalledWith({
        template_name: 'classic_single',
      });
    });
  });

  it('triggers AI tailoring for selected track', async () => {
    vi.mocked(api.resume.tailor).mockResolvedValue({
      tailored_summary: 'Tailored summary for Cloud Architect.',
      target_role_title: 'Cloud Architect',
    });

    renderResumeStudio();

    await waitFor(() => {
      expect(screen.getByText(/Tailor for Engineering Roles/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Tailor for Engineering Roles/i));

    await waitFor(() => {
      expect(api.resume.tailor).toHaveBeenCalled();
      expect(
        screen.getByText(/Tailored summary generated/i)
      ).toBeInTheDocument();
    });
  });

  it('calls downloadPdf when PDF download button is clicked', async () => {
    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    vi.mocked(api.resume.downloadPdf).mockResolvedValue(mockBlob);

    // Mock createObjectURL and revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-pdf');
    window.URL.revokeObjectURL = vi.fn();

    renderResumeStudio();

    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download PDF'));

    await waitFor(() => {
      expect(api.resume.downloadPdf).toHaveBeenCalled();
    });
  });
});
