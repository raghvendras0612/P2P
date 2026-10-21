def test_get_skills_catalog(client):
    response = client.get("/api/v1/catalog/skills")
    assert response.status_code == 200
    skills = response.json()
    assert len(skills) >= 120

    # Search by query
    py_res = client.get("/api/v1/catalog/skills?q=python")
    assert py_res.status_code == 200
    py_skills = py_res.json()
    assert any("Python" in s["name"] for s in py_skills)

    # Filter by category
    frontend_res = client.get("/api/v1/catalog/skills?category=Web Frontend")
    assert frontend_res.status_code == 200
    frontend_skills = frontend_res.json()
    assert len(frontend_skills) >= 10
    assert all(s["category"] == "Web Frontend" for s in frontend_skills)


def test_get_interests_catalog(client):
    response = client.get("/api/v1/catalog/interests")
    assert response.status_code == 200
    interests = response.json()
    assert len(interests) >= 25
    assert any("Building web apps" == i["group"] for i in interests)


def test_get_career_paths_catalog(client):
    response = client.get("/api/v1/catalog/paths")
    assert response.status_code == 200
    paths = response.json()
    assert len(paths) == 9
    slugs = [p["slug"] for p in paths]
    assert "full-stack-developer" in slugs
    assert "ai-ml-engineer" in slugs
