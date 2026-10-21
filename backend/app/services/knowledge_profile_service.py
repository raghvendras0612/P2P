from typing import Any, Dict

from sqlalchemy.orm import Session

from app.models.catalog import UserSkill
from app.models.testing import TestAttempt
from app.models.user import User

LEVEL_NAMES: Dict[int, str] = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
}


class KnowledgeProfileService:
    def get_knowledge_profile(self, db: Session, user: User) -> Dict[str, Any]:
        """Aggregate student verified skills, claimed skills, failed attempts, and weak subtopics."""
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

        verified_skills = []
        claimed_unverified = []
        failed_skills = []
        overclaimed_gaps = []

        all_weaknesses: set[str] = set()
        all_strengths: set[str] = set()

        for us in user_skills:
            skill_name = us.skill.name
            claimed_lvl = us.self_level

            # Get latest completed test attempt
            latest_attempt = (
                db.query(TestAttempt)
                .filter(
                    TestAttempt.user_id == user.id,
                    TestAttempt.skill_id == us.skill_id,
                    TestAttempt.status == "completed",
                )
                .order_by(TestAttempt.completed_at.desc())
                .first()
            )

            if latest_attempt and latest_attempt.feedback_json:
                fb = latest_attempt.feedback_json
                for w in fb.get("weaknesses", []):
                    all_weaknesses.add(f"{skill_name}: {w}")
                for s in fb.get("strengths", []):
                    all_strengths.add(f"{skill_name}: {s}")

            if us.status == "verified" and us.verified_level is not None:
                verified_skills.append(
                    {
                        "skill": skill_name,
                        "verified_level": us.verified_level,
                        "verified_level_name": LEVEL_NAMES.get(us.verified_level, "Verified"),
                        "claimed_level": claimed_lvl,
                        "last_score": latest_attempt.score_percentage if latest_attempt else None,
                        "tested_at": us.last_tested_at.isoformat() if us.last_tested_at else None,
                    }
                )
                # Check if overclaimed
                if claimed_lvl > us.verified_level:
                    overclaimed_gaps.append(
                        {
                            "skill": skill_name,
                            "claimed_level": claimed_lvl,
                            "verified_level": us.verified_level,
                            "delta": claimed_lvl - us.verified_level,
                            "note": f"Student claimed level {claimed_lvl} but tested at verified level {us.verified_level}.",
                        }
                    )
            elif us.status == "failed":
                failed_skills.append(
                    {
                        "skill": skill_name,
                        "claimed_level": claimed_lvl,
                        "last_score": latest_attempt.score_percentage if latest_attempt else None,
                        "tested_at": us.last_tested_at.isoformat() if us.last_tested_at else None,
                    }
                )
            else:
                claimed_unverified.append(
                    {
                        "skill": skill_name,
                        "claimed_level": claimed_lvl,
                        "claimed_level_name": LEVEL_NAMES.get(claimed_lvl, "Claimed"),
                    }
                )

        return {
            "verified_skills": verified_skills,
            "claimed_unverified_skills": claimed_unverified,
            "failed_skills": failed_skills,
            "overclaimed_gaps": overclaimed_gaps,
            "weak_subtopics": sorted(list(all_weaknesses)),
            "strong_subtopics": sorted(list(all_strengths)),
        }


knowledge_profile_service = KnowledgeProfileService()
