import json
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSkill
from app.models.user import User
from app.services.resume_service import resume_service
from tests.test_auth import get_sample_registration_payload


@pytest.fixture
def auth_context(client: TestClient, db_session: Session):
    payload = get_sample_registration_payload("resume_student@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]
    user = db_session.query(User).filter(User.id == user_id).first()
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def get_or_create_skill(db: Session, name: str, category: str) -> Skill:
    s = db.query(Skill).filter(Skill.name == name).first()
    if not s:
        s = Skill(name=name, category=category, is_verified_seed=True)
        db.add(s)
        db.commit()
    return s


def test_resume_compilation_and_skills_segregation(
    client: TestClient, auth_context: tuple, db_session: Session
):
    user, headers = auth_context

    # Add 1 verified skill, 1 claimed skill, 1 failed skill
    s1 = get_or_create_skill(db_session, "FastAPI Unique Microservices", "Backend")
    s2 = get_or_create_skill(db_session, "PostgreSQL Unique Queries", "Database")
    s3 = get_or_create_skill(db_session, "Kubernetes Unique Deployment", "DevOps")

    # Clean existing user_skills for this user to avoid conflict
    db_session.query(UserSkill).filter(UserSkill.user_id == user.id).delete()
    db_session.commit()

    us1 = UserSkill(
        user_id=user.id, skill_id=s1.id, self_level=3, status="verified", verified_level=3
    )
    us2 = UserSkill(
        user_id=user.id, skill_id=s2.id, self_level=2, status="claimed", verified_level=None
    )
    us3 = UserSkill(
        user_id=user.id, skill_id=s3.id, self_level=2, status="failed", verified_level=None
    )
    db_session.add_all([us1, us2, us3])
    db_session.commit()

    resp = client.get("/api/v1/resume", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["full_name"] == "Rahul Sharma"
    assert len(data["education"]) >= 1
    assert len(data["projects"]) >= 1

    # Verified skills must contain FastAPI
    verified_names = [s["name"] for s in data["verified_skills"]]
    assert "FastAPI Unique Microservices" in verified_names
    fastapi_item = next(
        s for s in data["verified_skills"] if s["name"] == "FastAPI Unique Microservices"
    )
    assert fastapi_item["verified_level"] == 3
    assert fastapi_item["verified_level_name"] == "Advanced"

    # Unverified skills must contain PostgreSQL
    unverified_names = [s["name"] for s in data["unverified_skills"]]
    assert "PostgreSQL Unique Queries" in unverified_names

    # Failed skill (Kubernetes) MUST NOT appear in verified or unverified skills!
    all_listed = verified_names + unverified_names
    assert "Kubernetes Unique Deployment" not in all_listed

    # Check strength checklist
    assert data["strength"]["score"] > 50
    assert len(data["strength"]["criteria_met"]) >= 3


def test_update_resume_settings(client: TestClient, auth_context: tuple):
    _, headers = auth_context

    update_payload = {
        "template_id": "modern_compact",
        "target_role": "Lead Backend Architect",
        "show_unverified_skills": False,
    }
    resp = client.put("/api/v1/resume", json=update_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["template_id"] == "modern_compact"
    assert data["target_role"] == "Lead Backend Architect"
    assert data["show_unverified_skills"] is False


def test_tailor_resume_ai_endpoint(client: TestClient, auth_context: tuple):
    _, headers = auth_context

    # Mock Gemini tailoring response
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(
        {
            "target_role": "Full Stack Developer",
            "career_path_slug": "full-stack-developer",
            "tailored_summary": "Results-driven Full Stack Engineer with verified backend competencies. Delivered responsive full-stack applications with FastAPI and relational databases.",
            "ordered_project_titles": ["Campus Connect Portal"],
            "relevant_skills_highlighted": ["Python", "FastAPI"],
        }
    )
    mock_client.models.generate_content.return_value = mock_resp
    resume_service._client = mock_client

    tailor_resp = client.post(
        "/api/v1/resume/tailor", json={"career_path_slug": "full-stack-developer"}, headers=headers
    )
    assert tailor_resp.status_code == 200
    data = tailor_resp.json()

    assert "Results-driven Full Stack Engineer" in data["tailored_summary"]
    assert data["career_path_slug"] == "full-stack-developer"

    # Re-fetch compiled resume and verify updated summary and is_tailored=True
    get_resp = client.get("/api/v1/resume", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["is_tailored"] is True
    assert "Results-driven" in get_resp.json()["summary"]


def test_resume_export_pdf_markdown_json(client: TestClient, auth_context: tuple):
    _, headers = auth_context

    # 1. PDF Export
    pdf_resp = client.get("/api/v1/resume/export/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in pdf_resp.headers["content-disposition"]
    # PDF magic bytes
    assert pdf_resp.content.startswith(b"%PDF")
    assert len(pdf_resp.content) > 1000

    # 2. Markdown Export
    md_resp = client.get("/api/v1/resume/export/markdown", headers=headers)
    assert md_resp.status_code == 200
    assert "text/markdown" in md_resp.headers["content-type"]
    assert "# Rahul Sharma" in md_resp.text
    assert "## Technical Skills" in md_resp.text

    # 3. JSON Export
    json_resp = client.get("/api/v1/resume/export/json", headers=headers)
    assert json_resp.status_code == 200
    assert json_resp.headers["content-type"] == "application/json"
    data = json_resp.json()
    assert data["full_name"] == "Rahul Sharma"
    assert "education" in data
