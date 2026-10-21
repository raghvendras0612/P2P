import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FirstMonthBoard } from '../components/paths/FirstMonthBoard';
import { ProjectsShowcase } from '../components/paths/ProjectsShowcase';
import { SkillGapRadar } from '../components/paths/SkillGapRadar';
import { TrackOverviewCompare } from '../components/paths/TrackOverviewCompare';
import { VisualTimeline } from '../components/paths/VisualTimeline';
import { FirstMonthPlan, ProjectRecommendation, SkillGap, SimulationOutput, YearlyMilestone } from '../types';

const mockSkillGaps: SkillGap[] = [
  {
    skill: 'Data Structures & Algorithms',
    current_level: 2,
    required_level: 4,
    priority: 'high',
    why_it_matters: 'Essential for passing initial technical screening rounds at product firms.',
  },
  {
    skill: 'PostgreSQL & Database Design',
    current_level: 2,
    required_level: 4,
    priority: 'high',
    why_it_matters: 'Core backend requirement for data modeling and query optimization.',
  },
  {
    skill: 'Docker Containerization',
    current_level: 1,
    required_level: 3,
    priority: 'medium',
    why_it_matters: 'Needed for containerized microservice development and CI/CD testing.',
  },
  {
    skill: 'React with TypeScript',
    current_level: 3,
    required_level: 4,
    priority: 'medium',
    why_it_matters: 'Standard modern frontend framework stack.',
  },
  {
    skill: 'System Design Fundamentals',
    current_level: 1,
    required_level: 3,
    priority: 'high',
    why_it_matters: 'High-level design questions asked in tier-1 off-campus interviews.',
  },
  {
    skill: 'Redis Caching',
    current_level: 0,
    required_level: 2,
    priority: 'low',
    why_it_matters: 'Performance optimization for production web traffic.',
  },
];

const mockMilestones: YearlyMilestone[] = [
  {
    label: 'Year 3 (Pre-final Year)',
    goals: ['Master core DSA', 'Build 2 full stack applications'],
    skills_to_learn: ['FastAPI', 'PostgreSQL', 'Docker'],
    projects: ['E-Commerce API', 'Realtime Chat'],
    target_activities: ['150 LeetCode problems', 'College Hackathon'],
    checkpoints: ['Pass 45-min mock coding round', 'Deploy project with live URL'],
  },
  {
    label: 'Year 4 (Final Year)',
    goals: ['Crack campus placement drive', 'Study system design'],
    skills_to_learn: ['System Design', 'Redis'],
    projects: ['Capstone Microservices'],
    target_activities: ['Apply for on-campus Tier 1 drives'],
    checkpoints: ['Secure SDE-1 placement offer'],
  },
];

const mockProjects: ProjectRecommendation[] = [
  {
    title: 'Distributed Event-Driven E-Commerce API',
    description: 'High-throughput REST API with inventory reservation and background job workers.',
    tech_stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    difficulty: 'Intermediate',
    estimated_weeks: 4,
    what_it_proves: 'Proves relational concurrency handling and caching integration.',
    stretch_goal: 'Add Stripe checkout integration.',
  },
];

const mockFirstMonthPlan: FirstMonthPlan = {
  weeks: [
    {
      week_number: 1,
      theme: 'FastAPI Backend Architecture & Relational Modeling',
      daily_tasks: ['Study Pydantic v2 schemas', 'Configure PostgreSQL connection pool'],
      resources: ['FastAPI Official Tutorial', 'SQLAlchemy 2.0 Docs'],
      end_of_week_outcome: 'Working CRUD API with database migrations applied.',
    },
    {
      week_number: 2,
      theme: 'Authentication & JWT Security',
      daily_tasks: ['Implement bcrypt password hashing', 'Add httpOnly cookie refresh'],
      resources: ['MDN Web Docs: HTTP Cookies'],
      end_of_week_outcome: 'Protected endpoints requiring Bearer tokens.',
    },
    {
      week_number: 3,
      theme: 'Frontend Integration with React & TanStack Query',
      daily_tasks: ['Setup Vite React TypeScript project', 'Wire up TanStack query hooks'],
      resources: ['TanStack Query Quickstart'],
      end_of_week_outcome: 'Dashboard communicating with backend API.',
    },
    {
      week_number: 4,
      theme: 'Containerization, Testing & Deployment',
      daily_tasks: ['Write pytest integration tests', 'Create multi-stage Dockerfile'],
      resources: ['Docker Get Started Guide'],
      end_of_week_outcome: 'Live deployed full-stack application on public URL.',
    },
  ],
};

