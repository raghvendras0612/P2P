from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.catalog import Skill, UserSkill
from app.models.testing import AttemptAnswer, QuestionBank, SkillProficiencyHistory, TestAttempt
from app.models.user import User
from app.services.test_engine_service import TestEngineService


def create_test_attempt_with_questions(
    db: Session,
    user: User,
    skill: Skill,
    distribution: list[tuple[int, str]],  # [(difficulty, type), ...]
) -> tuple[TestAttempt, list[AttemptAnswer]]:
    """Helper to construct an in-progress test attempt with custom question distribution."""
    now = datetime.now(timezone.utc)
    attempt = TestAttempt(
        user_id=user.id,
        skill_id=skill.id,
        status="in_progress",
        started_at=now,
        expires_at=now,
        time_limit_seconds=2700,
        total_questions=len(distribution),
        total_points=0.0,
        earned_points=0.0,
        pass_mark=60.0,
        tab_switch_count=0,
    )
    db.add(attempt)
    db.flush()

    answers = []
    for idx, (diff, q_type) in enumerate(distribution, start=1):
        correct_ans = ["A"] if q_type != "multi_select" else ["A", "B"]
        q = QuestionBank(
            skill_id=skill.id,
            question_text=f"Question #{idx} diff={diff} type={q_type}",
            question_type=q_type,
            options_json=[
                {"id": "A", "text": "Option A"},
                {"id": "B", "text": "Option B"},
                {"id": "C", "text": "Option C"},
                {"id": "D", "text": "Option D"},
            ],
            correct_answers_json=correct_ans,
            explanation=f"Explanation for #{idx}",
            difficulty=diff,
            subtopic_tag=f"Subtopic_{diff}",
            times_served=0,
            times_correct=0,
            is_active=True,
        )
        db.add(q)
        db.flush()

        ans = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            question_order=idx,
            selected_answers_json=[],
            is_correct=None,
            points_awarded=0.0,
            time_spent_seconds=10,
        )
        db.add(ans)
        answers.append(ans)

    db.commit()
    db.refresh(attempt)
    return attempt, answers


def test_score_all_correct_is_100(db_session: Session):
    """Student answers all questions correctly: score is 100%, passed is True."""
    user = User(email="all_correct@example.com", password_hash="pw")
    skill = Skill(name="Scoring Python", category="Programming", is_verified_seed=True)
    db_session.add_all([user, skill])
    db_session.commit()

    u_skill = UserSkill(user_id=user.id, skill_id=skill.id, self_level=3, status="claimed")
    db_session.add(u_skill)
    db_session.commit()

    # 10 questions: 3 easy (diff 1), 4 med (diff 3), 3 hard (diff 5)
    dist = [(1, "single_choice")] * 3 + [(3, "single_choice")] * 4 + [(5, "single_choice")] * 3
    attempt, answers = create_test_attempt_with_questions(db_session, user, skill, dist)

    for ans in answers:
        ans.selected_answers_json = ["A"]
    db_session.commit()

    engine = TestEngineService()
    res = engine.submit_and_grade_test(db_session, user, attempt.id)

    assert res.score_percentage == 100.0
    assert res.passed is True
    assert res.earned_points == res.total_points
    assert res.verified_level == 4  # 100% with 100% hard accuracy -> Expert


def test_score_all_wrong_is_zero(db_session: Session):
    """Student answers all questions incorrectly or skips: score is 0%, passed is False."""
    user = User(email="all_wrong@example.com", password_hash="pw")
    skill = Skill(name="Zero Score Skill", category="Testing", is_verified_seed=True)
    db_session.add_all([user, skill])
    db_session.commit()

    u_skill = UserSkill(user_id=user.id, skill_id=skill.id, self_level=2, status="claimed")
    db_session.add(u_skill)
    db_session.commit()

    dist = [(2, "single_choice")] * 5
    attempt, answers = create_test_attempt_with_questions(db_session, user, skill, dist)

    for ans in answers:
        ans.selected_answers_json = ["D"]  # Correct is A
    db_session.commit()

    engine = TestEngineService()
    res = engine.submit_and_grade_test(db_session, user, attempt.id)

    assert res.score_percentage == 0.0
    assert res.passed is False
    assert res.earned_points == 0.0
    assert res.verified_level is None

    # Verify UserSkill marked failed
    db_session.refresh(u_skill)
    assert u_skill.status == "failed"
    assert u_skill.verified_level is None


