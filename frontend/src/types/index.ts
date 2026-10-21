export type SelfSkillLevel = 1 | 2 | 3; // 1: Beginner, 2: Intermediate, 3: Advanced

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface StudentProfile {
  id?: number;
  user_id?: number;
  full_name: string;
  phone: string;
  college: string;
  branch: string;
  year_of_study: number;
  expected_graduation_year: number;
  cgpa: number;
  city: string;
  state: string;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  career_goal_text?: string | null;
  preferred_work_style?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EducationEntry {
  id?: number;
  user_id?: number;
  level: string; // "10th" | "12th" | "Diploma" | "Undergraduate"
  institution_name: string;
  board_or_university: string;
  passing_year: number;
  percentage: number;
  created_at?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  aliases?: string | null;
  is_verified_seed: boolean;
}

export interface UserSkill {
  id?: number;
  skill_id?: number;
  custom_skill_name?: string;
  skill_name: string;
  category: string;
  self_level: SelfSkillLevel;
  status: 'claimed' | 'verified' | 'failed';
  verified_level?: number | null;
  last_tested_at?: string | null;
}

export interface Interest {
  id: number;
  name: string;
  group: string;
}

export interface CareerPath {
  id: number;
  slug: string;
  name: string;
  description: string;
}

export interface Project {
  id?: number;
  user_id?: number;
  title: string;
  description: string;
  tech_stack: string;
  link?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface Experience {
  id?: number;
  user_id?: number;
  type: 'internship' | 'hackathon' | 'certification' | 'achievement';
  title: string;
  organization?: string | null;
  description?: string | null;
  date_or_duration?: string | null;
  link?: string | null;
  created_at?: string;
}

export interface FullProfile {
  user_id: number;
  email: string;
  profile: StudentProfile | null;
  education: EducationEntry[];
  skills: UserSkill[];
  interests: Interest[];
  projects: Project[];
  experiences: Experience[];
  selected_path: CareerPath | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OnboardingDraft {
  step: number;
  account: {
    email: string;
    password: string;
    confirmPassword?: string;
  };
  basics: {
    full_name: string;
    phone: string;
    college: string;
    branch: string;
    year_of_study: number;
    expected_graduation_year: number;
    cgpa: number;
    city: string;
    state: string;
  };
  education: EducationEntry[];
  skills: {
    skill_id?: number;
    custom_skill_name?: string;
    category?: string;
    self_level: SelfSkillLevel;
    skill_name: string;
  }[];
  interest_ids: number[];
  projects: Project[];
  experiences: Experience[];
  links: {
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
    career_goal_text: string;
    preferred_work_style: string;
  };
}

// ============================================================================
// Phase 2 & 3 Simulation & Path Selection Types
// ============================================================================

export interface IndiaMarketNotes {
  typical_roles: string[];
  company_types: string[];
  salary_range_lpa: string;
  is_approximate: boolean;
  demand_outlook: string;
}

export interface YearlyMilestone {
  label: string;
  goals: string[];
  skills_to_learn: string[];
  projects: string[];
  target_activities: string[];
  checkpoints: string[];
  // Backwards compatibility aliases
  academic_year?: string;
  focus_goals?: string[];
  skills_to_acquire?: string[];
  recommended_projects?: string[];
  internships_or_hackathons?: string[];
}

export interface SkillGap {
  skill: string;
  current_level: number; // 0 to 5
  required_level: number; // 0 to 5
  priority: 'high' | 'medium' | 'low';
  why_it_matters: string;
}

export interface ProjectRecommendation {
  title: string;
  description: string;
  tech_stack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_weeks: number;
  what_it_proves: string;
  stretch_goal?: string | null;
}

export interface WeekPlan {
  week_number: number;
  theme: string;
  daily_tasks: string[];
  resources: string[];
  end_of_week_outcome: string;
  // Backwards compatibility aliases
  weekly_theme?: string;
  daily_or_weekly_tasks?: string[];
  free_learning_resources?: string[];
  deliverable_outcome?: string;
}

export interface FirstMonthPlan {
  weeks: WeekPlan[];
}

export interface ResourceRecommendation {
  name: string;
  type: string;
  cost: string;
  description: string;
}

export interface SimulatedPath {
  path_slug: string;
  title: string;
  summary: string;
  fit_score: number; // 0-100
  fit_reasoning: string;
  india_market_notes: IndiaMarketNotes;
  yearly_milestones: YearlyMilestone[];
  skill_gaps: SkillGap[];
  projects_to_build: ProjectRecommendation[];
  first_month_plan: FirstMonthPlan;
  resources?: ResourceRecommendation[];
  risks_and_tradeoffs?: string[];
}

export interface SimulationOutput {
  paths: SimulatedPath[];
  overall_recommendation: string;
  disclaimer?: string;
  disclaimers?: string[];
  assumptions_made: string[];
}

export interface SimulationComparisonSummary {
  baseline_simulation_id: number;
  fit_score_changes: Record<string, number>;
  closed_skill_gaps: string[];
  newly_opened_gaps: string[];
  notes: string;
}

export interface SimulationDetail {
  id: number;
  user_id: number;
  mode: string;
  selected_paths?: string[] | null;
  prompt_version: string;
  model_name: string;
  input_snapshot: Record<string, any>;
  output: SimulationOutput;
  created_at: string;
  comparison?: SimulationComparisonSummary | null;
}

export interface SelectedPathDetail {
  id: number;
  user_id: number;
  career_path: CareerPath;
  simulation_id?: number | null;
  selected_at: string;
  is_active: boolean;
  simulated_path?: SimulatedPath | null;
}

export interface SelectedPathResponse {
  selected_path: SelectedPathDetail | null;
}

// ==========================================
// Phase 4: Skill Tests & Assessment Schemas
// ==========================================

export interface ClaimedSkillTestEligibility {
  skill_id: number;
  name: string;
  category: string;
  self_level: number;
  status: 'claimed' | 'verified' | 'failed';
  verified_level?: number | null;
  verified_level_name?: string | null;
  is_priority_for_selected_path: boolean;
  active_attempt_id?: number | null;
  can_take_test: boolean;
  cooldown_remaining_seconds: number;
  cooldown_ends_at?: string | null;
}

export interface ClientQuestionOption {
  id: string;
  text: string;
}

export interface ClientTestQuestion {
  id: number;
  question_order: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'code_snippet_output';
  options: ClientQuestionOption[];
  code_snippet?: string | null;
  code_language?: string | null;
  difficulty: number;
  subtopic_tag: string;
  is_answered: boolean;
  selected_option_ids: string[];
}

export interface ActiveTestSessionRead {
  attempt_id: number;
  skill_id: number;
  skill_name: string;
  total_questions: number;
  pass_mark_percentage: number;
  started_at: string;
  expires_at: string;
  remaining_seconds: number;
  questions: ClientTestQuestion[];
  tab_switch_count: number;
}

export interface QuestionReviewDetail {
  question_id: number;
  question_order: number;
  question_text: string;
  question_type: string;
  code_snippet?: string | null;
  code_language?: string | null;
  options: ClientQuestionOption[];
  user_selected: string[];
  correct_answers: string[];
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  explanation: string;
  subtopic_tag: string;
}

export interface TestResultResponse {
  attempt_id: number;
  skill_id: number;
  skill_name: string;
  status: string;
  score_percentage: number;
  total_points: number;
  earned_points: number;
  passed: boolean;
  verified_level?: number | null;
  verified_level_name?: string | null;
  pass_mark: number;
  accuracy_by_difficulty: Record<string, number>;
  accuracy_by_subtopic: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  tab_switch_count: number;
  questions_review?: QuestionReviewDetail[];
}

// ==========================================
// Phase 4: Resume Builder Schemas
// ==========================================

export interface ResumeSkillItem {
  name: string;
  category: string;
  verified_level?: number | null;
  verified_level_name?: string | null;
  self_level?: number | null;
}

export interface ResumeChecklistItem {
  item: string;
  passed: boolean;
  tip: string;
}

export interface ResumePreviewData {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  college: string;
  branch: string;
  year_of_study: number;
  expected_graduation_year: number;
  cgpa: number;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  target_role_title?: string | null;
  summary: string;
  verified_skills: ResumeSkillItem[];
  unverified_skills: ResumeSkillItem[];
  projects: {
    title: string;
    description: string;
    tech_stack: string;
    link?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }[];
  experiences: {
    type: string;
    title: string;
    organization?: string | null;
    description?: string | null;
    date_or_duration?: string | null;
    link?: string | null;
  }[];
  education: {
    level: string;
    institution_name: string;
    board_or_university: string;
    passing_year: number;
    percentage: number;
  }[];
  selected_template: 'minimal_ats' | 'classic_single' | 'modern_compact';
  include_unverified_skills: boolean;
  strength_score: number;
  strength_checklist: ResumeChecklistItem[];
}

export interface ResumeSettingsUpdate {
  template_name?: 'minimal_ats' | 'classic_single' | 'modern_compact';
  include_unverified_skills?: boolean;
  custom_summary?: string;
  target_career_slug?: string;
}

// ==========================================
// Phase 4: Progress Tracking Schemas
// ==========================================

export interface NextBestAction {
  title: string;
  action_type: 'skill_test' | 'milestone_checkpoint' | 'project' | 'resume' | 'simulation';
  link: string;
  description: string;
}

export interface MilestoneProgressSummary {
  total_checkpoints: number;
  completed_checkpoints: number;
  percent_complete: number;
}

export interface ProjectProgressItem {
  project_title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  repo_url?: string | null;
  notes?: string | null;
  completed_at?: string | null;
}

export interface SkillGrowthDataPoint {
  skill_name: string;
  verified_level: number;
  verified_level_name: string;
  score_achieved?: number | null;
  date: string;
}

export interface ProgressDashboardResponse {
  career_path_slug?: string | null;
  career_path_name?: string | null;
  milestone_progress: MilestoneProgressSummary;
  overall_roadmap_percent: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date?: string | null;
  completed_items_map: Record<string, boolean>;
  projects_progress: ProjectProgressItem[];
  next_best_action?: NextBestAction | null;
}

export interface ProgressToggleRequest {
  career_path_slug: string;
  item_type: 'milestone_checkpoint' | 'first_month_task';
  item_ref: string;
  status: 'not_started' | 'completed';
}

export interface ProjectProgressUpdateRequest {
  career_path_slug: string;
  project_title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  repo_url?: string | null;
  notes?: string | null;
}

export interface ProposedAction {
  type: 'add_task' | 'add_project';
  title: string;
  description?: string | null;
}

export interface ChatThread {
  id: number;
  user_id: number;
  title: string;
  career_path_id?: number | null;
  career_path_name?: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string | null;
}

export interface ChatMessage {
  id: number;
  thread_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposed_actions?: ProposedAction[] | null;
  created_at: string;
}

export interface CreateThreadRequest {
  title?: string;
  career_path_id?: number | null;
}

export interface ConfirmActionRequest {
  type: 'add_task' | 'add_project';
  title: string;
  description?: string | null;
  career_path_slug?: string | null;
}



