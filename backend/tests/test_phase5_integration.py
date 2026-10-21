import json
import os
from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.catalog import Skill, UserSkill
from app.models.progress import ProgressItem
from app.models.user import User
from app.routers.mentor import mentor_service
from app.schemas.simulation import SimulationOutput
from app.services.ai.ai_service import AIService
from app.services.test_engine_service import test_engine_service
from tests.test_auth import get_sample_registration_payload
from tests.test_question_service import create_mock_question_batch


class MockStreamChunk:
    def __init__(self, text: str):
        self.text = text


def test_full_student_journey_integration(client: TestClient, db_session: Session):
    """
    Comprehensive end-to-end integration test spanning the full platform lifecycle:
    1. Registration & Profile Setup
    2. AI Career Path Simulation (Mocked)
    3. Selected Path Commitment & Personalization
    4. Diagnostic Skill Assessment & Level Verification
    5. ATS Resume Auto-Compilation & Verification Badge
    6. Daily Progress Tracking & Streak Counter
    7. AI Placement Mentor SSE Chat & Action Confirmation
    """
    # -------------------------------------------------------------
    # Step 1: Register New Student
    # -------------------------------------------------------------
    reg_payload = get_sample_registration_payload("lifecycle_student@example.com")
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify user profile in DB
    user = db_session.query(User).filter(User.id == user_id).first()
    assert user is not None
    assert user.profile.full_name == reg_payload["profile"]["full_name"]

    # -------------------------------------------------------------
    # Step 2: Run AI Simulation with Mocked Gemini Engine
    # -------------------------------------------------------------
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_simulation.json")
    with open(fixture_path, "r") as f:
        sample_simulation_data = json.load(f)

    mock_ai = MagicMock(spec=AIService)
    mock_ai.simulate_career_paths.return_value = SimulationOutput.model_validate(
        sample_simulation_data
    )
    mock_ai.prompt_version = "v1.0.0"
    mock_ai.model_name = "gemini-2.5-flash"

    with pytest.MonkeyPatch.context() as mp:
        from app.routers.simulation import simulation_service

        mp.setattr(simulation_service, "ai_service", mock_ai)

        sim_resp = client.post("/api/v1/simulations", headers=headers, json={"mode": "auto"})
        assert sim_resp.status_code == 202
        sim_id = sim_resp.json()["simulation_id"]
        assert sim_id is not None

    # -------------------------------------------------------------
    # Step 3: Choose Full Stack Career Path Track
    # -------------------------------------------------------------
    choose_resp = client.post(
        "/api/v1/profile/selected-path",
        headers=headers,
        json={"path_slug": "full-stack-developer", "simulation_id": sim_id},
    )
    assert choose_resp.status_code == 200
    assert choose_resp.json()["career_path"]["slug"] == "full-stack-developer"

    # -------------------------------------------------------------
    # Step 4: Diagnostic Skill Testing & Verification
    # -------------------------------------------------------------
    py_skill = db_session.query(Skill).filter(Skill.name == "Python").first()
    assert py_skill is not None

    us = (
        db_session.query(UserSkill)
        .filter(UserSkill.user_id == user_id, UserSkill.skill_id == py_skill.id)
        .first()
    )
    if not us:
        db_session.add(
            UserSkill(user_id=user_id, skill_id=py_skill.id, self_level=2, status="claimed")
        )
        db_session.commit()

    # Mock Question Bank Generator for testing
    mock_batch = create_mock_question_batch("Python", 30)
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value.text = json.dumps(mock_batch)
    test_engine_service.question_service._client = mock_client

    # Start test
    start_res = client.post("/api/v1/tests/start", headers=headers, json={"skill_id": py_skill.id})
    assert start_res.status_code == 200
    attempt_data = start_res.json()
    attempt_id = attempt_data["attempt_id"]
    questions = attempt_data["questions"]

    # Record answers incrementally
    for q in questions:
        matched_q = next(
            bq for bq in mock_batch["questions"] if bq["question_text"] == q["question_text"]
        )
        ans_res = client.put(
            f"/api/v1/tests/{attempt_id}/answer",
            headers=headers,
            json={
                "question_id": q["question_id"],
                "selected_answers": matched_q["correct_answers"],
                "time_spent_seconds": 15,
            },
        )
        assert ans_res.status_code == 200

    # Submit test
    submit_res = client.post(
        f"/api/v1/tests/{attempt_id}/submit",
        headers=headers,
    )
    assert submit_res.status_code == 200
    result_data = submit_res.json()
    assert result_data["score_percentage"] >= 85.0
    assert result_data["passed"] is True
    assert result_data["verified_level"] >= 3

    # Verify user skill updated to verified
    us_record = (
        db_session.query(UserSkill)
        .filter(UserSkill.user_id == user_id, UserSkill.skill_id == py_skill.id)
        .first()
    )
    assert us_record.status == "verified"
    assert us_record.verified_level >= 3

    # -------------------------------------------------------------
    # Step 5: ATS Resume Auto-Compilation
    # -------------------------------------------------------------
    resume_res = client.get("/api/v1/resume", headers=headers)
    assert resume_res.status_code == 200
    resume_data = resume_res.json()
    assert "Full Stack" in resume_data["target_role"]
    assert any(
        s["name"] == "Python" and s["status"] == "verified" for s in resume_data["verified_skills"]
    )

    # -------------------------------------------------------------
    # Step 6: Daily Progress Tracking
    # -------------------------------------------------------------
    checkpoint_ref = "Pass campus placement mock coding rounds in under 45 minutes"
    prog_toggle_res = client.post(
        "/api/v1/progress/toggle",
        headers=headers,
        json={
            "career_path_slug": "full-stack-developer",
            "item_type": "milestone_checkpoint",
            "item_ref": checkpoint_ref,
            "status": "completed",
        },
    )
    assert prog_toggle_res.status_code == 200

    dash_prog_res = client.get("/api/v1/progress", headers=headers)
    assert dash_prog_res.status_code == 200
    dash_data = dash_prog_res.json()
    assert dash_data["current_streak_days"] >= 1
    assert dash_data["completed_items_map"][f"milestone_checkpoint:{checkpoint_ref}"] is True

    # -------------------------------------------------------------
    # Step 7: AI Mentor Chat Streaming & Proposed Action Confirmation
    # -------------------------------------------------------------
    thread_res = client.post(
        "/api/v1/mentor/threads",
        headers=headers,
        json={"title": "Placement Strategy Review"},
    )
    assert thread_res.status_code == 201
    thread_id = thread_res.json()["id"]

    mock_chunks = [
        MockStreamChunk("Congratulations on verifying your Python proficiency at Advanced level! "),
        MockStreamChunk(
            "Looking at your remaining high-priority gaps for Full Stack Developer, Docker is critical.\n"
        ),
        MockStreamChunk(
            '[PROPOSED_ACTION: {"type": "add_task", "title": "Build Multi-Stage Dockerfile for FastAPI", "description": "Reduce container image size and optimize layer caching."}]\n'
        ),
        MockStreamChunk("Add this to your weekly goals."),
    ]

    mock_mentor_client = MagicMock()
    mock_mentor_client.models.generate_content_stream.return_value = iter(mock_chunks)
    mentor_service._client = mock_mentor_client

    stream_res = client.post(
        f"/api/v1/mentor/threads/{thread_id}/messages",
        headers=headers,
        json={"content": "What is my next critical placement priority?"},
    )
    assert stream_res.status_code == 200
    assert "event: token" in stream_res.text
    assert "event: action" in stream_res.text
    assert "event: done" in stream_res.text
    assert "Build Multi-Stage Dockerfile for FastAPI" in stream_res.text

    # Student confirms proposed action
    action_confirm_res = client.post(
        "/api/v1/mentor/actions/confirm",
        headers=headers,
        json={
            "type": "add_task",
            "title": "Build Multi-Stage Dockerfile for FastAPI",
            "description": "Reduce container image size and optimize layer caching.",
            "career_path_slug": "full-stack-developer",
        },
    )
    assert action_confirm_res.status_code == 200
    assert action_confirm_res.json()["status"] == "created"

    # Confirm item persisted in progress table
    saved_item = (
        db_session.query(ProgressItem)
        .filter(
            ProgressItem.user_id == user_id,
            ProgressItem.item_ref == "Build Multi-Stage Dockerfile for FastAPI",
        )
        .first()
    )
    assert saved_item is not None
    assert saved_item.status == "not_started"


