# Career Path Simulator: Product & Engineering Specification

**Document Version**: 1.4.0 (Phase 5 Release: AI Placement Mentor, Quality Hardening & Production Blueprint)  
**Target Audience**: Indian Engineering Students (1st to 4th Year, Tier 1/2/3 Colleges)  
**Primary Focus**: Placement-centric career readiness, skill gap identification, test-driven skill verification, ATS-optimized vector resume auto-generation, persistent daily progress tracking, real-time AI placement mentorship, and enterprise-grade test automation.

---

## 1. Product Summary

Indian engineering colleges produce over 1.5 million graduates annually, yet industry reports consistently show fewer than 20% are immediately employable in modern tech roles. Students often suffer from:
1. **Career Disorientation**: Uncertainty regarding which tech specialization fits their skills and interests (e.g., Full Stack vs DevOps vs AI/ML vs Data Engineering).
2. **Curriculum-Industry Gap**: Academic university syllabi lag modern production tech stacks.
3. **Unverified Resume Inflation**: Resumes filled with buzzwords without demonstrable proof, leading to rejection during technical interviews.

**Career Path Simulator** solves this through a structured 4-step loop:
1. **Comprehensive Onboarding**: Captures academic basics (10th/12th/B.Tech CGPA), claimed technical skills with self-ratings (Beginner, Intermediate, Advanced), industry interests, and projects.
2. **AI Simulation (Phase 2)**: Simulates 3 realistic, tailored career tracks complete with year-by-year milestones, missing critical prerequisites, recommended portfolio projects, and a concrete 30-day kickoff plan.
3. **Dedicated Path Selection (Phase 3)**: The student commits to one path, adapting their entire dashboard (roadmap, milestone tracker, recommended skill tests, and mentor context).
4. **Verified Skills & Auto Resume (Phase 4)**: Diagnostic skill challenges transition skills from "Claimed" to "Verified", dynamically rendering an ATS-friendly, evidence-backed resume.

---

## 2. Technology Stack & Deployment Architecture

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Fast HMR, strong typing, clean component boundaries |
| **Styling** | Tailwind CSS, Lucide React | Unstyled-but-clean layout ready for visual reskinning |
| **State / Data** | TanStack Query v5, React Router v6 | Server-state caching, optimistic updates, declarative routing |
| **Backend** | FastAPI (Python 3.11+), Pydantic v2 | High-performance ASGI framework, automatic OpenAPI docs |
| **ORM / Migrations**| SQLAlchemy 2.x, Alembic | Type-safe declarative models, migration versioning |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) | Local zero-config SQLite (`dev.db`), Neon/Supabase for cloud |
| **Security & Auth** | Argon2id (`argon2-cffi`), PyJWT | Memory-hard password hashing, JWT access + httpOnly refresh |
| **AI Integration** | Google Gemini (`google-genai` SDK) | Structured path generation using env-configured `GEMINI_MODEL` |
| **Deployment Target**| Vercel Serverless / ASGI container | Fully stateless backend with managed PostgreSQL |

---

## 3. Data Model Architecture

### 3.1 Relational Diagram

```text
       ┌──────────────┐       1:1       ┌───────────────────┐
       │    users     ├─────────────────┤  student_profiles │
       └───┬──────┬───┘                 └───────────────────┘
           │      │
      1:N  │      │  1:N
           │      ├─────────────────► education_entries
           │      ├─────────────────► projects
           │      ├─────────────────► experiences
           │      ├─────────────────► user_selected_path ──► career_paths
           │      │
           │      │  M:N
           │      ├─────────────────► user_skills ──────────► skills
           │      └─────────────────► user_interests ───────► interests
```

### 3.2 Database Entities

1. **`users`**
   - `id`: Integer, Primary Key, Autoincrement
   - `email`: String(255), Unique, Indexed, Non-null
   - `password_hash`: String(255), Non-null (Argon2id)
   - `created_at`: DateTime(UTC), Default `now()`
   - `updated_at`: DateTime(UTC), OnUpdate `now()`

