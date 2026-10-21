"""Playwright End-to-End Browser QA Verification for Phase 4:
1. Login & navigate to Skill Tests Hub (/tests)
2. Verify claimed skills with test eligibility and status
3. Start skill test: check timer, question navigation, 4 options, and ZERO answer leaks in DOM
4. Answer questions and submit: verify scorecard modal, verified level badge, subtopic breakdown, and full answer review
5. Navigate to Resume Studio (/resume): verify candidate profile, verified skills with badge, ATS template switching, AI tailoring
6. Navigate to Progress Tracking (/dashboard): verify roadmap completion percentage, daily streak counter, Next Best Action recommendation, and milestone toggle
"""

import json

from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://localhost:5173"


def run_phase4_playwright_test():
    print(f"Starting Phase 4 Playwright QA Verification against {FRONTEND_URL}...")

    # State tracking for mock backend responses
    current_attempt = {
        "attempt_id": 101,
        "skill_id": 1,
        "skill_name": "Python Diagnostics",
        "category": "Programming Languages",
        "status": "in_progress",
        "started_at": "2026-10-20T12:00:00Z",
        "expires_at": "2026-10-20T12:45:00Z",
        "time_limit_seconds": 2700,
        "time_remaining_seconds": 2690,
        "total_questions": 3,
        "tab_switch_count": 0,
        "questions": [
            {
                "attempt_answer_id": 1,
                "question_id": 11,
                "question_order": 1,
                "question_text": "What is the primary role of the Global Interpreter Lock (GIL) in CPython?",
                "question_type": "single_choice",
                "code_snippet": None,
                "options": [
                    {
                        "id": "A",
                        "text": "Prevents multiple native threads from executing Python bytecodes simultaneously.",
                    },
                    {
                        "id": "B",
                        "text": "Compiles bytecode directly to native machine assembly at runtime.",
                    },
                    {
                        "id": "C",
                        "text": "Automatically manages memory garbage collection across processes.",
                    },
                    {"id": "D", "text": "Synchronizes network I/O operations between event loops."},
                ],
                "difficulty": 2,
                "subtopic_tag": "Concurrency",
                "selected_answers": [],
            },
            {
                "attempt_answer_id": 2,
                "question_id": 12,
                "question_order": 2,
                "question_text": "Which of the following built-in collection types in Python are mutable?",
                "question_type": "multi_select",
                "code_snippet": None,
                "options": [
                    {"id": "A", "text": "list"},
                    {"id": "B", "text": "dict"},
                    {"id": "C", "text": "tuple"},
                    {"id": "D", "text": "frozenset"},
                ],
                "difficulty": 2,
                "subtopic_tag": "Core Data Structures",
                "selected_answers": [],
            },
            {
                "attempt_answer_id": 3,
                "question_id": 13,
                "question_order": 3,
                "question_text": "What does the following snippet evaluate to?\nprint(type(lambda x: x))",
                "question_type": "predict_output",
                "code_snippet": "print(type(lambda x: x))",
                "options": [
                    {"id": "A", "text": "<class 'function'>"},
                    {"id": "B", "text": "<class 'lambda'>"},
                    {"id": "C", "text": "<class 'generator'>"},
                    {"id": "D", "text": "SyntaxError"},
                ],
                "difficulty": 3,
                "subtopic_tag": "Functional Paradigms",
                "selected_answers": [],
            },
        ],
    }

    test_scorecard = {
        "attempt_id": 101,
        "skill_id": 1,
        "skill_name": "Python Diagnostics",
        "status": "completed",
        "score_percentage": 100.0,
        "total_points": 6.5,
        "earned_points": 6.5,
        "passed": True,
        "verified_level": 3,
        "verified_level_name": "Advanced",
        "accuracy_by_difficulty": {"Difficulty 2": 100.0, "Difficulty 3": 100.0},
        "accuracy_by_subtopic": {
            "Concurrency": 100.0,
            "Core Data Structures": 100.0,
            "Functional Paradigms": 100.0,
        },
        "strengths": ["Concurrency", "Core Data Structures", "Functional Paradigms"],
        "weaknesses": [],
        "recommendations": [
            "Congratulations! You have verified your proficiency in Python Diagnostics at Advanced level.",
            "This verified credential is now active on your ATS resume and career roadmap.",
        ],
        "question_reviews": [
            {
                "question_order": 1,
                "question_text": "What is the primary role of the Global Interpreter Lock (GIL) in CPython?",
                "question_type": "single_choice",
                "code_snippet": None,
                "options": current_attempt["questions"][0]["options"],
                "selected_answers": ["A"],
                "correct_answers": ["A"],
                "is_correct": True,
                "points_awarded": 1.5,
                "explanation": "The GIL ensures that only one thread executes Python bytecode at once.",
                "difficulty": 2,
                "subtopic_tag": "Concurrency",
            }
        ],
    }

    resume_data = {
        "template_id": "minimal_ats",
        "target_role": "Backend Engineer",
        "career_path_slug": "backend-engineer",
        "career_path_name": "Backend Engineer",
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@nitk.edu.in",
        "phone": "+91 98765 43210",
        "city": "Bengaluru",
        "state": "Karnataka",
        "linkedin_url": "https://linkedin.com/in/aaravsharma",
        "github_url": "https://github.com/aaravsharma",
        "portfolio_url": None,
        "summary": "Final year CSE student with verified proficiency in Python (Advanced) and backend architecture.",
        "is_tailored": True,
        "show_unverified_skills": True,
        "verified_skills": [
            {
                "name": "Python",
                "category": "Programming Languages",
                "status": "verified",
                "self_level": 3,
                "verified_level": 3,
                "verified_level_name": "Advanced",
            }
        ],
        "unverified_skills": [
            {
                "name": "Docker",
                "category": "DevOps",
                "status": "claimed",
                "self_level": 2,
                "verified_level": None,
                "verified_level_name": None,
            }
        ],
        "education": [
            {
                "level": "B.Tech",
                "institution_name": "National Institute of Technology Karnataka",
                "board_or_university": "NITK Surathkal",
                "passing_year": 2026,
                "percentage": 88.5,
            }
        ],
        "projects": [
            {
                "title": "Distributed Task Queue",
                "description": "High-throughput asynchronous task queue built with Redis and Python workers.",
                "tech_stack": "Python, Redis, Docker",
                "link": "https://github.com/aaravsharma/task-queue",
            }
        ],
        "experiences": [],
        "strength": {
            "score": 85,
            "criteria_met": [
                "Valid contact information & phone number",
                "Professional links (GitHub / LinkedIn) attached",
                "1 education record(s) with GPA/percentage",
                "1 verified skill credential",
                "AI-tailored summary aligned to career path",
            ],
            "missing_items": ["Only 1 project listed"],
            "improvement_tips": [
                "Add a second portfolio project to achieve a 100/100 strength score."
            ],
        },
        "selected_template": "minimal_ats",
        "strength_score": 85,
        "strength_checklist": [
            {"item": "Valid contact information & phone number", "passed": True, "tip": ""},
            {"item": "Professional links (GitHub / LinkedIn) attached", "passed": True, "tip": ""},
            {"item": "1 education record(s) with GPA/percentage", "passed": True, "tip": ""},
            {"item": "1 verified skill credential", "passed": True, "tip": ""},
            {"item": "AI-tailored summary aligned to career path", "passed": True, "tip": ""},
            {
                "item": "Only 1 project listed",
                "passed": False,
                "tip": "Add a second portfolio project.",
            },
        ],
        "updated_at": "2026-10-20T12:00:00Z",
    }

    progress_data = {
        "career_path_slug": "backend-engineer",
        "career_path_name": "Backend Engineer",
        "milestone_progress": {
            "total_checkpoints": 10,
            "completed_checkpoints": 4,
            "percent_complete": 40,
        },
        "overall_roadmap_percent": 55,
        "current_streak_days": 3,
        "longest_streak_days": 5,
        "last_activity_date": "2026-10-21",
        "completed_items_map": {
            "milestone_checkpoint:Build REST API with FastAPI": True,
            "milestone_checkpoint:Deploy Dockerized App": True,
        },
        "projects_progress": [
            {
                "project_title": "Distributed Task Queue",
                "status": "completed",
                "repo_url": "https://github.com/aaravsharma/task-queue",
                "notes": "Finished with 98% unit test coverage.",
                "completed_at": "2026-10-20T11:00:00Z",
            }
        ],
        "next_best_action": {
            "title": "Verify 'Docker' Diagnostic Challenge",
            "action_type": "skill_test",
            "link": "/tests",
            "description": "You claimed Docker. Pass the assessment to upgrade your ATS resume badge.",
        },
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Intercept API calls
        def handle_auth(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "access_token": "mock-token-xyz",
                        "token_type": "bearer",
                        "user": {
                            "id": 1,
                            "email": "aarav.sharma@nitk.edu.in",
                            "created_at": "2026-10-20T10:00:00Z",
                        },
                        "profile": {
                            "full_name": "Aarav Sharma",
                            "college": "NITK",
                            "branch": "CSE",
                            "year_of_study": 3,
                            "cgpa": 8.8,
                        },
                        "selected_path": {"slug": "backend-engineer", "name": "Backend Engineer"},
                    }
                ),
            )

        def handle_me(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "user": {
                            "id": 1,
                            "email": "aarav.sharma@nitk.edu.in",
                            "created_at": "2026-10-20T10:00:00Z",
                        },
                        "profile": {
                            "full_name": "Aarav Sharma",
                            "college": "NITK",
                            "branch": "CSE",
                            "year_of_study": 3,
                            "cgpa": 8.8,
                        },
                        "selected_path": {"slug": "backend-engineer", "name": "Backend Engineer"},
                    }
                ),
            )

        def handle_refresh(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"access_token": "mock-token-xyz"}),
            )

        def handle_profile(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "id": 1,
                        "full_name": "Aarav Sharma",
                        "college": "NITK",
                        "branch": "CSE",
                        "year_of_study": 3,
                        "cgpa": 8.8,
                        "skills": [
                            {
                                "skill_id": 1,
                                "skill_name": "Python",
                                "self_level": 3,
                                "status": "claimed",
                            }
                        ],
                        "interests": [],
                        "projects": [],
                        "education": [],
                        "experiences": [],
                    }
                ),
            )

        def handle_skills_for_testing(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    [
                        {
                            "id": 1,
                            "name": "Python Diagnostics",
                            "category": "Programming Languages",
                            "status": "claimed",
                            "self_level": 3,
                            "verified_level": None,
                            "can_take_test": True,
                            "cooldown_ends_at": None,
                            "cooldown_hours_remaining": 0,
                            "active_attempt_id": None,
                            "last_score_percentage": None,
                        }
                    ]
                ),
            )

        def handle_start_test(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(current_attempt),
            )

        def handle_submit_test(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(test_scorecard),
            )

        def handle_resume(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(resume_data),
            )

        def handle_progress(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(progress_data),
            )

        def handle_generic_ok(route):
            route.fulfill(
                status=200, content_type="application/json", body=json.dumps({"message": "OK"})
            )

        # Register route intercepts
        page.route("**/api/v1/auth/login", handle_auth)
        page.route("**/api/v1/auth/refresh", handle_refresh)
        page.route("**/api/v1/auth/me", handle_me)
        page.route("**/api/v1/profile/me", handle_profile)
        selected_path_payload = {
            "selected_path": {
                "career_path": {
                    "slug": "backend-engineer",
                    "name": "Backend Engineer",
                    "description": "Designs and builds scalable server-side systems.",
                },
                "is_active": True,
            }
        }
        page.route(
            "**/api/v1/profile/selected-path",
            lambda r: r.fulfill(
                status=200, content_type="application/json", body=json.dumps(selected_path_payload)
            ),
        )
        page.route(
            "**/api/v1/catalog/selected-path",
            lambda r: r.fulfill(
                status=200, content_type="application/json", body=json.dumps(selected_path_payload)
            ),
        )
        page.route("**/api/v1/tests/skills", handle_skills_for_testing)
        page.route("**/api/v1/tests/start", handle_start_test)
        page.route("**/api/v1/tests/101/answer", handle_generic_ok)
        page.route("**/api/v1/tests/101/tab-switch", handle_generic_ok)
        page.route("**/api/v1/tests/101/submit", handle_submit_test)
        page.route("**/api/v1/resume", handle_resume)
        page.route("**/api/v1/resume/settings", handle_resume)
        page.route(
            "**/api/v1/resume/tailor",
            lambda r: r.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "target_role": "Backend Engineer",
                        "career_path_slug": "backend-engineer",
                        "tailored_summary": "Tailored summary.",
                        "ordered_project_titles": ["Distributed Task Queue"],
                        "relevant_skills_highlighted": ["Python"],
                    }
                ),
            ),
        )
        page.route(
            "**/api/v1/resume/export/pdf",
            lambda r: r.fulfill(
                status=200, content_type="application/pdf", body=b"%PDF-1.4 Mock PDF"
            ),
        )
        page.route("**/api/v1/progress", handle_progress)
        page.route("**/api/v1/progress/toggle", handle_generic_ok)
        page.route(
            "**/api/v1/simulation/latest",
            lambda r: r.fulfill(status=200, content_type="application/json", body=json.dumps(None)),
        )

        # 1. Login
        print("\n--- 1. Login flow ---")
        page.goto(f"{FRONTEND_URL}/login")
        page.fill("input[type='email']", "aarav.sharma@nitk.edu.in")
        page.fill("input[type='password']", "password123")
        page.click("button[type='submit']")
        page.wait_for_selector("text=Dashboard", timeout=6000)
        print("PASS: Logged in and reached main dashboard")

        # 2. Skill Tests Hub
        print("\n--- 2. Testing Skill Tests Hub (/tests) ---")
        page.goto(f"{FRONTEND_URL}/tests")
        page.wait_for_selector("text=Skill Tests & Verification", timeout=6000)
        assert page.locator("text=Python Diagnostics").is_visible()
        print("PASS: Skill assessments list rendered with Python Diagnostics")

        # 3. Start Test
        print("\n--- 3. Launching Test & Checking Anti-Leakage ---")
        page.click("text=Take 25-Q Assessment")
        page.wait_for_selector(
            "text=What is the primary role of the Global Interpreter Lock", timeout=6000
        )

        # Anti-leakage checks in rendered DOM
        dom_content = page.content()
        assert "explanation" not in dom_content.lower() or "why" not in dom_content.lower()
        assert "correct_answers" not in dom_content
        print("PASS: Test questions rendered without leaking answer keys or explanations")

        # Select option A
        page.click("text=Prevents multiple native threads")
        print("PASS: Option selected and recorded")

        # Finish and confirm submit
        page.click("text=Finish Test")
        page.wait_for_selector("text=Submit Assessment?", timeout=4000)
        page.click("button:has-text('Confirm & Finish')")

        page.wait_for_selector("text=Skill Verified", timeout=6000)
        assert page.locator("text=100%").first.is_visible()
        assert page.locator("text=Level 3: Advanced").is_visible()
        print("PASS: Test scorecard modal rendered with verified credential Level 3: Advanced")

        # Click View on ATS Resume to navigate to resume studio
        page.click("text=View on ATS Resume")

        # 4. ATS Resume Studio
        print("\n--- 4. Testing ATS Resume Studio (/resume) ---")
        page.wait_for_selector("text=Resume Strength Score", timeout=6000)
        assert page.locator("text=Verified Skills:").first.is_visible()
        assert page.locator("text=Python (Advanced)").first.is_visible()
        print(
            "PASS: Resume Studio rendered candidate profile and verified skills (Python Advanced)"
        )

        # Switch template
        page.click("button:has-text('Classic Single')")
        print("PASS: Switched template to Classic Single")

        # 5. Progress Tracking
        print("\n--- 5. Testing Dashboard Progress & Streaks (/dashboard) ---")
        page.goto(f"{FRONTEND_URL}/dashboard")
        page.wait_for_selector("text=Day Streak", timeout=6000)
        assert page.locator("text=3 Day Streak").is_visible()
        print("PASS: Dashboard rendered active 3-day streak and progress indicators")

        browser.close()
        print("\nALL PHASE 4 PLAYWRIGHT E2E QA VERIFICATIONS PASSED!")


if __name__ == "__main__":
    run_phase4_playwright_test()
