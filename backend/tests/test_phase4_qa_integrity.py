import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSkill
from app.models.testing import TestAttempt
from app.services.test_engine_service import test_engine_service
from tests.test_auth import get_sample_registration_payload
from tests.test_question_service import create_mock_question_batch


@pytest.fixture(autouse=True)
def mock_gemini_client():
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(create_mock_question_batch("Integrity Skill", 30))
    mock_client.models.generate_content.return_value = mock_resp
    test_engine_service.question_service._client = mock_client
    yield mock_client


def create_authenticated_user(client: TestClient, email: str) -> tuple[int, dict]:
    payload = get_sample_registration_payload(email)
    res = client.post("/api/v1/auth/register", json=payload)
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    return user_id, {"Authorization": f"Bearer {token}"}


def test_zero_answer_leakage_and_field_completeness(client: TestClient, db_session: Session):
    """Verify test payload contains all client fields and strictly ZERO answer keys or explanations."""
    user_id, headers = create_authenticated_user(client, "leak_test@example.com")
    skill = Skill(name="Security Integrity Skill", category="Security", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    db_session.add(UserSkill(user_id=user_id, skill_id=skill.id, self_level=2, status="claimed"))
    db_session.commit()

    resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    # Verify session fields
    assert "attempt_id" in data
    assert "skill_id" in data
    assert "time_remaining_seconds" in data
    assert data["time_remaining_seconds"] <= 2700

    # Verify each question in detail
    for q in data["questions"]:
        assert "attempt_answer_id" in q
        assert "question_id" in q
        assert "question_order" in q
        assert "question_text" in q
        assert "question_type" in q
        assert "options" in q
        assert "difficulty" in q
        assert "subtopic_tag" in q
        assert "selected_answers" in q

        # LEAKAGE CHECKS: neither correct_answers nor explanation may appear in client questions
        assert "correct_answers" not in q
        assert "explanation" not in q
        assert "is_correct" not in q
        assert "points_awarded" not in q

        for opt in q["options"]:
            assert "id" in opt
            assert "text" in opt
            assert "is_correct" not in opt


def test_45_min_timer_expiration(client: TestClient, db_session: Session):
    """Test attempt expires after 45 minutes; starting new request after expiry clears old."""
    user_id, headers = create_authenticated_user(client, "timer_test@example.com")
    skill = Skill(name="Timer Skill", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    db_session.add(UserSkill(user_id=user_id, skill_id=skill.id, self_level=2, status="claimed"))
    db_session.commit()

    # Start test
    resp1 = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp1.status_code == 200
    attempt_id1 = resp1.json()["attempt_id"]

    # Manually expire the attempt in the database (expires_at in past)
    past_dt = datetime.now(timezone.utc) - timedelta(minutes=50)
    attempt_rec = db_session.query(TestAttempt).filter(TestAttempt.id == attempt_id1).first()
    assert attempt_rec is not None
    attempt_rec.expires_at = past_dt
    db_session.commit()

    # Re-starting should detect expiration, mark it expired, and allow a fresh start
    resp2 = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert resp2.status_code == 200
    attempt_id2 = resp2.json()["attempt_id"]
    assert attempt_id2 != attempt_id1

    db_session.refresh(attempt_rec)
    assert attempt_rec.status == "expired"


def test_7_day_cooldown_enforcement_and_expiry(client: TestClient, db_session: Session):
    """After failing a test, user cannot retake for 7 days; allowed after cooldown expires."""
    user_id, headers = create_authenticated_user(client, "cooldown_test@example.com")
    skill = Skill(name="Cooldown Skill", category="CS", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    db_session.add(UserSkill(user_id=user_id, skill_id=skill.id, self_level=3, status="claimed"))
    db_session.commit()

    # 1. Start and immediately submit (0 answers -> fail)
    resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    attempt_id = resp.json()["attempt_id"]

    sub_res = client.post(f"/api/v1/tests/{attempt_id}/submit", headers=headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["passed"] is False

    # 2. Immediate retake attempt must be blocked by 7-day cooldown (HTTP 429)
    retry_resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert retry_resp.status_code == 429
    assert "cooldown active" in retry_resp.json()["detail"].lower()

    # 3. Simulate 8 days passing by backdating completed_at
    att = db_session.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
    assert att is not None
    att.completed_at = datetime.now(timezone.utc) - timedelta(days=8)
    db_session.commit()

    # 4. Now retake must succeed
    allowed_resp = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers)
    assert allowed_resp.status_code == 200
    assert allowed_resp.json()["attempt_id"] != attempt_id


def test_cross_tenant_test_isolation(client: TestClient, db_session: Session):
    """User B cannot view, answer, submit, or inspect results for User A's test attempt."""
    user_a_id, headers_a = create_authenticated_user(client, "usera_iso@example.com")
    user_b_id, headers_b = create_authenticated_user(client, "userb_iso@example.com")

    skill = Skill(name="Tenant Isolation Skill", category="DevOps", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    db_session.add(UserSkill(user_id=user_a_id, skill_id=skill.id, self_level=2, status="claimed"))
    db_session.commit()

    # User A starts test
    resp_a = client.post("/api/v1/tests/start", json={"skill_id": skill.id}, headers=headers_a)
    assert resp_a.status_code == 200
    attempt_a_id = resp_a.json()["attempt_id"]
    q1 = resp_a.json()["questions"][0]

    # User B attempts to answer User A's question -> 404
    b_ans = client.put(
        f"/api/v1/tests/{attempt_a_id}/answer",
        json={
            "question_id": q1["question_id"],
            "selected_answers": ["A"],
            "time_spent_seconds": 10,
        },
        headers=headers_b,
    )
    assert b_ans.status_code == 404

    # User B attempts to log tab switch for User A's test -> 404
    b_tab = client.post(f"/api/v1/tests/{attempt_a_id}/tab-switch", headers=headers_b)
    assert b_tab.status_code == 404

    # User B attempts to submit User A's test -> 404
    b_sub = client.post(f"/api/v1/tests/{attempt_a_id}/submit", headers=headers_b)
    assert b_sub.status_code == 404

    # User B attempts to view User A's results -> 404
    b_res = client.get(f"/api/v1/tests/{attempt_a_id}/results", headers=headers_b)
    assert b_res.status_code == 404
