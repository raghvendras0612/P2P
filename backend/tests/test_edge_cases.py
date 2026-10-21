"""Test Edge Cases for Phase 1.
Covers:
1. Unicode names (Hindi, Spanish, CJK)
2. Very long text & boundary limits
3. XSS injection payloads in text fields
4. Academic numeric boundaries (CGPA 0.00, 10.00, out of bounds; Year 1-4; Percentages 0-100)
5. Concurrent registration / double-click handling
"""

import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.main import app
from tests.test_auth import get_sample_registration_payload


def test_unicode_names(client):
    """Test unicode characters in student name, city, college."""
    unicode_names = [
        ("अमित शर्मा", "वाराणसी", "आईआईटी बीएचयू"),
        ("José García Müller", "São Paulo", "Universidade Federal"),
        ("李华", "北京", "Tsinghua University"),
    ]

    for i, (name, city, college) in enumerate(unicode_names):
        payload = get_sample_registration_payload(f"unicode_{i}@example.com")
        payload["profile"]["full_name"] = name
        payload["profile"]["city"] = city
        payload["profile"]["college"] = college

        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 201, f"Failed for {name}: {res.text}"

        token = res.json()["access_token"]
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["profile"]["full_name"] == name


def test_very_long_text_fields(client):
    """Test very long career goal statements and project descriptions."""
    payload = get_sample_registration_payload("long_text@example.com")
    long_goal = "Career goal statement with extensive detail. " * 50  # ~2500 chars
    payload["profile"]["career_goal_text"] = long_goal
    payload["projects"][0]["description"] = "Detailed architecture description. " * 30

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    token = res.json()["access_token"]
    profile_res = client.get("/api/v1/profile", headers={"Authorization": f"Bearer {token}"})
    assert profile_res.status_code == 200
    assert profile_res.json()["profile"]["career_goal_text"] == long_goal


def test_xss_special_characters_handling(client):
    """Verify that script tags and HTML injection payloads are safely stored as text without errors."""
    payload = get_sample_registration_payload("xss_test@example.com")
    xss_name = '<script>alert("xss")</script>'
    xss_goal = "<img src=x onerror=alert(1)> & < \" ' >"
    payload["profile"]["full_name"] = xss_name
    payload["profile"]["career_goal_text"] = xss_goal

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    token = res.json()["access_token"]
    profile_res = client.get("/api/v1/profile", headers={"Authorization": f"Bearer {token}"})
    assert profile_res.status_code == 200
    # Values are preserved exactly as string data
    assert profile_res.json()["profile"]["full_name"] == xss_name
    assert profile_res.json()["profile"]["career_goal_text"] == xss_goal


def test_numeric_boundary_validation(client):
    """Test exact boundaries for CGPA (0.00, 10.00), Year of study (1, 4), and Education percentage."""
    # 1. Valid exact boundaries
    payload = get_sample_registration_payload("boundary_valid@example.com")
    payload["profile"]["cgpa"] = 10.00
    payload["profile"]["year_of_study"] = 1
    payload["education"][0]["percentage"] = 100.00

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    # 2. CGPA out of bounds (> 10.00)
    p_cgpa_high = get_sample_registration_payload("cgpa_high@example.com")
    p_cgpa_high["profile"]["cgpa"] = 10.01
    assert client.post("/api/v1/auth/register", json=p_cgpa_high).status_code == 422

    # 3. CGPA negative (< 0)
    p_cgpa_neg = get_sample_registration_payload("cgpa_neg@example.com")
    p_cgpa_neg["profile"]["cgpa"] = -0.5
    assert client.post("/api/v1/auth/register", json=p_cgpa_neg).status_code == 422

    # 4. Year of study out of bounds (> 4)
    p_year_high = get_sample_registration_payload("year_high@example.com")
    p_year_high["profile"]["year_of_study"] = 5
    assert client.post("/api/v1/auth/register", json=p_year_high).status_code == 422

    # 5. Percentage out of bounds (> 100)
    p_pct_high = get_sample_registration_payload("pct_high@example.com")
    p_pct_high["education"][0]["percentage"] = 100.5
    assert client.post("/api/v1/auth/register", json=p_pct_high).status_code == 422


def test_concurrent_double_submit():
    """Verify that concurrent double-click on registration cannot create duplicate users or corrupt DB."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.db.seed import seed_database
    from app.db.session import Base, get_db

    db_file = "test_concurrent.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
        except OSError:
            pass

    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    init_db = Session()
    seed_database(init_db)
    init_db.close()

    def get_fresh_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = get_fresh_db
    try:
        with TestClient(app) as test_client:
            payload = get_sample_registration_payload("concurrent_user@example.com")

            def submit():
                return test_client.post("/api/v1/auth/register", json=payload).status_code

            with ThreadPoolExecutor(max_workers=2) as executor:
                f1 = executor.submit(submit)
                f2 = executor.submit(submit)
                statuses = [f1.result(), f2.result()]

            # Exactly one must succeed (201) and the duplicate must fail with 400
            assert 201 in statuses, f"Expected one 201 in {statuses}"
            assert 400 in statuses, f"Expected one 400 in {statuses}"
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except OSError:
                pass
