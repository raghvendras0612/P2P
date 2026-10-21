# Phase 4 QA Report: Skill Testing, ATS Resume Studio & Progress Tracking

**Date**: 2026-10-21  
**Phase**: Phase 4 – Skill Testing Engine, Dynamic ATS Resume Builder & Daily Progress Tracking  
**Application**: Career Path Simulator for Indian Engineering Students  
**Independent QA Status**: **GO for Phase 5** (All 6 Criteria Met, Zero Open Defects, 91% Backend Test Coverage)

---

## 1. Executive Summary

Phase 4 introduces three interconnected core pillars:
1. **Diagnostic Skill Testing Engine**: AI-generated 25-question technical assessments calibrated to Indian hiring screening standards with anti-leakage defenses, proctoring tab-switch logging, 45-minute countdown timers, and strict 7-day cooldowns.
2. **Automated ATS Resume Studio**: Compiles student profile data, education history, portfolio projects, and verified credentials into ATS-compliant formats with ReportLab vector PDF export, Markdown export, and injection-hardened AI career tailoring.
3. **Daily Progress Tracking & Streak System**: Indian timezone-aware (`Asia/Kolkata`) daily activity streaks, milestone checkpoint toggles, and feedback loops into future AI simulations to prevent redundant recommendations.

Testing was conducted adhering to independent QA principles:
- **Evidence Over Claims**: Every single requirement was exercised with automated tests and headless browser automation (Playwright). No requirement was marked PASS from reading code alone.
- **Strict Mock AI Guarantee**: Zero calls to the external Gemini API were made during automated testing. All AI interactions were driven by schema-compliant mocks and repair retry harnesses.
- **Full-Stack Regression**: Phases 1, 2, and 3 test suites, linting checks, type-checking, and frontend builds were run continuously and passed without regression.
- **Defects Identified and Remediated**: 8 distinct defects across validation schemas, scoring thresholds, timezone boundaries, prompt sanitization, anti-hallucination filtering, and API routing were isolated, patched, and verified with regression tests.

---

## 2. Requirements Verification Matrix

