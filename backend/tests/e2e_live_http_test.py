"""End-to-End Live HTTP Test Suite running against http://127.0.0.1:8000.
Verifies real network responses, headers, cookies, auth security, and rate limiting.
"""

from typing import Any

import httpx

BASE_URL = "http://127.0.0.1:8000"


def run_live_tests():
    print(f"Connecting to live backend at {BASE_URL}...")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    # 1. Health check
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    assert res.json()["status"] == "healthy"
    print("PASS: Health check 200 OK")

    # 2. Registration happy path
    reg_payload_a: dict[str, Any] = {
        "email": "live_student_a@test.com",
        "password": "Password123!",
        "profile": {
            "full_name": "Live Student A",
            "phone": "9876543210",
            "college": "NIT Surathkal",
            "branch": "Computer Science",
            "year_of_study": 3,
            "expected_graduation_year": 2026,
            "cgpa": 8.75,
            "city": "Mangalore",
            "state": "Karnataka",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "DPS",
                "board_or_university": "CBSE",
                "passing_year": 2020,
                "percentage": 92.5,
            }
        ],
        "skills": [{"skill_id": 1, "self_level": 3}],
        "interest_ids": [1],
    }

    reg_res = client.post("/api/v1/auth/register", json=reg_payload_a)
    assert reg_res.status_code in (201, 400), (
        f"Register returned {reg_res.status_code}: {reg_res.text}"
    )
    print("PASS: Registration endpoint responded appropriately")

    # 3. Login happy path
    login_res = client.post(
        "/api/v1/auth/login", json={"email": "live_student_a@test.com", "password": "Password123!"}
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token_a = login_res.json()["access_token"]
    assert token_a, "Access token missing from login response"
    assert "set-cookie" in [h.lower() for h in login_res.headers.keys()], (
        "Refresh token cookie missing"
    )
    print("PASS: Login happy path returned Bearer token and httpOnly cookie")

    # 4. Duplicate registration rejected
    dup_res = client.post("/api/v1/auth/register", json=reg_payload_a)
    assert dup_res.status_code == 400, f"Expected 400 for duplicate, got {dup_res.status_code}"
    print("PASS: Duplicate registration returns 400 Bad Request")

    # 5. Invalid validation checks
    bad_phone_payload = {**reg_payload_a, "email": "bad_phone@test.com"}
    bad_phone_payload["profile"]["phone"] = "12345"
    bad_phone_res = client.post("/api/v1/auth/register", json=bad_phone_payload)
    assert bad_phone_res.status_code == 422, f"Expected 422, got {bad_phone_res.status_code}"
    print("PASS: Invalid phone format rejected with 422")

    weak_pass_payload = {**reg_payload_a, "email": "weak_pass@test.com", "password": "short"}
    weak_pass_res = client.post("/api/v1/auth/register", json=weak_pass_payload)
    assert weak_pass_res.status_code == 422, f"Expected 422, got {weak_pass_res.status_code}"
    print("PASS: Weak password rejected with 422")

    # 6. Protected routes with Bearer token
    headers_a = {"Authorization": f"Bearer {token_a}"}
    me_res = client.get("/api/v1/auth/me", headers=headers_a)
    assert me_res.status_code == 200, f"GET /me failed: {me_res.text}"
    assert me_res.json()["user"]["email"] == "live_student_a@test.com"
    print("PASS: GET /me verified with valid Bearer token")

    # Missing token
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401
    print("PASS: Missing token rejected with 401 Unauthorized")

    # Tampered token
    tampered_res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bad.token.here"})
    assert tampered_res.status_code == 401
    print("PASS: Tampered token rejected with 401 Unauthorized")

    # 7. Authorization boundaries: Register Student B and verify isolation
    reg_payload_b = {
        "email": "live_student_b@test.com",
        "password": "Password123!",
        "profile": {
            "full_name": "Live Student B",
            "phone": "9811111111",
            "college": "IIT Madras",
            "branch": "Electrical",
            "year_of_study": 4,
            "expected_graduation_year": 2025,
            "cgpa": 9.1,
            "city": "Chennai",
            "state": "Tamil Nadu",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "DAV",
                "board_or_university": "CBSE",
                "passing_year": 2019,
                "percentage": 94.0,
            }
        ],
        "skills": [{"skill_id": 2, "self_level": 3}],
        "interest_ids": [2],
        "projects": [
            {
                "title": "Student B Blockchain",
                "description": "Smart contracts",
                "tech_stack": "Solidity, Rust",
            }
        ],
    }
    client.post("/api/v1/auth/register", json=reg_payload_b)
    login_b = client.post(
        "/api/v1/auth/login", json={"email": "live_student_b@test.com", "password": "Password123!"}
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    b_profile = client.get("/api/v1/profile", headers=headers_b).json()
    b_edu_id = b_profile["education"][0]["id"]
    b_proj_id = b_profile["projects"][0]["id"]

    # Student A tries to delete Student B's education record
    cross_edu_res = client.delete(f"/api/v1/profile/education/{b_edu_id}", headers=headers_a)
    assert cross_edu_res.status_code == 404, (
        f"Cross-tenant deletion must return 404, got {cross_edu_res.status_code}"
    )

    # Student A tries to update Student B's project
    cross_proj_res = client.put(
        f"/api/v1/profile/projects/{b_proj_id}", headers=headers_a, json={"title": "Hacked"}
    )
    assert cross_proj_res.status_code == 404, (
        f"Cross-tenant update must return 404, got {cross_proj_res.status_code}"
    )
    print("PASS: Authorization boundaries strictly enforced between User A and User B")

    # 8. Catalogs
    skills_res = client.get("/api/v1/catalog/skills?q=python")
    assert skills_res.status_code == 200
    assert any("Python" in s["name"] for s in skills_res.json())

    paths_res = client.get("/api/v1/catalog/paths")
    assert paths_res.status_code == 200
    assert len(paths_res.json()) == 9
    print("PASS: Catalog endpoints (skills search, career paths 9 count) verified")

    # 9. CORS check
    cors_valid = client.options(
        "/api/v1/catalog/paths",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert cors_valid.headers.get("access-control-allow-origin") == "http://localhost:5173"
    print("PASS: CORS allow-origin returned for allowed origin http://localhost:5173")

    cors_invalid = client.options(
        "/api/v1/catalog/paths",
        headers={"Origin": "https://malicious-site.com", "Access-Control-Request-Method": "GET"},
    )
    assert cors_invalid.headers.get("access-control-allow-origin") != "https://malicious-site.com"
    print("PASS: CORS disallows unconfigured origins")

    # 10. Rate limiting check
    print("Testing rate limiting on /api/v1/auth/login (limit: 15/min)...")
    hit_429 = False
    for i in range(20):
        r = client.post(
            "/api/v1/auth/login", json={"email": "rate_limit@test.com", "password": "wrongpassword"}
        )
        if r.status_code == 429:
            hit_429 = True
            break
    assert hit_429, "Rate limiter did not trigger HTTP 429 after 20 rapid requests"
    print("PASS: Rate limiting triggered HTTP 429 Too Many Requests as expected")

    print("\nALL LIVE HTTP TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_live_tests()
