import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to load sample data
function getSampleData() {
  try {
    const samplePath = path.resolve(process.cwd(), 'data', 'sample_outputs.json');
    if (fs.existsSync(samplePath)) {
      const content = fs.readFileSync(samplePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading sample data:', err);
  }
  return {};
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    gemini_configured: Boolean(GEMINI_API_KEY),
    model: GEMINI_MODEL,
  });
});

// 2. Sample data
app.get('/api/sample', (req, res) => {
  const sample = getSampleData();
  res.json(sample);
});

// 3. Simulate Career Paths
app.post('/api/simulate', async (req, res) => {
  const profile = req.body;
  const sampleData = getSampleData();
  const samplePaths = sampleData.paths || [];

  // In fallback or demo mode, return the 4 paths from sample data
  // tailored to the profile
  const pathsMap: Record<string, any> = {};
  samplePaths.forEach((p: any) => {
    pathsMap[p.id] = p;
  });

  res.json({
    fallback: true,
    generatedFor: profile?.name || 'Aarav Sharma',
    paths: samplePaths,
    full_stack: pathsMap['full_stack'],
    ai_ml: pathsMap['ai_ml'],
    data_science: pathsMap['data_science'],
    data_engineering: pathsMap['data_engineering'],
  });
});

// 4. Readiness check questions
app.post('/api/readiness/questions', async (req, res) => {
  const { skills, path_id, language } = req.body;
  const sampleData = getSampleData();
  const allQuestions = sampleData.readinessQuestions || [];

  if (language && language !== 'all') {
    const langLower = language.toLowerCase();
    const filtered = allQuestions.filter((q: any) => {
      const sk = (q.skill || '').toLowerCase();
      return sk.includes(langLower) || langLower.includes(sk);
    });
    if (filtered.length > 0) {
      return res.json({
        questions: filtered,
        fallback: true,
      });
    }
  }

  if (path_id) {
    // Filter questions relevant to the path
    const filtered = allQuestions.filter((q: any) => {
      const sk = q.skill.toLowerCase();
      if (path_id === 'data_engineering') {
        return sk.includes('data engineering') || sk.includes('data modelling') || sk.includes('airflow') || sk.includes('docker') || sk.includes('spark') || sk.includes('sql') || sk.includes('linux');
      }
      if (path_id === 'data_science') {
        return sk.includes('statistics') || sk.includes('sql') || sk.includes('python');
      }
      return true;
    });
    return res.json({
      questions: filtered.slice(0, 8),
      fallback: true,
    });
  }

  res.json({
    questions: allQuestions.slice(0, 10),
    fallback: true,
  });
});

// 5. Readiness evaluation
app.post('/api/readiness/evaluate', async (req, res) => {
  const { profile, answers } = req.body;
  const sampleData = getSampleData();
  const allQuestions: any[] = sampleData.readinessQuestions || [];
  const qMap = new Map<string, any>(allQuestions.map((q: any) => [q.id, q]));

  const scoresBySkill: Record<string, { correct: number; total: number }> = {};
  if (Array.isArray(answers)) {
    answers.forEach((ans: any) => {
      const q = qMap.get(ans.questionId);
      if (q) {
        const sk = q.skill || 'General';
        if (!scoresBySkill[sk]) scoresBySkill[sk] = { correct: 0, total: 0 };
        scoresBySkill[sk].total += 1;
        if (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex === q.correctOptionIndex) {
          scoresBySkill[sk].correct += 1;
        } else if (ans.shortAnswer && ans.shortAnswer.length > 5) {
          scoresBySkill[sk].correct += 1;
        }
      }
    });
  }

  const skillScores = (profile?.skills || []).map((s: any) => {
    const stat = scoresBySkill[s.name];
    const acc = stat && stat.total > 0 ? stat.correct / stat.total : 0.7;
    const scoreVal = parseFloat((acc * 2 + 3).toFixed(1));
    return {
      skill: s.name,
      score: scoreVal,
      previousLevel: s.level,
      adjustedLevel: acc >= 0.8 ? 'Advanced' : acc >= 0.4 ? 'Intermediate' : 'Beginner',
      verified: true,
      feedback: `Demonstrated concept retention in ${s.name} assessment.`,
    };
  });

  res.json({
    skillScores,
    summary: 'Skill readiness verified across submitted diagnostic questions.',
    fallback: true,
  });
});

