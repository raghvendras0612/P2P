import json
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSkill
from app.models.testing import QuestionBank, TestAttempt
from app.models.user import User
from app.services.test_engine_service import test_engine_service
from tests.test_auth import get_sample_registration_payload
from tests.test_question_service import create_mock_question_batch


@pytest.fixture(autouse=True)
def mock_gemini_for_tests():
    """Mock QuestionService Gemini client for all test engine API calls."""
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(create_mock_question_batch("General Skill", 30))
    mock_client.models.generate_content.return_value = mock_resp
    test_engine_service.question_service._client = mock_client
    yield mock_client


@pytest.fixture
def auth_context(client: TestClient, db_session: Session):
    payload = get_sample_registration_payload("test_student_skill@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]
    user = db_session.query(User).filter(User.id == user_id).first()
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def test_claimed_skill_test_eligibility_listing(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context
    skill1 = Skill(name="Docker Containers", category="DevOps", is_verified_seed=True)
    skill2 = Skill(name="PostgreSQL Database", category="Database", is_verified_seed=True)
    db_session.add_all([skill1, skill2])
    db_session.commit()

    # User claims skill1
    us1 = UserSkill(user_id=user.id, skill_id=skill1.id, self_level=2, status="claimed")
    db_session.add(us1)
    db_session.commit()

    resp = client.get("/api/v1/tests/skills", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    claimed_names = [d["name"] for d in data]
    assert "Docker Containers" in claimed_names
    docker_item = next(d for d in data if d["name"] == "Docker Containers")
    assert docker_item["can_take_test"] is True
    assert docker_item["status"] == "claimed"


def test_start_test_zero_answer_leakage(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context
    skill = Skill(name="React Diagnostic", category="Frontend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    us = UserSkill(user_id=user.id, skill_id=skill.id, self_level=3, status="claimed")
    db_session.add(us)
    db_session.commit()

    resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["skill_name"] == "React Diagnostic"
    assert data["total_questions"] == 25
    assert len(data["questions"]) == 25
    assert data["time_remaining_seconds"] > 2600

    # CRITICAL SECURITY CHECK: Ensure zero answer keys or explanations are leaked
    for q in data["questions"]:
        assert "correct_answers" not in q
        assert "explanation" not in q
        assert len(q["options"]) == 4
        assert q["selected_answers"] == []


def test_start_test_unclaimed_skill_rejected(
    client: TestClient, auth_context: tuple, db_session: Session
):
    _, headers = auth_context
    skill = Skill(name="Unclaimed Skill", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp.status_code == 400
    assert "claimed skills" in resp.json()["detail"].lower()


def test_resume_active_attempt_on_refresh(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context
    skill = Skill(name="TypeScript Test", category="Frontend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    us = UserSkill(user_id=user.id, skill_id=skill.id, self_level=2, status="claimed")
    db_session.add(us)
    db_session.commit()

    # Start test
    resp1 = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp1.status_code == 200
    attempt_id = resp1.json()["attempt_id"]
    q1 = resp1.json()["questions"][0]

    # Save an answer incrementally
    ans_resp = client.put(
        f"/api/v1/tests/{attempt_id}/answer",
        json={
            "question_id": q1["question_id"],
            "selected_answers": ["B"],
            "time_spent_seconds": 15,
        },
        headers=headers,
    )
    assert ans_resp.status_code == 200

    # Simulate browser reload by calling start again
    resp2 = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["attempt_id"] == attempt_id
    # First question should have ['B'] selected
    assert resp2.json()["questions"][0]["selected_answers"] == ["B"]


def test_tab_switch_logging(client: TestClient, auth_context: tuple, db_session: Session):
    user, headers = auth_context
    skill = Skill(name="Go Language", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    us = UserSkill(user_id=user.id, skill_id=skill.id, self_level=1, status="claimed")
    db_session.add(us)
    db_session.commit()

    resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    attempt_id = resp.json()["attempt_id"]

    tab_resp = client.post(f"/api/v1/tests/{attempt_id}/tab-switch", headers=headers)
    assert tab_resp.status_code == 200
    assert tab_resp.json()["tab_switch_count"] == 1


def test_submit_pass_and_verify_level(client: TestClient, auth_context: tuple, db_session: Session):
    user, headers = auth_context
    skill = Skill(name="Python Master", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    us = UserSkill(user_id=user.id, skill_id=skill.id, self_level=2, status="claimed")
    db_session.add(us)
    db_session.commit()

    start_resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    attempt_id = start_resp.json()["attempt_id"]
    questions = start_resp.json()["questions"]

    # Answer all questions correctly by inspecting question_bank in db
    for q in questions:
        qb = db_session.query(QuestionBank).filter(QuestionBank.id == q["question_id"]).first()
        client.put(
            f"/api/v1/tests/{attempt_id}/answer",
            json={"question_id": q["question_id"], "selected_answers": qb.correct_answers_json},
            headers=headers,
        )

    # Submit test
    sub_resp = client.post(f"/api/v1/tests/{attempt_id}/submit", headers=headers)
    assert sub_resp.status_code == 200
    res_data = sub_resp.json()

    assert res_data["passed"] is True
    assert res_data["score_percentage"] == 100.0
    assert res_data["verified_level"] == 4  # Expert (100% score)
    assert res_data["verified_level_name"] == "Expert"
    assert len(res_data["question_reviews"]) == 25
    assert all(r["is_correct"] for r in res_data["question_reviews"])

    # Now verify that question_reviews contains the full explanations
    assert len(res_data["question_reviews"][0]["explanation"]) > 10

    # Verify user_skill was updated in DB
    db_session.refresh(us)
    assert us.status == "verified"
    assert us.verified_level == 4
    assert us.last_tested_at is not None

    # Test 7-day cooldown: attempting to retake immediately returns 429
    cooldown_resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert cooldown_resp.status_code == 429
    assert "cooldown active" in cooldown_resp.json()["detail"].lower()


def test_cross_tenant_isolation_on_tests(
    client: TestClient, auth_context: tuple, db_session: Session
):
    _, headers = auth_context

    # Create User B
    user_b = User(email="other_student@college.edu", password_hash="hash")
    db_session.add(user_b)
    db_session.commit()

    skill = Skill(name="Isolation Skill", category="DevOps", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    # User B has an attempt
    attempt_b = TestAttempt(
        user_id=user_b.id,
        skill_id=skill.id,
        status="in_progress",
        expires_at=user_b.created_at,
        time_limit_seconds=2700,
        total_questions=25,
        total_points=50.0,
    )
    db_session.add(attempt_b)
    db_session.commit()

    # User A tries to answer or submit User B's attempt -> 404
    ans_resp = client.put(
        f"/api/v1/tests/{attempt_b.id}/answer",
        json={"question_id": 1, "selected_answers": ["A"]},
        headers=headers,
    )
    assert ans_resp.status_code == 404

    sub_resp = client.post(f"/api/v1/tests/{attempt_b.id}/submit", headers=headers)
    assert sub_resp.status_code == 404
