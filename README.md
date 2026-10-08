# Career Path Simulator: Three Futures, One Student

> **AI-Powered Career Architecture for Indian Engineering Students**  
> Simulate three high-impact trajectories side by side: **Full Stack Developer**, **AI/ML Engineer**, and **Data Scientist**.

---

## 1. Problem Statement
Every year, over 1.5 million engineering students in India face overwhelming uncertainty regarding career choices, campus placement benchmarks, and domain specializations. Students from Tier-1, Tier-2, and Tier-3 engineering colleges frequently struggle with:
- **Misaligned Placement Prep:** Unclear cutoffs for Day-1 dream companies (CGPA, DSA volume, system design).
- **Branch-to-Tech Friction:** Non-circuit branch students (Mechanical, Civil, Chemical) unsure how to bridge skill gaps for product roles.
- **Generic Roadmaps:** Endless online course recommendations with zero personalization for available weekly study hours.
- **Unverified Skill Confidence:** Self-rated skills on resumes that fail live technical interviews.

**Career Path Simulator** solves this by generating three personalized, side-by-side career simulations based on a student's unique academic standing, verified competencies, and available weekly time.

---

## 2. Core Features

### 🧭 Multi-Step Onboarding Wizard ("Create Your Career ID")
- **Step 1: Basics & Academics:** Full name, college, engineering branch (`CSE`, `IT`, `ECE`, `EE`, `ME`, `Civil`, `Other`), year of study (1 to 4), CGPA (with placement eligibility benchmarks), and available hours per week.
- **Step 2: Technical Skills & Ratings:** Interactive chip picker with 25+ curated preset skills, custom skill additions, and self-ratings (`Beginner`, `Intermediate`, `Advanced`).
- **Step 3: Career Interests:** Multi-select domains including Generative AI, Full Stack, Microservices, and Competitive Coding.
- **Step 4: Background & Proof:** 10th/12th percentages, diploma, certifications, built projects, internships, and hackathon achievements.
- **Career ID Generation:** Auto-generates a unique `CSP-XXXX` identifier and persists state in browser `localStorage`.
- **1-Click Demo Profile:** Instant pre-fill with **Deepak Kumar (3rd Year CSE, 8.4 CGPA, 15 hrs/wk)** for rapid evaluation.

### 🔮 Three Simulated Futures (Core Engine)
- **Side-by-Side Comparison:** Evaluates **Full Stack Web Developer**, **AI/ML Engineer**, and **Data Scientist**.
- **Circular Match-Score Gauge:** Animated circular fit score (0-100%) with domain-specific rationale.
- **Day-in-the-Life Narrative:** 4 to 6 sentence breakdown of daily engineering work in Indian tech hubs (Bangalore, Hyderabad, Pune, NCR).
- **Year-by-Year Roadmaps:** Timeline from current year through graduation with status indicators:
  - 🟢 **Achieved:** Milestones covered by existing skills and past projects.
  - 🟡 **In Progress:** Partially mastered competencies.
  - ⚪ **Remaining:** Future graduation targets.
- **Skill Gap Radar & Benchmarks:** Quantitative gap comparison (Level 0-5) against placement hiring standards.
- **Cap-stone Projects:** 3 tailored proof-of-work project suggestions with tech stack, difficulty, and estimated hours.
- **First 30 Days Action Plan:** 4-week structured sprint calibrated strictly to the student's available weekly hours.
- **Stable Free Resources:** Direct links to roadmap.sh, freeCodeCamp, CS50, Kaggle Learn, NPTEL, and fast.ai.

### 🛡️ Diagnostic Skill Readiness Assessment
- Generates 6 targeted technical interview questions graded to the student's self-rated proficiency.
- Immediate scoring (0.0 to 5.0) with concept explanations.
- Grants a verified badge on tested skills and dynamically updates roadmap milestones into **Achieved** status.

### 🤖 AI Career Mentor (Floating Assistant)
- Always-accessible drawer with conversational guidance tailored to Indian placement realities.
- 4 starter prompts covering DSA time allocation, placement cutoffs, and project selection.
- Stores the last 10 messages in `localStorage`.

### 📄 Live ATS Resume Builder & PDF Export
- Auto-compiles student profile, verified badges, and projects into a clean single-page format.
- Two layout templates: **Modern Tech ATS** and **Classic Ivy Engineering**.
- **AI Polish:** Rewrites the professional summary and generates impact-driven project bullet points.
- **One-Click PDF:** Print-optimized stylesheet (`window.print()`) that renders a crisp ATS resume.