2. **`student_profiles`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Unique
   - `full_name`: String(150), Non-null
   - `phone`: String(20), Non-null (Validated for Indian 10-digit mobile)
   - `college`: String(255), Non-null
   - `branch`: String(100), Non-null (CSE, IT, ECE, ME, etc.)
   - `year_of_study`: Integer, Non-null (1, 2, 3, or 4)
   - `expected_graduation_year`: Integer, Non-null
   - `cgpa`: Numeric(4, 2), Non-null (0.00 to 10.00 scale)
   - `city`: String(100), Non-null
   - `state`: String(100), Non-null
   - `linkedin_url`: String(255), Nullable
   - `github_url`: String(255), Nullable
   - `portfolio_url`: String(255), Nullable
   - `career_goal_text`: Text, Nullable
   - `preferred_work_style`: String(50), Nullable ("In-office", "Hybrid", "Remote")
   - `created_at`, `updated_at`

3. **`education_entries`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
   - `level`: String(50), Non-null ("10th", "12th", "Diploma", "Undergraduate")
   - `institution_name`: String(255), Non-null
   - `board_or_university`: String(150), Non-null ("CBSE", "ICSE", "State Board", etc.)
   - `passing_year`: Integer, Non-null
   - `percentage`: Numeric(5, 2), Non-null (0.00 to 100.00%)

4. **`skills`**
   - `id`: Integer, Primary Key
   - `name`: String(100), Unique, Indexed, Non-null
   - `category`: String(100), Indexed, Non-null (e.g., "Web Frontend", "Core CS")
   - `aliases`: String(255), Nullable (Comma-separated search aliases)
   - `is_verified_seed`: Boolean, Default True

5. **`user_skills`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
   - `skill_id`: Integer, Foreign Key (`skills.id`, CASCADE), Indexed
   - `self_level`: Integer, Non-null (1: Beginner, 2: Intermediate, 3: Advanced)
   - `status`: String(20), Non-null, Default "claimed" ("claimed", "verified", "failed")
   - `verified_level`: Integer, Nullable
   - `last_tested_at`: DateTime(UTC), Nullable
   - *Constraint*: `Unique(user_id, skill_id)`

6. **`interests`**
   - `id`: Integer, Primary Key
   - `name`: String(100), Unique, Non-null
   - `group`: String(100), Indexed, Non-null

7. **`user_interests`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
   - `interest_id`: Integer, Foreign Key (`interests.id`, CASCADE), Indexed
   - *Constraint*: `Unique(user_id, interest_id)`

8. **`projects`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
   - `title`: String(150), Non-null
   - `description`: Text, Non-null
   - `tech_stack`: String(255), Non-null
   - `link`: String(255), Nullable
   - `start_date`: String(50), Nullable
   - `end_date`: String(50), Nullable

9. **`experiences`**
   - `id`: Integer, Primary Key
   - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
   - `type`: String(50), Non-null ("internship", "hackathon", "certification", "achievement")
   - `title`: String(150), Non-null
   - `organization`: String(150), Nullable
   - `description`: Text, Nullable
   - `date_or_duration`: String(100), Nullable
   - `link`: String(255), Nullable

10. **`career_paths`**
    - `id`: Integer, Primary Key
    - `slug`: String(100), Unique, Indexed, Non-null
    - `name`: String(150), Non-null
    - `description`: Text, Non-null

11. **`user_selected_path`**
    - `id`: Integer, Primary Key
    - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
    - `career_path_id`: Integer, Foreign Key (`career_paths.id`, CASCADE), Indexed
    - `simulation_id`: Integer, Foreign Key (`simulations.id`, SET NULL), Nullable, Indexed
    - `selected_at`: DateTime(UTC), Default `now()`
    - `is_active`: Boolean, Default True

12. **`simulations`**
    - `id`: Integer, Primary Key, Autoincrement
    - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
    - `mode`: String(50), Non-null ("auto" | "custom")
    - `selected_paths`: JSON, Nullable (Requested path slugs)
    - `prompt_version`: String(50), Non-null (e.g. "v1.0.0")
    - `model_name`: String(100), Non-null (e.g. "gemini-1.5-pro")
    - `input_snapshot`: JSON, Non-null (Profile, verified/claimed skills, interests snapshot)
    - `output_json`: JSON, Non-null (Strictly validated 3-path roadmap output)
    - `created_at`: DateTime(UTC), Default `now()` (Immutable record)

