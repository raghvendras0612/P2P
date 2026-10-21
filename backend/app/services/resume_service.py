import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog import CareerPath, UserSelectedPath, UserSkill
from app.models.profile import EducationEntry, Experience, Project, StudentProfile
from app.models.resume import ResumeDocument
from app.models.user import User
from app.schemas.resume import (
    ResumeCompiledData,
    ResumeEducationItem,
    ResumeExperienceItem,
    ResumeProjectItem,
    ResumeSkillItem,
    ResumeStrengthCheck,
    TailorResumeResponse,
    UpdateResumeSettingsRequest,
)
from app.services.ai.ai_service import clean_json_markdown
from app.services.pdf_generator import generate_ats_resume_pdf

logger = logging.getLogger(__name__)

LEVEL_NAMES: Dict[int, str] = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
}


class ResumeService:
    def __init__(self, client: Optional[Any] = None, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client

    @property
    def client(self) -> Any:
        if self._client is None:
            from google import genai

            api_key = settings.GEMINI_API_KEY or "dummy_key_for_testing"
            self._client = genai.Client(api_key=api_key)
        return self._client

    def _get_or_create_resume_doc(self, db: Session, user: User) -> ResumeDocument:
        """Fetch or initialize the user's resume document settings."""
        doc = db.query(ResumeDocument).filter(ResumeDocument.user_id == user.id).first()
        if not doc:
            # Check if user has active selected path
            active_sel = (
                db.query(UserSelectedPath)
                .filter(UserSelectedPath.user_id == user.id, UserSelectedPath.is_active.is_(True))
                .first()
            )
            slug = active_sel.career_path.slug if active_sel else None
            role = active_sel.career_path.name if active_sel else "Software Engineer"

            doc = ResumeDocument(
                user_id=user.id,
                career_path_slug=slug,
                template_id="minimal_ats",
                target_role=role,
                custom_summary=None,
                show_unverified_skills=True,
                custom_sections_json={},
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
        return doc

    def compile_resume(self, db: Session, user: User) -> ResumeCompiledData:
        """Compile complete ATS resume from profile + verified skills + active track."""
        doc = self._get_or_create_resume_doc(db, user)
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile must be created before generating a resume.",
            )

        # 1. Career Path metadata
        career_path_name = None
        if doc.career_path_slug:
            cp = db.query(CareerPath).filter(CareerPath.slug == doc.career_path_slug).first()
            if cp:
                career_path_name = cp.name

        # 2. Skills (Categorized into Verified vs Unverified, failed suppressed)
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
        verified_skills: List[ResumeSkillItem] = []
        unverified_skills: List[ResumeSkillItem] = []

        for us in user_skills:
            skill = us.skill
            if us.status == "verified" and us.verified_level is not None:
                verified_skills.append(
                    ResumeSkillItem(
                        name=skill.name,
                        category=skill.category,
                        status="verified",
                        self_level=us.self_level,
                        verified_level=us.verified_level,
                        verified_level_name=LEVEL_NAMES.get(us.verified_level, "Verified"),
                    )
                )
            elif us.status == "claimed":
                unverified_skills.append(
                    ResumeSkillItem(
                        name=skill.name,
                        category=skill.category,
                        status="claimed",
                        self_level=us.self_level,
                        verified_level=None,
                        verified_level_name=None,
                    )
                )
            # Failed skills are excluded from listing at their claimed self-level

        # Sort verified skills by verified_level desc
        verified_skills.sort(key=lambda s: s.verified_level or 0, reverse=True)

        # 3. Education
        edus = db.query(EducationEntry).filter(EducationEntry.user_id == user.id).all()
        education_items = [
            ResumeEducationItem(
                level=e.level,
                institution_name=e.institution_name,
                board_or_university=e.board_or_university,
                passing_year=e.passing_year,
                percentage=float(e.percentage),
            )
            for e in edus
        ]

        # 4. Projects (ordered by custom ordering if tailored)
        projs = db.query(Project).filter(Project.user_id == user.id).all()
        project_map = {p.title.lower(): p for p in projs}

        ordered_projects: List[ResumeProjectItem] = []
        ordered_titles = (doc.custom_sections_json or {}).get("ordered_project_titles", [])

        # Add in tailored order first
        for title in ordered_titles:
            p_obj = project_map.pop(title.lower(), None)
            if p_obj:
                ordered_projects.append(
                    ResumeProjectItem(
                        title=p_obj.title,
                        description=p_obj.description,
                        tech_stack=p_obj.tech_stack,
                        link=p_obj.link,
                    )
                )
        # Add remaining projects
        for p_obj in project_map.values():
            ordered_projects.append(
                ResumeProjectItem(
                    title=p_obj.title,
                    description=p_obj.description,
                    tech_stack=p_obj.tech_stack,
                    link=p_obj.link,
                )
            )

        # 5. Experience
        exps = db.query(Experience).filter(Experience.user_id == user.id).all()
        experience_items = [
            ResumeExperienceItem(
                type=exp.type,
                title=exp.title,
                organization=exp.organization,
                description=exp.description,
                date_or_duration=exp.date_or_duration,
                link=exp.link,
            )
            for exp in exps
        ]

        # 6. Summary: custom tailored summary or default
        summary_text = doc.custom_summary
        is_tailored = bool(summary_text)
        if not summary_text:
            verified_names = [v.name for v in verified_skills[:3]]
            skills_mention = (
                f" with verified proficiency in {', '.join(verified_names)}"
                if verified_names
                else ""
            )
            summary_text = (
                f"{profile.branch} student at {profile.college} (CGPA: {float(profile.cgpa):.2f}){skills_mention}. "
                f"Aspiring {doc.target_role or 'Software Engineer'} focused on building scalable, production-grade applications."
            )

        # 7. Resume Strength Checklist Score
        strength = self._calculate_resume_strength(
            email=user.email,
            profile=profile,
            verified_count=len(verified_skills),
            projects_count=len(ordered_projects),
            education_count=len(education_items),
            experiences_count=len(experience_items),
            is_tailored=is_tailored,
        )

        checklist = [{"item": c, "passed": True, "tip": ""} for c in strength.criteria_met] + [
            {
                "item": m,
                "passed": False,
                "tip": strength.improvement_tips[i] if i < len(strength.improvement_tips) else "",
            }
            for i, m in enumerate(strength.missing_items)
        ]

        return ResumeCompiledData(
            template_id=doc.template_id,
            selected_template=doc.template_id,
            target_role=doc.target_role,
            career_path_slug=doc.career_path_slug,
            career_path_name=career_path_name,
            full_name=profile.full_name,
            email=user.email,
            phone=profile.phone,
            city=profile.city,
            state=profile.state,
            linkedin_url=profile.linkedin_url,
            github_url=profile.github_url,
            portfolio_url=profile.portfolio_url,
            summary=summary_text,
            is_tailored=is_tailored,
            show_unverified_skills=doc.show_unverified_skills,
            verified_skills=verified_skills,
            unverified_skills=unverified_skills,
            education=education_items,
            projects=ordered_projects,
            experiences=experience_items,
            strength=strength,
            strength_score=strength.score,
            strength_checklist=checklist,
            updated_at=doc.updated_at,
        )

    def _calculate_resume_strength(
        self,
        email: str,
        profile: StudentProfile,
        verified_count: int,
        projects_count: int,
        education_count: int,
        experiences_count: int,
        is_tailored: bool,
    ) -> ResumeStrengthCheck:
        """Evaluate resume completeness against ATS screening standards."""
        criteria_met = []
        missing_items = []
        tips = []
        score = 0

        # Contact info
        if email or profile.phone:
            score += 15
            criteria_met.append("Valid contact information & phone number")
        else:
            missing_items.append("Contact information incomplete")

        # Profiles
        if profile.github_url or profile.linkedin_url:
            score += 15
            criteria_met.append("Professional links (GitHub / LinkedIn) attached")
        else:
            missing_items.append("Missing GitHub or LinkedIn profile link")
            tips.append(
                "Add a GitHub profile with clean code samples to boost interview shortlisting."
            )

        # Education
        if education_count >= 1:
            score += 15
            criteria_met.append(f"{education_count} education record(s) with GPA/percentage")
        else:
            missing_items.append("Education history missing")

        # Projects
        if projects_count >= 2:
            score += 20
            criteria_met.append(f"{projects_count} portfolio projects with tech stacks")
        elif projects_count == 1:
            score += 10
            missing_items.append("Only 1 project listed")
            tips.append(
                "Indian tech recruiters look for at least 2 complete, deployed portfolio projects."
            )
        else:
            missing_items.append("No portfolio projects listed")
            tips.append("Add 2 portfolio projects with live URLs or GitHub links.")

        # Verified Skills
        if verified_count >= 3:
            score += 20
            criteria_met.append(f"{verified_count} skills verified via diagnostic assessments")
        elif verified_count >= 1:
            score += 10
            criteria_met.append(f"{verified_count} verified skill credential")
            tips.append(
                "Take diagnostic tests for 2 more claimed skills to replace unverified tags with verified badges."
            )
        else:
            missing_items.append("No verified skills yet (all skills unverified)")
            tips.append(
                "Pass diagnostic skill challenges on the Skill Tests page to display verified badges."
            )

        # Tailored summary
        if is_tailored:
            score += 15
            criteria_met.append("AI-tailored summary aligned to career path")
        else:
            tips.append(
                "Click 'Tailor to Career Track' to generate an ATS-optimized professional summary."
            )

        return ResumeStrengthCheck(
            score=min(100, score),
            criteria_met=criteria_met,
            missing_items=missing_items,
            improvement_tips=tips,
        )

    def update_resume_settings(
        self,
        db: Session,
        user: User,
        payload: UpdateResumeSettingsRequest,
    ) -> ResumeCompiledData:
        """Update resume template preference or custom overrides."""
        doc = self._get_or_create_resume_doc(db, user)

        tmpl = payload.template_id or payload.template_name
        if tmpl is not None:
            doc.template_id = tmpl
        if payload.target_role is not None:
            doc.target_role = payload.target_role.strip()
        if payload.custom_summary is not None:
            doc.custom_summary = payload.custom_summary.strip()
        show_unver = (
            payload.show_unverified_skills
            if payload.show_unverified_skills is not None
            else payload.include_unverified_skills
        )
        if show_unver is not None:
            doc.show_unverified_skills = show_unver

        doc.updated_at = datetime.now(timezone.utc)
        db.commit()
        return self.compile_resume(db, user)

    def tailor_resume_for_path(
        self,
        db: Session,
        user: User,
        career_path_slug: Optional[str] = None,
    ) -> TailorResumeResponse:
        """Use Gemini to tailor summary and prioritize projects without inventing facts."""
        doc = self._get_or_create_resume_doc(db, user)

        # Resolve path slug
        target_slug = career_path_slug or doc.career_path_slug
        if not target_slug:
            active_sel = (
                db.query(UserSelectedPath)
                .filter(UserSelectedPath.user_id == user.id, UserSelectedPath.is_active.is_(True))
                .first()
            )
            if active_sel:
                target_slug = active_sel.career_path.slug
            else:
                target_slug = "full-stack-developer"

        cp = db.query(CareerPath).filter(CareerPath.slug == target_slug).first()
        target_role_name = cp.name if cp else target_slug.replace("-", " ").title()

        # Build context from student records
        from app.services.ai.prompts.builder import sanitize_text

        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        projects = db.query(Project).filter(Project.user_id == user.id).all()
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

        context = {
            "full_name": sanitize_text(profile.full_name, 100) if profile else "Student",
            "branch": sanitize_text(profile.branch, 100) if profile else "Engineering",
            "college": sanitize_text(profile.college, 150) if profile else "University",
            "cgpa": float(profile.cgpa) if profile else 8.0,
            "target_role": sanitize_text(target_role_name, 100),
            "verified_skills": [
                sanitize_text(us.skill.name, 60) for us in user_skills if us.status == "verified"
            ],
            "claimed_skills": [
                sanitize_text(us.skill.name, 60) for us in user_skills if us.status == "claimed"
            ],
            "projects": [
                {
                    "title": sanitize_text(p.title, 100),
                    "tech_stack": sanitize_text(p.tech_stack, 150),
                    "description": sanitize_text(p.description, 200),
                }
                for p in projects
            ],
        }

        prompt = f"""You are a Technical Resume Optimizer specializing in the Indian engineering hiring market.
Target Career Track: "{target_role_name}" (Slug: "{target_slug}")
Student Background:
<student_context_data>
{json.dumps(context, indent=2)}
</student_context_data>

INSTRUCTIONS:
1. Generate an impactful, concise 2-3 sentence professional summary (under 60 words). It MUST highlight the student's verified competencies and relevant projects for {target_role_name}.
2. Reorder the student's project titles so the ones most relevant to {target_role_name} appear first.
3. Highlight 3-5 of their provided skills most relevant to this role.
4. ABSOLUTE CONSTRAINT: NEVER invent or hallucinate technologies, company names, or achievements not present above. Only polish, rephrase, and prioritize what the student provided.

Output valid JSON matching this schema:
{{
  "target_role": "{target_role_name}",
  "career_path_slug": "{target_slug}",
  "tailored_summary": "...",
  "ordered_project_titles": ["Title 1", "Title 2"],
  "relevant_skills_highlighted": ["Skill A", "Skill B"]
}}
"""
        from google.genai import types

        config = types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        )
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        cleaned_json = clean_json_markdown(response.text or "{}")
        parsed = json.loads(cleaned_json)

        tailored_summary = parsed.get("tailored_summary", "")

        # Anti-hallucination sanitization: only allow real projects and real skills
        valid_project_titles = [p.title for p in projects]
        raw_ordered = parsed.get("ordered_project_titles", [])
        ordered_projects: List[str] = []
        for t in raw_ordered:
            if t in valid_project_titles and t not in ordered_projects:
                ordered_projects.append(t)
        for p in projects:
            if p.title not in ordered_projects:
                ordered_projects.append(p.title)

        valid_skills_map = {us.skill.name.lower(): us.skill.name for us in user_skills}
        raw_highlighted = parsed.get("relevant_skills_highlighted", [])
        highlighted: List[str] = []
        for s in raw_highlighted:
            s_clean = s.strip()
            if s_clean.lower() in valid_skills_map:
                actual_name = valid_skills_map[s_clean.lower()]
                if actual_name not in highlighted:
                    highlighted.append(actual_name)

        # Save to document
        doc.target_role = target_role_name
        doc.career_path_slug = target_slug
        doc.custom_summary = tailored_summary
        doc.custom_sections_json = {
            "ordered_project_titles": ordered_projects,
            "relevant_skills_highlighted": highlighted,
        }
        doc.updated_at = datetime.now(timezone.utc)
        db.commit()

        return TailorResumeResponse(
            target_role=target_role_name,
            career_path_slug=target_slug,
            tailored_summary=tailored_summary,
            ordered_project_titles=ordered_projects,
            relevant_skills_highlighted=highlighted,
        )

    def export_pdf(self, db: Session, user: User) -> bytes:
        """Generate PDF resume binary."""
        data = self.compile_resume(db, user)
        return generate_ats_resume_pdf(data.model_dump(), template_id=data.template_id)

    def export_markdown(self, db: Session, user: User) -> str:
        """Export resume formatted in pure Markdown."""
        data = self.compile_resume(db, user)
        lines = []

        lines.append(f"# {data.full_name}")
        if data.target_role:
            lines.append(f"**Target Role: {data.target_role}**\n")

        contact = [data.email, data.phone, f"{data.city}, {data.state}"]
        if data.linkedin_url:
            contact.append(f"[LinkedIn]({data.linkedin_url})")
        if data.github_url:
            contact.append(f"[GitHub]({data.github_url})")
        lines.append(" | ".join(contact))
        lines.append("\n---\n")

        lines.append("## Professional Summary\n")
        lines.append(data.summary)
        lines.append("\n")

        lines.append("## Technical Skills\n")
        if data.verified_skills:
            v_strs = [
                f"**{s.name}** *(Verified - {s.verified_level_name})*" for s in data.verified_skills
            ]
            lines.append(f"- **Verified Competencies:** {', '.join(v_strs)}")
        if data.show_unverified_skills and data.unverified_skills:
            u_strs = [s.name for s in data.unverified_skills]
            lines.append(f"- **Familiar / Self-Reported:** {', '.join(u_strs)}")
        lines.append("\n")

        if data.projects:
            lines.append("## Projects\n")
            for p in data.projects:
                link_str = f" | [Link]({p.link})" if p.link else ""
                lines.append(f"### {p.title}{link_str}")
                lines.append(f"*Technologies: {p.tech_stack}*\n")
                lines.append(f"- {p.description}\n")

        if data.experiences:
            lines.append("## Experience & Recognition\n")
            for exp in data.experiences:
                org_str = f" - {exp.organization}" if exp.organization else ""
                date_str = f" ({exp.date_or_duration})" if exp.date_or_duration else ""
                lines.append(f"### {exp.title}{org_str}{date_str}")
                if exp.description:
                    lines.append(f"- {exp.description}\n")

        if data.education:
            lines.append("## Education\n")
            for edu in data.education:
                lines.append(f"### {edu.institution_name} - {edu.level}")
                lines.append(f"Passing Year: {edu.passing_year} | Percentage: {edu.percentage}%\n")

        return "\n".join(lines)


resume_service = ResumeService()
