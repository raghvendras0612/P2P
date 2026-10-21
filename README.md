# Career Path Simulator

> **AI-Powered Placement Strategy, Skill Gap Verification, Vector ATS Resume Studio & Real-Time Mentorship Engine for Indian Engineering Students.**

Career Path Simulator is a full-stack, enterprise-hardened career planning platform designed specifically for Indian engineering students (1st through 4th year, across Tier 1, Tier 2, and Tier 3 colleges). The platform addresses the critical disconnect between university syllabi and real-world tech recruitment by transforming self-reported student profiles into verifiable, milestone-driven roadmaps, diagnostic skill credentials, and placement-ready ATS resumes.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite + Tailwind)"]
        UI_Wizard["7-Step Onboarding Wizard"]
        UI_Dash["Adapted Placement Dashboard"]
        UI_Paths["My Paths & Visual Timeline"]
        UI_Radar["Skill Gap Radar (Recharts)"]
        UI_Tests["25-Q Diagnostic Test Engine"]
        UI_Resume["Vector ATS Resume Studio"]
        UI_Mentor["AI Mentor (SSE Stream & Actions)"]
        ErrBound["React Error Boundary"]
    end

    subgraph API_Gateway["FastAPI ASGI Backend"]
        AuthRouter["/api/v1/auth (Argon2id + JWT)"]
        ProfileRouter["/api/v1/profile"]
        SimRouter["/api/v1/simulations"]
        TestRouter["/api/v1/tests (45m Proctor)"]
        ResumeRouter["/api/v1/resume (ReportLab Vector PDF)"]
        ProgRouter["/api/v1/progress (Daily Streaks)"]
        MentorRouter["/api/v1/mentor (SSE Streaming)"]
        HealthRouter["/health & /api/v1/health"]
    end

    subgraph Core_Services["Business Logic & Service Layer"]
        SimService["Simulation & Calibration Engine"]
        TestEngine["Test Engine & Scoring Algorithm"]
        ResumeService["ATS Resume Compiler"]
        ProgressService["Milestone & Streak Counter"]
        ContextAssembler["Mentor Context Assembler (~1.5k tok)"]
    end

    subgraph Storage["Persistence & External Services"]
        DB[("PostgreSQL / SQLite (SQLAlchemy 2.x + Alembic)")]
        GeminiAPI["Google Gemini 2.5 Flash / 1.5 Pro"]
    end

    UI_Wizard --> AuthRouter
    UI_Dash --> ProfileRouter
    UI_Paths --> SimRouter
    UI_Tests --> TestRouter
    UI_Resume --> ResumeRouter
    UI_Mentor --> MentorRouter
    Client -.-> ErrBound

    AuthRouter --> DB
    ProfileRouter --> DB
    SimRouter --> SimService --> GeminiAPI
    SimService --> DB
    TestRouter --> TestEngine --> DB
    TestEngine -.-> GeminiAPI
    ResumeRouter --> ResumeService --> DB
    ProgRouter --> ProgressService --> DB
    MentorRouter --> ContextAssembler --> GeminiAPI
    MentorRouter --> DB
    HealthRouter --> DB