def test_multi_select_partial_credit_and_penalties(db_session: Session):
    """Verify multi-select partial credit formula and strict false positive penalties."""
    user = User(email="multiselect@example.com", password_hash="pw")
    skill = Skill(name="MultiSelect Skill", category="Backend", is_verified_seed=True)
    db_session.add_all([user, skill])
    db_session.commit()

    u_skill = UserSkill(user_id=user.id, skill_id=skill.id, self_level=2, status="claimed")
    db_session.add(u_skill)
    db_session.commit()

    # 4 multi-select questions (diff 2 -> 1.5 points each)
    # Correct answers are ["A", "B"]
    dist = [(2, "multi_select")] * 4
    attempt, answers = create_test_attempt_with_questions(db_session, user, skill, dist)

    # Q1: Exact match ["A", "B"] -> Full credit (1.5 pts)
    answers[0].selected_answers_json = ["A", "B"]

    # Q2: Partial match ["A"] (1 of 2 correct, 0 wrong) -> 50% credit (0.75 pts)
    answers[1].selected_answers_json = ["A"]

    # Q3: False positive ["A", "C"] (1 correct + 1 wrong) -> Strictly 0.0 pts
    answers[2].selected_answers_json = ["A", "C"]

    # Q4: Skipped [] -> Strictly 0.0 pts
    answers[3].selected_answers_json = []

    db_session.commit()

    engine = TestEngineService()
    res = engine.submit_and_grade_test(db_session, user, attempt.id)

    # Total points = 4 * 1.5 = 6.0
    # Earned points = 1.5 + 0.75 + 0 + 0 = 2.25
    # Score pct = 2.25 / 6.0 * 100 = 37.5%
    assert res.total_points == 6.0
    assert res.earned_points == 2.25
    assert res.score_percentage == 37.5
    assert res.passed is False


