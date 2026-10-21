import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { SelectedPathProvider } from '../context/SelectedPathContext';
import { SkillTestsHub } from '../pages/tests/SkillTestsHub';
import { TestRunner } from '../pages/tests/TestRunner';
import { TestScorecardModal } from '../pages/tests/TestScorecardModal';
import {
  ActiveTestSessionRead,
  ClaimedSkillTestEligibility,
  TestResultResponse,
} from '../types';

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
    tests: {
      getEligibility: vi.fn(),
      startTest: vi.fn(),
      saveAnswer: vi.fn().mockResolvedValue({ status: 'saved' }),
      recordTabSwitch: vi.fn().mockResolvedValue({ tab_switch_count: 1 }),
      submitTest: vi.fn(),
      getResults: vi.fn(),
    },
  },
}));

const mockEligibilityData: ClaimedSkillTestEligibility[] = [
  {
    skill_id: 101,
    name: 'Python',
    category: 'Programming Languages',
    self_level: 3,
    status: 'verified',
    verified_level: 3,
    verified_level_name: 'Advanced',
    is_priority_for_selected_path: true,
    active_attempt_id: null,
    can_take_test: true,
    cooldown_remaining_seconds: 0,
    cooldown_ends_at: null,
  },
  {
    skill_id: 102,
    name: 'Docker',
    category: 'DevOps',
    self_level: 2,
    status: 'claimed',
    verified_level: null,
    verified_level_name: null,
    is_priority_for_selected_path: false,
    active_attempt_id: null,
    can_take_test: false,
    cooldown_remaining_seconds: 86400, // 1 day
    cooldown_ends_at: '2026-10-21T21:00:00Z',
  },
  {
    skill_id: 103,
    name: 'FastAPI',
    category: 'Frameworks',
    self_level: 2,
    status: 'claimed',
    verified_level: null,
    verified_level_name: null,
    is_priority_for_selected_path: true,
    active_attempt_id: 55, // Active test in progress
    can_take_test: true,
    cooldown_remaining_seconds: 0,
    cooldown_ends_at: null,
  },
];

const mockActiveSession: ActiveTestSessionRead = {
  attempt_id: 55,
  skill_id: 103,
  skill_name: 'FastAPI',
  total_questions: 2,
  pass_mark_percentage: 60,
  started_at: '2026-10-20T21:00:00Z',
  expires_at: '2026-10-20T21:45:00Z',
  remaining_seconds: 2400,
  tab_switch_count: 0,
  questions: [
    {
      id: 1,
      question_order: 1,
      question_text: 'What is the purpose of Depends in FastAPI?',
      question_type: 'single_choice',
      code_snippet: null,
      code_language: null,
      difficulty: 2,
      subtopic_tag: 'Dependency Injection',
      is_answered: false,
      selected_option_ids: [],
      options: [
        { id: 'A', text: 'To declare dependency injection' },
        { id: 'B', text: 'To encrypt request passwords' },
        { id: 'C', text: 'To run database migrations' },
        { id: 'D', text: 'To compile Cython code' },
      ],
    },
    {
      id: 2,
      question_order: 2,
      question_text: 'Which decorators create GET and POST routes in FastAPI?',
      question_type: 'multiple_choice',
      code_snippet: '@app.get("/items")\ndef read_items(): pass',
      code_language: 'python',
      difficulty: 3,
      subtopic_tag: 'Routing',
      is_answered: false,
      selected_option_ids: [],
      options: [
        { id: 'A', text: '@app.get()' },
        { id: 'B', text: '@app.post()' },
        { id: 'C', text: '@app.route_all()' },
        { id: 'D', text: '@app.handler()' },
      ],
    },
  ],
};

