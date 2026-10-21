"""Playwright End-to-End Browser Smoke Test for Phase 3:
1. Login
2. Run simulation (mocked backend route intercept)
3. Explore 3-path comparison and deep dive
4. Choose path via confirmation modal
5. Verify Dashboard personalization adapts to chosen track
"""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://localhost:5173"


def _get_mock_simulation() -> dict:
    fixture_path = Path(__file__).parent / "fixtures" / "sample_simulation.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        golden = json.load(f)
    return {
        "id": 1,
        "user_id": 1,
        "mode": "auto",
        "selected_paths": None,
        "prompt_version": "v1.0.0",
        "model_name": "gemini-1.5-pro",
        "input_snapshot": {"branch": "Computer Science"},
        "output": golden,
        "created_at": "2026-10-20T12:00:00Z",
        "comparison": None,
    }


def run_phase3_smoke_test():
    print(f"Starting Phase 3 Playwright smoke test against {FRONTEND_URL}...")
    mock_sim = _get_mock_simulation()

    active_selected_path = {"selected_path": None}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Intercept backend routes with mock handlers
        def handle_login(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "access_token": "mock-jwt-token-123",
                        "token_type": "bearer",
                        "user": {
                            "id": 1,
                            "email": "student@nitk.edu.in",
                            "created_at": "2026-10-20T10:00:00Z",
                        },
                    }
                ),
            )

        def handle_me(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "user": {"id": 1, "email": "student@nitk.edu.in"},
                        "profile": {
                            "full_name": "Rohan Sharma",
                            "college": "NIT Surathkal",
                            "branch": "Computer Science",
                            "year_of_study": 3,
                            "cgpa": 8.75,
                        },
                        "selected_path": None,
                    }
                ),
            )

        def handle_refresh(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"access_token": "mock-jwt-token-123"}),
            )

        def handle_simulations(route):
            if route.request.method == "POST":
                route.fulfill(
                    status=202,
                    content_type="application/json",
                    body=json.dumps(
                        {
                            "job_id": "job-smoke-456",
                            "status": "succeeded",
                            "simulation_id": 1,
                        }
                    ),
                )
            else:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps([mock_sim] if active_selected_path["selected_path"] else []),
                )

        def handle_job_status(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(
                    {
                        "job_id": "job-smoke-456",
                        "status": "succeeded",
                        "simulation_id": 1,
                    }
                ),
            )

        def handle_sim_detail(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(mock_sim),
            )

        def handle_selected_path_endpoint(route):
            if route.request.method == "GET":
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(active_selected_path),
                )
            elif route.request.method == "POST":
                data = json.loads(route.request.post_data)
                slug = data.get("path_slug")
                sim_path = next(
                    (p for p in mock_sim["output"]["paths"] if p["path_slug"] == slug),
                    mock_sim["output"]["paths"][0],
                )
                selected_obj = {
                    "id": 1,
                    "user_id": 1,
                    "career_path": {
                        "id": 1,
                        "slug": slug,
                        "name": sim_path["title"],
                        "description": sim_path["summary"],
                    },
                    "simulation_id": 1,
                    "selected_at": "2026-10-20T12:30:00Z",
                    "is_active": True,
                    "simulated_path": sim_path,
                }
                active_selected_path["selected_path"] = selected_obj
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(selected_obj),
                )

        page.route("**/api/v1/auth/login", handle_login)
        page.route("**/api/v1/auth/me", handle_me)
        page.route("**/api/v1/auth/refresh", handle_refresh)
        page.route("**/api/v1/simulations/history", handle_simulations)
        page.route("**/api/v1/simulations/jobs/**", handle_job_status)
        page.route("**/api/v1/simulations/1", handle_sim_detail)
        page.route("**/api/v1/simulations", handle_simulations)
        page.route("**/api/v1/profile/selected-path", handle_selected_path_endpoint)

        # 1. Login Happy Path
        print("\n--- 1. Testing Login ---")
        page.goto(f"{FRONTEND_URL}/login")
        page.wait_for_selector("input[type='email']")
        page.fill("input[type='email']", "student@nitk.edu.in")
        page.fill("input[type='password']", "Password123!")
        page.click("button[type='submit']")

        page.wait_for_url("**/dashboard", timeout=8000)
        assert "/dashboard" in page.url
        print("PASS: Logged in and landed on /dashboard")

        # 2. Check Empty State on Dashboard
        print("\n--- 2. Checking Dashboard Without Active Path ---")
        assert page.locator("text=No Career Track Selected Yet").is_visible()
        print("PASS: Dashboard prompts user to simulate and choose career path")

        # 3. Navigate to My Paths & Run Simulation
        print("\n--- 3. Running Simulation in /paths ---")
        page.click("text=Simulate & Choose Career Path")
        page.wait_for_url("**/paths", timeout=5000)
        assert "/paths" in page.url

        # Click Run Simulation
        page.click("text=Run New Simulation")
        page.wait_for_selector("text=Overview & Compare", timeout=8000)
        print("PASS: Simulation completed; 3 tabs and Overview rendered")

        # 4. Verify Overview & 3 Paths Comparison
        print("\n--- 4. Verifying Comparison Table & Summary Cards ---")
        assert page.locator("text=Simulated Career Paths (3 Tracks)").is_visible()
        assert page.locator("text=Side-by-Side Comparison Matrix").is_visible()
        print("PASS: Comparison matrix and summary cards rendered")

        # 5. Deep Dive into Path 1
        print("\n--- 5. Exploring Path Deep Dive (Roadmap, Radar, Projects, Kickoff) ---")
        # Click on the tab for Path 1
        first_path_tab = page.locator("role=tab").nth(1)
        first_path_tab.click()

        page.wait_for_selector("text=Visual Roadmap")
        assert page.locator("text=Active Focus").is_visible()
        print("PASS: Roadmap node rendered with Active Focus on Year 3")

        # Switch to Skill Gap Radar subtab
        page.click("text=Skill Gap Radar")
        page.wait_for_selector("[data-testid='radar-chart-container']")
        assert page.locator("text=Ranked Skill Gap Breakdown").is_visible()
        print("PASS: Radar chart and ranked skill gap cards rendered")

        # Switch to Projects subtab
        page.click("text=Projects")
        page.wait_for_selector("[data-testid='projects-grid']")
        print("PASS: Projects showcase rendered")

        # Switch to 30-Day Sprint subtab
        page.click("text=30-Day Sprint")
        page.wait_for_selector("[data-testid='first-month-board']")
        print("PASS: 30-Day First Month Board rendered")

        # 6. Choose Path Flow
        print("\n--- 6. Testing 'Choose This Path' Action & Confirmation Modal ---")
        page.click("text=Choose This Path")
        page.wait_for_selector("role=dialog")
        assert page.locator("text=Choose This Career Track").is_visible()
        assert page.locator("text=What happens when you select this track").is_visible()

        # Confirm Selection
        page.click("text=Confirm & Adapt Dashboard")
        page.wait_for_selector("text=Active Path on Dashboard", timeout=5000)
        print("PASS: Career path confirmed and marked active")

        # 7. Verify Dashboard Adapts to Selected Path
        print("\n--- 7. Verifying Dashboard Personalization ---")
        page.goto(f"{FRONTEND_URL}/dashboard")
        page.wait_for_selector("[data-testid='active-path-banner']", timeout=5000)
        assert page.locator("text=Active Career Track").is_visible()
        assert page.locator("text=Current Milestone").is_visible()
        assert page.locator("text=Top Priority Skill Gaps").is_visible()
        assert page.locator("text=Recommended Project").is_visible()
        print("PASS: Dashboard successfully personalized to chosen career track!")

        browser.close()
        print("\nALL PHASE 3 PLAYWRIGHT SMOKE CHECKS PASSED!")


if __name__ == "__main__":
    run_phase3_smoke_test()
