from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.catalog import UserSelectedPath, UserSkill
from app.models.progress import ProgressItem, UserStreak
from app.models.simulation import Simulation
from app.models.testing import SkillProficiencyHistory
from app.models.user import User
from app.schemas.progress import (
    MilestoneProgressSummary,
    NextBestAction,
    ProgressDashboardResponse,
    ProgressToggleRequest,
    ProjectProgressItem,
    ProjectProgressUpdateRequest,
    SkillGrowthDataPoint,
)

LEVEL_NAMES: Dict[int, str] = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
}


class ProgressService:
    def _get_or_create_streak(self, db: Session, user_id: int) -> UserStreak:
        streak = db.query(UserStreak).filter(UserStreak.user_id == user_id).first()
        if not streak:
            streak = UserStreak(
                user_id=user_id,
                current_streak_days=0,
                longest_streak_days=0,
                last_activity_date=None,
            )
            db.add(streak)
            db.commit()
            db.refresh(streak)
        return streak

    def _record_activity(self, db: Session, user_id: int) -> UserStreak:
        """Update daily streak counter when a user completes a task or checkpoint."""
        streak = self._get_or_create_streak(db, user_id)
        kolkata_tz = ZoneInfo("Asia/Kolkata")
        now_dt = datetime.now(timezone.utc)
        now_kolkata = datetime.now(kolkata_tz)
        today = now_kolkata.strftime("%Y-%m-%d")
        yesterday = (now_kolkata - timedelta(days=1)).strftime("%Y-%m-%d")

        if streak.last_activity_date == today:
            # Already logged today
            pass
        elif streak.last_activity_date == yesterday:
            streak.current_streak_days += 1
            if streak.current_streak_days > streak.longest_streak_days:
                streak.longest_streak_days = streak.current_streak_days
            streak.last_activity_date = today
        else:
            # New streak or broken streak
            streak.current_streak_days = 1
            if streak.longest_streak_days == 0:
                streak.longest_streak_days = 1
            streak.last_activity_date = today

        streak.updated_at = now_dt
        db.commit()
        return streak

    def get_progress(self, db: Session, user: User) -> ProgressDashboardResponse:
        """Calculate roadmap completion %, milestone completion %, active streak, and next action."""
        streak = self._get_or_create_streak(db, user.id)

        kolkata_tz = ZoneInfo("Asia/Kolkata")
        now_kolkata = datetime.now(kolkata_tz)
        today = now_kolkata.strftime("%Y-%m-%d")
        yesterday = (now_kolkata - timedelta(days=1)).strftime("%Y-%m-%d")

        effective_current_streak = streak.current_streak_days
        if streak.last_activity_date not in (today, yesterday):
            effective_current_streak = 0

        # 1. Fetch active career path
        active_sel = (
            db.query(UserSelectedPath)
            .filter(UserSelectedPath.user_id == user.id, UserSelectedPath.is_active.is_(True))
            .first()
        )

        slug = active_sel.career_path.slug if active_sel else None
        path_name = active_sel.career_path.name if active_sel else None

        # 2. Query completed progress items
        progress_items = db.query(ProgressItem).filter(ProgressItem.user_id == user.id).all()

        completed_map: Dict[str, bool] = {}
        projects_progress: List[ProjectProgressItem] = []

        for item in progress_items:
            key = f"{item.item_type}:{item.item_ref}"
            is_done = item.status == "completed"
            completed_map[key] = is_done

            if item.item_type == "project":
                projects_progress.append(
                    ProjectProgressItem(
                        project_title=item.item_ref,
                        status=item.status,
                        repo_url=item.repo_url,
                        notes=item.notes,
                        completed_at=item.completed_at,
                    )
                )

        # 3. Extract total checkpoints from simulated path if available
        all_checkpoints: List[str] = []
        simulated_path: Optional[Dict[str, Any]] = None

        if active_sel and active_sel.simulation_id:
            sim = db.query(Simulation).filter(Simulation.id == active_sel.simulation_id).first()
            if sim and sim.output_json:
                paths = sim.output_json.get("paths", [])
                matched = next((p for p in paths if p.get("path_slug") == slug), None)
                if matched:
                    simulated_path = matched
                    for m in matched.get("yearly_milestones", []):
                        for cp in m.get("checkpoints", []):
                            all_checkpoints.append(cp)

        total_cps = len(all_checkpoints) if all_checkpoints else 10  # fallback baseline
        done_cps = sum(
            1 for cp in all_checkpoints if completed_map.get(f"milestone_checkpoint:{cp}")
        )
        milestone_pct = int(round((done_cps / total_cps * 100))) if total_cps > 0 else 0

        # Calculate overall roadmap completion (milestones + verified skills + projects)
        verified_skills_count = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user.id, UserSkill.status == "verified")
            .count()
        )
        completed_projects_count = sum(1 for p in projects_progress if p.status == "completed")

        # Roadmap composite: 50% milestone checkpoints, 30% verified skills, 20% projects
        skill_score = min(100, verified_skills_count * 25)
        proj_score = min(100, completed_projects_count * 35)
        overall_pct = int(round(milestone_pct * 0.50 + skill_score * 0.30 + proj_score * 0.20))

        # 4. Next Best Action Recommendation
        next_action = self._determine_next_action(
            user=user,
            db=db,
            simulated_path=simulated_path,
            completed_map=completed_map,
            verified_skills_count=verified_skills_count,
        )

        return ProgressDashboardResponse(
            career_path_slug=slug,
            career_path_name=path_name,
            milestone_progress=MilestoneProgressSummary(
                total_checkpoints=total_cps,
                completed_checkpoints=done_cps,
                percent_complete=milestone_pct,
            ),
            overall_roadmap_percent=min(100, overall_pct),
            current_streak_days=effective_current_streak,
            longest_streak_days=streak.longest_streak_days,
            last_activity_date=streak.last_activity_date,
            completed_items_map=completed_map,
            projects_progress=projects_progress,
            next_best_action=next_action,
        )

    def _determine_next_action(
        self,
        user: User,
        db: Session,
        simulated_path: Optional[Dict[str, Any]],
        completed_map: Dict[str, bool],
        verified_skills_count: int,
    ) -> NextBestAction:
        """Compute the highest-leverage next action for placement readiness."""
        # 1. If unverified claimed skills exist, recommend taking a skill test
        unverified_skill = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user.id, UserSkill.status == "claimed")
            .first()
        )
        if unverified_skill and verified_skills_count < 3:
            return NextBestAction(
                title=f"Verify '{unverified_skill.skill.name}' Diagnostic Challenge",
                action_type="skill_test",
                link="/tests",
                description=f"You claimed {unverified_skill.skill.name}. Pass the 25-question assessment to earn a verified credential for your ATS resume.",
            )

        # 2. If milestone checkpoints remain uncompleted
        if simulated_path:
            for m in simulated_path.get("yearly_milestones", []):
                for cp in m.get("checkpoints", []):
                    if not completed_map.get(f"milestone_checkpoint:{cp}"):
                        return NextBestAction(
                            title=f"Complete Checkpoint: {cp[:60]}...",
                            action_type="milestone_checkpoint",
                            link="/paths",
                            description="Mark this academic milestone checkpoint complete to advance your career roadmap.",
                        )

        # 3. Default to project recommendation
        return NextBestAction(
            title="Deploy Next Portfolio Project",
            action_type="project",
            link="/paths?tab=full-stack-developer&subtab=projects",
            description="Build and deploy a full-stack project with clean documentation and a live URL to showcase to recruiters.",
        )

    def toggle_item(
        self,
        db: Session,
        user: User,
        payload: ProgressToggleRequest,
    ) -> None:
        """Toggle checkpoint or kickoff task completion and update daily streak."""
        item = (
            db.query(ProgressItem)
            .filter(
                ProgressItem.user_id == user.id,
                ProgressItem.career_path_slug == payload.career_path_slug,
                ProgressItem.item_type == payload.item_type,
                ProgressItem.item_ref == payload.item_ref,
            )
            .first()
        )

        now = datetime.now(timezone.utc)

        if not item:
            item = ProgressItem(
                user_id=user.id,
                career_path_slug=payload.career_path_slug,
                item_type=payload.item_type,
                item_ref=payload.item_ref,
                status=payload.status,
                completed_at=now if payload.status == "completed" else None,
            )
            db.add(item)
        else:
            item.status = payload.status
            item.completed_at = now if payload.status == "completed" else None
            item.updated_at = now

        db.commit()

        # Update streak on completion
        if payload.status == "completed":
            self._record_activity(db, user.id)

    def update_project_progress(
        self,
        db: Session,
        user: User,
        payload: ProjectProgressUpdateRequest,
    ) -> None:
        """Record project status and optional GitHub repository link."""
        item = (
            db.query(ProgressItem)
            .filter(
                ProgressItem.user_id == user.id,
                ProgressItem.career_path_slug == payload.career_path_slug,
                ProgressItem.item_type == "project",
                ProgressItem.item_ref == payload.project_title,
            )
            .first()
        )

        now = datetime.now(timezone.utc)

        if not item:
            item = ProgressItem(
                user_id=user.id,
                career_path_slug=payload.career_path_slug,
                item_type="project",
                item_ref=payload.project_title,
                status=payload.status,
                repo_url=payload.repo_url,
                notes=payload.notes,
                completed_at=now if payload.status == "completed" else None,
            )
            db.add(item)
        else:
            item.status = payload.status
            if payload.repo_url is not None:
                item.repo_url = payload.repo_url
            if payload.notes is not None:
                item.notes = payload.notes
            item.completed_at = now if payload.status == "completed" else None
            item.updated_at = now

        db.commit()

        if payload.status == "completed":
            self._record_activity(db, user.id)

    def get_skill_growth_history(
        self,
        db: Session,
        user: User,
    ) -> List[SkillGrowthDataPoint]:
        """Fetch timeline of verified skills over time for the growth trajectory chart."""
        history = (
            db.query(SkillProficiencyHistory)
            .filter(
                SkillProficiencyHistory.user_id == user.id,
                SkillProficiencyHistory.new_status == "verified",
            )
            .order_by(SkillProficiencyHistory.changed_at.asc())
            .all()
        )

        results: List[SkillGrowthDataPoint] = []
        for h in history:
            lvl = h.new_level or 1
            results.append(
                SkillGrowthDataPoint(
                    skill_name=h.skill.name,
                    verified_level=lvl,
                    verified_level_name=LEVEL_NAMES.get(lvl, "Verified"),
                    score_achieved=h.score_achieved,
                    date=h.changed_at.strftime("%Y-%m-%d"),
                )
            )
        return results


progress_service = ProgressService()
