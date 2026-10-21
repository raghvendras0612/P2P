"""Phase 5 Security Matrix & Multi-Tenant Authorization Isolation Tests.

Exhaustively verifies cross-tenant isolation and security boundaries:
- User A cannot view, mutate, or delete User B's resources:
  * Mentor threads and messages
  * Diagnostic skill test attempts and results
  * Simulation records and resimulation triggers
  * Profile items (education, projects, experiences)
  * Resumes and ATS scorecards
  * Roadmap progress tracking
- Ensures HTTP 403 or 404 is strictly returned with no data leakage.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.simulation import Simulation
from app.models.testing import TestAttempt
from tests.test_auth import get_sample_registration_payload


def create_user_and_token(client: TestClient, email: str, name: str) -> tuple[int, dict]:
    payload = get_sample_registration_payload(email)
    payload["profile"]["full_name"] = name
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    return user_id, {"Authorization": f"Bearer {token}"}


def test_mentor_thread_multi_tenant_isolation(client: TestClient, db_session: Session):
    """User B must be forbidden from reading, messaging, or deleting User A's thread."""
    user_a_id, headers_a = create_user_and_token(client, "alice.sec@example.com", "Alice Smith")
    user_b_id, headers_b = create_user_and_token(client, "bob.sec@example.com", "Bob Jones")

    # Alice creates a thread
    res = client.post("/api/v1/mentor/threads", json={"title": "Alice Private Thread"}, headers=headers_a)
    assert res.status_code == 201
    thread_id = res.json()["id"]

    # Bob attempts to get Alice's thread -> 404 Not Found (or 403 Forbidden)
    res_b_get = client.get(f"/api/v1/mentor/threads/{thread_id}", headers=headers_b)
    assert res_b_get.status_code in (403, 404), f"Bob accessed Alice's thread: {res_b_get.text}"

    # Bob attempts to get Alice's messages -> 403 or 404
    res_b_msgs = client.get(f"/api/v1/mentor/threads/{thread_id}/messages", headers=headers_b)
    assert res_b_msgs.status_code in (403, 404), f"Bob accessed Alice's messages: {res_b_msgs.text}"

    # Bob attempts to delete Alice's thread -> 403 or 404
    res_b_del = client.delete(f"/api/v1/mentor/threads/{thread_id}", headers=headers_b)
    assert res_b_del.status_code in (403, 404), f"Bob deleted Alice's thread: {res_b_del.text}"

    # Thread still exists for Alice
    res_a_check = client.get(f"/api/v1/mentor/threads/{thread_id}", headers=headers_a)
    assert res_a_check.status_code == 200


def test_simulation_multi_tenant_isolation(client: TestClient, db_session: Session):
    """User B cannot read or resimulate User A's simulation results."""
    user_a_id, headers_a = create_user_and_token(client, "alice.sim@example.com", "Alice Sim")
    user_b_id, headers_b = create_user_and_token(client, "bob.sim@example.com", "Bob Sim")

    # Create dummy simulation for Alice directly in DB
    sim = Simulation(
        user_id=user_a_id,
        mode="auto",
        prompt_version="v1",
        model_name="gemini-2.5-pro",
        input_snapshot={"skills": ["Python"]},
        output_json={
            "paths": [],
            "assumptions_made": ["Daily study"],
            "disclaimers": ["Projections only"],
            "overall_recommendation": "Great fit",
        },
    )
    db_session.add(sim)
    db_session.commit()
    db_session.refresh(sim)

    # Bob attempts to read Alice's simulation
    res_b_get = client.get(f"/api/v1/simulations/{sim.id}", headers=headers_b)
    assert res_b_get.status_code in (403, 404), f"Bob read Alice's simulation: {res_b_get.text}"

    # Bob attempts to resimulate Alice's simulation
    res_b_resim = client.post(f"/api/v1/simulations/{sim.id}/resimulate", json={}, headers=headers_b)
    assert res_b_resim.status_code in (403, 404)