| # | Requirement | Scope & Acceptance Criteria | Status | Evidence & Test Verification |
|---|---|---|:---:|---|
| 1 | **Phases 1–3 Regression** | Full backend test suite, frontend vitest suite, ruff lint, mypy type-check, and Vite production build must pass cleanly. | **PASS** | `pytest` (93/93 passed), `vitest` (31/31 passed across 6 test suites), `ruff check` (0 errors), `mypy app` (0 issues across 48 source files), `tsc && vite build` (builds in 2.73s). |
| 2 | **Question Generation & Schema Validation** | Valid batches pass. Reject: `< 20` or `> 30` questions; skewed difficulty distribution (~30% easy, ~40% med, ~30% hard); duplicate or near-duplicate questions; single-choice with `0` or `2+` correct options; multi-select with `< 2` answers; correct answer not in options; answer leaked in question text; missing explanations; difficulty outside `1–5`. | **PASS** | Verified in `backend/tests/test_phase4_qa_validation.py` across 11 test cases exercising all Pydantic validators and regex leakage filters. |
| 3 | **Repair Retry & Bank Caching** | Initial malformed AI output triggers repair prompt; second failure cleanly returns HTTP 502. Subsequent test starts for same skill reuse cached question bank without calling Gemini. Ascending question ordering from easy to hard. | **PASS** | Verified in `test_phase4_qa_validation.py` (`test_question_service_caching_and_ordering` and `test_question_service_double_failure_clean_error`). Second test start for same skill makes 0 additional AI calls. |
| 4 | **Test Anti-Leakage & Session Security** | Active test session payload returns question ID, text, options, difficulty, subtopic; answers and explanations NEVER leaked before submit. 45-minute countdown timer enforces expiration. | **PASS** | Verified in `backend/tests/test_phase4_qa_integrity.py` (`test_zero_answer_leakage_and_field_completeness` and `test_45_min_timer_expiration`). Every question field asserted for absence of `correct_answers` or `explanation`. |
| 5 | **Cooldown & Active Attempt Guard** | Single active attempt per user per skill. Resuming mid-test preserves answers. 7-day cooldown enforced after test completion (HTTP 429 with remaining hours); retake permitted after 7 days. Unclaimed skills rejected. | **PASS** | Verified in `test_phase4_qa_integrity.py` (`test_7_day_cooldown_enforcement_and_expiry`). Active attempt re-entry verified in `test_skill_testing_api.py`. |
| 6 | **Cross-Tenant Security** | User B cannot view, answer, submit, or inspect results of User A's test attempt or progress tracking items (HTTP 404/403). | **PASS** | Verified in `test_phase4_qa_integrity.py` (`test_cross_tenant_test_isolation`) and `test_phase4_qa_progress.py` (`test_progress_cross_tenant_isolation`). |
| 7 | **Scoring & Multi-Select Partial Credit** | 100% on all correct; 0% on all wrong; multi-select awards partial credit for correct options with 0 false positives; strict 0 points if any false positive selected; skipped questions score 0 points. | **PASS** | Hand-calculated and verified in `backend/tests/test_phase4_qa_scoring.py` (`test_score_all_correct_is_100`, `test_score_all_wrong_is_zero`, `test_multi_select_partial_credit_and_penalties`). |
| 8 | **Level Thresholds & Overclaiming** | `< 60.0%` Fail; `60.0%–74.9%` Level 1 (Beginner); `75.0%–84.9%` Level 2 (Intermediate); `85.0%+` Level 3 (Advanced) or Level 4 (Expert if hard accuracy $\ge 60\%$). Overclaimed skills downgraded to measured score level; failed skills marked failed. | **PASS** | Tested exact boundary conditions (59.9% vs 60.0%, 74.9% vs 75.0%, 84.9% vs 85.0%) in `test_phase4_qa_scoring.py`. Overclaiming downgrade verified from Level 4 to Level 1. |
| 9 | **Knowledge Profile Feedback Loop** | Passed tests update `UserSkill` status to `"verified"` with `verified_level`. Failed tests log weak subtopics into student profile. Skill growth timeline records test score, timestamp, and score change. | **PASS** | Verified in `test_phase4_qa_scoring.py` (`test_overclaiming_and_proficiency_history`), `test_knowledge_profile.py`, and `test_progress_api.py`. |
| 10 | **Resume Auto-Compilation & Field Integrity** | Resume compiles automatically from profile + education + projects + verified skills + active track. Failed skills NEVER appear as verified. | **PASS** | Verified field-by-field in `backend/tests/test_phase4_qa_resume.py` (`test_resume_compilation_field_by_field_and_failed_suppression`). Failed skills completely excluded from resume. |
| 11 | **AI Resume Tailoring Safety & Anti-Hallucination** | Tailoring prompt neutralizes prompt injection breakout attempts (e.g. `</student_context_data>`). Output sanitization strips hallucinated project titles or unearned skills. | **PASS** | Verified in `test_phase4_qa_resume.py` (`test_tailor_resume_prompt_injection_neutralization` and `test_tailor_resume_anti_hallucination`). Non-existent projects and skills filtered out. |
| 12 | **ATS Templates & Vector PDF Export** | Switch between Minimal ATS, Classic Single, and Modern Compact. PDF export produces genuine vector text (selectable, ATS-parsable). Markdown and JSON exports match schemas. | **PASS** | Verified in `test_phase4_qa_resume.py` (`test_ats_templates_and_pdf_vector_export` and `test_markdown_and_json_export`). Vector fonts and `%PDF-1.4` signatures verified. |
| 13 | **Resume Strength Score** | Completeness score evaluated across 5 progressive profile tiers (15% to 100%) with actionable tips for Indian technical hiring. | **PASS** | Tested with 5 distinct profile tiers in `test_phase4_qa_resume.py` (`test_resume_strength_calculation_across_five_profiles`). |
| 14 | **Progress Persistence & Streak Mechanics** | Checkpoints persist across page reloads. Streak increments on first daily activity; does not double-increment on second task. Resets to 0 on missed days. Evaluated in Indian timezone (`Asia/Kolkata`). | **PASS** | Verified in `backend/tests/test_phase4_qa_progress.py` (`test_progress_toggle_persistence_and_reversibility` and `test_streak_ist_single_increment_and_broken_streak_zero`). |
| 15 | **Progress Feedback into Re-Simulation** | Completed milestone checkpoints and projects carry over into student snapshot (`completed_progress_items`) and AI prompt instruction 9 (PROGRESS CONTINUITY). | **PASS** | Verified in `test_phase4_qa_progress.py` (`test_completed_progress_items_feed_into_resimulation_prompt`). Prompt verified to instruct AI not to assign completed items as pending work. |
| 16 | **End-to-End User Experience (Playwright)** | Full user walkthrough: login $\to$ Skill Tests Hub $\to$ test launch with timer $\to$ answer autosave $\to$ submit & scorecard $\to$ ATS Resume Studio $\to$ template switch $\to$ Dashboard streak update. | **PASS** | Verified in `backend/tests/test_phase4_qa_e2e_playwright.py`. All 5 interaction stages executed and verified in headless Chromium. |