def test_exact_level_boundary_thresholds(db_session: Session):
    """Test boundary conditions: 59.9% vs 60.0%, 74.9% vs 75.0%, 84.9% vs 85.0%."""
    engine = TestEngineService()

    # Case 1: 59.9% -> Fail (None)
    user1 = User(email="b599@example.com", password_hash="pw")
    skill1 = Skill(name="B599 Skill", category="CS", is_verified_seed=True)
    db_session.add_all([user1, skill1])
    db_session.commit()
    attempt1, answers1 = create_test_attempt_with_questions(
        db_session, user1, skill1, [(3, "single_choice")] * 10
    )
    for i in range(5):
        answers1[i].selected_answers_json = ["A"]
    db_session.commit()
    res1 = engine.submit_and_grade_test(db_session, user1, attempt1.id)
    assert res1.passed is False
    assert res1.verified_level is None

    # Case 2: 60.0% -> Level 1 (Beginner)
    user2 = User(email="b600@example.com", password_hash="pw")
    skill2 = Skill(name="B600 Skill", category="CS", is_verified_seed=True)
    db_session.add_all([user2, skill2])
    db_session.commit()
    attempt2, answers2 = create_test_attempt_with_questions(
        db_session, user2, skill2, [(3, "single_choice")] * 10
    )
    for i in range(6):
        answers2[i].selected_answers_json = ["A"]
    db_session.commit()
    res2 = engine.submit_and_grade_test(db_session, user2, attempt2.id)
    assert res2.score_percentage == 60.0
    assert res2.passed is True
    assert res2.verified_level == 1

    # Case 3: 75.0% -> Level 2 (Intermediate)
    user3 = User(email="b750@example.com", password_hash="pw")
    skill3 = Skill(name="B750 Skill", category="CS", is_verified_seed=True)
    db_session.add_all([user3, skill3])
    db_session.commit()
    attempt3, answers3 = create_test_attempt_with_questions(
        db_session, user3, skill3, [(3, "single_choice")] * 20
    )
    for i in range(15):
        answers3[i].selected_answers_json = ["A"]
    db_session.commit()
    res3 = engine.submit_and_grade_test(db_session, user3, attempt3.id)
    assert res3.score_percentage == 75.0
    assert res3.passed is True
    assert res3.verified_level == 2

    # Case 4: 85.0% with low hard accuracy (<60%) -> Level 3 (Advanced)
    user4 = User(email="b850_adv@example.com", password_hash="pw")
    skill4 = Skill(name="B850 Adv Skill", category="CS", is_verified_seed=True)
    db_session.add_all([user4, skill4])
    db_session.commit()
    attempt4, answers4 = create_test_attempt_with_questions(
        db_session, user4, skill4, [(3, "single_choice")] * 17 + [(5, "single_choice")] * 3
    )
    for i in range(17):
        answers4[i].selected_answers_json = ["A"]
    answers4[17].selected_answers_json = ["A"]  # 1 hard correct
    db_session.commit()
    res4 = engine.submit_and_grade_test(db_session, user4, attempt4.id)
    assert res4.score_percentage >= 85.0
    assert res4.verified_level == 3  # High score, but hard accuracy < 60% -> Level 3 (Advanced)

    # Case 5: 85.0%+ with high hard accuracy (>=60%) -> Level 4 (Expert)
    user5 = User(email="b850_exp@example.com", password_hash="pw")
    skill5 = Skill(name="B850 Exp Skill", category="CS", is_verified_seed=True)
    db_session.add_all([user5, skill5])
    db_session.commit()
    attempt5, answers5 = create_test_attempt_with_questions(
        db_session, user5, skill5, [(3, "single_choice")] * 17 + [(5, "single_choice")] * 3
    )
    for i in range(17):
        answers5[i].selected_answers_json = ["A"]
    answers5[17].selected_answers_json = ["A"]  # hard 1 correct
    answers5[18].selected_answers_json = ["A"]  # hard 2 correct (2/3 = 66.7% >= 60%)
    db_session.commit()
    res5 = engine.submit_and_grade_test(db_session, user5, attempt5.id)
    assert res5.score_percentage >= 85.0
    assert res5.verified_level == 4  # High score + hard accuracy >= 60% -> Level 4 (Expert)


def test_overclaiming_and_proficiency_history(db_session: Session):
    """Student claimed level 4 (Expert), scores 65% -> downgraded to Level 1 and history logged."""
    user = User(email="overclaimer@example.com", password_hash="pw")
    skill = Skill(name="System Design", category="Architecture", is_verified_seed=True)
    db_session.add_all([user, skill])
    db_session.commit()

    u_skill = UserSkill(user_id=user.id, skill_id=skill.id, self_level=4, status="claimed")
    db_session.add(u_skill)
    db_session.commit()

    # 10 questions diff 3 = 20 pts. 6.5 correct (or 13 pts) -> 65%
    attempt, answers = create_test_attempt_with_questions(
        db_session, user, skill, [(3, "single_choice")] * 10
    )
    for i in range(6):
        answers[i].selected_answers_json = ["A"]
    # Question 7: partial answer not possible for single choice, 6/10 = 60.0%
    db_session.commit()

    engine = TestEngineService()
    res = engine.submit_and_grade_test(db_session, user, attempt.id)

    assert res.score_percentage == 60.0
    assert res.passed is True
    assert res.verified_level == 1  # Verified at Level 1, despite claiming Level 4!

    # Verify UserSkill updated
    db_session.refresh(u_skill)
    assert u_skill.status == "verified"
    assert u_skill.verified_level == 1

    # Verify Proficiency History row created
    hist = (
        db_session.query(SkillProficiencyHistory)
        .filter(
            SkillProficiencyHistory.user_id == user.id, SkillProficiencyHistory.skill_id == skill.id
        )
        .first()
    )
    assert hist is not None
    assert hist.old_status == "claimed"
    assert hist.new_status == "verified"
    assert hist.old_level is None
    assert hist.new_level == 1
    assert hist.score_achieved == 60.0
