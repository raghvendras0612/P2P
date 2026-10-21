# Phase 2 QA Audit Report: AI Career Simulation Engine

**Date**: 2026-10-20  
**Auditor**: Independent QA Engineer  
**Target Repository**: `Career Path Simulator` (Phase 2 Post-Implementation Audit)  
**Overall Verdict**: **GO (PASS - All Phase 2 Requirements Verified)**

---

## 1. Executive Summary

A comprehensive, skeptical, evidence-based QA audit was executed across the entire Phase 2 AI Career Simulation Engine. All Phase 1 regression checks were re-run and confirmed intact. 

Every requirement of Phase 2—spanning the `google-genai` integration, strict Pydantic v2 schemas (with 3-path limits, Indian market LPA estimates, remaining academic year milestones, 6-10 radar-calibrated skill gaps, and 4-week kickoff plans), prompt injection defenses, 2-stage automated repair-retry, asynchronous polling jobs, tenant isolation, snapshot caching, rate limiting (5/hr), and frontend smoke UI—was executed and verified with deterministic tests.

As mandated by QA guidelines, **zero calls were made to the live Gemini API in automated tests**. All tests utilized isolated mocks and golden fixtures.

---

## 2. Requirement Verification Table

| ID | Category | Requirement Description | Status | Evidence / Observation |
|---|---|---|---|---|
| **1.1** | **Regression** | Phase 1 Backend Pytest Suite | **PASS** | 14/14 Phase 1 tests pass cleanly |
| **1.2** | **Regression** | Backend Code Quality & Style (`ruff`) | **PASS** | `ruff check app tests` passed with 0 lint errors |
| **1.3** | **Regression** | Backend Static Type Checking (`mypy`) | **PASS** | `mypy app tests` passed with 0 errors across 40 source files |
| **1.4** | **Regression** | Frontend Vitest Suite | **PASS** | 9/9 tests pass (`wizard.test.tsx` + `paths.test.tsx`) |
| **1.5** | **Regression** | Frontend Production Build (`tsc && vite`) | **PASS** | Clean build in 1.65s; zero TypeScript errors |
| **2.1** | **Schema & Validation** | Valid simulation fixture schema parsing | **PASS** | Golden fixture `sample_simulation.json` parses cleanly into `SimulationOutput` |
| **2.2** | **Schema & Validation** | Reject <3 or >3 paths, duplicate slugs, unknown slugs | **PASS** | `test_schema_rejects_invalid_path_counts_and_duplicates` raises `ValidationError` |
| **2.3** | **Schema & Validation** | Milestone year range matches remaining academic years | **PASS** | `test_prompt_builder_milestones_for_all_years` verifies Year 1 to 4 graduation milestones |
| **2.4** | **Schema & Validation** | Skill gap bounds (6-10 items, levels 0-5) | **PASS** | `test_schema_rejects_invalid_skill_gaps` rejects <6 or >10 items and levels >5 |
| **2.5** | **Schema & Validation** | First-month action plan strictly 4 weeks | **PASS** | `test_schema_rejects_invalid_first_month_plan` rejects 3 or 5-week plans |
| **2.6** | **Schema & Validation** | Distinct fit scores (0-100), disclaimers, no extra fields | **PASS** | Schema forbids extra fields; rejects duplicate fit scores; enforces disclaimers |
| **2.7** | **Schema & Validation** | Rejection of non-JSON and markdown-wrapped JSON | **PASS** | Markdown cleaner extracts raw JSON from ````json blocks; rejects non-JSON strings |
| **2.8** | **Schema & Validation** | 2-stage Repair-Retry pipeline with typed failure handling | **PASS** | `test_repair_retry_success_flow` and `test_repair_retry_exhausted_raises_typed_error` verify repair prompt injection and typed exceptions |
| **2.9** | **Schema & Validation** | Error mapping (timeout, 429 rate limit, safety block, network) | **PASS** | `test_ai_service_error_mappings` maps API errors to `AIRateLimitError`, `AISafetyBlockError`, and `AITimeoutError` |
| **3.1** | **Input & Safety** | Milestone year range projector (Years 1-4) | **PASS** | Projected labels: `Year 2 Milestone`, `Final Year Milestone`, `First 1-2 Years Post-Graduation` |
| **3.2** | **Input & Safety** | Prompt injection defense (delimiters & tag neutralization) | **PASS** | `test_prompt_injection_delimited_safely` neutralizes `</student_context_data>` injections |
| **3.3** | **Input & Safety** | Skill boundaries (0, 1, 50 skills) & truncation | **PASS** | `test_prompt_builder_skill_boundaries` formats empty, single, and 50 skills seamlessly |
| **3.4** | **Input & Safety** | Verified vs Self-claimed skill weighting | **PASS** | Prompt builder clearly differentiates `[Verified]` vs `[Self-Claimed]` skills |
| **4.1** | **API Behavior** | `POST /api/v1/simulations` (Auto & Custom modes) | **PASS** | Accepts auto-generation or explicit catalog `preferred_path_slugs` |
| **4.2** | **API Behavior** | Asynchronous Job Runner (`queued`, `running`, `succeeded`, `failed`) | **PASS** | Background runner processes jobs; `/jobs/{id}` returns accurate status transitions |
| **4.3** | **API Behavior** | Job tenant isolation (404 on cross-user access) | **PASS** | `test_simulation_tenant_isolation` verifies User B cannot view User A's jobs or simulations |
| **4.4** | **API Behavior** | History & Detail Endpoints | **PASS** | `GET /api/v1/simulations/history` & `GET /api/v1/simulations/{id}` return full schemas |
| **4.5** | **API Behavior** | Immutability enforcement | **PASS** | Simulation records have no update/patch endpoints; snapshots are stored as JSON |
| **4.6** | **API Behavior** | Re-simulation with "what-if" delta comparison | **PASS** | `test_resimulation_comparison_diff` computes fit score deltas and added/removed paths |
| **4.7** | **API Behavior** | Single-path regeneration | **PASS** | `POST /api/v1/simulations/{id}/regenerate-path` swaps a single track while maintaining immutability via new simulation version |
| **4.8** | **API Behavior** | Rate limit (5/hr) & SHA-256 snapshot caching | **PASS** | `test_rate_limit_and_snapshot_cache` returns cached simulation immediately without re-calling AI, and enforces 429 when quota exceeded |
| **5.1** | **Frontend Smoke** | My Paths UI (`/paths`): Run button & state machine | **PASS** | Empty state, Auto/Custom mode toggle, and Run trigger implemented |
| **5.2** | **Frontend Smoke** | Loading state & polling progress indicator | **PASS** | Polls `/jobs/{id}` every 2 seconds with visual loading indicator |
| **5.3** | **Frontend Smoke** | Simulation success view & 3-card comparison | **PASS** | Renders 3 career tracks with fit scores, Indian salary LPA bands, milestones, and JSON dump |
| **5.4** | **Frontend Smoke** | Error state with user-facing retry button | **PASS** | Displays failure alert banner with actionable retry button |
| **5.5** | **Frontend Smoke** | Double-click protection | **PASS** | Run button is disabled during submission to prevent duplicate concurrent jobs |