13. **`simulation_jobs`**
    - `id`: String(36), Primary Key (UUIDv4)
    - `user_id`: Integer, Foreign Key (`users.id`, CASCADE), Indexed
    - `simulation_id`: Integer, Foreign Key (`simulations.id`, SET NULL), Nullable, Indexed
    - `status`: String(50), Non-null ("queued" | "running" | "succeeded" | "failed")
    - `mode`: String(50), Non-null ("auto" | "custom")
    - `custom_path_slugs`: JSON, Nullable
    - `what_if_delta`: JSON, Nullable
    - `error_message`: Text, Nullable
    - `created_at`, `updated_at`: DateTime(UTC)

---

## 4. API Endpoints Specification (`/api/v1`)

### 4.1 Authentication & User Session
- `POST /api/v1/auth/register`: Atomic transaction creating User + StudentProfile + Education + Skills + Interests. Returns access token + sets `httpOnly` refresh cookie.
- `POST /api/v1/auth/login`: Authenticates with email & password. Returns access token + sets refresh cookie.
- `POST /api/v1/auth/refresh`: Reads `httpOnly` refresh cookie, validates, and rotates tokens.
- `POST /api/v1/auth/logout`: Clears the refresh cookie.
- `GET /api/v1/auth/me`: Returns current user info and active selected career path.

### 4.2 Catalogs (Public / Authenticated)
- `GET /api/v1/catalog/skills`: Returns seed skills, searchable by `?q=` and filterable by `?category=`.
- `GET /api/v1/catalog/interests`: Returns all interests grouped by interest cluster.
- `GET /api/v1/catalog/paths`: Returns the 9 seeded career paths.

### 4.3 Student Profile & Resume Data
- `GET /api/v1/profile`: Fetches complete student profile including education, claimed skills, interests, projects, and experiences.
- `PUT /api/v1/profile`: Updates core profile attributes.
- `PUT /api/v1/profile/skills`: Replaces or updates claimed user skills with self-levels.
- `PUT /api/v1/profile/interests`: Updates selected user interest IDs.
- `POST /api/v1/profile/education`: Creates an education record.
- `DELETE /api/v1/profile/education/{id}`: Deletes an education record.
- `POST /api/v1/profile/projects`: Creates a project record.
- `PUT /api/v1/profile/projects/{id}`: Updates a project record.
- `DELETE /api/v1/profile/projects/{id}`: Deletes a project record.
- `POST /api/v1/profile/experiences`: Creates an experience record.
- `PUT /api/v1/profile/experiences/{id}`: Updates an experience record.
- `DELETE /api/v1/profile/experiences/{id}`: Deletes an experience record.
- `POST /api/v1/profile/selected-path`: Selects/switches active career track. Accepts `career_path_id` or `path_slug` and optional `simulation_id`. Atomically deactivates previous selections and links to simulation run.
- `GET /api/v1/profile/selected-path`: Returns active selected path with attached catalog details and extracted simulated path roadmap.
- `DELETE /api/v1/profile/selected-path`: Deactivates active selected career path.

### 4.4 AI Career Path Simulations (`/api/v1/simulations`)
- `POST /api/v1/simulations`: Creates a career simulation job (Auto or Custom mode). Enforces user rate limits (5/hr) and SHA-256 snapshot caching. Returns job status.
- `GET /api/v1/simulations/jobs/{job_id}`: Polls simulation job status (`queued`, `running`, `succeeded`, `failed`) with tenant authorization.
- `GET /api/v1/simulations/history`: Lists user's past simulation records with top path summary and fit scores.
- `GET /api/v1/simulations/{id}`: Returns full immutable simulation record with validated 3-track roadmap and historical comparison diff.
- `POST /api/v1/simulations/{id}/resimulate`: Re-runs simulation using CURRENT profile plus an optional "what-if" delta (added skills/interests) and returns comparison summary.
- `POST /api/v1/simulations/{id}/regenerate-path`: Re-simulates a single career path while keeping the other two paths intact.

---

## 5. Coding & Engineering Conventions

1. **Separation of Concerns**:
   - Routers only parse requests, enforce auth dependencies, and return Pydantic models.
   - Core business logic and database transactions live in `app/services/`.
   - Security primitives (Argon2, JWT) remain strictly isolated in `app/core/security.py`.
   - AI service prompts remain versioned in `app/services/ai/prompts/` with `PROMPT_VERSION = "v1.0.0"`.