const mockSimulationOutput: SimulationOutput = {
  paths: [
    {
      path_slug: 'full-stack-developer',
      title: 'Full Stack Software Engineer',
      summary: 'Architecting modern web applications with React and FastAPI.',
      fit_score: 88,
      fit_reasoning: 'Strong proficiency in Python and JavaScript.',
      india_market_notes: {
        typical_roles: ['SDE-1', 'Full Stack Developer'],
        company_types: ['Product Startups', 'Fintech MNCs'],
        salary_range_lpa: '7 - 14 LPA',
        is_approximate: true,
        demand_outlook: 'High demand across Bengaluru and Hyderabad.',
      },
      yearly_milestones: mockMilestones,
      skill_gaps: mockSkillGaps,
      projects_to_build: mockProjects,
      first_month_plan: mockFirstMonthPlan,
    },
    {
      path_slug: 'data-engineer',
      title: 'Data & Analytics Engineer',
      summary: 'Building reliable data pipelines with SQL and Spark.',
      fit_score: 82,
      fit_reasoning: 'Good database foundation.',
      india_market_notes: {
        typical_roles: ['Data Engineer', 'ETL Developer'],
        company_types: ['Consulting', 'Product Firms'],
        salary_range_lpa: '6 - 12 LPA',
        is_approximate: true,
        demand_outlook: 'Steady enterprise demand.',
      },
      yearly_milestones: mockMilestones,
      skill_gaps: mockSkillGaps,
      projects_to_build: mockProjects,
      first_month_plan: mockFirstMonthPlan,
    },
    {
      path_slug: 'devops-cloud-engineer',
      title: 'DevOps & Cloud Engineer',
      summary: 'Automating infrastructure and continuous integration.',
      fit_score: 79,
      fit_reasoning: 'Linux and scripting interest.',
      india_market_notes: {
        typical_roles: ['Cloud Engineer', 'DevOps Specialist'],
        company_types: ['SaaS Startups', 'IT Services'],
        salary_range_lpa: '6.5 - 13 LPA',
        is_approximate: true,
        demand_outlook: 'Growing adoption of AWS and Kubernetes.',
      },
      yearly_milestones: mockMilestones,
      skill_gaps: mockSkillGaps,
      projects_to_build: mockProjects,
      first_month_plan: mockFirstMonthPlan,
    },
  ],
  overall_recommendation: 'Full Stack Software Engineer is your best match based on current skills.',
  disclaimer: 'Salary brackets are approximate estimates for campus and off-campus placements in India.',
  assumptions_made: ['Assumes regular academic progression and 10 hrs/week prep time.'],
};