---

## 3. Automated Commands Run and Output Verification

### Command 1: Backend Test Suite (Phase 1 + Phase 2)
```bash
$ cd backend && ./.venv/bin/pytest --cov=app --cov-report=term-missing
```
**Output**:
```text
============================= test session starts ==============================
platform darwin -- Python 3.13.7, pytest-9.1.1, pluggy-1.7.0
rootdir: /Users/raghvendra/Desktop/Desktop/P2P/backend
configfile: pyproject.toml
plugins: cov-7.1.0, anyio-4.15.1
collected 36 items

tests/test_auth.py .....                                                 [ 13%]
tests/test_catalog.py ...                                                [ 22%]
tests/test_edge_cases.py .....                                           [ 36%]
tests/test_profile.py .                                                  [ 38%]
tests/test_simulation.py ......................                          [100%]

================================ tests coverage ================================
Name                                       Stmts   Miss  Cover   Missing
------------------------------------------------------------------------
app/core/config.py                            33      7    79%   46-52
app/core/dependencies.py                      28      7    75%   20, 29, 36, 44, 52-53, 61
app/core/limiter.py                            3      0   100%
app/core/security.py                          34      6    82%   22-23, 31, 54, 79-80
app/db/seed.py                                49      6    88%   308-316
app/db/session.py                             14      4    71%   23-27
app/main.py                                   23      2    91%   44, 58
app/models/__init__.py                         5      0   100%
app/models/catalog.py                         55      0   100%
app/models/profile.py                         61      0   100%
app/models/simulation.py                      33      0   100%
app/models/user.py                            19      0   100%
app/routers/auth.py                           65     19    71%   99-129, 160-162
app/routers/catalog.py                        23      0   100%
app/routers/profile.py                        49      6    88%   67, 111, 133, 144, 154-155
app/routers/simulation.py                     58      2    97%   152-153
app/schemas/__init__.py                        5      0   100%
app/schemas/auth.py                           27      0   100%
app/schemas/catalog.py                        20      0   100%
app/schemas/profile.py                       144      9    94%   125, 159-166
app/schemas/simulation.py                    179     10    94%   38, 97, 147, 164, 168, 184, 186, 189, 192, 215
app/services/ai/__init__.py                    3      0   100%
app/services/ai/ai_service.py                126     15    88%   48-50, 76, 79, 106-113, 137, 153, 185, 198
app/services/ai/exceptions.py                 22      1    95%   40
app/services/ai/prompts/__init__.py            1      0   100%
app/services/ai/prompts/builder.py            24      0   100%
app/services/ai/prompts/repair_prompt.py       4      0   100%
app/services/ai/prompts/system_prompt.py       1      0   100%
app/services/auth_service.py                  73      6    92%   115-116, 123-125, 138
app/services/profile_service.py              122     49    60%   106-108, 129, 152-166, 187-196, 215, 232-243, 253, 260-264, 270-281, 285-293
app/services/simulation_service.py           145     14    90%   34, 80, 237-243, 294, 341, 348, 363-364
------------------------------------------------------------------------
TOTAL                                       1448    163    89%
======================== 36 passed, 1 warning in 8.87s =========================
```