2. **Defensive Validation & Prompt Injection Neutralization**:
   - Server-side Pydantic models enforce string trimming, email normalization, CGPA bounds (`0.0 <= cgpa <= 10.0`), and Indian phone number formatting (`^[6-9]\d{9}$`).
   - AI inputs enclose student context within `<student_context_data>` JSON envelopes with anti-injection escaping to treat all user text strictly as passive data.
   - Strict 2-stage repair retry loop corrects schema deviations before falling back to clean typed errors.
3. **Stateless Backend Design**:
   - No filesystem persistence assumptions; storage relies on managed database connections.
   - Database connection pools use `pool_pre_ping=True` to withstand serverless cold starts.
4. **Security & Secrets Hygiene**:
   - Passwords are never logged or returned in responses.
   - Refresh tokens are transmitted only via `httpOnly`, `SameSite=Lax`, `Secure` cookies.
   - Rate limiting applied to `/auth/*` endpoints and `/simulations` (5 per hour per student).
5. **Selected-Path Personalization Contract (Phases 3 -> 4 -> 5)**:
   - When a student commits to a career track (`POST /api/v1/profile/selected-path`), the track is linked to catalog `career_path_id` and optional `simulation_id`.
   - The active path object (`simulated_path`) exposes the roadmap, skill gaps, projects, and 30-day kickoff plan.
   - **Dashboard**: Renders active track hero card, daily activity streak, next best action recommendation, current academic year's milestone checkpoints, top 3 prioritized skill gaps, and next recommended project.
   - **Phase 4 (Skill Tests & Resume)**: Prioritizes diagnostic skill tests directly against the selected path's high-priority skill gaps. Automatically tailors the dynamic ATS resume target role, produces vector PDFs, and aligns highlighted projects with the chosen track.
   - **Phase 4 (Milestone Tracking)**: Checkpoints and kickoff task completion statuses persist to the `progress_items` table and maintain an active daily streak via `user_streaks`.
   - **Phase 5 (AI Mentor Chat)**: System prompt automatically injects the active career track, current academic milestone, and remaining skill gaps into the LLM context.

---

## 6. Phase 4 Architecture & Specifications

### 6.1 Diagnostic Skill Testing Engine
- **Lazy Question Bank Generation**: Generates 15–20 high-quality questions per batch on-demand via Gemini 2.5 Flash, cached in `question_bank` with SHA-256 deduplication.
- **Strict Anti-Leakage Guarantee**: Client APIs receive only sanitized questions, difficulty, subtopic tags, and options. Correct answer keys and AI explanations are strictly locked on the server until the assessment is finalized.
- **25-Question Diagnostic Ladder**: Tests sample exactly 25 questions ordered from easy to hard (~30% easy, ~40% medium, ~30% hard).
- **Proctoring & Timing**: 45-minute countdown timer enforced on the server; incremental autosave prevents loss of progress; client blur/visibility events log tab switches.
- **Cooldown & Scoring**: 7-day cooldown prevents cramming; weighted scoring (1.0 to 3.0 points based on difficulty); verified proficiency levels: Level 1 (Beginner, 60–74%), Level 2 (Intermediate, 75–84%), Level 3 (Advanced, 85%+), Level 4 (Expert, 85%+ with >=60% hard question accuracy).
- **Simulation Feedback Loop**: Verified skills carry heavy weight in subsequent simulations and calibrate fit scores.

### 6.2 ATS Resume Engine & Server-Side PDF
- **Vector PDF Generator**: Python backend renders machine-readable, ATS-compliant PDFs using `reportlab` with 3 selectable templates (`minimal_ats`, `classic_single`, `modern_compact`).
- **Proof-Backed Credentialing**: Verified skills prominently display verification badges and proficiency levels. Unverified skills can be toggled on/off. Failed attempts are strictly suppressed.
- **AI Role Tailoring**: Automatically generates a professional summary aligned to the candidate's active career track and Indian fresher hiring expectations without hallucinating unverified achievements.
- **Multi-Format Export**: Full downloads available in PDF, formatted Markdown, and structured JSON, with quick plain-text clipboard copying.
- **Strength Checklist & Score**: 0–100 ATS readiness score evaluated against 5 objective placement criteria.

### 6.3 Persistent Progress & Streak Engine
- **Database Tables**: Replaces client-side storage with `progress_items` and `user_streaks` tables.
- **Activity Streak Calculation**: Computes current and longest streaks based on UTC calendar dates, supporting idempotent multi-action completion.
- **Actionable Guidance**: Exposes a dynamic `next_best_action` driving the student towards high-impact placement milestones.

