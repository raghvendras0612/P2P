import json
from typing import Any, Dict, List, Optional

from app.schemas.simulation import VALID_CAREER_PATH_SLUGS


def sanitize_text(text: Optional[str], max_chars: int = 1000) -> str:
    """Sanitize and truncate user-provided text, neutralizing any attempts to break context tags."""
    if not text:
        return ""
    # Neutralize closing context tags to prevent prompt injection breakouts
    safe = text.replace("</student_context_data>", "[escaped_tag]").replace(
        "<student_context_data>", "[escaped_tag]"
    )
    return safe[:max_chars].strip()


def build_simulation_input_prompt(
    student_snapshot: Dict[str, Any],
    mode: str = "auto",
    custom_slugs: Optional[List[str]] = None,
) -> str:
    """Build a hardened, injection-resistant prompt for Gemini with explicit milestone guidelines."""
    current_year = int(student_snapshot.get("year_of_study", 3))
    grad_year = int(
        student_snapshot.get("expected_graduation_year", current_year + (4 - current_year))
    )

    # Compute required milestones labels
    required_milestones = []
    for yr in range(current_year, 5):
        ordinal = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}.get(yr, f"{yr}th")
        required_milestones.append(f"Year {yr} ({ordinal} Year)")
    required_milestones.append("First 1-2 Years Post-Graduation")

    # Sanitize snapshot components
    sanitized_snapshot = {
        "full_name": sanitize_text(student_snapshot.get("full_name", "Student"), 100),
        "college": sanitize_text(student_snapshot.get("college", ""), 150),
        "branch": sanitize_text(student_snapshot.get("branch", ""), 100),
        "year_of_study": current_year,
        "expected_graduation_year": grad_year,
        "cgpa": float(student_snapshot.get("cgpa", 8.0)),
        "city": sanitize_text(student_snapshot.get("city", ""), 100),
        "state": sanitize_text(student_snapshot.get("state", ""), 100),
        "career_goal_text": sanitize_text(student_snapshot.get("career_goal_text", ""), 1000),
        "preferred_work_style": sanitize_text(
            student_snapshot.get("preferred_work_style", "Hybrid"), 50
        ),
        "claimed_and_verified_skills": [
            {
                "skill": sanitize_text(s.get("skill_name") or s.get("custom_skill_name", ""), 60),
                "category": sanitize_text(s.get("category", "General"), 50),
                "self_level": int(s.get("self_level", 2)),  # 1=Beg, 2=Int, 3=Adv
                "status": s.get("status", "claimed"),  # "claimed" vs "verified"
                "verified_level": s.get("verified_level"),
            }
            for s in student_snapshot.get("skills", [])[:50]  # Cap at 50 skills
            if (s.get("skill_name") or s.get("custom_skill_name"))
        ],
        "interests": [
            sanitize_text(i.get("name") if isinstance(i, dict) else str(i), 80)
            for i in student_snapshot.get("interests", [])[:25]
        ],
        "projects": [
            {
                "title": sanitize_text(p.get("title", ""), 100),
                "tech_stack": sanitize_text(p.get("tech_stack", ""), 150),
                "description": sanitize_text(p.get("description", ""), 500),
            }
            for p in student_snapshot.get("projects", [])[:5]
        ],
        "experiences": [
            {
                "type": sanitize_text(e.get("type", "internship"), 50),
                "title": sanitize_text(e.get("title", ""), 100),
                "organization": sanitize_text(e.get("organization", ""), 100),
            }
            for e in student_snapshot.get("experiences", [])[:5]
        ],
        "completed_progress_items": [
            {
                "career_path_slug": sanitize_text(item.get("career_path_slug", ""), 60),
                "item_type": sanitize_text(item.get("item_type", ""), 40),
                "item_ref": sanitize_text(item.get("item_ref", ""), 150),
            }
            for item in student_snapshot.get("completed_progress_items", [])[:30]
        ],
        "knowledge_profile": student_snapshot.get("knowledge_profile", {}),
    }

    mode_instruction = ""
    if mode == "custom" and custom_slugs:
        slugs_formatted = ", ".join(f"'{s}'" for s in custom_slugs)
        mode_instruction = f"""
CUSTOM MODE SPECIFICATION:
The student explicitly requested the following career path(s): [{slugs_formatted}].
- You MUST include these path(s) among the 3 simulated paths using their exact slugs.
- If fewer than 3 were named, choose the most complementary remaining path(s) from the catalog to make exactly 3.
"""
    else:
        mode_instruction = f"""
AUTO MODE SPECIFICATION:
Select the THREE best-fit career paths for this student from the allowed catalog:
{sorted(list(VALID_CAREER_PATH_SLUGS))}
Choose paths that realistically leverage their branch, claimed/verified skills, and stated career interests.
"""

    prompt = f"""Generate three realistic, strictly structured career path simulations for the Indian engineering student below.

<student_context_data>
{json.dumps(sanitized_snapshot, indent=2)}
</student_context_data>

{mode_instruction}

REQUIRED YEARLY MILESTONES FOR THIS STUDENT (Year {current_year} to Graduation {grad_year}):
Your `yearly_milestones` array in each path MUST contain one entry for each of the following phases in chronological order:
{json.dumps(required_milestones, indent=2)}

CRITICAL SCHEMA INSTRUCTIONS:
1. Return EXACTLY 3 distinct career paths.
2. Every `path_slug` MUST be one of: {sorted(list(VALID_CAREER_PATH_SLUGS))}.
3. Every path must have strictly 6 to 10 `skill_gaps` with levels between 0 and 5.
4. Every path must have 3 to 5 `projects_to_build`.
5. Every path must have a `first_month_plan` with strictly 4 weeks (weeks 1 to 4).
6. Fit scores must be between 0 and 100 and must be meaningfully distinct across the 3 paths (never all identical).
7. Include top-level disclaimers stating that all milestones and salary projections are estimates, not guarantees.
8. ASSESSMENT WEIGHTING: Skills with status='verified' were validated through technical assessment and carry heavy weight in fit scores. Address any overclaimed gaps and weak subtopics in learning goals.
9. PROGRESS CONTINUITY: The student has already completed items listed under `completed_progress_items`. Do NOT assign those completed items as pending work; build forward from their accomplishments.
10. Output pure JSON matching the specified schema.
"""
    return prompt
