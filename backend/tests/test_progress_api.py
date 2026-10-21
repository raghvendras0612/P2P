from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog import Skill
from app.models.progress import UserStreak
from app.models.testing import SkillProficiencyHistory
from app.models.user import User
from tests.test_auth import get_sample_registration_payload


@pytest.fixture
def auth_context(client: TestClient, db_session: Session):
    payload = get_sample_registration_payload("progress_student@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]
    user = db_session.query(User).filter(User.id == user_id).first()
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def test_get_progress_initial_state(client: TestClient, auth_context: tuple):
    _, headers = auth_context

    resp = client.get("/api/v1/progress", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["current_streak_days"] == 0
    assert data["longest_streak_days"] == 0
    assert data["next_best_action"] is not None
    assert "skill_test" in data["next_best_action"]["action_type"]


def test_toggle_milestone_checkpoint_and_streak(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context

    # 1. Toggle checkpoint completed
    toggle_payload = {
        "career_path_slug": "full-stack-developer",
        "item_type": "milestone_checkpoint",
        "item_ref": "Pass campus placement mock coding rounds in under 45 minutes",
        "status": "completed",
    }
    resp = client.post("/api/v1/progress/toggle", json=toggle_payload, headers=headers)
    assert resp.status_code == 200

    # 2. Re-fetch progress
    prog_resp = client.get("/api/v1/progress", headers=headers)
    assert prog_resp.status_code == 200
    data = prog_resp.json()

    # Completed map must contain checkpoint
    key = "milestone_checkpoint:Pass campus placement mock coding rounds in under 45 minutes"
    assert data["completed_items_map"].get(key) is True
    # Streak started
    assert data["current_streak_days"] == 1
    assert data["longest_streak_days"] == 1


def test_update_project_progress(client: TestClient, auth_context: tuple):
    _, headers = auth_context

    project_payload = {
        "career_path_slug": "full-stack-developer",
        "project_title": "Real-Time Collaborative Code Editor",
        "status": "completed",
        "repo_url": "https://github.com/rahul/collaborative-editor",
        "notes": "Deployed with WebSockets on Render and PostgreSQL on Neon.",
    }
    resp = client.post("/api/v1/progress/projects", json=project_payload, headers=headers)
    assert resp.status_code == 200

    # Verify project progress in dashboard
    prog_resp = client.get("/api/v1/progress", headers=headers)
    data = prog_resp.json()
    proj = next(
        p
        for p in data["projects_progress"]
        if p["project_title"] == "Real-Time Collaborative Code Editor"
    )
    assert proj["status"] == "completed"
    assert proj["repo_url"] == "https://github.com/rahul/collaborative-editor"


def test_streak_consecutive_days_increment(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context

    # Mock user streak where last activity was yesterday (in Asia/Kolkata timezone)
    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    yesterday = (now_ist - timedelta(days=1)).strftime("%Y-%m-%d")
    streak = db_session.query(UserStreak).filter(UserStreak.user_id == user.id).first()
    if not streak:
        streak = UserStreak(
            user_id=user.id,
            current_streak_days=3,
            longest_streak_days=5,
            last_activity_date=yesterday,
        )
        db_session.add(streak)
    else:
        streak.current_streak_days = 3
        streak.longest_streak_days = 5
        streak.last_activity_date = yesterday
    db_session.commit()

    # Completing an item today should increment streak from 3 -> 4
    toggle_payload = {
        "career_path_slug": "full-stack-developer",
        "item_type": "first_month_task",
        "item_ref": "Complete Git branching and pull request hygiene",
        "status": "completed",
    }
    resp = client.post("/api/v1/progress/toggle", json=toggle_payload, headers=headers)
    assert resp.status_code == 200

    prog_resp = client.get("/api/v1/progress", headers=headers)
    data = prog_resp.json()
    assert data["current_streak_days"] == 4
    assert data["longest_streak_days"] == 5


def test_skill_growth_timeline_history(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context

    skill = Skill(name="Growth Skill", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    now = datetime.now(timezone.utc)
    entry = SkillProficiencyHistory(
        user_id=user.id,
        skill_id=skill.id,
        old_status="claimed",
        new_status="verified",
        old_level=1,
        new_level=3,
        score_achieved=88.5,
        changed_at=now,
    )
    db_session.add(entry)
    db_session.commit()

    resp = client.get("/api/v1/progress/history", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    point = next(p for p in data if p["skill_name"] == "Growth Skill")
    assert point["verified_level"] == 3
    assert point["verified_level_name"] == "Advanced"
    assert point["score_achieved"] == 88.5
