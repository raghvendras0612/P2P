import { StudentProfile } from '../types';

export const PRESET_SKILLS = [
  'Python',
  'JavaScript',
  'HTML/CSS',
  'C++',
  'Java',
  'SQL',
  'Git',
  'React',
  'Node.js',
  'TypeScript',
  'FastAPI',
  'PostgreSQL',
  'MongoDB',
  'DSA',
  'NumPy',
  'Pandas',
  'Matplotlib',
  'Scikit-learn',
  'PyTorch',
  'Docker',
  'Linux',
  'Airflow',
  'Spark',
  'dbt',
  'BigQuery',
  'Kafka',
  'Power BI',
  'Statistics',
  'Excel'
];

export const PRESET_INTERESTS = [
  'Web apps',
  'AI & Machine Learning',
  'Data analysis & BI',
  'Data pipelines & Engineering',
  'Cloud Architecture & DevOps',
  'Competitive Coding (DSA)',
  'High-Growth Startups',
  'System Design & Microservices'
];

export const AARAV_SHARMA_PROFILE: StudentProfile = {
  careerId: 'CSP-1042',
  name: 'Aarav Sharma',
  college: 'Engineering College',
  branch: 'CSE',
  yearOfStudy: 2,
  cgpa: 7.8,
  hoursPerWeek: 10,
  skills: [
    { name: 'Python', level: 'Intermediate' },
    { name: 'HTML/CSS', level: 'Beginner' },
    { name: 'C++', level: 'Beginner' },
    { name: 'SQL', level: 'Beginner' },
    { name: 'Git', level: 'Beginner' }
  ],
  interests: ['Web apps', 'AI & Machine Learning', 'Data analysis & BI'],
  tenthPercentage: 91.0,
  twelfthPercentage: 88.5,
  certifications: [],
  projects: [
    {
      id: 'p-calc',
      name: 'Calculator app',
      description: 'Interactive calculator built with HTML, CSS and JavaScript',
      techStack: ['HTML', 'CSS', 'JavaScript']
    },
    {
      id: 'p-todo',
      name: 'To-do app',
      description: 'Task management application with local state handling',
      techStack: ['HTML', 'CSS', 'JavaScript']
    }
  ],
  internships: [],
  achievements: ['Participated in one college hackathon'],
  createdAt: '2026-10-07T10:00:00Z',
  updatedAt: '2026-10-07T10:00:00Z'
};

export const DEMO_STUDENT_PROFILE = AARAV_SHARMA_PROFILE;

export const MENTOR_STARTER_PROMPTS = [
  'Which of the three paths suits me best?',
  'What should I learn first this month?',
  'How do I get my first internship?',
  'Review my roadmap and tell me what to cut.'
];

export const PATH_SPECIFIC_STARTER_PROMPTS = [
  'What should I build first for this path?',
  'Is this path realistic for my CGPA and hours per week?',
  'How is this path different from the closest other path?',
  'What does a first internship look like for this role?'
];