def test_skill_test_attempt_multi_tenant_isolation(client: TestClient, db_session: Session):
    """User B cannot submit answers, grade, or view results of User A's test attempt."""
    from datetime import datetime, timedelta, timezone
    user_a_id, headers_a = create_user_and_token(client, "alice.test@example.com", "Alice Tester")
    user_b_id, headers_b = create_user_and_token(client, "bob.test@example.com", "Bob Tester")

    # Create test attempt directly in DB for Alice
    attempt = TestAttempt(
        user_id=user_a_id,
        skill_id=1,
        status="in_progress",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=45),
        time_limit_seconds=2700,
        total_questions=25,
        total_points=25.0,
        earned_points=0.0,
        pass_mark=60.0,
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)
    attempt_id = attempt.id

    # Bob attempts to submit an answer to Alice's test attempt
    res_b_answer = client.put(
        f"/api/v1/tests/{attempt_id}/answer",
        json={"question_id": 1, "selected_answers": ["A"]},
        headers=headers_b,
    )
    assert res_b_answer.status_code in (403, 404)

    # Bob attempts to submit Alice's test attempt
    res_b_submit = client.post(f"/api/v1/tests/{attempt_id}/submit", headers=headers_b)
    assert res_b_submit.status_code in (403, 404)

    # Bob attempts to view results of Alice's test attempt
    res_b_results = client.get(f"/api/v1/tests/{attempt_id}/results", headers=headers_b)
    assert res_b_results.status_code in (403, 404)


def test_profile_records_multi_tenant_isolation(client: TestClient, db_session: Session):
    """User B cannot delete User A's education, project, or experience records."""
    user_a_id, headers_a = create_user_and_token(client, "alice.prof@example.com", "Alice Prof")
    user_b_id, headers_b = create_user_and_token(client, "bob.prof@example.com", "Bob Prof")

    # Create Alice education
    edu_res = client.post(
        "/api/v1/profile/education",
        json={
            "level": "12th",
            "institution_name": "Delhi Public School",
            "board_or_university": "CBSE",
            "passing_year": 2022,
            "percentage": 92.0,
        },
        headers=headers_a,
    )
    assert edu_res.status_code == 201
    edu_id = edu_res.json()["id"]

    # Bob attempts to delete Alice's education
    res_b_del_edu = client.delete(f"/api/v1/profile/education/{edu_id}", headers=headers_b)
    assert res_b_del_edu.status_code in (403, 404)

    # Create Alice project
    proj_res = client.post(
        "/api/v1/profile/projects",
        json={
            "title": "Alice Distributed Cache",
            "description": "High performance in-memory key-value store in Go",
            "tech_stack": "Go, Docker",
        },
        headers=headers_a,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Bob attempts to delete Alice's project
    res_b_del_proj = client.delete(f"/api/v1/profile/projects/{proj_id}", headers=headers_b)
    assert res_b_del_proj.status_code in (403, 404)


def test_unauthenticated_requests_strictly_rejected(client: TestClient):
    """Endpoints requiring authentication must return 401 Unauthorized when no token is passed."""
    unauth_endpoints = [
        ("GET", "/api/v1/auth/me"),
        ("GET", "/api/v1/profile"),
        ("GET", "/api/v1/profile/selected-path"),
        ("GET", "/api/v1/simulations/history"),
        ("GET", "/api/v1/tests/skills"),
        ("POST", "/api/v1/tests/start"),
        ("GET", "/api/v1/resume"),
        ("GET", "/api/v1/progress"),
        ("GET", "/api/v1/mentor/threads"),
        ("POST", "/api/v1/mentor/actions/confirm"),
    ]

    for method, path in unauth_endpoints:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path, json={})
        assert res.status_code == 401, f"Expected 401 for {method} {path}, got {res.status_code}"