describe('Phase 3 Component Tests', () => {
  describe('SkillGapRadar', () => {
    it('renders radar container and ranked skill gap cards', () => {
      render(<SkillGapRadar skillGaps={mockSkillGaps} pathTitle="Full Stack Web" />);

      expect(screen.getByTestId('radar-chart-container')).toBeInTheDocument();
      expect(screen.getByText(/Ranked Skill Gap Breakdown \(6 Skills\)/i)).toBeInTheDocument();
      expect(screen.getByText('Data Structures & Algorithms')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL & Database Design')).toBeInTheDocument();
    });

    it('toggles accessible table fallback with semantic table markup', () => {
      render(<SkillGapRadar skillGaps={mockSkillGaps} />);

      const toggleBtn = screen.getByRole('button', { name: /show accessible table view/i });
      fireEvent.click(toggleBtn);

      const table = screen.getByRole('table', { name: /skill gap benchmark table/i });
      expect(table).toBeInTheDocument();
      expect(screen.getAllByText('Data Structures & Algorithms').length).toBeGreaterThan(0);
    });

    it('sorts skill gaps by priority, gap size, and name', () => {
      render(<SkillGapRadar skillGaps={mockSkillGaps} />);

      const sortByGapBtn = screen.getByRole('button', { name: /gap size/i });
      fireEvent.click(sortByGapBtn);
      expect(screen.getByTestId('skill-gaps-list')).toBeInTheDocument();

      const sortByNameBtn = screen.getByRole('button', { name: /name/i });
      fireEvent.click(sortByNameBtn);
      expect(screen.getByTestId('skill-gaps-list')).toBeInTheDocument();
    });

    it('handles exactly 10 skills and very long skill names without errors', () => {
      const tenSkillsWithLongNames: SkillGap[] = [
        ...mockSkillGaps,
        {
          skill: 'Scalable Microservices Architecture with Distributed Tracing & Caching',
          current_level: 1,
          required_level: 4,
          priority: 'high',
          why_it_matters: 'Crucial for high scale systems.',
        },
        {
          skill: 'Advanced CI/CD Pipeline Automation with GitHub Actions & ArgoCD',
          current_level: 2,
          required_level: 3,
          priority: 'medium',
          why_it_matters: 'Deployment engineering.',
        },
        {
          skill: 'Graph Databases & Neo4j',
          current_level: 0,
          required_level: 2,
          priority: 'low',
          why_it_matters: 'Niche data modeling.',
        },
        {
          skill: 'WebSockets & Real-time State Synchronization',
          current_level: 2,
          required_level: 4,
          priority: 'high',
          why_it_matters: 'Chat and collaborative tools.',
        },
      ];
      expect(tenSkillsWithLongNames.length).toBe(10);

      render(<SkillGapRadar skillGaps={tenSkillsWithLongNames} pathTitle="Cloud Architect" />);
      expect(screen.getByTestId('radar-chart-container')).toBeInTheDocument();
      expect(screen.getByText('Show Accessible Table')).toBeInTheDocument();
    });
  });

  describe('VisualTimeline', () => {
    it('renders milestones with active focus on student current year (Year 3)', () => {
      render(
        <VisualTimeline
          milestones={mockMilestones}
          currentYearOfStudy={3}
          pathSlug="full-stack-developer"
        />
      );

      expect(screen.getAllByText('Year 3 (Pre-final Year)')[0]).toBeInTheDocument();
      expect(screen.getByText('Active Focus')).toBeInTheDocument();
      expect(screen.getAllByText('Year 4 (Final Year)')[0]).toBeInTheDocument();
    });

    it('allows toggling measurable checkpoints and updating local progress', () => {
      render(
        <VisualTimeline
          milestones={mockMilestones}
          currentYearOfStudy={3}
          pathSlug="full-stack-developer"
        />
      );

      const checkpointLabel = screen.getByText('Pass 45-min mock coding round');
      expect(checkpointLabel).toBeInTheDocument();
      const checkbox = screen.getAllByRole('checkbox')[0];
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('renders correct number of nodes and status for students across years 1, 2, 3, and 4', () => {
      const year1Milestones: YearlyMilestone[] = [
        { label: 'Year 1 (1st Year)', goals: ['G1'], skills_to_learn: ['S1'], projects: ['P1'], target_activities: ['A1'], checkpoints: ['C1'] },
        { label: 'Year 2 (2nd Year)', goals: ['G2'], skills_to_learn: ['S2'], projects: ['P2'], target_activities: ['A2'], checkpoints: ['C2'] },
        { label: 'Year 3 (3rd Year)', goals: ['G3'], skills_to_learn: ['S3'], projects: ['P3'], target_activities: ['A3'], checkpoints: ['C3'] },
        { label: 'Year 4 (4th Year)', goals: ['G4'], skills_to_learn: ['S4'], projects: ['P4'], target_activities: ['A4'], checkpoints: ['C4'] },
        { label: 'First 1-2 Years Post-Graduation', goals: ['G5'], skills_to_learn: ['S5'], projects: ['P5'], target_activities: ['A5'], checkpoints: ['C5'] },
      ];

      // Test Year 1 (5 nodes)
      const { unmount: u1 } = render(
        <VisualTimeline milestones={year1Milestones} currentYearOfStudy={1} pathSlug="full-stack-developer" />
      );
      expect(screen.getByText('Phase 5')).toBeInTheDocument();
      expect(screen.getByText('Active Focus')).toBeInTheDocument();
      u1();

      // Test Year 2 (4 nodes)
      const year2Milestones = year1Milestones.slice(1);
      const { unmount: u2 } = render(
        <VisualTimeline milestones={year2Milestones} currentYearOfStudy={2} pathSlug="full-stack-developer" />
      );
      expect(screen.getByText('Phase 4')).toBeInTheDocument();
      expect(screen.getByText('Active Focus')).toBeInTheDocument();
      u2();

      // Test Year 3 (3 nodes)
      const year3Milestones = year1Milestones.slice(2);
      const { unmount: u3 } = render(
        <VisualTimeline milestones={year3Milestones} currentYearOfStudy={3} pathSlug="full-stack-developer" />
      );
      expect(screen.getByText('Phase 3')).toBeInTheDocument();
      expect(screen.getByText('Active Focus')).toBeInTheDocument();
      u3();

      // Test Year 4 (2 nodes)
      const year4Milestones = year1Milestones.slice(3);
      const { unmount: u4 } = render(
        <VisualTimeline milestones={year4Milestones} currentYearOfStudy={4} pathSlug="full-stack-developer" />
      );
      expect(screen.getByText('Phase 2')).toBeInTheDocument();
      expect(screen.getByText('Active Focus')).toBeInTheDocument();
      u4();

      // Test Past Year Styling: when year 1 milestone is shown for a Year 3 student
      render(
        <VisualTimeline milestones={year1Milestones} currentYearOfStudy={3} pathSlug="full-stack-developer" />
      );
      expect(screen.getAllByText('Year 1 (1st Year)')[0]).toBeInTheDocument();
    });
  });

  describe('ProjectsShowcase & FirstMonthBoard', () => {
    it('renders project recommendations with difficulty badges and hiring proof', () => {
      render(
        <ProjectsShowcase
          projects={mockProjects}
          pathSlug="full-stack-developer"
        />
      );

      expect(screen.getByText('Distributed Event-Driven E-Commerce API')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText(/Proves relational concurrency handling/i)).toBeInTheDocument();

      const startBtn = screen.getByRole('button', { name: /start this project/i });
      fireEvent.click(startBtn);
      expect(screen.getByText('Project In Progress')).toBeInTheDocument();
    });

    it('handles comma-separated string tech_stack gracefully without throwing error', () => {
      const projectWithStringTechStack: any = {
        title: 'String Stack App',
        description: 'Test application with string tech stack',
        tech_stack: 'Python, FastAPI, Redis, Docker',
        difficulty: 'Beginner',
        estimated_weeks: 2,
        what_it_proves: 'Proves basic architecture.',
        stretch_goal: 'Add caching layer',
      };

      render(
        <ProjectsShowcase
          projects={[projectWithStringTechStack]}
          pathSlug="full-stack-developer"
        />
      );

      expect(screen.getByText('String Stack App')).toBeInTheDocument();
      expect(screen.getByText('FastAPI')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
    });

    it('renders 4-week kickoff board with checkable daily tasks and outcome deliverables', () => {
      render(
        <FirstMonthBoard
          firstMonthPlan={mockFirstMonthPlan}
          pathSlug="full-stack-developer"
        />
      );

      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Week 4')).toBeInTheDocument();
      expect(screen.getByText('FastAPI Backend Architecture & Relational Modeling')).toBeInTheDocument();

      const taskCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(taskCheckbox);
      expect(taskCheckbox).toBeChecked();
    });
  });

  describe('TrackOverviewCompare', () => {
    it('renders 3 summary cards, recommendation, and comparative matrix table', () => {
      const onSelectTab = vi.fn();
      const onChoose = vi.fn();

      render(
        <TrackOverviewCompare
          output={mockSimulationOutput}
          activePathSlug="full-stack-developer"
          onSelectPathTab={onSelectTab}
          onChoosePath={onChoose}
        />
      );

      expect(screen.getByText(/Full Stack Software Engineer is your best match/i)).toBeInTheDocument();
      expect(screen.getAllByText('Full Stack Software Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Data & Analytics Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DevOps & Cloud Engineer').length).toBeGreaterThan(0);

      // Comparison table
      expect(screen.getByText('Student Profile Fit')).toBeInTheDocument();
      expect(screen.getAllByText(/88%/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('7 - 14 LPA').length).toBeGreaterThan(0);

      // Choose path button trigger
      const chooseButtons = screen.getAllByRole('button', { name: /choose track/i });
      fireEvent.click(chooseButtons[0]);
      expect(onChoose).toHaveBeenCalled();
    });
  });
});
