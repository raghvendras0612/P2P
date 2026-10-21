"""Unit and integration tests for Career Path Selection & Personalization API.
Tests:
1. Selection happy path without simulation
2. Selection happy path with linked simulation and simulated_path extraction
3. Re-selection atomically deactivates previous active path (history preserved)
4. Validation: non-existent slug returns 404
5. Validation: cross-user simulation ID returns 404
6. Validation: simulation missing slug returns 400
7. Clearing active selection (DELETE /selected-path)
8. Unauthenticated access rejected (401)
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.models.catalog import UserSelectedPath
from app.models.simulation import Simulation
from tests.test_auth import get_sample_registration_payload


def _get_golden_fixture() -> dict:
    fixture_path = Path(__file__).parent / "fixtures" / "sample_simulation.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    payload = get_sample_registration_payload("path_student@test.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_select_career_path_from_catalog(client: TestClient, auth_headers: dict):
    # 1. Initially no path selected
    res = client.get("/api/v1/profile/selected-path", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["selected_path"] is None

    # 2. Select full-stack-developer
    payload = {"path_slug": "full-stack-developer"}
    res = client.post("/api/v1/profile/selected-path", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["career_path"]["slug"] == "full-stack-developer"
    assert data["is_active"] is True
    assert data["simulation_id"] is None
    assert data["simulated_path"] is None

    # 3. GET /selected-path returns this active path
    res = client.get("/api/v1/profile/selected-path", headers=auth_headers)
    assert res.status_code == 200
    current = res.json()["selected_path"]
    assert current is not None
    assert current["career_path"]["slug"] == "full-stack-developer"


def test_select_career_path_with_simulation_link(
    client: TestClient, auth_headers: dict, db_session
):
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()
    user_id = me["user"]["id"]

    # Create a simulation for user
    golden = _get_golden_fixture()
    sim = Simulation(
        user_id=user_id,
        mode="auto",
        prompt_version="v1.0.0",
        model_name="gemini-1.5-pro",
        input_snapshot={"test": "data"},
        output_json=golden,
    )
    db_session.add(sim)
    db_session.commit()
    db_session.refresh(sim)

    # Select path linking this simulation
    payload = {"path_slug": "full-stack-developer", "simulation_id": sim.id}
    res = client.post("/api/v1/profile/selected-path", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["career_path"]["slug"] == "full-stack-developer"
    assert data["simulation_id"] == sim.id
    assert data["simulated_path"] is not None
    assert data["simulated_path"]["path_slug"] == "full-stack-developer"
    assert data["simulated_path"]["fit_score"] == 88
    assert len(data["simulated_path"]["skill_gaps"]) == 7
    assert len(data["simulated_path"]["first_month_plan"]["weeks"]) == 4

    # GET /selected-path retains the simulated track details
    res = client.get("/api/v1/profile/selected-path", headers=auth_headers)
    assert res.status_code == 200
    current = res.json()["selected_path"]
    assert current["simulated_path"]["fit_score"] == 88


def test_path_reselection_deactivates_previous(client: TestClient, auth_headers: dict):
    # Select path 1
    client.post(
        "/api/v1/profile/selected-path", json={"path_slug": "ai-ml-engineer"}, headers=auth_headers
    )

    # Select path 2
    res = client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "devops-cloud-engineer"},
        headers=auth_headers,
    )
    assert res.status_code == 200

    # Current active path must be devops-cloud-engineer
    res = client.get("/api/v1/profile/selected-path", headers=auth_headers)
    current = res.json()["selected_path"]
    assert current["career_path"]["slug"] == "devops-cloud-engineer"


def test_select_path_validation_errors(client: TestClient, auth_headers: dict, db_session):
    # 1. Invalid slug
    res = client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "non-existent-career"},
        headers=auth_headers,
    )
    assert res.status_code == 404
    assert "not found in catalog" in res.json()["detail"]

    # 2. Simulation belonging to another user (User ID 999)
    foreign_sim = Simulation(
        user_id=999,
        mode="auto",
        prompt_version="v1.0.0",
        model_name="gemini-1.5-pro",
        input_snapshot={},
        output_json=_get_golden_fixture(),
    )
    db_session.add(foreign_sim)
    db_session.commit()
    db_session.refresh(foreign_sim)

    res = client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "full-stack-developer", "simulation_id": foreign_sim.id},
        headers=auth_headers,
    )
    assert res.status_code == 404

    # 3. Simulation does not contain chosen path slug
    partial_fixture = {"paths": [{"path_slug": "ai-ml-engineer"}]}
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()
    user_id = me["user"]["id"]

    user_sim = Simulation(
        user_id=user_id,
        mode="auto",
        prompt_version="v1.0.0",
        model_name="gemini-1.5-pro",
        input_snapshot={},
        output_json=partial_fixture,
    )
    db_session.add(user_sim)
    db_session.commit()
    db_session.refresh(user_sim)

    res = client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "full-stack-developer", "simulation_id": user_sim.id},
        headers=auth_headers,
    )
    assert res.status_code == 400
    assert "does not contain path" in res.json()["detail"]


def test_clear_selected_path(client: TestClient, auth_headers: dict):
    # Select first
    client.post(
        "/api/v1/profile/selected-path", json={"path_slug": "data-engineer"}, headers=auth_headers
    )

    # Delete
    del_res = client.delete("/api/v1/profile/selected-path", headers=auth_headers)
    assert del_res.status_code == 200

    # Check empty
    get_res = client.get("/api/v1/profile/selected-path", headers=auth_headers)
    assert get_res.json()["selected_path"] is None


def test_unauthenticated_selected_path(client: TestClient):
    assert client.get("/api/v1/profile/selected-path").status_code == 401
    assert (
        client.post(
            "/api/v1/profile/selected-path", json={"path_slug": "data-engineer"}
        ).status_code
        == 401
    )
    assert client.delete("/api/v1/profile/selected-path").status_code == 401


def test_audit_history_preserved_in_db(client: TestClient, auth_headers: dict, db_session):
    me = client.get("/api/v1/auth/me", headers=auth_headers).json()
    user_id = me["user"]["id"]

    # Select path 1
    client.post(
        "/api/v1/profile/selected-path", json={"path_slug": "data-engineer"}, headers=auth_headers
    )
    # Select path 2
    client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "full-stack-developer"},
        headers=auth_headers,
    )
    # Select path 3
    client.post(
        "/api/v1/profile/selected-path", json={"path_slug": "ai-ml-engineer"}, headers=auth_headers
    )

    # Inspect all records in DB for this user
    all_selections = (
        db_session.query(UserSelectedPath)
        .filter(UserSelectedPath.user_id == user_id)
        .order_by(UserSelectedPath.id.asc())
        .all()
    )
    assert len(all_selections) == 3
    # First two must be deactivated
    assert all_selections[0].is_active is False
    assert all_selections[1].is_active is False
    # Third must be active
    assert all_selections[2].is_active is True


def test_cross_user_tenant_isolation_on_selected_path(client: TestClient, db_session):
    # User A registers and selects full-stack-developer
    payload_a = get_sample_registration_payload("user_a@test.com")
    token_a = client.post("/api/v1/auth/register", json=payload_a).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "full-stack-developer"},
        headers=headers_a,
    )

    # User B registers and selects devops-cloud-engineer
    payload_b = get_sample_registration_payload("user_b@test.com")
    token_b = client.post("/api/v1/auth/register", json=payload_b).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    client.post(
        "/api/v1/profile/selected-path",
        json={"path_slug": "devops-cloud-engineer"},
        headers=headers_b,
    )

    # User A's GET returns full-stack-developer, User B's returns devops-cloud-engineer
    res_a = client.get("/api/v1/profile/selected-path", headers=headers_a).json()
    res_b = client.get("/api/v1/profile/selected-path", headers=headers_b).json()

    assert res_a["selected_path"]["career_path"]["slug"] == "full-stack-developer"
    assert res_b["selected_path"]["career_path"]["slug"] == "devops-cloud-engineer"
    assert res_a["selected_path"]["id"] != res_b["selected_path"]["id"]