---

## 3. Automated Test Execution & Results

### 3.1 Backend Test Suite (`pytest`)
```bash
backend/.venv/bin/pytest -v backend/tests/
```
**Output**: `93 passed, 1 warning in 10.55s`

```
backend/tests/test_auth.py .....                                         [  5%]
backend/tests/test_catalog.py ...                                        [  8%]
backend/tests/test_edge_cases.py .....                                   [ 13%]
backend/tests/test_knowledge_profile.py .                                [ 15%]
backend/tests/test_path_selection.py ........                            [ 23%]
backend/tests/test_phase4_qa_integrity.py ....                           [ 27%]
backend/tests/test_phase4_qa_progress.py ....                            [ 32%]
backend/tests/test_phase4_qa_resume.py ......                            [ 38%]
backend/tests/test_phase4_qa_scoring.py .....                            [ 44%]
backend/tests/test_phase4_qa_validation.py ...........                   [ 55%]
backend/tests/test_profile.py .                                          [ 56%]
backend/tests/test_progress_api.py .....                                 [ 62%]
backend/tests/test_question_service.py ..                                [ 64%]
backend/tests/test_resume_api.py ....                                    [ 68%]
backend/tests/test_simulation.py ......................                  [ 92%]
backend/tests/test_skill_testing_api.py .......                          [100%]
======================== 93 passed, 1 warning in 10.55s ========================
```

### 3.2 Backend Code Coverage (`pytest-cov`)
```bash
backend/.venv/bin/pytest --cov=app backend/tests/
```
**Total Coverage**: **91%** across 2,897 statements (268 misses).
Key service coverage:
- `backend/app/services/pdf_generator.py`: **98%**
- `backend/app/services/resume_service.py`: **95%**
- `backend/app/services/simulation_service.py`: **90%**
- `backend/app/services/test_engine_service.py`: **86%**
- `backend/app/services/progress_service.py`: **83%**
- `backend/app/services/ai/question_service.py`: **80%**
- `backend/app/services/knowledge_profile_service.py`: **100%**
- `backend/app/schemas/testing.py`: **97%**
- `backend/app/schemas/resume.py`: **100%**
- `backend/app/schemas/progress.py`: **100%**

### 3.3 Code Hygiene & Type Safety
- **Ruff Linter**: `ruff check .` $\to$ **All checks passed! (0 errors)**
- **Mypy Static Typing**: `mypy app` $\to$ **Success: no issues found in 48 source files**

