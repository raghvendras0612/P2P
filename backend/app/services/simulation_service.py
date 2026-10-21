import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog import Interest, Skill, UserInterest, UserSkill
from app.models.profile import EducationEntry, Experience, Project, StudentProfile
from app.models.progress import ProgressItem
from app.models.simulation import Simulation, SimulationJob
from app.models.user import User
from app.schemas.simulation import (
    CreateSimulationRequest,
    RegeneratePathRequest,
    ResimulateRequest,
    SimulationOutput,
)
from app.services.ai import AIService

logger = logging.getLogger(__name__)


def build_student_profile_snapshot(
    db: Session,
    user_id: int,
    what_if_skills: Optional[List[Any]] = None,
    what_if_interest_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """Serializes the student's current profile, skills, interests, and projects into an immutable snapshot."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=404, detail="Student profile not found. Please complete onboarding first."
        )

    # 1. Base profile
    snapshot: Dict[str, Any] = {
        "full_name": profile.full_name,
        "college": profile.college,
        "branch": profile.branch,
        "year_of_study": profile.year_of_study,
        "expected_graduation_year": profile.expected_graduation_year,
        "cgpa": float(profile.cgpa),
        "city": profile.city,
        "state": profile.state,
        "career_goal_text": profile.career_goal_text or "",
        "preferred_work_style": profile.preferred_work_style or "Hybrid",
    }

    # 2. Skills
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
    skills_list = []
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        skills_list.append(
            {
                "skill_id": us.skill_id,
                "skill_name": skill.name if skill else f"Skill #{us.skill_id}",
                "category": skill.category if skill else "General",
                "self_level": us.self_level,
                "status": us.status,  # "claimed" vs "verified"
                "verified_level": us.verified_level,
            }
        )

    # Merge what-if skills
    if what_if_skills:
        for ws in what_if_skills:
            skills_list.append(
                {
                    "skill_name": ws.skill_name,
                    "category": getattr(ws, "category", "Other") or "Other",
                    "self_level": ws.self_level,
                    "status": "claimed",
                    "verified_level": None,
                }
            )
    snapshot["skills"] = skills_list

    # 3. Interests
    user_interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    interest_ids = {ui.interest_id for ui in user_interests}
    if what_if_interest_ids:
        interest_ids.update(what_if_interest_ids)

    interests_list = []
    if interest_ids:
        interests = db.query(Interest).filter(Interest.id.in_(list(interest_ids))).all()
        for i in interests:
            interests_list.append({"id": i.id, "name": i.name, "group": i.group})
    snapshot["interests"] = interests_list

    # 4. Education
    edu_entries = db.query(EducationEntry).filter(EducationEntry.user_id == user_id).all()
    snapshot["education"] = [
        {
            "level": e.level,
            "institution_name": e.institution_name,
            "board_or_university": e.board_or_university,
            "passing_year": e.passing_year,
            "percentage": float(e.percentage),
        }
        for e in edu_entries
    ]

    # 5. Projects
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    snapshot["projects"] = [
        {
            "title": p.title,
            "tech_stack": p.tech_stack,
            "description": p.description,
        }
        for p in projects
    ]

    # 6. Experiences
    experiences = db.query(Experience).filter(Experience.user_id == user_id).all()
    snapshot["experiences"] = [
        {
            "type": exp.type,
            "title": exp.title,
            "organization": exp.organization,
        }
        for exp in experiences
    ]

    # 7. Knowledge profile (verified skills & diagnostic gaps)
    from app.services.knowledge_profile_service import knowledge_profile_service

    user_obj = db.query(User).filter(User.id == user_id).first()
    if user_obj:
        snapshot["knowledge_profile"] = knowledge_profile_service.get_knowledge_profile(
            db, user_obj
        )
    else:
        snapshot["knowledge_profile"] = {}

    # 8. Completed progress items (milestones and projects already completed)
    completed_items = (
        db.query(ProgressItem)
        .filter(ProgressItem.user_id == user_id, ProgressItem.status == "completed")
        .all()
    )
    snapshot["completed_progress_items"] = [
        {
            "career_path_slug": ci.career_path_slug,
            "item_type": ci.item_type,
            "item_ref": ci.item_ref,
        }
        for ci in completed_items
    ]

    return snapshot


def compute_snapshot_cache_key(
    user_id: int, snapshot: Dict[str, Any], mode: str, custom_slugs: Optional[List[str]]
) -> str:
    """Compute deterministic SHA256 digest for input caching."""
    payload = {
        "user_id": user_id,
        "snapshot": snapshot,
        "mode": mode,
        "custom_slugs": sorted(custom_slugs or []),
    }
    dumped = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(dumped.encode("utf-8")).hexdigest()


class SimulationService:
    def __init__(self, ai_service: Optional[AIService] = None):
        self.ai_service = ai_service or AIService()

    def check_user_rate_limit(self, db: Session, user_id: int) -> None:
        """Enforce maximum simulations per hour per user."""
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_count = (
            db.query(Simulation)
            .filter(Simulation.user_id == user_id, Simulation.created_at >= one_hour_ago)
            .count()
        )
        if recent_count >= settings.SIMULATION_RATE_LIMIT_PER_HOUR:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: maximum {settings.SIMULATION_RATE_LIMIT_PER_HOUR} simulations allowed per hour. Please retry later.",
            )

    def find_cached_simulation(
        self,
        db: Session,
        user_id: int,
        snapshot: Dict[str, Any],
        mode: str,
        custom_slugs: Optional[List[str]],
    ) -> Optional[Simulation]:
        """Look for identical simulation run for this user within the past 2 hours."""
        cache_cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        target_key = compute_snapshot_cache_key(user_id, snapshot, mode, custom_slugs)

        recent_sims = (
            db.query(Simulation)
            .filter(
                Simulation.user_id == user_id,
                Simulation.mode == mode,
                Simulation.created_at >= cache_cutoff,
            )
            .order_by(Simulation.created_at.desc())
            .all()
        )

        for sim in recent_sims:
            sim_key = compute_snapshot_cache_key(
                sim.user_id, sim.input_snapshot, sim.mode, sim.selected_paths
            )
            if sim_key == target_key:
                logger.info(f"Hit simulation cache for user {user_id} (simulation #{sim.id})")
                return sim
        return None

    def execute_simulation_sync(
        self,
        db: Session,
        job_id: str,
        user_id: int,
        snapshot: Dict[str, Any],
        mode: str,
        custom_slugs: Optional[List[str]] = None,
    ) -> Simulation:
        """Synchronously execute simulation for job, saving immutable Simulation record."""
        job = db.query(SimulationJob).filter(SimulationJob.id == job_id).first()
        if job:
            job.status = "running"
            db.commit()

        try:
            # 1. Check cache
            cached_sim = self.find_cached_simulation(db, user_id, snapshot, mode, custom_slugs)
            if cached_sim:
                if job:
                    job.status = "succeeded"
                    job.simulation_id = cached_sim.id
                    db.commit()
                return cached_sim

            # 2. Run AI simulation
            output: SimulationOutput = self.ai_service.simulate_career_paths(
                student_snapshot=snapshot,
                mode=mode,
                custom_slugs=custom_slugs,
            )

            # 3. Store immutable simulation record
            sim = Simulation(
                user_id=user_id,
                mode=mode,
                selected_paths=custom_slugs,
                prompt_version=self.ai_service.prompt_version,
                model_name=self.ai_service.model_name,
                input_snapshot=snapshot,
                output_json=output.model_dump(),
            )
            db.add(sim)
            db.commit()
            db.refresh(sim)

            # 4. Mark job succeeded
            if job:
                job.status = "succeeded"
                job.simulation_id = sim.id
                db.commit()

            return sim

        except Exception as e:
            logger.exception(f"Simulation execution failed for job {job_id}: {e}")
            if job:
                job.status = "failed"
                job.error_message = str(getattr(e, "message", str(e)))
                db.commit()
            raise

    def create_simulation_job(
        self,
        db: Session,
        user_id: int,
        req: CreateSimulationRequest,
    ) -> SimulationJob:
        """Create and queue a simulation job, enforcing rate limits."""
        self.check_user_rate_limit(db, user_id)
        snapshot = build_student_profile_snapshot(db, user_id)

        job = SimulationJob(
            user_id=user_id,
            mode=req.mode,
            custom_path_slugs=req.custom_path_slugs,
            status="queued",
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Run execution
        self.execute_simulation_sync(
            db=db,
            job_id=job.id,
            user_id=user_id,
            snapshot=snapshot,
            mode=req.mode,
            custom_slugs=req.custom_path_slugs,
        )
        db.refresh(job)
        return job

    def resimulate(
        self,
        db: Session,
        user_id: int,
        baseline_sim_id: int,
        req: ResimulateRequest,
    ) -> SimulationJob:
        """Re-simulate using CURRENT profile + what-if delta and compute comparison."""
        self.check_user_rate_limit(db, user_id)

        # Verify baseline exists and belongs to user
        baseline_sim = (
            db.query(Simulation)
            .filter(Simulation.id == baseline_sim_id, Simulation.user_id == user_id)
            .first()
        )
        if not baseline_sim:
            raise HTTPException(
                status_code=404, detail="Baseline simulation not found or access denied."
            )

        snapshot = build_student_profile_snapshot(
            db,
            user_id=user_id,
            what_if_skills=req.what_if_added_skills,
            what_if_interest_ids=req.what_if_added_interest_ids,
        )

        job = SimulationJob(
            user_id=user_id,
            mode=baseline_sim.mode,
            custom_path_slugs=baseline_sim.selected_paths,
            what_if_delta=req.model_dump(),
            status="queued",
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        self.execute_simulation_sync(
            db=db,
            job_id=job.id,
            user_id=user_id,
            snapshot=snapshot,
            mode=baseline_sim.mode,
            custom_slugs=baseline_sim.selected_paths,
        )
        db.refresh(job)
        return job

    def regenerate_single_path(
        self,
        db: Session,
        user_id: int,
        simulation_id: int,
        req: RegeneratePathRequest,
    ) -> Simulation:
        """Re-simulates a single path within an existing simulation and creates a new immutable record."""
        self.check_user_rate_limit(db, user_id)

        sim = (
            db.query(Simulation)
            .filter(Simulation.id == simulation_id, Simulation.user_id == user_id)
            .first()
        )
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found or access denied.")

        existing_output = SimulationOutput.model_validate(sim.output_json)
        target_slug = req.path_slug

        # Ensure slug is part of existing paths
        if not any(p.path_slug == target_slug for p in existing_output.paths):
            raise HTTPException(
                status_code=400,
                detail=f"Path slug '{target_slug}' is not one of the paths in simulation #{simulation_id}.",
            )

        # Re-run simulation in custom mode requesting this path
        fresh_output = self.ai_service.simulate_career_paths(
            student_snapshot=sim.input_snapshot,
            mode="custom",
            custom_slugs=[target_slug],
        )

        # Locate fresh path for target_slug
        replacement_path = next((p for p in fresh_output.paths if p.path_slug == target_slug), None)
        if not replacement_path:
            replacement_path = fresh_output.paths[0]
            replacement_path.path_slug = target_slug

        # Splice into existing paths
        updated_paths = []
        for p in existing_output.paths:
            if p.path_slug == target_slug:
                updated_paths.append(replacement_path)
            else:
                updated_paths.append(p)

        new_simulation_output = SimulationOutput(
            paths=updated_paths,
            assumptions_made=fresh_output.assumptions_made or existing_output.assumptions_made,
            disclaimers=existing_output.disclaimers,
            overall_recommendation=f"Regenerated {replacement_path.title} pathway. "
            + fresh_output.overall_recommendation,
        )

        new_sim = Simulation(
            user_id=user_id,
            mode=sim.mode,
            selected_paths=sim.selected_paths,
            prompt_version=self.ai_service.prompt_version,
            model_name=self.ai_service.model_name,
            input_snapshot=sim.input_snapshot,
            output_json=new_simulation_output.model_dump(),
        )
        db.add(new_sim)
        db.commit()
        db.refresh(new_sim)
        return new_sim
