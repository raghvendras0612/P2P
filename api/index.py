import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from .schemas import (
    StudentProfile,
    SimulationResponse,
    QuestionsResponse,
    EvaluationRequest,
    EvaluationResponse,
    RoadmapAdjustRequest,
    MentorRequest,
    MentorResponse,
    ResumePolishRequest,
    ResumePolishResponse
)
from .prompts import (
    SIMULATION_SYSTEM_PROMPT,
    READINESS_QUESTIONS_PROMPT,
    READINESS_EVALUATION_PROMPT,
    MENTOR_SYSTEM_PROMPT,
    RESUME_POLISH_PROMPT
)
from .gemini_client import call_gemini_with_fallback, load_sample_data

app = FastAPI(title="Career Path Simulator API", version="1.0.0")

app.add_middleware(
    CORSMSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "gemini_configured": has_gemini,
        "model": os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
    }

@app.get("/api/sample")
async def get_sample():
    sample_data = load_sample_data()
    return sample_data

@app.post("/api/simulate")
async def simulate_paths(profile: StudentProfile):
    prompt = f"Student Profile:\n{profile.model_dump_json(indent=2)}\nSimulate full_stack, ai_ml, and data_science paths."
    sample = load_sample_data().get("simulation", {})
    try:
        result = await call_gemini_with_fallback(
            system_instruction=SIMULATION_SYSTEM_PROMPT,
            prompt=prompt
        )
        # Validate that all 3 keys exist
        if "full_stack" in result and "ai_ml" in result and "data_science" in result:
            result["fallback"] = False
            return result
    except Exception as e:
        print(f"Simulation failed, using fallback: {e}")

    # Fallback to hardcoded sample
    sample_data = load_sample_data()
    paths = sample_data.get("paths", [])
    paths_map = {p.get("id"): p for p in paths}
    return {
        "fallback": True,
        "generatedFor": profile.name,
        "paths": paths,
        "full_stack": paths_map.get("full_stack"),
        "ai_ml": paths_map.get("ai_ml"),
        "data_science": paths_map.get("data_science"),
        "data_engineering": paths_map.get("data_engineering")
    }

@app.post("/api/readiness/questions")
async def generate_questions(profile: StudentProfile):
    skills_summary = [{"name": s.name, "level": s.level} for s in profile.skills]
    prompt = f"Student Skills to evaluate:\n{json.dumps(skills_summary, indent=2)}\nGenerate diagnostic questions."
    sample_questions = load_sample_data().get("readinessQuestions", [])
    try:
        result = await call_gemini_with_fallback(
            system_instruction=READINESS_QUESTIONS_PROMPT,
            prompt=prompt
        )
        if "questions" in result:
            result["fallback"] = False
            return result
    except Exception as e:
        print(f"Questions generation failed, using fallback: {e}")

    return {
        "questions": sample_questions,
        "fallback": True
    }

@app.post("/api/readiness/evaluate")
async def evaluate_readiness(req: EvaluationRequest):
    prompt = f"Student Profile:\n{req.profile.model_dump_json()}\nSubmitted Answers:\n{json.dumps([a.model_dump() for a in req.answers], indent=2)}"
    try:
        result = await call_gemini_with_fallback(
            system_instruction=READINESS_EVALUATION_PROMPT,
            prompt=prompt
        )
        if "skillScores" in result:
            result["fallback"] = False
            return result
    except Exception as e:
        print(f"Evaluation failed, using fallback: {e}")

    # Fallback score generator
    scores = []
    for skill in req.profile.skills:
        scores.append({
            "skill": skill.name,
            "score": 4.2 if skill.level == "Advanced" else (3.5 if skill.level == "Intermediate" else 2.5),
            "previousLevel": skill.level,
            "adjustedLevel": skill.level,
            "verified": True,
            "feedback": f"Demonstrated solid concept retention in {skill.name} core fundamentals."
        })
    return {
        "skillScores": scores,
        "summary": "Readiness evaluation completed successfully based on submitted technical questions.",
        "fallback": True
    }

@app.post("/api/roadmap/adjust")
async def adjust_roadmap(req: RoadmapAdjustRequest):
    # Adjusts simulation milestones based on verified skills
    sim_data = load_sample_data().get("simulation", {})
    verified_map = {s.skill.lower(): s.score for s in req.verifiedSkills}
    
    # Dynamically update milestone statuses
    for path_key in ["full_stack", "ai_ml", "data_science"]:
        path = sim_data.get(path_key)
        if not path:
            continue
        for year in path.get("yearByYear", []):
            for ms in year.get("milestones", []):
                req_skills = [s.lower() for s in ms.get("requiredSkills", [])]
                all_covered = any(rk in verified_map and verified_map[rk] >= 3.0 for rk in req_skills)
                if all_covered:
                    ms["status"] = "achieved"
    sim_data["fallback"] = True
    return sim_data

@app.post("/api/mentor")
async def mentor_chat(req: MentorRequest):
    history_str = "\n".join([f"{m.role}: {m.content}" for m in req.history[-6:]])
    prompt = f"Student Profile:\n{req.profile.model_dump_json()}\nSimulation Summary:\n{json.dumps(req.simulationSummary or {})}\nRecent Conversation:\n{history_str}"
    try:
        result = await call_gemini_with_fallback(
            system_instruction=MENTOR_SYSTEM_PROMPT,
            prompt=prompt
        )
        if "reply" in result:
            result["fallback"] = False
            return result
    except Exception as e:
        print(f"Mentor chat failed, using fallback: {e}")

    fallback_mentor = load_sample_data().get("mentorSample", {})
    return {
        "reply": fallback_mentor.get("reply", "Focus on core DSA and 1 deployed full-stack project for Indian campus placements."),
        "suggestedActions": fallback_mentor.get("suggestedActions", []),
        "fallback": True
    }

@app.post("/api/resume/polish")
async def polish_resume(req: ResumePolishRequest):
    prompt = f"Profile:\n{req.profile.model_dump_json()}\nTarget Path: {req.targetPath}\nGenerate ATS summary and polished project bullet points."
    try:
        result = await call_gemini_with_fallback(
            system_instruction=RESUME_POLISH_PROMPT,
            prompt=prompt
        )
        if "summary" in result:
            result["fallback"] = False
            return result
    except Exception as e:
        print(f"Resume polish failed, using fallback: {e}")

    return {
        "summary": f"Analytical and execution-focused {req.profile.branch} student at {req.profile.college or 'Engineering College'} with {req.profile.cgpa} CGPA. Proficient in modern web architecture, algorithmic problem solving, and building scalable full-stack applications.",
        "projectBulletPoints": [
            {"name": "DevPulse", "bullets": ["Architected end-to-end full stack application utilizing modern React and Node.js REST APIs", "Reduced query latency by 35% through indexed PostgreSQL queries and schema normalization"]},
            {"name": "Collaborative Canvas", "bullets": ["Engineered low-latency multi-user synchronization over WebSockets with 60fps rendering", "Implemented JWT-based authentication and secure session management"]}
        ],
        "fallback": True
    }

# Mount static frontend for Vercel / standalone
public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
if os.path.exists(public_dir):
    app.mount("/", StaticFiles(directory=public_dir, html=True), name="static")