```

---

## 2. Core Capabilities by Phase

| Phase | Module | Capabilities |
|---|---|---|
| **Phase 1** | **Foundation & Onboarding** | 7-step wizard capturing academic history (10th/12th/B.Tech CGPA), claimed technical skills, branch, target work styles, and Argon2id authenticated session management. |
| **Phase 2** | **AI Simulation Engine** | Google Gemini integration simulating 3 viable career tracks (fit score, yearly milestones, high-priority gaps, recommended projects, 30-day kickoff sprint, and Tier 1/2/3 Indian CTC brackets). |
| **Phase 3** | **Results & Personalization** | "Choose My Path" core mechanic: interactive comparison matrix, visual timeline highlighting current year of study, Recharts skill gap radar, and automatic dashboard adaptation. |
| **Phase 4** | **Testing, Resume & Streaks** | 25-question diagnostic assessments with anti-leakage lock and 45-minute server timer; vector ATS resume generator with 3 templates (`minimal_ats`, `classic_single`, `modern_compact`) and PDF export; daily streak tracker. |
| **Phase 5** | **AI Placement Mentor & Hardening** | Real-time SSE streaming chat with token-budgeted student context snapshot; interactive proposed action cards; comprehensive 100-test backend suite (91% coverage); Vercel deployment blueprint. |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, TanStack Query v5, React Router v6, Recharts.
- **Backend**: FastAPI, Python 3.11+, Pydantic v2, SQLAlchemy 2.x, Alembic, SlowAPI, Argon2-cffi, PyJWT, ReportLab.
- **AI Engine**: Google Gemini API via official `google-genai` SDK (`gemini-2.5-flash` / `gemini-1.5-pro`).
- **Database**: SQLite (local development) / PostgreSQL (production via Neon, Supabase, or AWS RDS).
- **Serverless / ASGI Hosting**: Vercel (Frontend Static & SPA rewrites) + Uvicorn / Gunicorn (ASGI container).

---

## 4. Repository Structure

```text
├── backend/
│   ├── alembic/              # Database migration versions
│   │   └── versions/         # Alembic migration scripts (Phases 1 through 5)
│   ├── app/
│   │   ├── core/             # Configuration, JWT security, Rate limiter, Dependencies
│   │   ├── db/               # SQLAlchemy engine, session provider, seed catalog script
│   │   ├── models/           # Declarative DB entities (User, Catalog, Testing, Resume, Progress, Mentor)
│   │   ├── routers/          # Route controllers (Auth, Profile, Catalog, Sim, Tests, Resume, Progress, Mentor)
│   │   ├── schemas/          # Pydantic v2 schemas and validation contracts
│   │   ├── services/         # Domain services and AI prompt builders
│   │   │   └── ai/           # Gemini client, streaming generators, prompt injection guards
│   │   └── main.py           # FastAPI ASGI application root with health checks and exception handlers
│   ├── tests/                # 100 Pytest test suites (unit, integration, security matrix)
│   ├── Dockerfile            # Production ASGI container build
│   ├── gunicorn_conf.py      # Production Gunicorn worker configuration
│   ├── requirements.txt      # Python dependencies
│   └── pyproject.toml        # Ruff and Mypy configuration
├── frontend/
│   ├── src/
│   │   ├── api/              # Strongly-typed Axios/Fetch client and SSE stream reader
│   │   ├── components/       # UI component library (Common, Layout, Wizard, Paths, Tests, Resume, Mentor)
│   │   ├── context/          # React context providers (AuthContext, SelectedPathContext)
│   │   ├── pages/            # View pages (Login, Wizard, Dashboard, MyPaths, Tests, Resume, Mentor, Profile)
│   │   ├── test/             # 7 Vitest test suites (35 unit and interaction tests)
│   │   └── types/            # TypeScript interfaces matching backend contracts
│   ├── Dockerfile            # Multi-stage production Nginx container build
│   ├── nginx.conf            # Nginx SPA fallback configuration
│   ├── vercel.json           # Vercel deployment routing & security headers
│   └── vite.config.ts        # Vite configuration with chunk splitting
├── docs/
│   ├── PROJECT_SPEC.md       # Comprehensive product and engineering specification (v1.4.0)
│   └── qa/                   # QA audit reports for Phases 1 through 4
├── api/
│   └── index.py              # Optional Vercel Serverless Python entrypoint
├── docker-compose.yml        # Multi-container orchestration (Backend + Frontend)
├── vercel.json               # Monorepo root Vercel configuration
└── README.md
```

---

## 5. Local Development Quickstart

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.11+
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### Option A: Direct Local Setup

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY

# Run database migrations and seed initial skills catalog
alembic upgrade head
python -m app.db.seed

# Start ASGI development server
uvicorn app.main:app --reload --port 8000
```
*API Swagger Documentation will be accessible at: `http://localhost:8000/docs`*

#### 2. Frontend Setup
```bash
cd frontend

# Install npm packages
npm install

# Start Vite HMR server
npm run dev
```
*Web application will be accessible at: `http://localhost:5173`*

---

### Option B: Docker Compose Setup

Run the entire application stack in isolated containers with a single command:

```bash
# Export your Gemini API Key
export GEMINI_API_KEY="your-gemini-api-key"

# Build and launch containers
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Health Check: `http://localhost:8000/health`

---

## 6. Automated Testing & Verification

Every layer of the platform is covered by automated unit, integration, and security tests.

### 1. Backend Pytest Suite & Coverage
```bash
cd backend
.venv/bin/pytest --cov=app --cov-report=term-missing
```
- **Test Count**: 100 passing tests
- **Code Coverage**: 91% total line coverage (exceeds 80% threshold)
- **Key Suites**: `test_phase5_integration.py`, `test_mentor_api.py`, `test_simulation.py`, `test_skill_testing_api.py`, `test_resume_api.py`, `test_progress_api.py`, `test_auth.py`.

### 2. Backend Code Hygiene (Linting & Types)
```bash
cd backend
.venv/bin/ruff check .
.venv/bin/mypy app
```
- **Ruff**: 0 errors
- **Mypy**: 0 type issues across 54 source files

### 3. Frontend Vitest Suite
```bash
cd frontend
npm test -- --run
```
- **Test Count**: 35 passing tests across 7 test suites
- **Key Suites**: `wizard.test.tsx`, `results.test.tsx`, `paths.test.tsx`, `personalization.test.tsx`, `phase4_tests.test.tsx`, `phase4_resume.test.tsx`, `mentor.test.tsx`.

