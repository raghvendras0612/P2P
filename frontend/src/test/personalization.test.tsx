import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { SelectedPathProvider } from '../context/SelectedPathContext';
import { Dashboard } from '../pages/Dashboard';

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
      setSelectedPath: vi.fn(),
      clearSelectedPath: vi.fn(),
    },
    simulations: {
      getHistory: vi.fn().mockResolvedValue([]),
    },
    progress: {
      getDashboard: vi.fn().mockResolvedValue({
        current_streak_days: 2,
        longest_streak_days: 5,
        overall_roadmap_percent: 25,
        completed_items_map: {},
        projects_progress: [],
        milestone_progress: {
          total_checkpoints: 4,
          completed_checkpoints: 1,
          percent_complete: 25,
        },
      }),
      toggleItem: vi.fn().mockResolvedValue({ message: 'OK' }),
      updateProject: vi.fn().mockResolvedValue({ message: 'OK' }),
    },
  },
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SelectedPathProvider>
          <Dashboard />
        </SelectedPathProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Personalization', () => {
  it('prompts the student to simulate when no career path is selected', async () => {
    vi.mocked(api.profile.getSelectedPath).mockResolvedValueOnce({ selected_path: null });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('no-path-prompt')).toBeInTheDocument();
    });

    expect(screen.getByText('No Career Track Selected Yet')).toBeInTheDocument();
    expect(screen.getByText(/Simulate & Choose Career Path/i)).toBeInTheDocument();
  });

  it('adapts the dashboard when an active career track is chosen', async () => {
    vi.mocked(api.profile.getSelectedPath).mockResolvedValueOnce({
      selected_path: {
        id: 1,
        user_id: 1,
        career_path: {
          id: 1,
          slug: 'full-stack-developer',
          name: 'Full Stack Software Engineer',
          description: 'Web development with React and FastAPI',
        },
        selected_at: new Date().toISOString(),
        is_active: true,
        simulated_path: {
          path_slug: 'full-stack-developer',
          title: 'Full Stack Software Engineer',
          summary: 'Web development with React and FastAPI',
          fit_score: 91,
          fit_reasoning: 'Matches full stack profile',
          india_market_notes: {
            typical_roles: ['SDE-1'],
            company_types: ['Product Startups'],
            salary_range_lpa: '8 - 16 LPA',
            is_approximate: true,
            demand_outlook: 'Strong tech hub hiring',
          },
          yearly_milestones: [
            {
              label: 'Year 3 (Pre-final Year)',
              goals: ['Build distributed web microservices', 'DSA placement prep'],
              skills_to_learn: ['FastAPI', 'PostgreSQL'],
              projects: ['E-Commerce Backend'],
              target_activities: ['Hackathons'],
              checkpoints: ['Pass mock tech interviews'],
            },
          ],
          skill_gaps: [
            {
              skill: 'System Design',
              current_level: 1,
              required_level: 4,
              priority: 'high',
              why_it_matters: 'Required for product tier-1 interviews',
            },
          ],
          projects_to_build: [
            {
              title: 'Distributed Event-Driven API',
              description: 'FastAPI microservices with Redis queues',
              tech_stack: ['FastAPI', 'Redis'],
              difficulty: 'Intermediate',
              estimated_weeks: 3,
              what_it_proves: 'Concurrency handling',
            },
          ],
          first_month_plan: {
            weeks: [],
          },
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('active-path-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('Full Stack Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('91% Fit Match')).toBeInTheDocument();
    expect(screen.getByText('8 - 16 LPA')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
    expect(screen.getByText('Distributed Event-Driven API')).toBeInTheDocument();
  });
});