---

## 7. Implementation Checklist & Phase Roadmap

- [x] **Phase 1: Foundation, Auth, Onboarding & Profile** *(Completed)*
  - [x] Repo structure & tooling setup (`/frontend`, `/backend`, `.env.example`, `docs/`)
  - [x] `PROJECT_SPEC.md` documentation
  - [x] SQLAlchemy 2.x data models & Alembic migrations
  - [x] 128 Skills, 25 Interests, 9 Career Paths seeded
  - [x] FastAPI `/api/v1` routes (Auth, Catalog, Profile CRUD) with tests
  - [x] React 7-step onboarding wizard with local progress preservation
  - [x] Dashboard shell, protected routing, and full profile editor
  - [x] Vitest and Pytest test suites passing (100% pass rate)
- [x] **Phase 2: AI Simulation Engine** *(Completed)*
  - [x] Gemini API integration via `google-genai` SDK and `GEMINI_MODEL`
  - [x] Prompt engineering for 3 realistic career paths (milestones, gaps, projects, 30-day plan)
  - [x] Structured JSON output parsing, Pydantic v2 schemas & simulation persistence
  - [x] Asynchronous job polling queue, 2-stage repair retry & error mapping
  - [x] Snapshot SHA-256 caching & per-user rate limit (5 simulations/hour)
  - [x] Re-simulation with structured "what-if" delta & comparison diff computation
  - [x] My Paths frontend smoke UI with live runner, job polling, and path cards preview
  - [x] 22/22 unit & integration tests passing with 89% total backend coverage
- [x] **Phase 3: Results Experience & Path Selection** *(Completed)*
  - [x] Multi-tab results experience on `/paths`: "Overview / Compare" tab (3 summary cards, recommendation, assumptions, disclaimers, and comparison matrix) + 3 dedicated path tabs (Roadmap, Skill Gaps, Projects, 30-Day Sprint, Market & Risks)
  - [x] Visual timeline and roadmap with active focus on current academic year, past year styling, and checkable checkpoints
  - [x] Skill gap radar using Recharts (0–5 levels, tooltips with priority and rationale), plus accessible table fallback and sortable gap cards
  - [x] Project recommendations showcase with difficulty badges, hiring signals, and "Start this project" state; 4-week kickoff sprint board
  - [x] "Choose My Path" core mechanic: confirmation modal with dashboard personalization impact, backend persistence with history preservation, and frontend `useSelectedPath()` hook/context
  - [x] Dashboard adaptation: active career track banner, next milestone progress, top 3 critical skill gaps, and next recommended project
  - [x] Simulation history drawer and "What-If" re-simulation modal with skill chip picker and diff comparison view
  - [x] Automated unit and integration tests (Pytest + Vitest: 100% pass rate)
- [x] **Phase 4: Skill Tests, Resume Builder & Progress Tracking** *(Completed)*
  - [x] SQLAlchemy models (`question_bank`, `test_attempts`, `attempt_answers`, `skill_proficiency_history`, `resume_documents`, `progress_items`, `user_streaks`) & Alembic migration
  - [x] AI Question Generator & Bank Service with strict Pydantic validation & Gemini repair retry
  - [x] 25-question diagnostic assessment engine with server timer (45m), 7-day cooldown, and anti-leakage guarantee
  - [x] Knowledge profile service updating `UserSkill` status and closing gaps in subsequent career path simulations
  - [x] Server-side vector ATS resume PDF generator via `reportlab` with 3 templates, Markdown, and JSON exports
  - [x] Dynamic ATS resume studio UI with template switcher, unverified skill filter, AI tailor button, and 0–100 strength score
  - [x] Persistent milestone progress tracking, project repo links, streak calculation engine, and next best action card
  - [x] Comprehensive test suites: 63 backend pytest tests (100% pass), 31 frontend vitest tests (100% pass), ruff/mypy clean, production Vite build verified