### 4. Frontend Production Build
```bash
cd frontend
npm run build
```
- Runs TypeScript compiler (`tsc`) and Vite bundler with zero errors.
- Manual chunk splitting ensures no production bundle exceeds 350 kB gzip.

---

## 7. Production Deployment Blueprint

### Step 1: Managed Database Setup (PostgreSQL)
1. Provision a PostgreSQL instance using **Neon**, **Supabase**, or **AWS RDS**.
2. Retrieve your connection string. Example:
   ```text
   postgresql+psycopg://username:password@ep-cool-db.us-east-2.aws.neon.tech/career_sim?sslmode=require
   ```

### Step 2: Backend ASGI Deployment (Container or VM)
Deploy to Render, Railway, Fly.io, or an AWS EC2 instance:
1. Configure environment variables (see `backend/.env.example`):
   - `ENVIRONMENT=production`
   - `DATABASE_URL=postgresql+psycopg://...`
   - `SECRET_KEY=...` (generate with `openssl rand -hex 32`)
   - `GEMINI_API_KEY=...`
   - `CORS_ORIGINS=["https://your-frontend.vercel.app"]`
2. Run database migrations and seed catalog:
   ```bash
   alembic upgrade head
   python -m app.db.seed
   ```
3. Launch with multi-worker ASGI server:
   ```bash
   # Using Uvicorn:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

   # Or using Gunicorn configuration:
   gunicorn -c gunicorn_conf.py app.main:app
   ```

### Step 3: Frontend Deployment (Vercel)
1. In the Vercel Dashboard, click **Add New Project** and import this repository.
2. If configuring as a subdirectory project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. If deploying from repository root:
   - The included root `vercel.json` automatically orchestrates the build command and routing.
4. Set Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://api.yourdomain.com` (your deployed backend URL)
5. Deploy. The included `vercel.json` applies:
   - SPA client-side route fallback to `/index.html`
   - Strict Security Headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
   - Immutable static asset caching: `Cache-Control: public, max-age=31536000, immutable`.

---

## 8. Pre-Deployment Manual QA Checklist

Before pointing production DNS to the release, execute this verification protocol:

- [ ] **Health Check Verification**:
  - `GET https://api.yourdomain.com/health` returns `{"status": "healthy", "database": "connected"}`.
  - `GET https://api.yourdomain.com/api/v1/health` confirms DB connectivity with zero latency spikes.
- [ ] **Student Onboarding**:
  - Register a new account (`/register`); confirm password validation, CGPA boundaries (0.0–10.0), and 10-digit mobile formatting.
  - Complete all 7 steps and land on `/dashboard`.
- [ ] **Career Path Simulation**:
  - Navigate to `/paths` and trigger an AI Simulation.
  - Confirm polling indicators work, and 3 realistic tracks render with fit scores, yearly milestones, and market CTC brackets.
- [ ] **Dedicated Path Selection**:
  - Click "Choose This Path" on one track; confirm modal warning and select.
  - Return to `/dashboard`; verify active path banner, milestone tracker, and top skill gaps reflect the selected track.
- [ ] **Diagnostic Skill Testing**:
  - Go to `/tests`; select a claimed skill (e.g. Python, React).
  - Confirm the 45-minute countdown starts, answers save incrementally, and no answer keys are visible in DevTools network payloads.
  - Submit test; verify score calculation, level badge assignment (Beginner to Expert), and 7-day cooldown initiation.
- [ ] **ATS Resume Studio**:
  - Navigate to `/resume`; verify verified skills display badges with correct proficiency levels.
  - Toggle between the 3 ATS templates (`minimal_ats`, `classic_single`, `modern_compact`).
  - Test "Download Vector PDF"; confirm the generated PDF is crisp, machine-readable, and formatted correctly.
- [ ] **AI Placement Mentor**:
  - Open `/mentor` or launch the slide-over drawer from any page.
  - Ask: *"What is my highest-priority skill gap for campus placements?"*
  - Verify smooth token-by-token SSE streaming, typing indicator, and proposed action card formatting.
  - Click "Add to Progress" on a proposed card; verify it saves to `/dashboard` without page reload.
- [ ] **Security & Error Isolation**:
  - Attempt accessing protected routes with an expired or missing JWT; verify clean redirect to `/login`.
  - Intentionally inject prompt-override text in student inputs; verify the mentor treats user text strictly as untrusted data.
  - Verify 500 errors display generic user-safe notices with zero backend stack traces exposed.

---

## 9. License & Attribution

Built for Indian Engineering Students. All rights reserved &copy; 2026.