### 3.4 Frontend Test Suite (`vitest`)
```bash
cd frontend && npm test -- --run
```
**Output**: `6 test files passed, 31 tests passed in 2.22s`
- `src/test/phase4_tests.test.tsx` (5 tests): Skill Tests Hub, Anti-Leakage, Autosave, Scorecard Modal.
- `src/test/phase4_resume.test.tsx` (4 tests): Candidate Profile, Verified Skills, Template Switching, PDF Download.
- `src/test/personalization.test.tsx` (2 tests): Dashboard Personalization & Active Track Adapter.
- `src/test/results.test.tsx` (11 tests): Overview, Compare, Skill Radar, Roadmap, 30-Day Sprint.
- `src/test/paths.test.tsx` (3 tests): Simulation Polling, History, Custom Mode.
- `src/test/wizard.test.tsx` (6 tests): Multi-step onboarding validation.

### 3.5 Frontend Production Build (`tsc && vite build`)
```bash
cd frontend && npm run build
```
**Output**: `built in 2.73s` with zero TypeScript errors.

### 3.6 Playwright End-to-End Walkthrough
```bash
backend/.venv/bin/python backend/tests/test_phase4_qa_e2e_playwright.py
```
**Output**:
```
Starting Phase 4 Playwright QA Verification against http://localhost:5173...

--- 1. Login flow ---
PASS: Logged in and reached main dashboard

--- 2. Testing Skill Tests Hub (/tests) ---
PASS: Skill assessments list rendered with Python Diagnostics

--- 3. Launching Test & Checking Anti-Leakage ---
PASS: Test questions rendered without leaking answer keys or explanations
PASS: Option selected and recorded
PASS: Test scorecard modal rendered with verified credential Level 3: Advanced

--- 4. Testing ATS Resume Studio (/resume) ---
PASS: Resume Studio rendered candidate profile and verified skills (Python Advanced)
PASS: Switched template to Classic Single

--- 5. Testing Dashboard Progress & Streaks (/dashboard) ---
PASS: Dashboard rendered active 3-day streak and progress indicators

ALL PHASE 4 PLAYWRIGHT E2E QA VERIFICATIONS PASSED!
```

---

## 4. Defects Detected and Remediated During QA

### Defect 1: Insufficient Batch and Question Schema Validation
- **Symptom**: `GeneratedQuestionBatch` accepted batches with skewed difficulty distributions (e.g., 100% easy), duplicate questions, single-choice questions with multiple correct options, and questions with answer leakage in the text.
- **Root Cause**: Schema lacked custom model validators and difficulty distribution checks.
- **Remediation**: Added `validate_question_integrity` on `GeneratedQuestion` enforcing strictly 1 correct option for single choice, $\ge 2$ for multi-select, and regex checks for leaked answer patterns (e.g. `correct answer is [A-D]`). Added `validate_batch_quality` on `GeneratedQuestionBatch` enforcing 20–30 count limits, normalized string duplicate detection, and difficulty ratio checks (~30% easy, ~40% medium, ~30% hard).
- **Files Modified**: `backend/app/schemas/testing.py`.

### Defect 2: Binary All-or-Nothing Scoring for Multi-Select Questions
- **Symptom**: If a student selected 1 correct option out of 2 without picking any false positives, they received 0 points.
- **Root Cause**: Evaluated using strict set equality `user_selected == correct_set`.
- **Remediation**: Replaced with proportional partial credit formula: if any false positive is selected, awarded 0.0 points; if 0 false positives are selected, awarded partial points proportional to correct options chosen (`earned = total * len(chosen & correct) / len(correct)`).
- **Files Modified**: `backend/app/services/test_engine_service.py`.

### Defect 3: Beginner Level (Level 1) Threshold Unreachable
- **Symptom**: Students scoring between 60.0% and 74.9% were assigned `verified_lvl = 2` (Intermediate), making Level 1 (Beginner) completely unreachable.
- **Root Cause**: Condition was `elif score_pct >= 60.0: verified_lvl = 2`.
- **Remediation**: Mapped `< 60.0%` to Fail (`None`), `60.0%–74.9%` to Level 1 (Beginner), `75.0%–84.9%` to Level 2 (Intermediate), `85.0%+` to Level 3 (Advanced) or Level 4 (Expert if hard question accuracy $\ge 60\%$).
- **Files Modified**: `backend/app/services/test_engine_service.py`.

