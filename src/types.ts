export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SkillItem {
  name: string;
  level: SkillLevel;
  verified?: boolean;
  score?: number;
  feedback?: string;
}

export interface StudentProject {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface StudentInternship {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export type BranchOption = 'CSE' | 'IT' | 'ECE' | 'EE' | 'ME' | 'Civil' | 'Other';

export interface StudentProfile {
  careerId: string;
  name: string;
  college: string;
  branch: BranchOption;
  yearOfStudy: number; // 1 to 4
  cgpa: number; // 0 to 10
  hoursPerWeek: number; // 1 to 80
  skills: SkillItem[];
  interests: string[];
  tenthPercentage?: number;
  twelfthPercentage?: number;
  diploma?: string;
  certifications: string[];
  projects: StudentProject[];
  internships: StudentInternship[];
  achievements: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type MilestoneStatus = 'achieved' | 'in_progress' | 'remaining';

export interface Milestone {
  id?: string;
  title: string;
  status: MilestoneStatus;
  requiredSkills?: string[];
  requiredChecklistIds?: string[];
}

export interface YearRoadmap {
  year?: string;
  yearLabel?: string;
  academicYear?: number;
  focus?: string;
  theme?: string;
  milestones: Milestone[];
  skillsToLearn: string[];
  projectsToBuild: string[];
}

export interface SkillGap {
  skill: string;
  currentLevel: number; // 0-5
  requiredLevel: number; // 0-5
  priority: 'high' | 'medium' | 'low';
}

export interface RecommendedProject {
  name: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
}

export interface WeeklyPlan {
  week: number;
  title: string;
  goals: string[];
  dailyHours: number;
  deliverable: string;
}

export interface LearningResource {
  title: string;
  url: string;
  type: string;
  isFree: boolean;
}

export type ChecklistStage = 'foundation' | 'build' | 'specialize' | 'job_ready';

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  skill: string;
  levelGained: number; // 1-5
  stage: ChecklistStage;
  checked: boolean;
}

export interface CareerPath {
  id: 'full_stack' | 'ai_ml' | 'data_science' | 'data_engineering';
  pathId?: 'full_stack' | 'ai_ml' | 'data_science' | 'data_engineering';
  slug?: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
  checklistPrefix?: string;
  badge?: string;
  matchScore: number; // 0-100
  baseMatchScore?: number;
  matchReason: string;
  dayInLife: string;
  yearByYear: YearRoadmap[];
  skillGaps: SkillGap[];
  projects: RecommendedProject[];
  firstMonthPlan: WeeklyPlan[];
  resources: LearningResource[];
  checklist: ChecklistItem[];
}

export interface SimulationResult {
  fallback?: boolean;
  generatedFor?: string;
  paths: CareerPath[];
  full_stack?: CareerPath;
  ai_ml?: CareerPath;
  data_science?: CareerPath;
  data_engineering?: CareerPath;
  generatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  skill: string;
  level?: string;
  type?: 'mcq' | 'short_answer';
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
}

export interface SkillScore {
  skill: string;
  score: number;
  previousLevel: string;
  adjustedLevel: SkillLevel;
  verified: boolean;
  feedback: string;
}

export interface MentorChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}