### ⚡ Demo Mode & Fallback Resilience
- Offline-ready toggle in the navigation header.
- Zero-crash fallback against API rate limits or network issues using `/data/sample_outputs.json`.

---

## 3. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Onboarding Wizard  |   | Simulation Cards (3x) |   | ATS Resume & PDF Print |  |
|  |  (Career ID: CSP)  |   |  Roadmap / Skill Gaps |   | Modern / Classic View  |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
|            |                         |                            |               |
|            +-------------------------+----------------------------+               |
|                                      |                                            |
|                   Browser localStorage Persistence                                |
|        (career_sim_profile, career_sim_simulation, career_sim_mentor_chat)       |
+--------------------------------------|--------------------------------------------+
                                       | HTTP JSON REST
                                       v
+-----------------------------------------------------------------------------------+
|                             BACKEND API LAYER                                     |
|                                                                                   |
|    Node.js Express (AI Studio Dev / Port 3000) OR Python FastAPI (Vercel Prod)     |
|                                                                                   |
|    Endpoints:                                                                     |
|    • GET  /api/health            • GET  /api/sample                               |
|    • POST /api/simulate          • POST /api/readiness/questions                  |
|    • POST /api/readiness/evaluate• POST /api/roadmap/adjust                       |
|    • POST /api/mentor            • POST /api/resume/polish                        |
+--------------------------------------|--------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   | (Live Mode)                           | (Offline / Timeout / Error)
                   v                                       v
+------------------------------------+   +------------------------------------+
|          Google Gemini API         |   |      Hardcoded Resilient Store     |
|        (gemini-3.8-flash)          |   |     (/data/sample_outputs.json)    |
|   • 25s Timeout + 1 Auto-Retry     |   |                                    |
|   • Structured JSON Response       |   | • Guaranteed Zero-Downtime Demo    |
+------------------------------------+   +------------------------------------+
```

---

## 4. Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion, Chart.js via CDN.
- **Full-Stack Runtime:** Express with Vite middleware in development (`server.ts`).
- **Python FastAPI API:** Ready for Vercel Serverless Function deployment (`/api/index.py`, `/api/schemas.py`, `/api/prompts.py`, `/api/gemini_client.py`).
- **AI Model:** Google Gemini (`gemini-3.8-flash`) via `@google/genai` TypeScript SDK (server-side only) and `google-genai` Python SDK.
- **Persistence:** Browser `localStorage` (client-side only, privacy-first, zero external DB dependencies).
- **Deployment:** Vercel via `vercel.json` and `requirements.txt`.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js 18+ and npm
- (Optional for Python Vercel runtime) Python 3.10+

### Step-by-Step
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd career-path-simulator
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional — app runs in fallback mode if omitted):
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-3.8-flash"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` in your browser.

---

## 6. Environment Variables

| Variable | Description | Default | Required? |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key | `""` | No (falls back gracefully) |
| `GEMINI_MODEL` | Gemini Model Alias | `gemini-3.8-flash` | No |
| `PORT` | Local dev server port | `3000` | No |

---

## 7. Vercel Deployment Steps

1. Install the Vercel CLI or import repository to Vercel dashboard:
   ```bash
   vercel
   ```
2. Set Environment Variables in Project Settings:
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `GEMINI_MODEL`: `gemini-3.8-flash`
3. The included `vercel.json` routes `/api/*` to the Python FastAPI entrypoint (`api/index.py`) and static assets to `/public/**`.
4. Deploy with `vercel --prod`.

---

## 8. Fallback Strategy & Resilience
1. **25-Second Timeout & Retry:** All Gemini calls are guarded by an abort timeout and automatic single retry.
2. **Schema Sanitization:** Automatic stripping of markdown fences (````json ... ````) and validation against Pydantic models.
3. **Hardcoded Sample Store:** If the API fails, the network drops, or no API key is provided, the backend seamlessly serves `/data/sample_outputs.json` with a subtle UI badge: `Showing Sample Data`.
4. **Interactive Demo Mode:** A switch in the header allows judges or testers to force offline sample data anytime.

---

## 9. Future Scope
- **Real Job-Market Demand Engine:** Live integration with Indian job boards (Naukri, LinkedIn India, Wellfound) to show live package ranges and job openings.
- **College Placement TPO Analytics:** Institutional dashboards for College Training & Placement Officers to identify departmental skill gaps before campus recruitment drives.
- **Multi-Role Branch Transitions:** Step-by-step transition pathways specifically tailored for Core Engineering branches (Mechanical to Robotics/AI, Civil to Geospatial Analytics).
- **Verified GitHub & LeetCode Integrations:** Automatic verification of solved coding problems and live repository commits.