### Defect 4: Broken Daily Streak Reported Stale Active Count
- **Symptom**: When a user was inactive for several days, `GET /api/v1/progress` continued reporting their old streak count (e.g., 3 days) rather than resetting to 0.
- **Root Cause**: `get_progress()` returned `streak.current_streak_days` straight from the database without checking if `last_activity_date` was within `[today, yesterday]`.
- **Remediation**: Implemented `effective_current_streak = streak.current_streak_days if streak.last_activity_date in (today, yesterday) else 0`.
- **Files Modified**: `backend/app/services/progress_service.py`.

### Defect 5: Timezone Mismatch Causing Streak Failures at Midnight IST
- **Symptom**: Streak incremented or reset incorrectly around midnight IST because dates were computed in `timezone.utc`.
- **Root Cause**: At 11:30 PM or 12:30 AM IST, UTC date differed from Indian calendar day.
- **Remediation**: Refactored `_record_activity` and `get_progress` to calculate calendar days using `ZoneInfo("Asia/Kolkata")`.
- **Files Modified**: `backend/app/services/progress_service.py`.

### Defect 6: Simulation Snapshots Omitted Completed Progress Items
- **Symptom**: Re-running a career simulation repeated already-completed milestones and projects as pending recommendations.
- **Root Cause**: `build_student_profile_snapshot()` did not query `ProgressItem`.
- **Remediation**: Added query for `ProgressItem` where `status == "completed"` into `snapshot["completed_progress_items"]`. Added instruction 9 (`PROGRESS CONTINUITY`) in `builder.py` instructing Gemini not to re-recommend completed milestones.
- **Files Modified**: `backend/app/services/simulation_service.py`, `backend/app/services/ai/prompts/builder.py`.

### Defect 7: Prompt Injection & Hallucination Vulnerability in Resume Tailoring
- **Symptom**: User-supplied project descriptions could escape context tags. In addition, AI could hallucinate non-existent projects or skills in the tailored output.
- **Root Cause**: `tailor_resume_for_path()` injected raw JSON into prompt and blindly trusted AI output lists.
- **Remediation**: Sanitized user text with `sanitize_text`, wrapped context inside `<student_context_data>`, and added strict post-filtering on `ordered_project_titles` and `relevant_skills_highlighted` against real student records.
- **Files Modified**: `backend/app/services/resume_service.py`.

### Defect 8: Frontend API Mismatch on Resume Settings & Checklist
- **Symptom**: Frontend `api.resume.updateSettings` called `PUT /api/v1/resume/settings` with `template_name`, but backend only had `PUT /api/v1/resume` with `template_id`. Furthermore, `ResumeStudio` crashed if `strength_checklist` was missing.
- **Root Cause**: Endpoint and property naming divergence between frontend and backend.
- **Remediation**: Added `@router.put("/settings")` alias to `resume.py`, expanded `UpdateResumeSettingsRequest` to accept both `template_id` and `template_name`, and added `strength_score` and `strength_checklist` directly to `ResumeCompiledData`.
- **Files Modified**: `backend/app/routers/resume.py`, `backend/app/schemas/resume.py`, `backend/app/services/resume_service.py`.

---

## 5. Bugs Not Fixed

**None.** (0 open defects; all identified defects have been resolved and verified with automated regression tests).

---

## 6. Go / No-Go Verdict

### **VERDICT: GO FOR PHASE 5**

**Justification**:
1. All Phase 4 requirements (Skill Testing, Dynamic ATS Resume Studio, Daily Progress Tracking & Streaks) have been thoroughly tested and verified.
2. Zero regressions across Phases 1, 2, and 3: 93 backend tests pass with 91% code coverage; 31 frontend vitest tests pass; linting and type-checking report 0 errors; production builds compile cleanly.
3. Anti-leakage, proctoring security, prompt injection defenses, anti-hallucination sanitization, and cross-tenant isolation have been rigorously proven with automated tests.
4. The system is structurally sound and ready for Phase 5 (AI Placement Mentor).