- [x] **Phase 5: AI Placement Mentor Chat, Quality Hardening & Production Preparation** *(Completed)*
  - [x] Context-aware AI placement mentor chat with server-assembled token-bounded context snapshot (~1,500 token budget)
  - [x] Database persistence for chat threads and messages with cascade deletion (`chat_threads`, `chat_messages`)
  - [x] Server-Sent Events (SSE) streaming engine (`event: token`, `event: action`, `event: done`, `event: error`)
  - [x] Interactive proposed actions system with explicit student confirmation modal and zero silent DB mutations
  - [x] Dedicated `/mentor` full-page workspace and universal `MentorSlideOver` launcher on all authenticated screens
  - [x] 5 placement quick-action chips, typing indicator, auto-scroll, and graceful network error recovery
  - [x] End-to-end integration test (`test_phase5_integration.py`) covering the complete 7-step student lifecycle
  - [x] Comprehensive security & authorization audit matrix (cross-tenant isolation, expired JWTs, bounded inputs)
  - [x] Backend test suite hardened to 100 passed tests with 91% code coverage (surpassing 80% threshold)
  - [x] Frontend test suite expanded to 35 passed tests across 7 test suites with 0 failures
  - [x] React Error Boundaries wrapped around route outlets and major tabs to isolate runtime exceptions
  - [x] Production health check endpoints (`/health` and `/api/v1/health`) reporting service status and live DB ping
  - [x] Clean 500 error exception handling with sanitized user error messages and internal logging
  - [x] Production build readiness: Vite chunk optimization (`tsc && vite build`) and backend ASGI compliance
  - [x] Multi-platform deployment blueprint: Vercel configuration (`vercel.json`), serverless entrypoint (`api/index.py`), and ASGI configuration (`backend/gunicorn_conf.py`)
  - [x] Documented environment variable files (`.env.example`) for backend and frontend with types and sensible defaults
  - [x] Idempotent catalog database seed script (`python -m app.db.seed`) and migration verification (`alembic upgrade head`)

---

## 8. Phase 5 Architecture & Specifications

### 8.1 AI Placement Mentor Chat Engine
- **Server-Side Context Assembler**: Constructs a dynamic, token-budgeted prompt snapshot (~3,500 characters) integrating:
  1. Student academic fundamentals (college tier, year, branch, CGPA, city/state).
  2. Active selected career path with fit score and next milestone checkpoint.
  3. Knowledge profile from Phase 4 (verified skills, verified levels, weak subtopics identified during skill testing).
  4. Current activity streak and completion progress count.
- **Placement-Calibrated System Prompt**: Specially engineered for Indian engineering placement realities (Tier 1/2/3 campus drives, service vs product firms, DSA & system design expectations). Strictly treats student inputs as untrusted data (mitigating prompt-injection attacks) and gracefully defers off-topic questions.
- **Server-Sent Events (SSE) Protocol**:
  - `event: token`: Incremental text chunks streamed in real-time to the browser.
  - `event: action`: Structured proposed action payloads (`add_task` or `add_project`) extracted from the model response.
  - `event: done`: Signals stream completion with full message payload.
  - `event: error`: Delivers clean error status for client retry handling.
- **Action Confirmation Flow**: Mentor outputs structured suggestions using `[PROPOSED_ACTION: {"type": "add_task"|"add_project", ...}]`. The client renders these as clickable `ProposedActionCard` components. Clicking "Add to Progress" invokes `POST /api/v1/mentor/actions/confirm`, ensuring no background mutations occur without student consent.

### 8.2 Testing Matrix & Quality Assurance
- **Coverage & Suite Volume**: 100 backend tests executed via Pytest with 91% total line coverage.
- **Lifecycle Integration Test**: Asserts registration -> onboarding -> AI simulation -> path selection -> diagnostic skill test -> ATS resume generation -> streak tracking -> mentor chat streaming.
- **Security Audit Matrix**: Asserts multi-tenant data boundaries, expired token rejection, payload validation, and prompt-injection string isolation.
- **Frontend Vitest**: 35 unit/integration tests validating form wizard steps, tab switching, skill test proctoring, resume editing, and streaming mentor chat.

### 8.3 Production Deployment Blueprint
- **Frontend Static Hosting (Vercel)**: Configured in `vercel.json` with SPA history fallback, asset immutability caching (`Cache-Control: public, max-age=31536000, immutable`), and strict security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Backend ASGI Server**: Configured for high-concurrency production deployments via `uvicorn` or `gunicorn` with `uvicorn.workers.UvicornWorker` (`gunicorn_conf.py`), featuring a 120-second timeout to handle streaming generative AI workloads.
- **Database Migrations & Seed**: Zero-downtime schema evolution managed by Alembic (`alembic upgrade head`), accompanied by idempotent catalog seeding (`python -m app.db.seed`).