### Command 2: Backend Code Quality & Type Safety
```bash
$ cd backend && ./.venv/bin/ruff check app tests && ./.venv/bin/mypy app tests
```
**Output**:
```text
All checks passed!
Success: no issues found in 40 source files
```

### Command 3: Frontend Tests & Production Build
```bash
$ cd frontend && npx vitest run && npm run build
```
**Output**:
```text
 RUN  v2.1.9 /Users/raghvendra/Desktop/Desktop/P2P/frontend

 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  12:26:39
   Duration  1.38s

> career-path-simulator-frontend@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
✓ 1633 modules transformed.
dist/index.html                   0.53 kB │ gzip:  0.34 kB
dist/assets/index-jCsVqC-l.css   23.94 kB │ gzip:  5.03 kB
dist/assets/index-D5qtoRmR.js   317.09 kB │ gzip: 87.40 kB
✓ built in 1.65s
```

---

## 4. Defects Discovered and Resolved

1. **SQLAlchemy 2.0 / Mypy Column Typing Mismatch**:
   - *Symptom*: New `Simulation` and `SimulationJob` models initially used SQLAlchemy 1.x `Column(...)`, triggering Mypy errors when accessing model fields.
   - *Fix*: Refactored to modern SQLAlchemy 2.0 `Mapped[T] = mapped_column(...)` in `backend/app/models/simulation.py`.

2. **Test Exception Variable Type Shadowing**:
   - *Symptom*: In `tests/test_simulation.py`, `with pytest.raises(...) as exc:` reused `exc` across `AIRateLimitError`, `AISafetyBlockError`, and `AITimeoutError`, causing Mypy assignment type conflicts.
   - *Fix*: Separated exception captures into `exc_limit`, `exc_safety`, and `exc_timeout`.

3. **E2E Test Payload Dictionary Typing**:
   - *Symptom*: In `tests/e2e_live_http_test.py`, modifying nested `profile["phone"]` produced Mypy index errors due to untyped dictionary inference.
   - *Fix*: Explicitly typed `reg_payload_a: dict[str, Any]` and imported `Any`.

4. **EmptyState Action Prop Type Inconsistency**:
   - *Symptom*: `EmptyState` component required `actionText` and `onAction` instead of an `action` object.
   - *Fix*: Aligned `MyPaths.tsx` empty-state usage with the actual component prop contract.

---

## 5. Unresolved Bugs & Limitations

- **Blocker Bugs**: None.
- **Major Bugs**: None.
- **Minor / Observational Limitations**:
  - Live Gemini API execution is intentionally disabled in CI/test environments in accordance with testing rules. For local live execution, developers must populate `GEMINI_API_KEY` in `backend/.env`.

---

## 6. Final Go / No-Go Verdict

**Verdict: GO**  
Phase 2 (AI Career Simulation Engine) is fully implemented, verified, robust, and ready for Phase 3 (Results Experience & Path Selection).
