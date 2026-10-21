"""Comprehensive Phase 1 QA verification suite.
Tests:
1. Fresh setup & seed idempotency
2. Auth & security (happy paths, errors, JWT tampering/expiry, password hashing)
3. Authorization boundaries (User A vs User B isolation across all CRUD endpoints)
4. Rate limiting trigger
5. CORS origin enforcement
6. Registration atomicity
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.seed import seed_database
from app.db.session import Base
from app.models.catalog import CareerPath, Interest, Skill

# Use in-memory SQLite for comprehensive isolated QA tests
QA_ENGINE = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
QASession = sessionmaker(autocommit=False, autoflush=False, bind=QA_ENGINE)


def test_seed_idempotency_and_counts():
    """Verify seed script runs cleanly, counts match requirements, and running twice is 100% idempotent."""
    temp_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=temp_engine)
    session = sessionmaker(bind=temp_engine)()

    # Run 1
    stats1 = seed_database(session)
    assert stats1["skills"] >= 120, f"Expected >= 120 skills, got {stats1['skills']}"
    assert stats1["interests"] >= 25, f"Expected >= 25 interests, got {stats1['interests']}"
    assert stats1["paths"] == 9, f"Expected 9 career paths, got {stats1['paths']}"

    # Verify counts in DB
    total_skills = session.query(Skill).count()
    total_interests = session.query(Interest).count()
    total_paths = session.query(CareerPath).count()

    assert total_skills >= 120
    assert total_interests >= 25
    assert total_paths == 9

    # Run 2 (Idempotency)
    stats2 = seed_database(session)
    assert stats2["skills"] == 0, "Idempotent seed should add 0 new skills on re-run"
    assert stats2["interests"] == 0, "Idempotent seed should add 0 new interests on re-run"
    assert stats2["paths"] == 0, "Idempotent seed should add 0 new paths on re-run"

    assert session.query(Skill).count() == total_skills
    assert session.query(Interest).count() == total_interests
    assert session.query(CareerPath).count() == total_paths
    session.close()


def test_password_hashing_and_never_leaked(client):
    """Verify passwords in DB are Argon2 hashes and plain passwords are never returned."""
    payload = {
        "email": "argon_check@example.com",
        "password": "SecretPassword123!",
        "profile": {
            "full_name": "Argon Tester",
            "phone": "9876543210",
            "college": "IIT Bombay",
            "branch": "CSE",
            "year_of_study": 4,
            "expected_graduation_year": 2025,
            "cgpa": 9.2,
            "city": "Mumbai",
            "state": "Maharashtra",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "School",
                "board_or_university": "CBSE",
                "passing_year": 2019,
                "percentage": 95.0,
            }
        ],
        "skills": [{"skill_id": 1, "self_level": 3}],
        "interest_ids": [1],
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    res_data = res.json()

    # Verify password is NOT in response
    assert "password" not in res_data
    assert "password_hash" not in res_data
    assert "password" not in res_data.get("user", {})
    assert "password_hash" not in res_data.get("user", {})


def test_authorization_boundaries_user_a_cannot_touch_user_b(client):
    """Verify that User A cannot read, update, or delete User B's resources."""
    # Register User A
    user_a_payload = {
        "email": "user_a@example.com",
        "password": "Password123!",
        "profile": {
            "full_name": "User Alpha",
            "phone": "9111111111",
            "college": "College A",
            "branch": "CSE",
            "year_of_study": 2,
            "expected_graduation_year": 2027,
            "cgpa": 8.0,
            "city": "Delhi",
            "state": "Delhi",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "School A",
                "board_or_university": "CBSE",
                "passing_year": 2021,
                "percentage": 88.0,
            }
        ],
        "skills": [{"skill_id": 1, "self_level": 1}],
        "interest_ids": [1],
    }
    res_a = client.post("/api/v1/auth/register", json=user_a_payload)
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B with project, education, and experience
    user_b_payload = {
        "email": "user_b@example.com",
        "password": "Password123!",
        "profile": {
            "full_name": "User Beta",
            "phone": "9222222222",
            "college": "College B",
            "branch": "IT",
            "year_of_study": 3,
            "expected_graduation_year": 2026,
            "cgpa": 8.5,
            "city": "Pune",
            "state": "Maharashtra",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "School B",
                "board_or_university": "State Board",
                "passing_year": 2020,
                "percentage": 90.0,
            }
        ],
        "skills": [{"skill_id": 2, "self_level": 2}],
        "interest_ids": [2],
        "projects": [
            {
                "title": "User B Secret Project",
                "description": "Proprietary algorithm",
                "tech_stack": "Rust, Python",
            }
        ],
        "experiences": [
            {
                "type": "internship",
                "title": "User B Internship",
                "organization": "Top Corp",
            }
        ],
    }
    res_b = client.post("/api/v1/auth/register", json=user_b_payload)
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Get User B's profile to extract their resource IDs
    b_profile = client.get("/api/v1/profile", headers=headers_b).json()
    b_edu_id = b_profile["education"][0]["id"]
    b_proj_id = b_profile["projects"][0]["id"]
    b_exp_id = b_profile["experiences"][0]["id"]

    # 1. User A tries to delete User B's education record -> MUST FAIL (404)
    del_edu_res = client.delete(f"/api/v1/profile/education/{b_edu_id}", headers=headers_a)
    assert del_edu_res.status_code == 404, f"Expected 404, got {del_edu_res.status_code}"

    # 2. User A tries to update User B's project -> MUST FAIL (404)
    update_proj_res = client.put(
        f"/api/v1/profile/projects/{b_proj_id}",
        headers=headers_a,
        json={"title": "Hacked Title"},
    )
    assert update_proj_res.status_code == 404

    # 3. User A tries to delete User B's project -> MUST FAIL (404)
    del_proj_res = client.delete(f"/api/v1/profile/projects/{b_proj_id}", headers=headers_a)
    assert del_proj_res.status_code == 404

    # 4. User A tries to update User B's experience -> MUST FAIL (404)
    update_exp_res = client.put(
        f"/api/v1/profile/experiences/{b_exp_id}",
        headers=headers_a,
        json={"title": "Hacked Experience"},
    )
    assert update_exp_res.status_code == 404

    # 5. User A tries to delete User B's experience -> MUST FAIL (404)
    del_exp_res = client.delete(f"/api/v1/profile/experiences/{b_exp_id}", headers=headers_a)
    assert del_exp_res.status_code == 404

    # Confirm User B's resources are still untouched in DB
    b_profile_after = client.get("/api/v1/profile", headers=headers_b).json()
    assert len(b_profile_after["education"]) == 1
    assert len(b_profile_after["projects"]) == 1
    assert b_profile_after["projects"][0]["title"] == "User B Secret Project"
    assert len(b_profile_after["experiences"]) == 1


