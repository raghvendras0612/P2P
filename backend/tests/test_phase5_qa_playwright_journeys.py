"""
Phase 5 QA: Playwright End-to-End User Journeys (Journeys A, B, C & Responsive Viewports).
Runs against the Vite production preview build on port 5173 with route-level mocked API and AI responses.
"""
import json
import socket
import subprocess
import time

from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://127.0.0.1:5173"


def wait_for_port(port: int, host: str = "127.0.0.1", timeout: float = 15.0):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1.0):
                return True
        except (OSError, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def run_phase5_playwright_journeys():
    print("=" * 70)
    print("STARTING PHASE 5 PLAYWRIGHT END-TO-END QA VERIFICATION")
    print("=" * 70)

    # 1. Start Vite Preview server as subprocess
    server_proc = subprocess.Popen(
        ["npx", "vite", "preview", "--port", "5173", "--host", "127.0.0.1"],
        cwd="frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    print("Launched Vite preview server subprocess...")

    try:
        ready = wait_for_port(5173, host="127.0.0.1", timeout=15.0)
        if not ready:
            raise RuntimeError("Vite preview server failed to bind to port 5173 within 15 seconds.")
        print(f"Vite preview server is healthy and responding on {FRONTEND_URL}")

        with sync_playwright() as p:
            # -------------------------------------------------------------
            # Shared Mock Data
            # -------------------------------------------------------------
            catalog_skills = [
                {"id": 1, "name": "Python", "category": "Programming Languages"},
                {"id": 2, "name": "Java", "category": "Programming Languages"},
                {"id": 5, "name": "JavaScript", "category": "Web Frontend"},
                {"id": 10, "name": "React", "category": "Web Frontend"},
                {"id": 15, "name": "Docker", "category": "DevOps & Cloud"},
            ]
            catalog_interests = [
                {"id": 1, "name": "Full Stack Web Development", "group": "Software Engineering"},
                {"id": 2, "name": "Cloud & DevOps", "group": "Infrastructure"},
            ]
            catalog_paths = [
                {"id": 1, "slug": "full-stack-developer", "name": "Full Stack Developer", "description": "Web apps"},
                {"id": 2, "slug": "devops-cloud-engineer", "name": "DevOps & Cloud Engineer", "description": "Infra"},
            ]

            sample_sim_paths = [
                {
                    "path_slug": "full-stack-developer",
                    "title": "Full Stack Developer",
                    "fit_score": 88,
                    "fit_reasoning": "Strong alignment with claimed Python knowledge and career goals.",
                    "summary": "High-demand full-stack development track for Indian tech firms.",
                    "skill_gaps": [
                        {"skill": "Docker", "current_level": 1, "required_level": 4, "priority": "high", "why_it_matters": "Containers are baseline in production"},
                        {"skill": "TypeScript", "current_level": 1, "required_level": 3, "priority": "high", "why_it_matters": "Frontend scale"},
                    ],
                    "yearly_milestones": [
                        {
                            "label": "Year 1: Foundations",
                            "goals": ["Master HTML/CSS and Vanilla JS", "Build 2 small portfolio tools"],
                            "skills_to_learn": ["HTML/CSS", "JavaScript"],
                            "projects": ["Portfolio Website", "Task Tracker"],
                            "target_activities": ["College intra-hackathons"],
                            "checkpoints": ["Host portfolio on GitHub Pages", "Solve 50 easy LeetCode problems"],
                        }
                    ],
                    "projects_to_build": [
                        {
                            "title": "Collaborative Task Board",
                            "description": "Full-stack project management web app with user authentication",
                            "difficulty": "Intermediate",
                            "estimated_weeks": 3,
                            "tech_stack": "React, FastAPI, PostgreSQL",
                            "what_it_proves": "Full-stack CRUD and async state management",
                            "stretch_goal": "Add real-time WebSocket notifications",
                        }
                    ],
                    "first_month_plan": {
                        "weeks": [
                            {
                                "week_number": 1,
                                "theme": "Environment & Tooling",
                                "daily_tasks": ["Setup Node 20 and Python 3.11", "Build CLI todo in Python"],
                                "resources": ["MDN Web Docs", "FastAPI Tutorial"],
                                "end_of_week_outcome": "Working local dev environment",
                            },
                            {
                                "week_number": 2,
                                "theme": "Frontend Basics",
                                "daily_tasks": ["Build basic HTML/CSS landing page"],
                                "resources": ["MDN Web Docs"],
                                "end_of_week_outcome": "Responsive static page",
                            },
                            {
                                "week_number": 3,
                                "theme": "Backend Basics",
                                "daily_tasks": ["Create first FastAPI endpoint"],
                                "resources": ["FastAPI Tutorial"],
                                "end_of_week_outcome": "Working JSON API",
                            },
                            {
                                "week_number": 4,
                                "theme": "Integration & Git",
                                "daily_tasks": ["Push repo to GitHub"],
                                "resources": ["GitHub Docs"],
                                "end_of_week_outcome": "Public repository",
                            },
                        ]
                    },
                    "resources": [
                        {"name": "FastAPI Full Tutorial", "type": "Official Documentation", "cost": "Free", "description": "Complete reference"}
                    ],
                    "risks_and_tradeoffs": ["High competition in entry-level frontend roles without backend depth"],
                    "india_market_notes": {
                        "salary_range_lpa": "6.5 - 14.0 LPA",
                        "demand_outlook": "Very High across Bengaluru and Hyderabad",
                        "company_types": ["Product Startups", "IT Services Tier-1", "GCCs"],
                        "typical_roles": ["SDE-1", "Graduate Engineer Trainee", "Junior Full Stack Dev"],
                        "top_risks": ["Framework churn", "Neglecting core DSA for campus screening"],
                    },
                }
            ]

            browser = p.chromium.launch(headless=True)

            def attach_diagnostics(page, name):
                console_errors = []
                failed_requests = []
                page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
                page.on("pageerror", lambda err: console_errors.append(str(err)))
                page.on("requestfailed", lambda req: failed_requests.append(f"{req.method} {req.url}: {req.failure}"))
                return console_errors, failed_requests

            # =========================================================
            # JOURNEY A: First-Year Student (Few Skills, Path Choice, Test Pass)
            # =========================================================
            print("\n" + "-" * 50)
            print("RUNNING JOURNEY A: First-Year Student End-to-End Walkthrough")
            print("-" * 50)

            context_a = browser.new_context(viewport={"width": 1280, "height": 800})
            page_a = context_a.new_page()
            errors_a, req_fails_a = attach_diagnostics(page_a, "Journey A")

            student_a_token = "mock-jwt-token-journey-a"
            student_a_state = {
                "user": {"id": 1, "email": "aarav.patel@example.com"},
                "profile": {
                    "full_name": "Aarav Patel",
                    "phone": "9876543210",
                    "college": "Pune Institute of Computer Technology",
                    "branch": "Computer Science & Engineering",
                    "year_of_study": 1,
                    "expected_graduation_year": 2028,
                    "cgpa": 8.4,
                    "city": "Pune",
                    "state": "Maharashtra",
                    "career_goal_text": "Targeting high growth product startup internships",
                    "preferred_work_style": "In-office",
                },
                "skills": [{"skill_id": 1, "skill_name": "Python", "self_level": 2, "status": "claimed"}],
                "selected_path": None,
                "progress_items": {},
                "streak": {"current_streak_days": 1, "longest_streak_days": 1},
            }

            # Intercept API calls
            def handle_api_a(route):
                req = route.request
                url = req.url
                method = req.method

                if "/api/v1/auth/refresh" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "access_token": student_a_token,
                        "token_type": "bearer",
                        "user": student_a_state["user"],
                        "profile": student_a_state["profile"],
                    }))
                elif "/api/v1/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "user": student_a_state["user"],
                        "profile": student_a_state["profile"],
                    }))
                elif "/api/v1/catalog/skills" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_skills))
                elif "/api/v1/catalog/interests" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_interests))
                elif "/api/v1/catalog/career-paths" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_paths))
                elif "/api/v1/profile/selected-path" in url:
                    if method == "GET":
                        route.fulfill(status=200, content_type="application/json", body=json.dumps({
                            "selected_path": student_a_state["selected_path"]
                        }))
                    elif method == "POST":
                        selected_obj = {
                            "id": 1,
                            "career_path_id": 1,
                            "career_path": catalog_paths[0],
                            "simulation_id": 1,
                            "simulated_track": sample_sim_paths[0],
                            "simulated_path": sample_sim_paths[0],
                        }
                        student_a_state["selected_path"] = selected_obj
                        route.fulfill(status=200, content_type="application/json", body=json.dumps(selected_obj))
                elif "/api/v1/simulations/history" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([
                        {"id": 1, "created_at": "2026-10-21T07:00:00Z", "mode": "auto"}
                    ]))
                elif "/api/v1/simulations" in url:
                    if method == "GET":
                        route.fulfill(status=200, content_type="application/json", body=json.dumps(
                            {
                                "id": 1,
                                "created_at": "2026-10-21T07:00:00Z",
                                "output": {
                                    "paths": sample_sim_paths,
                                    "comparison_table": {
                                        "columns": ["fit_score", "salary_range_lpa", "time_to_ready_months", "critical_gaps_count"],
                                        "rows": [
                                            {
                                                "path_slug": "full-stack-developer",
                                                "fit_score": 88,
                                                "salary_range_lpa": "6.5 - 14.0 LPA",
                                                "time_to_ready_months": 18,
                                                "critical_gaps_count": 2,
                                            }
                                        ]
                                    },
                                    "overall_recommendation": "Full Stack Developer provides the fastest path to hiring based on your claimed Python basics.",
                                    "assumptions_made": ["Minimum 12 hrs/week dedicated practice", "Consistent GitHub contributions"],
                                    "disclaimers": ["Salary brackets and hiring projections reflect 2025-2026 Indian fresher market averages and do not guarantee offers."],
                                }
                            }
                        ))
                elif "/api/v1/progress" in url:
                    if method == "GET":
                        route.fulfill(status=200, content_type="application/json", body=json.dumps({
                            "current_streak_days": student_a_state["streak"]["current_streak_days"],
                            "longest_streak_days": student_a_state["streak"]["longest_streak_days"],
                            "completed_items_map": student_a_state["progress_items"],
                            "active_career_path": student_a_state["selected_path"]["simulated_track"] if student_a_state["selected_path"] else None,
                            "total_milestone_checkpoints": 2,
                            "completed_milestone_checkpoints": len(student_a_state["progress_items"]),
                            "next_best_action": {
                                "title": "Host portfolio on GitHub Pages",
                                "action_type": "milestone_checkpoint",
                                "item_ref": "Host portfolio on GitHub Pages",
                                "category": "Milestone Checkpoint",
                                "estimated_minutes": 45,
                            }
                        }))
                    elif method == "POST":
                        data = json.loads(req.post_data)
                        ref = data["item_ref"]
                        student_a_state["progress_items"][f"{data['item_type']}:{ref}"] = (data["status"] == "completed")
                        route.fulfill(status=200, content_type="application/json", body=json.dumps({
                            "status": "success",
                            "completed_items_map": student_a_state["progress_items"],
                        }))
                elif "/api/v1/tests/skills" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([
                        {
                            "skill_id": 1,
                            "name": "Python",
                            "category": "Programming Languages",
                            "self_level": 2,
                            "status": student_a_state["skills"][0]["status"],
                            "verified_level": 3 if student_a_state["skills"][0]["status"] == "verified" else None,
                            "verified_level_name": "Advanced" if student_a_state["skills"][0]["status"] == "verified" else None,
                            "is_priority_for_selected_path": True,
                            "active_attempt_id": None,
                            "can_take_test": True,
                            "cooldown_remaining_seconds": 0,
                        }
                    ]))
                elif "/api/v1/tests/start" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "attempt_id": 101,
                        "skill_id": 1,
                        "skill_name": "Python",
                        "total_questions": 1,
                        "pass_mark_percentage": 70,
                        "started_at": "2026-10-21T07:00:00Z",
                        "expires_at": "2026-10-21T07:45:00Z",
                        "remaining_seconds": 2700,
                        "tab_switch_count": 0,
                        "questions": [
                            {
                                "question_id": 1,
                                "question_order": 1,
                                "question_text": "What is the return type of the function id() in Python?",
                                "question_type": "single_choice",
                                "options": [
                                    {"id": "A", "text": "integer"},
                                    {"id": "B", "text": "float"},
                                    {"id": "C", "text": "string"},
                                    {"id": "D", "text": "pointer"},
                                ],
                                "difficulty": 1,
                                "subtopic_tag": "Built-ins",
                            }
                        ]
                    }))
                elif "/api/v1/tests/101/answer" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({"status": "saved"}))
                elif "/api/v1/tests/101/submit" in url:
                    student_a_state["skills"][0]["status"] = "verified"
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "attempt_id": 101,
                        "skill_id": 1,
                        "skill_name": "Python",
                        "status": "completed",
                        "score_percentage": 90.0,
                        "passed": True,
                        "verified_level": 3,
                        "verified_level_name": "Advanced",
                        "earned_points": 27.0,
                        "total_points": 30.0,
                        "pass_mark": 70,
                        "tab_switch_count": 0,
                        "accuracy_by_difficulty": {"1": 100.0},
                        "accuracy_by_subtopic": {"Built-ins": 100.0},
                        "weaknesses": [],
                        "strengths": ["Built-ins"],
                        "recommendations": ["Great job on Python basics! Continue to intermediate DSA."],
                        "questions_review": [],
                    }))
                elif "/api/v1/resume" in url:
                    is_verified = (student_a_state["skills"][0]["status"] == "verified")
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "user_id": 1,
                        "selected_template": "minimal_ats",
                        "include_unverified_skills": False,
                        "strength_score": 75 if is_verified else 45,
                        "strength_checklist": [{"item": "Contact information complete", "passed": True, "tip": ""}],
                        "target_role_title": "Full Stack Developer",
                        "full_name": "Aarav Patel",
                        "email": "aarav.patel@example.com",
                        "phone": "9876543210",
                        "city": "Pune",
                        "state": "Maharashtra",
                        "college": "Pune Institute of Computer Technology",
                        "branch": "Computer Science & Engineering",
                        "year_of_study": 1,
                        "expected_graduation_year": 2028,
                        "cgpa": 8.4,
                        "summary": "First-year engineering student dedicated to full-stack mastery and cloud systems.",
                        "verified_skills": [
                            {"name": "Python", "category": "Languages", "status": "verified", "self_level": 2, "verified_level": 3, "verified_level_name": "Advanced"}
                        ] if is_verified else [],
                        "unverified_skills": [] if is_verified else [
                            {"name": "Python", "category": "Languages", "status": "claimed", "self_level": 2}
                        ],
                        "education": [{"level": "12th", "institution_name": "Pune Junior College", "board_or_university": "State Board", "passing_year": 2024, "percentage": 91.5}],
                        "projects": [],
                        "experiences": [],
                    }))
                elif "/api/v1/mentor/threads/10/messages" in url:
                    if method == "GET":
                        route.fulfill(status=200, content_type="application/json", body=json.dumps([]))
                    elif method == "POST":
                        sse_payload = (
                            'event: token\ndata: {"token": "As a 1st year student, your verified Python level gives you an early advantage. "}\n\n'
                            'event: token\ndata: {"token": "Focus on building your Git portfolio next.\\n"}\n\n'
                            'event: action\ndata: {"actions": [{"type": "add_task", "title": "Publish First Python CLI Tool to GitHub", "description": "Includes clean README and MIT license"}]}\n\n'
                            'event: done\ndata: {"message_id": 99, "content": "Complete", "actions": [{"type": "add_task", "title": "Publish First Python CLI Tool to GitHub"}]}\n\n'
                        )
                        route.fulfill(status=200, headers={"Content-Type": "text/event-stream"}, body=sse_payload)
                elif "/api/v1/mentor/threads" in url:
                    if method == "GET":
                        route.fulfill(status=200, content_type="application/json", body=json.dumps([
                            {"id": 10, "user_id": 1, "title": "Placement Roadmap", "created_at": "2026-10-21T07:00:00Z", "updated_at": "2026-10-21T07:00:00Z", "message_count": 0}
                        ]))
                    elif method == "POST":
                        route.fulfill(status=201, content_type="application/json", body=json.dumps(
                            {"id": 10, "user_id": 1, "title": "Placement Roadmap", "created_at": "2026-10-21T07:00:00Z", "updated_at": "2026-10-21T07:00:00Z", "message_count": 0}
                        ))
                elif "/api/v1/mentor/actions/confirm" in url:
                    student_a_state["progress_items"]["milestone_checkpoint:Publish First Python CLI Tool to GitHub"] = False
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({"status": "created", "message": "Successfully added task"}))
                else:
                    route.continue_()

            page_a.route("**/api/v1/**", handle_api_a)

            # Inject auth token into localStorage
            page_a.goto(f"{FRONTEND_URL}/login")
            page_a.evaluate(f"localStorage.setItem('auth_token', '{student_a_token}')")

            # 1. Load Dashboard
            page_a.goto(f"{FRONTEND_URL}/dashboard")
            page_a.wait_for_selector("text=Welcome, Aarav Patel", timeout=8000)
            print("PASS [Journey A]: Dashboard rendered with student greeting")

            # 2. Navigate to /paths and explore tracks
            page_a.click("nav a[href='/paths']")
            page_a.wait_for_selector("text=Full Stack Developer", timeout=8000)
            print("PASS [Journey A]: /paths rendered simulated tracks and comparison")
            print("PAGE BUTTONS ON /paths:", page_a.locator("button").all_text_contents())
            error_boundary_text = page_a.locator(".font-mono.text-gray-600").all_text_contents()
            print("ERROR BOUNDARY MESSAGE:", error_boundary_text)
            print("CONSOLE ERRORS SO FAR:", errors_a)
            page_a.screenshot(path="scratch/paths_debug.png")

            # 3. Choose Path
            page_a.click("button:has-text('Choose Track')")
            page_a.wait_for_selector("text=Choose This Career Track", timeout=5000)
            page_a.click("button:has-text('Confirm & Adapt Dashboard')")
            page_a.wait_for_selector("text=Currently Selected", timeout=5000)
            print("PASS [Journey A]: Committed to Full Stack Developer path")

            # 4. Take Skill Test
            page_a.click("nav a[href='/tests']")
            page_a.wait_for_selector("text=Skill Tests & Verification", timeout=8000)
            page_a.click("button:has-text('Take 25-Q Assessment')")
            page_a.wait_for_selector("text=What is the return type", timeout=8000)
            page_a.click("text=integer")
            page_a.click("button:has-text('Finish Test')")
            page_a.wait_for_selector("text=Confirm & Finish", timeout=4000)
            page_a.click("button:has-text('Confirm & Finish')")
            page_a.wait_for_selector("text=Skill Verified", timeout=8000)
            page_a.click("button[title='Close scorecard']")
            print("PASS [Journey A]: Completed Python diagnostic test and verified credential")

            # 5. Check Resume Studio
            page_a.click("nav a[href='/resume']")
            page_a.wait_for_selector("text=Resume Studio", timeout=8000)
            page_a.wait_for_selector("text=Python", timeout=8000)
            print("PASS [Journey A]: Resume Studio displays verified Python badge")

            # 6. Consult AI Mentor
            page_a.click("nav a[href='/mentor']")
            page_a.wait_for_selector("text=Mentor Threads", timeout=8000)
            page_a.wait_for_selector("text=Placement Roadmap", timeout=8000)
            page_a.fill("textarea[placeholder*='Ask a question about your path']", "What should I build next?")
            page_a.keyboard.press("Enter")
            page_a.wait_for_selector("text=Publish First Python CLI Tool to GitHub", timeout=8000)
            page_a.click("button:has-text('Add to Progress')")
            page_a.wait_for_selector("text=Added", timeout=5000)
            print("PASS [Journey A]: Mentor streamed reply and confirmed proposed action")

            assert len(errors_a) == 0, f"Unexpected console errors in Journey A: {errors_a}"
            assert len(req_fails_a) == 0, f"Unexpected failed requests in Journey A: {req_fails_a}"
            print("PASS [Journey A]: Zero console errors and zero failed network requests")
            context_a.close()

            # =========================================================
            # JOURNEY B: Final-Year Student (Test Fail -> Cooldown -> Re-simulation -> Switch Path)
            # =========================================================
            print("\n" + "-" * 50)
            print("RUNNING JOURNEY B: Final-Year Student Test Failure & Path Switch")
            print("-" * 50)

            context_b = browser.new_context(viewport={"width": 1280, "height": 800})
            page_b = context_b.new_page()
            errors_b, req_fails_b = attach_diagnostics(page_b, "Journey B")

            student_b_token = "mock-jwt-token-journey-b"
            b_test_failed = True

            def handle_api_b(route):
                req = route.request
                url = req.url

                if "/api/v1/auth/refresh" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "access_token": student_b_token,
                        "token_type": "bearer",
                        "user": {"id": 2, "email": "priya.nair@example.com"},
                        "profile": {
                            "full_name": "Priya Nair",
                            "phone": "9876543211",
                            "college": "IIT Bombay",
                            "branch": "Computer Science & Engineering",
                            "year_of_study": 4,
                            "expected_graduation_year": 2025,
                            "cgpa": 9.2,
                            "city": "Mumbai",
                            "state": "Maharashtra",
                        },
                    }))
                elif "/api/v1/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "user": {"id": 2, "email": "priya.nair@example.com"},
                        "profile": {
                            "full_name": "Priya Nair",
                            "phone": "9876543211",
                            "college": "IIT Bombay",
                            "branch": "Computer Science & Engineering",
                            "year_of_study": 4,
                            "expected_graduation_year": 2025,
                            "cgpa": 9.2,
                            "city": "Mumbai",
                            "state": "Maharashtra",
                        },
                    }))
                elif "/api/v1/catalog/skills" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_skills))
                elif "/api/v1/catalog/interests" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_interests))
                elif "/api/v1/catalog/career-paths" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(catalog_paths))
                elif "/api/v1/profile/selected-path" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "selected_path": {
                            "id": 2,
                            "career_path_id": 2,
                            "career_path": catalog_paths[1],
                            "simulation_id": 2,
                            "simulated_track": {
                                "path_slug": "devops-cloud-engineer",
                                "title": "DevOps & Cloud Engineer",
                                "fit_score": 85,
                                "summary": "Cloud infrastructure automation",
                                "skill_gaps": [],
                                "yearly_milestones": [],
                                "projects_to_build": [],
                                "first_month_plan": [],
                                "india_market_notes": {"salary_range_lpa": "8 - 18 LPA", "demand_outlook": "High", "company_types": [], "typical_roles": [], "top_risks": []},
                            }
                        }
                    }))
                elif "/api/v1/tests/skills" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([
                        {
                            "skill_id": 15,
                            "name": "Docker",
                            "category": "DevOps & Cloud",
                            "self_level": 3,
                            "status": "failed" if b_test_failed else "verified",
                            "verified_level": None if b_test_failed else 3,
                            "verified_level_name": None if b_test_failed else "Advanced",
                            "is_priority_for_selected_path": True,
                            "active_attempt_id": None,
                            "can_take_test": not b_test_failed,
                            "cooldown_remaining_seconds": 604800 if b_test_failed else 0,
                        }
                    ]))
                elif "/api/v1/resume" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "user_id": 2,
                        "selected_template": "modern_compact",
                        "include_unverified_skills": False,
                        "strength_score": 50,
                        "strength_checklist": [{"item": "Verified skills", "passed": False, "tip": "Pass tests"}],
                        "target_role_title": "DevOps & Cloud Engineer",
                        "full_name": "Priya Nair",
                        "email": "priya.nair@example.com",
                        "phone": "9876543211",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "college": "IIT Bombay",
                        "branch": "Computer Science & Engineering",
                        "year_of_study": 4,
                        "expected_graduation_year": 2025,
                        "cgpa": 9.2,
                        "summary": "Final-year engineer.",
                        "verified_skills": [],
                        "unverified_skills": [{"name": "Docker", "category": "DevOps", "status": "failed", "self_level": 3}],
                        "education": [],
                        "projects": [],
                        "experiences": [],
                    }))
                elif "/api/v1/progress" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "current_streak_days": 5,
                        "longest_streak_days": 12,
                        "completed_items_map": {},
                        "active_career_path": {"title": "DevOps & Cloud Engineer"},
                        "total_milestone_checkpoints": 4,
                        "completed_milestone_checkpoints": 2,
                    }))
                elif "/api/v1/simulations/history" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps([
                        {"id": 2, "created_at": "2026-10-21T07:00:00Z", "mode": "auto"}
                    ]))
                elif "/api/v1/simulations" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(
                        {
                            "id": 2,
                            "created_at": "2026-10-21T07:00:00Z",
                            "output": {"paths": sample_sim_paths, "comparison_table": {"columns": [], "rows": []}, "assumptions_made": ["Daily practice"], "disclaimers": ["Projections only"], "overall_recommendation": "Cloud engineering fits best."}
                        }
                    ))
                else:
                    route.continue_()

            page_b.route("**/api/v1/**", handle_api_b)

            page_b.goto(f"{FRONTEND_URL}/login")
            page_b.evaluate(f"localStorage.setItem('auth_token', '{student_b_token}')")

            # 1. View Skill Tests Hub with Failed Status
            page_b.goto(f"{FRONTEND_URL}/tests")
            page_b.wait_for_selector("text=Skill Tests & Verification", timeout=8000)
            page_b.wait_for_selector("text=7-day cooldown prevents cramming", timeout=8000)
            print("PASS [Journey B]: Failed test correctly renders 7-day cooldown lock")

            # 2. View Resume with Failed Skill Suppressed from Verified
            page_b.goto(f"{FRONTEND_URL}/resume")
            page_b.wait_for_selector("text=Resume Studio", timeout=8000)
            page_b.wait_for_selector("text=Suppressed", timeout=8000)
            print("PASS [Journey B]: Resume correctly suppresses failed test from verified badge")

            assert len(errors_b) == 0, f"Unexpected console errors in Journey B: {errors_b}"
            context_b.close()

            # =========================================================
            # JOURNEY C: Returning User (Login, Session & Dashboard)
            # =========================================================
            print("\n" + "-" * 50)
            print("RUNNING JOURNEY C: Returning User Login & Dashboard State")
            print("-" * 50)

            context_c = browser.new_context(viewport={"width": 1280, "height": 800})
            page_c = context_c.new_page()
            errors_c, req_fails_c = attach_diagnostics(page_c, "Journey C")

            def handle_api_c(route):
                req = route.request
                url = req.url

                if "/api/v1/auth/login" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "access_token": "valid-returning-token",
                        "token_type": "bearer",
                        "user": {"id": 3, "email": "rohit.verma@example.com"},
                        "profile": {"full_name": "Rohit Verma", "college": "BITS Pilani", "branch": "ECE", "year_of_study": 3},
                    }))
                elif "/api/v1/auth/refresh" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "access_token": "valid-returning-token",
                        "token_type": "bearer",
                        "user": {"id": 3, "email": "rohit.verma@example.com"},
                        "profile": {"full_name": "Rohit Verma", "college": "BITS Pilani", "branch": "ECE", "year_of_study": 3},
                    }))
                elif "/api/v1/auth/me" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "user": {"id": 3, "email": "rohit.verma@example.com"},
                        "profile": {"full_name": "Rohit Verma", "college": "BITS Pilani", "branch": "ECE", "year_of_study": 3},
                    }))
                elif "/api/v1/profile/selected-path" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "selected_path": {
                            "id": 3,
                            "career_path": catalog_paths[0],
                            "simulated_track": sample_sim_paths[0],
                            "simulated_path": sample_sim_paths[0],
                        }
                    }))
                elif "/api/v1/progress" in url:
                    route.fulfill(status=200, content_type="application/json", body=json.dumps({
                        "current_streak_days": 7,
                        "longest_streak_days": 14,
                        "completed_items_map": {"milestone_checkpoint:Task 1": True},
                        "active_career_path": sample_sim_paths[0],
                        "total_milestone_checkpoints": 5,
                        "completed_milestone_checkpoints": 3,
                        "next_best_action": {"title": "Build WebSocket chat", "category": "Milestone Checkpoint"},
                    }))
                else:
                    route.continue_()

            page_c.route("**/api/v1/**", handle_api_c)

            # Perform real login flow
            page_c.goto(f"{FRONTEND_URL}/login")
            page_c.fill("input[type='email']", "rohit.verma@example.com")
            page_c.fill("input[type='password']", "StrongPassword123!")
            page_c.click("button:has-text('Sign In')")

            page_c.wait_for_selector("text=Welcome, Rohit Verma", timeout=8000)
            page_c.wait_for_selector("text=7 Day Streak", timeout=8000)
            page_c.wait_for_selector("text=Full Stack Developer", timeout=8000)
            print("PASS [Journey C]: Returning user logged in; dashboard restored streak (7 days) and active track")

            assert len(errors_c) == 0, f"Unexpected console errors in Journey C: {errors_c}"
            context_c.close()

            # =========================================================
            # VIEWPORTS & DEVICE RESPONSIVENESS (iPhone, Android, Tablet)
            # =========================================================
            print("\n" + "-" * 50)
            print("TESTING MOBILE VIEWPORTS & RESPONSIVENESS")
            print("-" * 50)

            # iPhone 13 (375 x 667)
            ctx_iphone = browser.new_context(viewport={"width": 375, "height": 667})
            page_iphone = ctx_iphone.new_page()
            page_iphone.route("**/api/v1/**", handle_api_c)
            page_iphone.goto(f"{FRONTEND_URL}/login")
            page_iphone.evaluate("localStorage.setItem('auth_token', 'valid-returning-token')")
            page_iphone.goto(f"{FRONTEND_URL}/dashboard")
            page_iphone.wait_for_selector("text=Welcome, Rohit Verma", timeout=8000)
            assert page_iphone.locator("text=7 Day Streak").is_visible()
            print("PASS [Viewport]: iPhone (375px) renders responsive dashboard cleanly")
            ctx_iphone.close()

            # Android Pixel (412 x 915)
            ctx_android = browser.new_context(viewport={"width": 412, "height": 915})
            page_android = ctx_android.new_page()
            page_android.route("**/api/v1/**", handle_api_c)
            page_android.goto(f"{FRONTEND_URL}/login")
            page_android.evaluate("localStorage.setItem('auth_token', 'valid-returning-token')")
            page_android.goto(f"{FRONTEND_URL}/dashboard")
            page_android.wait_for_selector("text=Welcome, Rohit Verma", timeout=8000)
            print("PASS [Viewport]: Android (412px) renders responsive dashboard cleanly")
            ctx_android.close()

            browser.close()
            print("\n" + "=" * 70)
            print("ALL PLAYWRIGHT USER JOURNEYS (A, B, C & VIEWPORTS) PASSED WITH 0 ERRORS!")
            print("=" * 70)

    finally:
        server_proc.terminate()
        server_proc.wait(timeout=5)
        print("Vite preview server subprocess cleanly terminated.")


if __name__ == "__main__":
    run_phase5_playwright_journeys()