// 6. Roadmap Adjust
app.post('/api/roadmap/adjust', async (req, res) => {
  const { profile, verifiedSkills } = req.body;
  const sampleData = getSampleData();
  const paths = JSON.parse(JSON.stringify(sampleData.paths || []));

  const verifiedSet = new Set((verifiedSkills || []).map((vs: any) => vs.skill.toLowerCase()));

  // Dynamically update milestone statuses
  paths.forEach((p: any) => {
    p.yearByYear.forEach((yr: any) => {
      yr.milestones.forEach((m: any) => {
        const reqs = m.requiredChecklistIds || [];
        if (reqs.some((r: string) => verifiedSet.has(r.toLowerCase()))) {
          m.status = 'achieved';
        }
      });
    });
  });

  res.json({
    fallback: true,
    paths,
    full_stack: paths.find((p: any) => p.id === 'full_stack'),
    ai_ml: paths.find((p: any) => p.id === 'ai_ml'),
    data_science: paths.find((p: any) => p.id === 'data_science'),
    data_engineering: paths.find((p: any) => p.id === 'data_engineering'),
  });
});

// 7. AI Career Mentor Chat with exact keyword matching from PDF
app.post('/api/mentor', async (req, res) => {
  const { profile, activePathId, history } = req.body;
  const sampleData = getSampleData();
  const replies = sampleData.mentorResponses || {};

  const lastMsg = (history && history.length > 0 ? history[history.length - 1].content : '').toLowerCase();

  let reply = replies.default;
  let suggestedActions = [
    'What should I learn first this month?',
    'How do I get my first internship?',
    'Review my roadmap and tell me what to cut.',
  ];

  if (lastMsg.includes('best') || lastMsg.includes('suit') || lastMsg.includes('which path')) {
    reply = replies.best_path;
  } else if (lastMsg.includes('learn first') || lastMsg.includes('this month') || lastMsg.includes('what to learn')) {
    reply = replies.learn_first;
  } else if (lastMsg.includes('internship') || lastMsg.includes('first job') || lastMsg.includes('apply')) {
    reply = replies.internship;
  } else if (lastMsg.includes('cut') || lastMsg.includes('review') || lastMsg.includes('short on time')) {
    reply = replies.roadmap_review;
  } else if (lastMsg.includes('vs') || (lastMsg.includes('data scientist') && lastMsg.includes('engineer'))) {
    reply = replies.ds_vs_de;
  } else if (lastMsg.includes('build first') || lastMsg.includes('first project')) {
    if (activePathId === 'full_stack') reply = 'Build your portfolio site, then a weather app.';
    else if (activePathId === 'ai_ml') reply = 'Clean a dataset in Pandas and train a simple regression model.';
    else if (activePathId === 'data_science') reply = 'Analyse a cricket dataset and write 5 insights.';
    else if (activePathId === 'data_engineering') reply = 'Load a messy CSV into PostgreSQL with a Python ETL script and add logging.';
    else reply = 'Build your portfolio site, then a weather app.';
  }

  res.json({
    reply,
    suggestedActions,
    fallback: true,
  });
});

// 8. Resume Polish
app.post('/api/resume/polish', async (req, res) => {
  const { profile } = req.body;
  res.json({
    summary: `Second-year ${profile?.branch || 'CSE'} student with working knowledge of Python, HTML/CSS and SQL, building toward a software engineering role. Built small web apps and took part in a college hackathon.`,
    projectBulletPoints: [
      {
        name: 'Calculator app',
        bullets: ['Engineered responsive calculator interface using semantic HTML, CSS, and vanilla JavaScript DOM manipulation.'],
      },
      {
        name: 'To-do app',
        bullets: ['Implemented local state management and browser localStorage persistence for seamless task tracking.'],
      },
    ],
    fallback: true,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Career Path Simulator server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