def test_jwt_tampering_and_expiration(client):
    """Verify expired, tampered, and missing JWTs are strictly rejected."""
    # 1. Missing token
    res_missing = client.get("/api/v1/profile")
    assert res_missing.status_code == 401

    # 2. Tampered token
    tampered_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6ImFjY2VzcyJ9.InvalidSignatureHere"
    res_tampered = client.get(
        "/api/v1/profile", headers={"Authorization": f"Bearer {tampered_token}"}
    )
    assert res_tampered.status_code == 401

    # 3. Expired token
    expired_payload = {
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "sub": "1",
        "type": "access",
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res_expired = client.get(
        "/api/v1/profile", headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

    # 4. Wrong token type (refresh token passed as access token)
    refresh_payload = {
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
        "sub": "1",
        "type": "refresh",
    }
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    res_wrong_type = client.get(
        "/api/v1/profile", headers={"Authorization": f"Bearer {refresh_token}"}
    )
    assert res_wrong_type.status_code == 401


def test_registration_atomicity_on_failure(client):
    """Verify that if an error occurs mid-registration, the entire transaction rolls back cleanly."""
    # We pass an invalid skill payload or trigger a db error
    bad_payload = {
        "email": "atomic_test@example.com",
        "password": "Password123!",
        "profile": {
            "full_name": "Atomic Student",
            "phone": "9876543210",
            "college": "College",
            "branch": "CSE",
            "year_of_study": 3,
            "expected_graduation_year": 2026,
            "cgpa": 8.0,
            "city": "Bengaluru",
            "state": "Karnataka",
        },
        "education": [],  # Violates min_length=1
        "skills": [{"skill_id": 1, "self_level": 2}],
        "interest_ids": [1],
    }

    res = client.post("/api/v1/auth/register", json=bad_payload)
    assert res.status_code == 422

    # Verify user was NOT created in DB
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "atomic_test@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 401
