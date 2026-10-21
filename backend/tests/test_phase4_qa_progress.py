from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.progress import ProgressItem, UserStreak
from app.services.ai.prompts.builder import build_simulation_input_prompt
from app.services.simulation_service import build_student_profile_snapshot
from tests.test_auth import get_sample_registration_payload


def create_user_with_token(client: TestClient, email: str) -> tuple[int, dict]:
    payload = get_sample_registration_payload(email)
    res = client.post("/api/v1/auth/register", json=payload)
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    return user_id, {"Authorization": f"Bearer {token}"}


def test_progress_toggle_persistence_and_reversibility(client: TestClient):
    """Toggle checkpoint to completed, verify persistence, then revert and verify."""
    user_id, headers = create_user_with_token(client, "toggle_persist@example.com")

    payload = {
        "career_path_slug": "backend-engineer",
        "item_type": "milestone_checkpoint",
        "item_ref": "Build a REST API with FastAPI and PostgreSQL",
        "status": "completed",
    }

    # 1. Toggle to completed
    res1 = client.post("/api/v1/progress/toggle", json=payload, headers=headers)
    assert res1.status_code == 200

    # 2. Fetch progress and verify completed
    get_res1 = client.get("/api/v1/progress", headers=headers)
    assert get_res1.status_code == 200
    completed_map1 = get_res1.json()["completed_items_map"]
    key = "milestone_checkpoint:Build a REST API with FastAPI and PostgreSQL"
    assert completed_map1.get(key) is True

    # 3. Revert to not_started
    payload["status"] = "not_started"
    res2 = client.post("/api/v1/progress/toggle", json=payload, headers=headers)
    assert res2.status_code == 200

    # 4. Fetch progress and verify reverted
    get_res2 = client.get("/api/v1/progress", headers=headers)
    assert get_res2.status_code == 200
    completed_map2 = get_res2.json()["completed_items_map"]
    assert completed_map2.get(key) is False


def test_streak_ist_single_increment_and_broken_streak_zero(
    client: TestClient, db_session: Session
):
    """Verify streak mechanics in Asia/Kolkata timezone:
    1. First task today -> streak = 1
    2. Second task today -> streak stays 1
    3. Yesterday active -> increments to 2
    4. Missed days -> current_streak_days displays as 0 until active
    """
    user_id, headers = create_user_with_token(client, "streak_ist@example.com")
    kolkata_tz = ZoneInfo("Asia/Kolkata")
    now_kolkata = datetime.now(kolkata_tz)
    today_ist = now_kolkata.strftime("%Y-%m-%d")
    yesterday_ist = (now_kolkata - timedelta(days=1)).strftime("%Y-%m-%d")

    # Step 1: Complete task 1 today
    client.post(
        "/api/v1/progress/toggle",
        json={
            "career_path_slug": "backend-engineer",
            "item_type": "milestone_checkpoint",
            "item_ref": "Task 1",
            "status": "completed",
        },
        headers=headers,
    )
    res1 = client.get("/api/v1/progress", headers=headers).json()
    assert res1["current_streak_days"] == 1
    assert res1["last_activity_date"] == today_ist

    # Step 2: Complete task 2 today -> streak must remain 1 (no double increment)
    client.post(
        "/api/v1/progress/toggle",
        json={
            "career_path_slug": "backend-engineer",
            "item_type": "milestone_checkpoint",
            "item_ref": "Task 2",
            "status": "completed",
        },
        headers=headers,
    )
    res2 = client.get("/api/v1/progress", headers=headers).json()
    assert res2["current_streak_days"] == 1

    # Step 3: Simulate streak from yesterday
    streak = db_session.query(UserStreak).filter(UserStreak.user_id == user_id).first()
    assert streak is not None
    streak.current_streak_days = 4
    streak.last_activity_date = yesterday_ist
    db_session.commit()

    # Activity today should increment from 4 -> 5
    client.post(
        "/api/v1/progress/toggle",
        json={
            "career_path_slug": "backend-engineer",
            "item_type": "milestone_checkpoint",
            "item_ref": "Task 3",
            "status": "completed",
        },
        headers=headers,
    )
    res3 = client.get("/api/v1/progress", headers=headers).json()
    assert res3["current_streak_days"] == 5

    # Step 4: Broken streak (missed days: last active 4 days ago)
    four_days_ago = (now_kolkata - timedelta(days=4)).strftime("%Y-%m-%d")
    streak.last_activity_date = four_days_ago
    streak.current_streak_days = 5
    db_session.commit()

    # get_progress must report effective streak = 0 because the streak was broken!
    res4 = client.get("/api/v1/progress", headers=headers).json()
    assert res4["current_streak_days"] == 0
    assert res4["longest_streak_days"] >= 5


def test_progress_cross_tenant_isolation(client: TestClient):
    """User B cannot view or tamper with User A's progress."""
    user_a_id, headers_a = create_user_with_token(client, "user_a_prog@example.com")
    user_b_id, headers_b = create_user_with_token(client, "user_b_prog@example.com")

    # User A completes a checkpoint and sets a project note
    client.post(
        "/api/v1/progress/toggle",
        json={
            "career_path_slug": "backend-engineer",
            "item_type": "milestone_checkpoint",
            "item_ref": "Confidential User A Milestone",
            "status": "completed",
        },
        headers=headers_a,
    )
    client.post(
        "/api/v1/progress/projects",
        json={
            "career_path_slug": "backend-engineer",
            "project_title": "User A Secret Project",
            "status": "completed",
            "repo_url": "https://github.com/usera/secret",
            "notes": "User A private confidential notes.",
        },
        headers=headers_a,
    )

    # User B views their own progress
    res_b = client.get("/api/v1/progress", headers=headers_b).json()

    # User B must have 0 completed checkpoints and empty projects list
    key = "milestone_checkpoint:Confidential User A Milestone"
    assert res_b["completed_items_map"].get(key) is None
    assert len(res_b["projects_progress"]) == 0
    assert res_b["current_streak_days"] == 0


def test_completed_progress_items_feed_into_resimulation_prompt(
    db_session: Session, client: TestClient
):
    """Completed milestones/projects are included in profile snapshot and instruction 9 in prompt builder."""
    user_id, headers = create_user_with_token(client, "resim_prompt@example.com")

    # Record 2 completed items for the user
    item1 = ProgressItem(
        user_id=user_id,
        career_path_slug="full-stack-developer",
        item_type="milestone_checkpoint",
        item_ref="Pass Data Structures & Algorithms assessment",
        status="completed",
    )
    item2 = ProgressItem(
        user_id=user_id,
        career_path_slug="full-stack-developer",
        item_type="project",
        item_ref="E-commerce Full Stack Web App",
        status="completed",
    )
    db_session.add_all([item1, item2])
    db_session.commit()

    # Build snapshot
    snapshot = build_student_profile_snapshot(db_session, user_id=user_id)
    assert "completed_progress_items" in snapshot
    completed_refs = [ci["item_ref"] for ci in snapshot["completed_progress_items"]]
    assert "Pass Data Structures & Algorithms assessment" in completed_refs
    assert "E-commerce Full Stack Web App" in completed_refs

    # Build simulation input prompt
    prompt = build_simulation_input_prompt(snapshot, mode="auto")
    assert "<student_context_data>" in prompt
    assert "Pass Data Structures & Algorithms assessment" in prompt
    assert "PROGRESS CONTINUITY" in prompt
