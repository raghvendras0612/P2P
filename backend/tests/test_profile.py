from tests.test_auth import get_sample_registration_payload


def test_profile_lifecycle(client):
    # 1. Register student
    payload = get_sample_registration_payload("profile_lifecycle@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get full profile
    profile_res = client.get("/api/v1/profile", headers=headers)
    assert profile_res.status_code == 200
    data = profile_res.json()
    assert data["profile"]["full_name"] == "Rahul Sharma"
    assert len(data["education"]) == 2
    assert len(data["skills"]) == 3
    assert len(data["interests"]) == 2
    assert len(data["projects"]) == 1
    assert len(data["experiences"]) == 1

    # 3. Update primary profile
    update_res = client.put(
        "/api/v1/profile",
        headers=headers,
        json={"cgpa": 9.15, "city": "Hyderabad", "career_goal_text": "Updated career goal."},
    )
    assert update_res.status_code == 200
    assert float(update_res.json()["cgpa"]) == 9.15
    assert update_res.json()["city"] == "Hyderabad"

    # 4. Update skills
    new_skills = [
        {"skill_id": 2, "self_level": 3},  # Java
        {"skill_id": 3, "self_level": 1},  # C++
    ]
    skills_res = client.put("/api/v1/profile/skills", headers=headers, json=new_skills)
    assert skills_res.status_code == 200
    updated_skills = skills_res.json()
    assert len(updated_skills) == 2
    assert any(s["skill_name"] == "Java" for s in updated_skills)

    # 5. Add and delete education
    new_edu = {
        "level": "Undergraduate",
        "institution_name": "NIT Karnataka",
        "board_or_university": "Autonomous NIT",
        "passing_year": 2026,
        "percentage": 88.5,
    }
    edu_res = client.post("/api/v1/profile/education", headers=headers, json=new_edu)
    assert edu_res.status_code == 201
    edu_id = edu_res.json()["id"]

    del_edu_res = client.delete(f"/api/v1/profile/education/{edu_id}", headers=headers)
    assert del_edu_res.status_code == 204

    # 6. Add, update, and delete project
    new_proj = {
        "title": "AI Resume Scanner",
        "description": "ATS scanner with semantic matching.",
        "tech_stack": "Python, React, Tailwind",
    }
    proj_res = client.post("/api/v1/profile/projects", headers=headers, json=new_proj)
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    up_proj = client.put(
        f"/api/v1/profile/projects/{proj_id}",
        headers=headers,
        json={"title": "Updated AI Resume Scanner"},
    )
    assert up_proj.status_code == 200
    assert up_proj.json()["title"] == "Updated AI Resume Scanner"

    del_proj_res = client.delete(f"/api/v1/profile/projects/{proj_id}", headers=headers)
    assert del_proj_res.status_code == 204

    # 7. Add, update, and delete experience
    new_exp = {
        "type": "hackathon",
        "title": "Smart India Hackathon Finalist",
        "organization": "AICTE",
        "description": "Built agricultural supply chain tracker.",
        "date_or_duration": "2024",
    }
    exp_res = client.post("/api/v1/profile/experiences", headers=headers, json=new_exp)
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]

    up_exp = client.put(
        f"/api/v1/profile/experiences/{exp_id}",
        headers=headers,
        json={"title": "Smart India Hackathon Winner"},
    )
    assert up_exp.status_code == 200
    assert up_exp.json()["title"] == "Smart India Hackathon Winner"

    del_exp_res = client.delete(f"/api/v1/profile/experiences/{exp_id}", headers=headers)
    assert del_exp_res.status_code == 204
