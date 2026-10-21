from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSkill
from app.models.testing import TestAttempt
from app.models.user import User
from app.services.knowledge_profile_service import knowledge_profile_service
from app.services.simulation_service import build_student_profile_snapshot
from tests.test_auth import get_sample_registration_payload


def test_knowledge_profile_aggregation(db_session: Session, client):
    # Register student
    payload = get_sample_registration_payload("knowledge_profile_test@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    user_id = reg_res.json()["user"]["id"]
    user = db_session.query(User).filter(User.id == user_id).first()

    # Create skills
    skill1 = Skill(name="Rust Systems", category="Languages", is_verified_seed=True)
    skill2 = Skill(name="Redis Caching", category="Database", is_verified_seed=True)
    skill3 = Skill(name="Kubernetes Cloud", category="DevOps", is_verified_seed=True)
    db_session.add_all([skill1, skill2, skill3])
    db_session.commit()

    now = datetime.now(timezone.utc)

    # 1. Verified skill: Rust (claimed level 3, tested level 2 -> overclaimed delta 1)
    us1 = UserSkill(
        user_id=user.id,
        skill_id=skill1.id,
        self_level=3,
        status="verified",
        verified_level=2,
        last_tested_at=now,
    )
    # Linked attempt with feedback
    attempt1 = TestAttempt(
        user_id=user.id,
        skill_id=skill1.id,
        status="completed",
        started_at=now,
        expires_at=now,
        completed_at=now,
        time_limit_seconds=2700,
        total_questions=25,
        total_points=50.0,
        earned_points=35.0,
        score_percentage=70.0,
        verified_level=2,
        feedback_json={
            "strengths": ["Borrow Checker", "Pattern Matching"],
            "weaknesses": ["Async Pinning", "Unsafe Pointer Aliasing"],
        },
    )

    # 2. Failed skill: Redis (claimed level 2, tested <60%)
    us2 = UserSkill(
        user_id=user.id,
        skill_id=skill2.id,
        self_level=2,
        status="failed",
        verified_level=None,
        last_tested_at=now,
    )
    attempt2 = TestAttempt(
        user_id=user.id,
        skill_id=skill2.id,
        status="completed",
        started_at=now,
        expires_at=now,
        completed_at=now,
        time_limit_seconds=2700,
        total_questions=25,
        total_points=50.0,
        earned_points=20.0,
        score_percentage=40.0,
        verified_level=None,
        feedback_json={
            "strengths": [],
            "weaknesses": ["Cluster Sharding", "Lua Scripting"],
        },
    )

    # 3. Unverified claimed skill: Kubernetes
    us3 = UserSkill(
        user_id=user.id,
        skill_id=skill3.id,
        self_level=1,
        status="claimed",
        verified_level=None,
    )

    db_session.add_all([us1, us2, us3, attempt1, attempt2])
    db_session.commit()

    # Call service
    profile = knowledge_profile_service.get_knowledge_profile(db_session, user)

    # Assertions
    assert len(profile["verified_skills"]) == 1
    assert profile["verified_skills"][0]["skill"] == "Rust Systems"
    assert profile["verified_skills"][0]["verified_level"] == 2
    assert profile["verified_skills"][0]["verified_level_name"] == "Intermediate"

    assert len(profile["failed_skills"]) == 1
    assert profile["failed_skills"][0]["skill"] == "Redis Caching"

    assert len(profile["claimed_unverified_skills"]) >= 1
    k8s = next(s for s in profile["claimed_unverified_skills"] if s["skill"] == "Kubernetes Cloud")
    assert k8s["claimed_level"] == 1

    # Overclaimed gap detection
    assert len(profile["overclaimed_gaps"]) == 1
    assert profile["overclaimed_gaps"][0]["skill"] == "Rust Systems"
    assert profile["overclaimed_gaps"][0]["delta"] == 1

    # Weak subtopics aggregated
    assert "Rust Systems: Async Pinning" in profile["weak_subtopics"]
    assert "Redis Caching: Cluster Sharding" in profile["weak_subtopics"]
    assert "Rust Systems: Borrow Checker" in profile["strong_subtopics"]

    # Verify inclusion in simulation snapshot
    snapshot = build_student_profile_snapshot(db_session, user.id)
    assert "knowledge_profile" in snapshot
    assert len(snapshot["knowledge_profile"]["verified_skills"]) == 1
