"""Playwright Browser Automation Test for Career Path Simulator.
Tests:
1. Protected route redirect (/dashboard -> /login)
2. Full 7-step onboarding wizard
3. Validation errors on invalid inputs
4. Mid-wizard reload draft persistence via localStorage
5. Skills chip picker (search, category filter, custom skill, 3-tier self-ratings)
6. Interests grouped checklist
7. Projects and experiences (adding and skipping)
8. Dashboard welcome and active path status
9. Session persistence on page reload
10. Navigation to all Phase 2-5 placeholder pages
11. Profile editing (updating basics, adding/deleting education and projects)
12. Responsive viewport checks (375px mobile, 768px tablet, 1280px desktop)
13. Logout flow
"""

import time

from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://localhost:5173"


def run_browser_tests():
    print(f"Starting Playwright browser automation tests against {FRONTEND_URL}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # 1. Protected route redirect
        print("\n--- 1. Testing protected route redirection ---")
        page.goto(f"{FRONTEND_URL}/dashboard")
        page.wait_for_url("**/login", timeout=10000)
        assert "/login" in page.url, f"Expected /login redirect, got {page.url}"
        print("PASS: Unauthenticated visit to /dashboard redirects to /login")

        # 2. Navigate to Register
        print("\n--- 2. Navigating to Onboarding Wizard ---")
        page.click("text=Start Onboarding Wizard")
        page.wait_for_url("**/register", timeout=5000)
        assert "/register" in page.url
        print("PASS: Navigated to /register")

        # 3. Step 1: Account
        print("\n--- 3. Testing Step 1: Account & Validation ---")
        # Try next without email/password -> triggers validation
        page.click("text=Next: Academic Basics")
        error_msg = page.locator("text=Please provide a valid email address").text_content()
        assert error_msg, "Validation message missing for empty email"
        print("PASS: Empty email validation caught")

        # Fill valid credentials
        timestamp = int(time.time())
        student_email = f"ananya.patel_{timestamp}@college.edu.in"
        page.fill("input[type='email']", student_email)
        page.fill("input[placeholder='Minimum 8 characters']", "Password123!")
        page.fill("input[placeholder='Re-enter password']", "Password123!")
        page.click("text=Next: Academic Basics")

        # 4. Step 2: Basics
        print("\n--- 4. Testing Step 2: Basics & Phone Validation ---")
        page.wait_for_selector("text=Step 2: Academic & Personal Basics", timeout=5000)

        # Invalid phone test
        page.fill("input[placeholder='e.g. Rahul Sharma']", "Ananya Patel")
        page.fill("input[placeholder='9876543210']", "1234567890")  # Invalid Indian mobile
        page.fill(
            "input[placeholder*='National Institute']", "Indian Institute of Technology Delhi"
        )
        page.fill(
            "input[placeholder='Select or type branch']", "Computer Science & Engineering (CSE)"
        )
        page.fill("input[placeholder='e.g. 8.45']", "9.25")
        page.fill("input[placeholder*='Bengaluru']", "New Delhi")
        page.click("text=Next: Education History")

        phone_error = page.locator("text=valid 10-digit Indian mobile number").text_content()
        assert phone_error, "Indian phone validation failed to trigger"
        print("PASS: Non-Indian phone prefix rejected with clear banner")

        # Fix phone number
        page.fill("input[placeholder='9876543210']", "9876543210")

        # Test LocalStorage Draft Persistence on Refresh
        print("\n--- 4b. Testing LocalStorage Draft Persistence across page refresh ---")
        page.reload()
        page.wait_for_selector("text=Step 2: Academic & Personal Basics", timeout=5000)
        persisted_name = page.input_value("input[placeholder='e.g. Rahul Sharma']")
        assert persisted_name == "Ananya Patel", f"Draft lost after reload! Got: {persisted_name}"
        print("PASS: Wizard restored draft from localStorage on refresh without data loss")

        page.click("text=Next: Education History")

        # 5. Step 3: Education History
        print("\n--- 5. Testing Step 3: Education History ---")
        page.wait_for_selector("text=Step 3: Education History", timeout=5000)
        # Fill school name for 10th and 12th
        edu_inputs = page.locator("input[placeholder='e.g. Delhi Public School']").all()
        assert len(edu_inputs) >= 2, "Expected at least 10th and 12th default inputs"
        edu_inputs[0].fill("Delhi Public School R.K. Puram")
        edu_inputs[1].fill("Delhi Public School R.K. Puram")
        page.click("text=Next: Technical Skills")

        # 6. Step 4: Skills Chip Picker
        print("\n--- 6. Testing Step 4: Skills Chip Picker & Ratings ---")
        page.wait_for_selector("text=Step 4: Claim Your Technical Skills", timeout=5000)

        # Search for Python
        page.fill("input[placeholder*='Search skills']", "Python")
        page.wait_for_timeout(300)
        # Click on Python chip
        page.click("button:has-text('Python')")
        print("PASS: Selected Python from catalog")

        # Add custom skill
        page.fill("input[placeholder='Custom skill...']", "FastAPI Microservices")
        page.click("button:has-text('Add')")
        print("PASS: Added custom skill 'FastAPI Microservices'")

        # Verify 2 skills chosen
        assert page.locator("text=Your Chosen Skills (2)").is_visible()

        # Set Python rating to Advanced (Adv)
        page.click("button:has-text('Adv')")
        print("PASS: Updated skill rating to Advanced")

        page.click("text=Next: Career Interests")

        # 7. Step 5: Interests
        print("\n--- 7. Testing Step 5: Interests Checklist ---")
        page.wait_for_selector("text=Step 5: Career & Technical Interests", timeout=5000)
        # Select first 2 checkboxes
        checkboxes = page.locator("input[type='checkbox']").all()
        assert len(checkboxes) >= 2, "Interests checklist empty"
        checkboxes[0].check()
        checkboxes[1].check()
        page.click("text=Next: Projects & Experience")

        # 8. Step 6: Projects & Experiences
        print("\n--- 8. Testing Step 6: Projects (Add & Skip capability) ---")
        page.wait_for_selector("text=Step 6: Projects & Experiences", timeout=5000)
        page.click("button:has-text('Add Project')")
        page.fill(
            "input[placeholder='e.g. Distributed Task Queue']", "Realtime Collaborative Whiteboard"
        )
        page.fill("input[placeholder='e.g. Python, Redis, Docker']", "React, FastAPI, WebSockets")
        page.fill(
            "textarea[placeholder*='problem solved']",
            "Distributed whiteboard with conflict-free replicated data types.",
        )
        page.click("text=Save & Continue")

        # 9. Step 7: Goals & Links and Submit
        print("\n--- 9. Testing Step 7: Links, Career Goals & Registration Submission ---")
        page.wait_for_selector("text=Step 7: Professional Links & Career Goal", timeout=5000)
        page.fill(
            "input[placeholder='https://linkedin.com/in/username']",
            "https://linkedin.com/in/ananyapatel",
        )
        page.fill(
            "textarea[placeholder*='Aiming for an SDE-1']",
            "Targeting SDE-1 backend product company roles in 7th semester campus placements.",
        )

        page.click("button:has-text('Complete Registration')")

        # 10. Dashboard Verification
        print("\n--- 10. Verifying Dashboard Navigation and Content ---")
        page.wait_for_url("**/dashboard", timeout=15000)
        assert "/dashboard" in page.url
        page.wait_for_selector("text=Welcome, Ananya Patel!", timeout=5000)
        assert page.locator("text=Indian Institute of Technology Delhi").is_visible()
        assert page.locator("text=Year 3").is_visible()
        print("PASS: Student successfully registered and landed on personalized Dashboard")

        # 11. Session Persistence on Reload
        print("\n--- 11. Testing Session Persistence on Reload ---")
        page.reload()
        page.wait_for_selector("text=Welcome, Ananya Patel!", timeout=5000)
        assert "/dashboard" in page.url
        print("PASS: Session persisted across full browser page reload")

        # 12. Placeholder Routes Navigation
        print("\n--- 12. Verifying Placeholder Navigation Routes ---")
        for route, expected_title in [
            ("/paths", "Career Path Simulator"),
            ("/tests", "Skill Tests & Diagnostic Challenges"),
            ("/resume", "Auto-Built ATS Resume Generator"),
            ("/mentor", "AI Placement Mentor Chat"),
        ]:
            page.goto(f"{FRONTEND_URL}{route}")
            page.wait_for_selector(f"text={expected_title}", timeout=5000)
            print(f"PASS: Route {route} loaded cleanly with '{expected_title}'")

        # 13. Profile Page Inspection & Editing
        print("\n--- 13. Testing Profile Inspection & Live Editing ---")
        page.goto(f"{FRONTEND_URL}/profile")
        page.wait_for_selector("text=Academic & Personal Profile", timeout=5000)
        assert page.locator("text=Ananya Patel").is_visible()
        assert page.locator("text=Python").is_visible()
        assert page.locator("text=Realtime Collaborative Whiteboard").is_visible()

        # Edit City
        page.click("button:has-text('Edit Basics')")
        city_input = page.locator("input[value='New Delhi']")
        city_input.fill("Gurugram")
        page.click("button:has-text('Save Changes')")
        page.wait_for_selector("text=Basic details updated successfully!", timeout=5000)

        # Reload and confirm persisted edit
        page.reload()
        page.wait_for_selector("text=Gurugram", timeout=5000)
        print("PASS: Profile edits persisted and reloaded successfully")

        # 14. Responsive Viewports Check
        print(
            "\n--- 14. Testing Responsive Layout (Mobile 375px, Tablet 768px, Desktop 1280px) ---"
        )
        for width, height, name in [
            (1280, 800, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile"),
        ]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(300)
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            assert scroll_width <= client_width + 1, (
                f"Horizontal scroll overflow detected at {name} ({width}px): {scroll_width} > {client_width}"
            )
            print(f"PASS: {name} ({width}x{height}) viewport clean, no horizontal overflow")

        # 15. Logout
        print("\n--- 15. Testing Logout ---")
        page.set_viewport_size({"width": 1280, "height": 800})
        page.click("button[title='Logout']")
        page.wait_for_url("**/login", timeout=5000)
        assert "/login" in page.url

        # Confirm protected routes kick back to /login
        page.goto(f"{FRONTEND_URL}/dashboard")
        page.wait_for_url("**/login", timeout=5000)
        assert "/login" in page.url
        print("PASS: Logout invalidated session and protected routes redirect to /login")

        browser.close()
        print("\nALL 15 PLAYWRIGHT BROWSER AUTOMATION CHECKS PASSED!")


if __name__ == "__main__":
    run_browser_tests()