const mockScorecardResult: TestResultResponse = {
  attempt_id: 55,
  skill_id: 103,
  skill_name: 'FastAPI',
  status: 'completed',
  score_percentage: 80.0,
  total_points: 3.5,
  earned_points: 2.8,
  passed: true,
  verified_level: 3,
  verified_level_name: 'Advanced',
  pass_mark: 60.0,
  accuracy_by_difficulty: { 'Difficulty 2': 100.0, 'Difficulty 3': 75.0 },
  accuracy_by_subtopic: { 'Dependency Injection': 100.0, Routing: 75.0 },
  strengths: ['Dependency Injection', 'Routing'],
  weaknesses: [],
  recommendations: ['Congratulations! Verified at Advanced level.'],
  tab_switch_count: 0,
  questions_review: [
    {
      question_id: 1,
      question_order: 1,
      question_text: 'What is the purpose of Depends in FastAPI?',
      question_type: 'single_choice',
      options: [
        { id: 'A', text: 'To declare dependency injection' },
        { id: 'B', text: 'To encrypt request passwords' },
      ],
      user_selected: ['A'],
      correct_answers: ['A'],
      is_correct: true,
      points_earned: 1.5,
      points_possible: 1.5,
      explanation: 'Depends declares hierarchical dependency injection in route operations.',
      subtopic_tag: 'Dependency Injection',
    },
  ],
};

const renderSkillTestsHub = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SelectedPathProvider>
          <SkillTestsHub />
        </SelectedPathProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Phase 4: Skill Tests Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.tests.getEligibility).mockResolvedValue(mockEligibilityData);
  });

  it('renders claimed skills with verification badges and cooldown indicators', async () => {
    renderSkillTestsHub();

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText('FastAPI')).toBeInTheDocument();
    });

    // Check Python is verified
    expect(screen.getByText('Lvl 3 Verified')).toBeInTheDocument();

    // Check Docker has cooldown active
    expect(screen.getByText('1d cooldown')).toBeInTheDocument();

    // Check active test alert banner for FastAPI
    expect(
      screen.getByText(/You have an in-progress test for FastAPI!/i)
    ).toBeInTheDocument();
  });

  it('launches TestRunner when Resume Assessment is clicked', async () => {
    vi.mocked(api.tests.startTest).mockResolvedValue(mockActiveSession);

    renderSkillTestsHub();

    await waitFor(() => {
      expect(screen.getByText('Resume Assessment')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Resume Assessment'));

    await waitFor(() => {
      expect(
        screen.getByText('What is the purpose of Depends in FastAPI?')
      ).toBeInTheDocument();
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('To declare dependency injection')).toBeInTheDocument();
    });
  });
});

describe('Phase 4: TestRunner & Anti-Leakage', () => {
  it('renders question content without leaking correct answers or explanations', () => {
    const onFinish = vi.fn();
    const onCancel = vi.fn();

    render(
      <TestRunner session={mockActiveSession} onFinish={onFinish} onCancel={onCancel} />
    );

    // Question and options must be visible
    expect(
      screen.getByText('What is the purpose of Depends in FastAPI?')
    ).toBeInTheDocument();
    expect(screen.getByText('To declare dependency injection')).toBeInTheDocument();

    // Zero correct answers or explanations leaked
    expect(
      screen.queryByText(/Depends declares hierarchical dependency injection/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Correct Answer/i)).not.toBeInTheDocument();
  });

  it('records option selections and triggers autosave', async () => {
    const onFinish = vi.fn();
    const onCancel = vi.fn();

    render(
      <TestRunner session={mockActiveSession} onFinish={onFinish} onCancel={onCancel} />
    );

    const optionA = screen.getByText('To declare dependency injection');
    fireEvent.click(optionA);

    await waitFor(() => {
      expect(api.tests.saveAnswer).toHaveBeenCalledWith(55, {
        question_id: 1,
        selected_option_ids: ['A'],
      });
    });
  });
});

describe('Phase 4: TestScorecardModal', () => {
  it('displays scorecard with score, level badge, and full explanations', () => {
    const onClose = vi.fn();

    render(
      <BrowserRouter>
        <TestScorecardModal
          attemptId={55}
          initialResult={mockScorecardResult}
          onClose={onClose}
        />
      </BrowserRouter>
    );

    // Score and badge
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Pass (>= 60%)')).toBeInTheDocument();
    expect(screen.getByText('Level 3: Advanced')).toBeInTheDocument();

    // Question review details
    expect(
      screen.getByText('Detailed Question Review (1 Questions)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('What is the purpose of Depends in FastAPI?')
    ).toBeInTheDocument();
  });
});
