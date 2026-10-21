import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.catalog import UserSelectedPath
from app.models.progress import ProgressItem, UserStreak
from app.models.simulation import Simulation
from app.models.user import User
from app.services.knowledge_profile_service import KnowledgeProfileService


def sanitize_context_text(text: Optional[str], max_len: int = 300) -> str:
    """Sanitize user text by neutralizing XML/HTML tags and truncating."""
    if not text:
        return ""
    # Strip or neutralize tag markers
    cleaned = re.sub(r"[<>]", "", str(text)).strip()
    return cleaned[:max_len]


class MentorContextService:
    def __init__(self) -> None:
        self.knowledge_service = KnowledgeProfileService()

    def assemble_context(self, db: Session, user: User) -> str:
        """
        Assemble a concise, high-signal context snapshot of the student's profile,
        active career path, skill gaps, test verification status, and daily progress.
        Enforces a strict token/character budget (~3,500 characters max).
        """
        sections: List[str] = []

        # 1. Basic Student Academic Profile
        profile = user.profile
        year_str = (
            f"Year {profile.year_of_study}"
            if profile and profile.year_of_study
            else "Engineering Student"
        )
        branch_str = (
            sanitize_context_text(profile.branch, 50)
            if profile and profile.branch
            else "Engineering"
        )
        grad_year = (
            profile.expected_graduation_year
            if profile and profile.expected_graduation_year
            else "Not specified"
        )
        cgpa_str = f"{profile.cgpa:.2f}" if profile and profile.cgpa else "Not provided"
        college_str = (
            sanitize_context_text(profile.college, 80)
            if profile and profile.college
            else "Engineering College"
        )
        goal_str = (
            sanitize_context_text(profile.career_goal_text, 80)
            if profile and profile.career_goal_text
            else "Campus Placements"
        )

        sections.append(
            f"STUDENT PROFILE:\n"
            f"- Academic Standing: {year_str}, {branch_str} (Graduating {grad_year})\n"
            f"- College: {college_str} | CGPA: {cgpa_str} / 10.0\n"
            f"- Target Career Goal: {goal_str}"
        )

        # 2. Active Selected Career Track & Roadmap
        active_sel = (
            db.query(UserSelectedPath)
            .filter(UserSelectedPath.user_id == user.id, UserSelectedPath.is_active.is_(True))
            .first()
        )

        if active_sel and active_sel.career_path:
            path_name = active_sel.career_path.name
            path_slug = active_sel.career_path.slug
            track_info = [f"ACTIVE CAREER TRACK: {path_name} (slug: {path_slug})"]

            # Load simulation data if linked
            if active_sel.simulation_id:
                sim = db.query(Simulation).filter(Simulation.id == active_sel.simulation_id).first()
                if sim and sim.output_json:
                    paths = sim.output_json.get("paths", [])
                    matched = next((p for p in paths if p.get("path_slug") == path_slug), None)
                    if matched:
                        fit_score = matched.get("fit_score", "N/A")
                        track_info.append(f"- Simulation Fit Score: {fit_score}%")

                        # Top Skill Gaps (limit to 4)
                        gaps = matched.get("skill_gaps", [])[:4]
                        if gaps:
                            gap_lines = []
                            for g in gaps:
                                s_name = sanitize_context_text(g.get("skill", ""), 30)
                                cur = g.get("current_level", 0)
                                req = g.get("required_level", 0)
                                prio = g.get("priority", "medium")
                                gap_lines.append(
                                    f"  * {s_name}: Level {cur}/5 -> Required {req}/5 [{prio} priority]"
                                )
                            track_info.append("- Top Skill Gaps to Close:\n" + "\n".join(gap_lines))

                        # Current Year Milestone
                        stud_year = profile.year_of_study if profile else 3
                        yearly = matched.get("yearly_milestones", [])
                        current_m = next((m for m in yearly if m.get("year") == stud_year), None)
                        if current_m:
                            m_title = sanitize_context_text(
                                current_m.get("milestone_title", ""), 60
                            )
                            m_goals = [
                                sanitize_context_text(g, 60)
                                for g in current_m.get("focus_goals", [])[:2]
                            ]
                            track_info.append(
                                f"- Current Milestone ({year_str}): {m_title} | Goals: {', '.join(m_goals)}"
                            )

            sections.append("\n".join(track_info))
        else:
            sections.append(
                "ACTIVE CAREER TRACK: None chosen yet. Advise student to explore simulated paths in 'My Paths'."
            )

        # 3. Knowledge Profile & Verified Skills (Phase 4)
        try:
            kp = self.knowledge_service.get_knowledge_profile(db, user)
            verified = kp.get("verified_skills", [])
            weaknesses = list(kp.get("all_weaknesses", []))[:4]
            claimed = kp.get("claimed_unverified", [])[:4]

            kp_lines = ["KNOWLEDGE PROFILE & TEST RESULTS:"]
            if verified:
                v_strs = [f"{v['skill']} (Lvl {v['verified_level']})" for v in verified[:5]]
                kp_lines.append(f"- Verified by Diagnostic Tests: {', '.join(v_strs)}")
            else:
                kp_lines.append(
                    "- Verified Skills: None yet (advise taking diagnostic test in 'Skill Tests')"
                )

            if weaknesses:
                w_strs = [sanitize_context_text(w, 50) for w in weaknesses]
                kp_lines.append(f"- Weak Subtopics Identified: {'; '.join(w_strs)}")

            if claimed:
                c_strs = [f"{c['skill']} (Self-rating: {c['self_level']}/5)" for c in claimed]
                kp_lines.append(f"- Unverified Claimed Skills: {', '.join(c_strs)}")

            sections.append("\n".join(kp_lines))
        except Exception:
            sections.append("KNOWLEDGE PROFILE: Standard initial profile.")

        # 4. Daily Progress & Streaks (Phase 4)
        try:
            streak = db.query(UserStreak).filter(UserStreak.user_id == user.id).first()
            current_streak = streak.current_streak_days if streak else 0
            longest_streak = streak.longest_streak_days if streak else 0

            # Query recent completed items
            done_items = (
                db.query(ProgressItem)
                .filter(ProgressItem.user_id == user.id, ProgressItem.status == "completed")
                .order_by(ProgressItem.updated_at.desc())
                .limit(3)
                .all()
            )
            done_refs = [sanitize_context_text(it.item_ref, 50) for it in done_items]

            prog_lines = [
                "PROGRESS & CONSISTENCY (Asia/Kolkata):",
                f"- Daily Streak: {current_streak} days (Personal Best: {longest_streak} days)",
            ]
            if done_refs:
                prog_lines.append(f"- Recently Completed: {', '.join(done_refs)}")
            else:
                prog_lines.append("- Recently Completed: No completed milestone tasks yet.")

            sections.append("\n".join(prog_lines))
        except Exception:
            sections.append("PROGRESS: Streak 0 days.")

        raw_context = "\n\n".join(sections)
        # Cap at 3,500 characters max
        truncated_context = raw_context[:3500]

        return f"<student_context_data>\n{truncated_context}\n</student_context_data>"