def test_platform_security_and_authorization_matrix(client: TestClient, db_session: Session):
    """
    Exhaustive security audit asserting strict cross-tenant isolation,
    expired token rejection, and malformed payload validation.
    """
    # 1. Create User A
    user_a_payload = get_sample_registration_payload("student_alpha_phase5@example.com")
    reg_a = client.post("/api/v1/auth/register", json=user_a_payload).json()
    token_a = reg_a["access_token"]
    user_a_id = reg_a["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Create User B
    user_b_payload = get_sample_registration_payload("student_bravo_phase5@example.com")
    reg_b = client.post("/api/v1/auth/register", json=user_b_payload).json()
    token_b = reg_b["access_token"]
    user_b_id = reg_b["user"]["id"]
    assert user_b_id != user_a_id
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A creates a chat thread
    thread_a = client.post(
        "/api/v1/mentor/threads",
        headers=headers_a,
        json={"title": "Alpha Confidential Strategy"},
    ).json()
    thread_a_id = thread_a["id"]

    # User B attempts to access User A's thread -> HTTP 404
    resp_cross_get = client.get(f"/api/v1/mentor/threads/{thread_a_id}", headers=headers_b)
    assert resp_cross_get.status_code == 404

    resp_cross_msgs = client.get(
        f"/api/v1/mentor/threads/{thread_a_id}/messages", headers=headers_b
    )
    assert resp_cross_msgs.status_code == 404

    resp_cross_send = client.post(
        f"/api/v1/mentor/threads/{thread_a_id}/messages",
        headers=headers_b,
        json={"content": "Malicious probe"},
    )
    assert resp_cross_send.status_code == 404

    resp_cross_del = client.delete(f"/api/v1/mentor/threads/{thread_a_id}", headers=headers_b)
    assert resp_cross_del.status_code == 404

    # 4. Expired / Invalid Token Rejection
    expired_token = create_access_token(user_a_id, expires_delta=timedelta(seconds=-3600))
    expired_headers = {"Authorization": f"Bearer {expired_token}"}

    resp_expired_auth = client.get("/api/v1/profile", headers=expired_headers)
    assert resp_expired_auth.status_code == 401

    resp_garbage_token = client.get(
        "/api/v1/profile", headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert resp_garbage_token.status_code == 401

    resp_no_token = client.get("/api/v1/profile")
    assert resp_no_token.status_code == 401

    # 5. Oversized Message Validation
    oversized_message = "x" * 1500  # Exceeds max length of 1000
    resp_oversized = client.post(
        f"/api/v1/mentor/threads/{thread_a_id}/messages",
        headers=headers_a,
        json={"content": oversized_message},
    )
    assert resp_oversized.status_code == 422  # Pydantic validation error

    # 6. Health endpoint verification
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    api_health_resp = client.get("/api/v1/health")
    assert api_health_resp.status_code == 200
    assert api_health_resp.json()["database"] == "connected"
