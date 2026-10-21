from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, overload

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSelectedPath, UserSkill
from app.models.simulation import Simulation
from app.models.testing import (
    AttemptAnswer,
    QuestionBank,
    SkillProficiencyHistory,
    TestAttempt,
)
from app.models.user import User
from app.schemas.testing import (
    ActiveTestSessionRead,
    ClaimedSkillTestEligibility,
    ClientQuestionOption,
    ClientTestQuestion,
    QuestionReviewDetail,
    TestResultResponse,
)
from app.services.ai.question_service import QuestionService

DEFAULT_TIME_LIMIT_SECONDS = 2700  # 45 minutes
COOLDOWN_DAYS = 7
PASS_MARK_PERCENTAGE = 60.0

DIFFICULTY_POINTS: Dict[int, float] = {
    1: 1.0,
    2: 1.5,
    3: 2.0,
    4: 2.5,
    5: 3.0,
}

LEVEL_NAMES: Dict[int, str] = {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
    4: "Expert",
}


@overload
def ensure_utc(dt: None) -> None: ...


@overload
def ensure_utc(dt: datetime) -> datetime: ...


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class TestEngineService:
    __test__ = False

    def __init__(self, question_service: Optional[QuestionService] = None):
        self.question_service = question_service or QuestionService()

    def get_claimed_skills_eligibility(
        self,
        db: Session,
        user: User,
    ) -> List[ClaimedSkillTestEligibility]:
        """List all skills claimed by the user along with their test readiness, cooldown, and path priority."""
        user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

        # Check user's active career track to prioritize skills
        active_track_skills: set[str] = set()
        active_selection = (
            db.query(UserSelectedPath)
            .filter(UserSelectedPath.user_id == user.id, UserSelectedPath.is_active.is_(True))
            .first()
        )
        if active_selection and active_selection.simulation_id:
            sim = (
                db.query(Simulation).filter(Simulation.id == active_selection.simulation_id).first()
            )
            if sim and sim.output_json:
                paths = sim.output_json.get("paths", [])
                matched = next(
                    (p for p in paths if p.get("path_slug") == active_selection.career_path.slug),
                    None,
                )
                if matched:
                    # Collect skill gaps
                    for gap in matched.get("skill_gaps", []):
                        active_track_skills.add(gap.get("skill", "").lower())
                    for m in matched.get("yearly_milestones", []):
                        for s in m.get("skills_to_learn", []):
                            active_track_skills.add(s.lower())

        now = datetime.now(timezone.utc)
        results: List[ClaimedSkillTestEligibility] = []

        for us in user_skills:
            skill = us.skill

            # Check for active in_progress attempt
            active_attempt = (
                db.query(TestAttempt)
                .filter(
                    TestAttempt.user_id == user.id,
                    TestAttempt.skill_id == skill.id,
                    TestAttempt.status == "in_progress",
                )
                .first()
            )
            if active_attempt and active_attempt.expires_at:
                if ensure_utc(active_attempt.expires_at) <= now:
                    active_attempt = None

            # Check cooldown from last completed test
            last_completed = (
                db.query(TestAttempt)
                .filter(
                    TestAttempt.user_id == user.id,
                    TestAttempt.skill_id == skill.id,
                    TestAttempt.status.in_(["completed", "expired"]),
                )
                .order_by(TestAttempt.started_at.desc())
                .first()
            )

            cooldown_ends: Optional[datetime] = None
            cooldown_remaining_secs = 0
            can_take = True

            if active_attempt:
                can_take = True  # Can resume
            elif last_completed and last_completed.completed_at:
                cooldown_ends = ensure_utc(last_completed.completed_at) + timedelta(
                    days=COOLDOWN_DAYS
                )
                if cooldown_ends and now < cooldown_ends:
                    cooldown_remaining_secs = int((cooldown_ends - now).total_seconds())
                    can_take = False

            is_priority = any(
                skill.name.lower() in track_s or track_s in skill.name.lower()
                for track_s in active_track_skills
            )

            results.append(
                ClaimedSkillTestEligibility(
                    skill_id=skill.id,
                    name=skill.name,
                    category=skill.category,
                    self_level=us.self_level,
                    status=us.status,
                    verified_level=us.verified_level,
                    verified_level_name=LEVEL_NAMES.get(us.verified_level)
                    if us.verified_level
                    else None,
                    last_tested_at=us.last_tested_at,
                    can_take_test=can_take,
                    cooldown_remaining_seconds=max(0, cooldown_remaining_secs),
                    cooldown_ends_at=cooldown_ends if cooldown_remaining_secs > 0 else None,
                    is_path_priority=is_priority,
                    active_attempt_id=active_attempt.id if active_attempt else None,
                )
            )

        # Sort: priority first, then active attempt first, then name
        results.sort(key=lambda s: (not bool(s.active_attempt_id), not s.is_path_priority, s.name))
        return results

    def start_or_resume_test(
        self,
        db: Session,
        user: User,
        skill_id: int,
    ) -> ActiveTestSessionRead:
        """Start a new test session or resume an unexpired active attempt."""
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found in catalog."
            )

        # Ensure user claimed this skill
        user_skill = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user.id, UserSkill.skill_id == skill.id)
            .first()
        )
        if not user_skill:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must add this skill to your claimed skills profile before attempting verification.",
            )

        now = datetime.now(timezone.utc)

        # 1. Check for existing active in-progress attempt
        active = (
            db.query(TestAttempt)
            .filter(
                TestAttempt.user_id == user.id,
                TestAttempt.skill_id == skill.id,
                TestAttempt.status == "in_progress",
            )
            .first()
        )

        if active and active.expires_at:
            exp = ensure_utc(active.expires_at)
            # Check if expired
            if exp and now > exp:
                active.status = "expired"
                db.commit()
            else:
                # Resume existing active test
                return self._build_active_session_response(db, active, skill)

        # 2. Check 7-day cooldown
        last_completed = (
            db.query(TestAttempt)
            .filter(
                TestAttempt.user_id == user.id,
                TestAttempt.skill_id == skill.id,
                TestAttempt.status.in_(["completed", "expired"]),
            )
            .order_by(TestAttempt.started_at.desc())
            .first()
        )
        if last_completed and last_completed.completed_at:
            cooldown_ends = ensure_utc(last_completed.completed_at) + timedelta(days=COOLDOWN_DAYS)
            if cooldown_ends and now < cooldown_ends:
                diff_hours = int((cooldown_ends - now).total_seconds() / 3600)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Cooldown active. You can retake the test for '{skill.name}' in {diff_hours} hours.",
                )

        # 3. Create fresh attempt
        sampled_questions = self.question_service.sample_test_questions(
            db=db,
            skill=skill,
            target_count=25,
        )

        total_pts = sum(DIFFICULTY_POINTS.get(q.difficulty, 2.0) for q in sampled_questions)
        expires_at = now + timedelta(seconds=DEFAULT_TIME_LIMIT_SECONDS)

        new_attempt = TestAttempt(
            user_id=user.id,
            skill_id=skill.id,
            status="in_progress",
            started_at=now,
            expires_at=expires_at,
            time_limit_seconds=DEFAULT_TIME_LIMIT_SECONDS,
            total_questions=len(sampled_questions),
            total_points=total_pts,
            earned_points=0.0,
            pass_mark=PASS_MARK_PERCENTAGE,
            tab_switch_count=0,
        )
        db.add(new_attempt)
        db.flush()

        # Create AttemptAnswer entries
        for idx, q in enumerate(sampled_questions, start=1):
            ans = AttemptAnswer(
                attempt_id=new_attempt.id,
                question_id=q.id,
                question_order=idx,
                selected_answers_json=[],
                is_correct=None,
                points_awarded=0.0,
                time_spent_seconds=0,
            )
            db.add(ans)

        db.commit()
        db.refresh(new_attempt)

        return self._build_active_session_response(db, new_attempt, skill)

    def _build_active_session_response(
        self,
        db: Session,
        attempt: TestAttempt,
        skill: Skill,
    ) -> ActiveTestSessionRead:
        """Construct sanitized response for client: ZERO answer keys, ZERO explanations!"""
        now = datetime.now(timezone.utc)
        remaining = 0
        if attempt.expires_at:
            exp = ensure_utc(attempt.expires_at)
            if exp:
                remaining = max(0, int((exp - now).total_seconds()))

        # Query answers in question_order
        answers = (
            db.query(AttemptAnswer)
            .filter(AttemptAnswer.attempt_id == attempt.id)
            .order_by(AttemptAnswer.question_order.asc())
            .all()
        )

        client_questions: List[ClientTestQuestion] = []
        for a in answers:
            q: QuestionBank = a.question
            client_opts = [
                ClientQuestionOption(id=opt["id"], text=opt["text"]) for opt in q.options_json
            ]
            client_questions.append(
                ClientTestQuestion(
                    attempt_answer_id=a.id,
                    question_id=q.id,
                    question_order=a.question_order,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    code_snippet=q.code_snippet,
                    options=client_opts,
                    difficulty=q.difficulty,
                    subtopic_tag=q.subtopic_tag,
                    selected_answers=a.selected_answers_json or [],
                )
            )

        return ActiveTestSessionRead(
            attempt_id=attempt.id,
            skill_id=skill.id,
            skill_name=skill.name,
            category=skill.category,
            status=attempt.status,
            started_at=attempt.started_at,
            expires_at=attempt.expires_at,
            time_limit_seconds=attempt.time_limit_seconds,
            time_remaining_seconds=remaining,
            total_questions=attempt.total_questions,
            questions=client_questions,
            tab_switch_count=attempt.tab_switch_count,
        )

    def record_incremental_answer(
        self,
        db: Session,
        user: User,
        attempt_id: int,
        question_id: int,
        selected_answers: List[str],
        time_spent_seconds: int = 0,
    ) -> None:
        """Save answers incrementally so progress is resilient to page reload or drop."""
        attempt = (
            db.query(TestAttempt)
            .filter(TestAttempt.id == attempt_id, TestAttempt.user_id == user.id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Test attempt not found."
            )

        if attempt.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot record answers for test with status '{attempt.status}'.",
            )

        now = datetime.now(timezone.utc)
        if attempt.expires_at:
            exp = ensure_utc(attempt.expires_at)
            if exp and now > exp:
                attempt.status = "expired"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Test time limit has expired.",
                )

        answer_record = (
            db.query(AttemptAnswer)
            .filter(
                AttemptAnswer.attempt_id == attempt.id,
                AttemptAnswer.question_id == question_id,
            )
            .first()
        )
        if not answer_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question is not part of this test attempt.",
            )

        answer_record.selected_answers_json = [ans.upper().strip() for ans in selected_answers]
        answer_record.time_spent_seconds = time_spent_seconds
        answer_record.answered_at = now
        db.commit()

    def record_tab_switch(
        self,
        db: Session,
        user: User,
        attempt_id: int,
    ) -> int:
        """Increment and record tab-switch count for proctoring logging."""
        attempt = (
            db.query(TestAttempt)
            .filter(TestAttempt.id == attempt_id, TestAttempt.user_id == user.id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Test attempt not found."
            )

        attempt.tab_switch_count += 1
        db.commit()
        return attempt.tab_switch_count

    def submit_and_grade_test(
        self,
        db: Session,
        user: User,
        attempt_id: int,
    ) -> TestResultResponse:
        """Grade test, calculate metrics, update user_skills, and reveal answers & explanations."""
        attempt = (
            db.query(TestAttempt)
            .filter(TestAttempt.id == attempt_id, TestAttempt.user_id == user.id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Test attempt not found."
            )

        # If already completed, return existing graded results
        if attempt.status in ["completed", "expired"] and attempt.feedback_json:
            return self.get_attempt_results(db, user, attempt.id)

        now = datetime.now(timezone.utc)
        skill = attempt.skill

        # Fetch answers and linked questions
        answers = (
            db.query(AttemptAnswer)
            .filter(AttemptAnswer.attempt_id == attempt.id)
            .order_by(AttemptAnswer.question_order.asc())
            .all()
        )

        total_pts = 0.0
        earned_pts = 0.0

        difficulty_stats: Dict[str, Dict[str, float]] = {}  # "Level 1": {"total": 0, "correct": 0}
        subtopic_stats: Dict[str, Dict[str, float]] = {}

        question_reviews: List[QuestionReviewDetail] = []

        for a in answers:
            q: QuestionBank = a.question
            q_pts = DIFFICULTY_POINTS.get(q.difficulty, 2.0)
            total_pts += q_pts

            # Update question served count
            q.times_served += 1

            # Compare selected vs correct with multi-select partial credit
            user_selected = set(a.selected_answers_json or [])
            correct_set = set(q.correct_answers_json)

            if q.question_type == "multi_select" and len(correct_set) > 1:
                has_incorrect = bool(user_selected - correct_set)
                if has_incorrect or not user_selected:
                    a.points_awarded = 0.0
                    is_correct = False
                elif user_selected == correct_set:
                    a.points_awarded = q_pts
                    earned_pts += q_pts
                    q.times_correct += 1
                    is_correct = True
                else:
                    # Partial credit: fraction of correct options chosen with 0 false positives
                    fraction = len(user_selected & correct_set) / len(correct_set)
                    pts = round(q_pts * fraction, 2)
                    a.points_awarded = pts
                    earned_pts += pts
                    is_correct = False
            else:
                is_correct = user_selected == correct_set and bool(user_selected)
                if is_correct:
                    a.points_awarded = q_pts
                    earned_pts += q_pts
                    q.times_correct += 1
                else:
                    a.points_awarded = 0.0

            a.is_correct = is_correct

            # Difficulty tracking
            diff_label = f"Difficulty {q.difficulty}"
            if diff_label not in difficulty_stats:
                difficulty_stats[diff_label] = {"total": 0.0, "earned": 0.0}
            difficulty_stats[diff_label]["total"] += q_pts
            difficulty_stats[diff_label]["earned"] += a.points_awarded

            # Subtopic tracking
            sub_tag = q.subtopic_tag
            if sub_tag not in subtopic_stats:
                subtopic_stats[sub_tag] = {"total": 0.0, "earned": 0.0}
            subtopic_stats[sub_tag]["total"] += q_pts
            subtopic_stats[sub_tag]["earned"] += a.points_awarded

            # Client review detail
            client_opts = [
                ClientQuestionOption(id=opt["id"], text=opt["text"]) for opt in q.options_json
            ]
            question_reviews.append(
                QuestionReviewDetail(
                    question_order=a.question_order,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    code_snippet=q.code_snippet,
                    options=client_opts,
                    selected_answers=a.selected_answers_json or [],
                    correct_answers=q.correct_answers_json,
                    is_correct=is_correct,
                    points_awarded=a.points_awarded,
                    explanation=q.explanation,
                    difficulty=q.difficulty,
                    subtopic_tag=q.subtopic_tag,
                )
            )

        score_pct = round((earned_pts / total_pts * 100.0) if total_pts > 0 else 0.0, 1)
        passed = score_pct >= attempt.pass_mark

        # Hard question accuracy
        hard_earned = sum(
            difficulty_stats.get(f"Difficulty {d}", {}).get("earned", 0.0) for d in [4, 5]
        )
        hard_total = sum(
            difficulty_stats.get(f"Difficulty {d}", {}).get("total", 0.0) for d in [4, 5]
        )
        hard_accuracy = (hard_earned / hard_total) if hard_total > 0 else 0.0

        # Determine verified level
        verified_lvl: Optional[int] = None
        if passed:
            if score_pct >= 85.0 and hard_accuracy >= 0.60:
                verified_lvl = 4  # Expert
            elif score_pct >= 85.0:
                verified_lvl = 3  # Advanced
            elif score_pct >= 75.0:
                verified_lvl = 2  # Intermediate
            else:
                verified_lvl = 1  # Beginner (60.0% to 74.9%)
        else:
            verified_lvl = None

        # Compute accuracy maps
        acc_by_diff = {
            k: round((v["earned"] / v["total"] * 100.0) if v["total"] > 0 else 0.0, 1)
            for k, v in difficulty_stats.items()
        }
        acc_by_sub = {
            k: round((v["earned"] / v["total"] * 100.0) if v["total"] > 0 else 0.0, 1)
            for k, v in subtopic_stats.items()
        }

        # Identify strengths (accuracy >= 70%) & weaknesses (accuracy < 50%)
        strengths = [sub for sub, acc in acc_by_sub.items() if acc >= 70.0]
        weaknesses = [sub for sub, acc in acc_by_sub.items() if acc < 50.0]

        recommendations = []
        if passed:
            lvl_name = (
                LEVEL_NAMES.get(verified_lvl, "Verified")
                if verified_lvl is not None
                else "Verified"
            )
            recommendations.append(
                f"Congratulations! You have verified your proficiency in {skill.name} at {lvl_name} level."
            )
            if weaknesses:
                recommendations.append(
                    f"Focus on strengthening: {', '.join(weaknesses[:2])} to prepare for high-bar technical interviews."
                )
            recommendations.append(
                "This verified credential is now active on your ATS resume and career roadmap."
            )
        else:
            recommendations.append(
                f"Score was {score_pct}% (minimum pass mark is {attempt.pass_mark}%). Review the full question explanations below."
            )
            if weaknesses:
                recommendations.append(
                    f"Primary areas needing revision: {', '.join(weaknesses[:3])}."
                )
            recommendations.append(
                f"You may retake this assessment after the {COOLDOWN_DAYS}-day cooldown."
            )

        # Update test attempt record
        attempt.status = "completed"
        attempt.completed_at = now
        attempt.total_points = total_pts
        attempt.earned_points = earned_pts
        attempt.score_percentage = score_pct
        attempt.verified_level = verified_lvl
        attempt.feedback_json = {
            "score_percentage": score_pct,
            "passed": passed,
            "verified_level": verified_lvl,
            "accuracy_by_difficulty": acc_by_diff,
            "accuracy_by_subtopic": acc_by_sub,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
        }

        # Update UserSkill
        user_skill = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user.id, UserSkill.skill_id == skill.id)
            .first()
        )
        old_status = user_skill.status if user_skill else "claimed"
        old_level = user_skill.verified_level if user_skill else None

        if user_skill:
            if passed:
                user_skill.status = "verified"
                user_skill.verified_level = verified_lvl
            else:
                user_skill.status = "failed"
                user_skill.verified_level = None
            user_skill.last_tested_at = now

        # Add proficiency history entry
        history_entry = SkillProficiencyHistory(
            user_id=user.id,
            skill_id=skill.id,
            attempt_id=attempt.id,
            old_status=old_status,
            new_status="verified" if passed else "failed",
            old_level=old_level,
            new_level=verified_lvl,
            score_achieved=score_pct,
            changed_at=now,
        )
        db.add(history_entry)

        db.commit()
        db.refresh(attempt)

        return TestResultResponse(
            attempt_id=attempt.id,
            skill_id=skill.id,
            skill_name=skill.name,
            status=attempt.status,
            score_percentage=score_pct,
            total_points=total_pts,
            earned_points=earned_pts,
            passed=passed,
            verified_level=verified_lvl,
            verified_level_name=LEVEL_NAMES.get(verified_lvl) if verified_lvl else None,
            pass_mark=attempt.pass_mark,
            accuracy_by_difficulty=acc_by_diff,
            accuracy_by_subtopic=acc_by_sub,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            tab_switch_count=attempt.tab_switch_count,
            completed_at=attempt.completed_at,
            question_reviews=question_reviews,
        )

    def get_attempt_results(
        self,
        db: Session,
        user: User,
        attempt_id: int,
    ) -> TestResultResponse:
        """Fetch results and answer explanations for a completed test attempt."""
        attempt = (
            db.query(TestAttempt)
            .filter(TestAttempt.id == attempt_id, TestAttempt.user_id == user.id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Test attempt not found."
            )

        if attempt.status == "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Test attempt is currently in progress. Complete and submit the test to view results.",
            )

        feedback = attempt.feedback_json or {}
        passed = feedback.get("passed", (attempt.score_percentage or 0.0) >= attempt.pass_mark)

        answers = (
            db.query(AttemptAnswer)
            .filter(AttemptAnswer.attempt_id == attempt.id)
            .order_by(AttemptAnswer.question_order.asc())
            .all()
        )

        question_reviews: List[QuestionReviewDetail] = []
        for a in answers:
            q: QuestionBank = a.question
            client_opts = [
                ClientQuestionOption(id=opt["id"], text=opt["text"]) for opt in q.options_json
            ]
            question_reviews.append(
                QuestionReviewDetail(
                    question_order=a.question_order,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    code_snippet=q.code_snippet,
                    options=client_opts,
                    selected_answers=a.selected_answers_json or [],
                    correct_answers=q.correct_answers_json,
                    is_correct=bool(a.is_correct),
                    points_awarded=a.points_awarded,
                    explanation=q.explanation,
                    difficulty=q.difficulty,
                    subtopic_tag=q.subtopic_tag,
                )
            )

        return TestResultResponse(
            attempt_id=attempt.id,
            skill_id=attempt.skill_id,
            skill_name=attempt.skill.name,
            status=attempt.status,
            score_percentage=attempt.score_percentage or 0.0,
            total_points=attempt.total_points,
            earned_points=attempt.earned_points,
            passed=passed,
            verified_level=attempt.verified_level,
            verified_level_name=LEVEL_NAMES.get(attempt.verified_level)
            if attempt.verified_level
            else None,
            pass_mark=attempt.pass_mark,
            accuracy_by_difficulty=feedback.get("accuracy_by_difficulty", {}),
            accuracy_by_subtopic=feedback.get("accuracy_by_subtopic", {}),
            strengths=feedback.get("strengths", []),
            weaknesses=feedback.get("weaknesses", []),
            recommendations=feedback.get("recommendations", []),
            tab_switch_count=attempt.tab_switch_count,
            completed_at=attempt.completed_at,
            question_reviews=question_reviews,
        )


test_engine_service = TestEngineService()
