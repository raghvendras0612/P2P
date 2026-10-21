def get_sample_registration_payload(email="rahul.sharma@example.com"):
    return {
        "email": email,
        "password": "StrongPassword123!",
        "profile": {
            "full_name": "Rahul Sharma",
            "phone": "9876543210",
            "college": "National Institute of Technology",
            "branch": "Computer Science & Engineering",
            "year_of_study": 3,
            "expected_graduation_year": 2026,
            "cgpa": 8.75,
            "city": "Bengaluru",
            "state": "Karnataka",
            "linkedin_url": "https://linkedin.com/in/rahulsharma",
            "github_url": "https://github.com/rahulsharma",
            "career_goal_text": "Targeting top product company campus placements as Full Stack SDE.",
            "preferred_work_style": "Hybrid",
        },
        "education": [
            {
                "level": "10th",
                "institution_name": "Delhi Public School",
                "board_or_university": "CBSE",
                "passing_year": 2020,
                "percentage": 94.5,
            },
            {
                "level": "12th",
                "institution_name": "Delhi Public School",
                "board_or_university": "CBSE",
                "passing_year": 2022,
                "percentage": 91.2,
            },
        ],
        "skills": [
            {"skill_id": 1, "self_level": 3},  # Python
            {"skill_id": 5, "self_level": 2},  # JavaScript
            {
                "custom_skill_name": "FastAPI Microservices",
                "category": "Web Backend",
                "self_level": 2,
            },
        ],
        "interest_ids": [1, 7],
        "projects": [
            {
                "title": "E-Commerce Microservices",
                "description": "Built event-driven backend with FastAPI and RabbitMQ.",
                "tech_stack": "FastAPI, Docker, PostgreSQL",
                "link": "https://github.com/rahulsharma/ecommerce",
            }
        ],
        "experiences": [
            {
                "type": "internship",
                "title": "Software Engineering Intern",
                "organization": "FinTech Labs",
                "description": "Developed payment reconciliation microservices.",
                "date_or_duration": "May 2024 - July 2024",
            }
        ],
    }


def test_register_success(client):
    payload = get_sample_registration_payload("student1@example.com")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student1@example.com"
    # Check that refresh cookie was set
    assert "refresh_token" in response.cookies


def test_register_duplicate_email(client):
    payload = get_sample_registration_payload("duplicate@example.com")
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_register_invalid_phone(client):
    payload = get_sample_registration_payload("badphone@example.com")
    payload["profile"]["phone"] = "12345"  # Not a 10-digit Indian mobile
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_and_logout(client):
    payload = get_sample_registration_payload("login_test@example.com")
    client.post("/api/v1/auth/register", json=payload)

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "StrongPassword123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # Check /me with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "login_test@example.com"
    assert me_res.json()["profile"]["full_name"] == "Rahul Sharma"

    # Logout
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401
