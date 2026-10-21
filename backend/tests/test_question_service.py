import json
from unittest.mock import MagicMock

from sqlalchemy.orm import Session

from app.models.catalog import Skill
from app.models.testing import QuestionBank
from app.services.ai.question_service import QuestionService


def create_mock_question_batch(skill_name: str, count: int = 30) -> dict:
    questions = []
    for i in range(count):
        # 30% easy (1-2), 40% med (3), 30% hard (4-5)
        if i < 9:
            diff = 1 if i % 2 == 0 else 2
        elif i < 21:
            diff = 3
        else:
            diff = 4 if i % 2 == 0 else 5

        questions.append(
            {
                "question_text": f"What is the expected behavior of code snippet #{i} in {skill_name}?",
                "question_type": "single_choice" if i % 3 != 0 else "predict_output",
                "code_snippet": f"print('test {i}')" if i % 3 == 0 else None,
                "options": [
                    {"id": "A", "text": f"Correct option for #{i}"},
                    {"id": "B", "text": f"Distractor B for #{i}"},
                    {"id": "C", "text": f"Distractor C for #{i}"},
                    {"id": "D", "text": f"Distractor D for #{i}"},
                ],
                "correct_answers": ["A"],
                "explanation": f"Explanation demonstrating why A is correct for question #{i}.",
                "difficulty": diff,
                "subtopic_tag": "Core Syntax" if i % 2 == 0 else "Runtime Architecture",
            }
        )
    return {"skill_name": skill_name, "questions": questions}


def test_question_service_generate_and_sample(db_session: Session):
    # Setup test skill
    skill = Skill(
        name="Python Diagnostic Test", category="Programming Languages", is_verified_seed=True
    )
    db_session.add(skill)
    db_session.commit()

    # Mock Gemini client
    mock_client = MagicMock()
    mock_batch = create_mock_question_batch(skill.name, 30)
    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_batch)
    mock_client.models.generate_content.return_value = mock_response

    service = QuestionService(client=mock_client)

    # 1. Ensure question bank populates
    total = service.ensure_question_bank(db=db_session, skill=skill, min_count=25)
    assert total >= 25
    assert mock_client.models.generate_content.call_count == 1

    # Check database rows
    rows = db_session.query(QuestionBank).filter(QuestionBank.skill_id == skill.id).all()
    assert len(rows) == 30
    assert all(r.is_active for r in rows)

    # 2. Sample 25 test questions
    sampled = service.sample_test_questions(db=db_session, skill=skill, target_count=25)
    assert len(sampled) == 25

    # Check difficulty ordering (ascending: 1 -> 5)
    difficulties = [q.difficulty for q in sampled]
    assert difficulties == sorted(difficulties)
    assert min(difficulties) in (1, 2)
    assert max(difficulties) in (4, 5)


def test_question_service_repair_retry(db_session: Session):
    skill = Skill(name="FastAPI Diagnostic Test", category="Backend", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    # First call returns invalid schema (missing options), second returns valid
    mock_client = MagicMock()

    resp_invalid = MagicMock()
    resp_invalid.text = json.dumps(
        {"skill_name": "FastAPI Diagnostic Test", "questions": [{"invalid": "data"}]}
    )

    resp_valid = MagicMock()
    mock_batch = create_mock_question_batch(skill.name, 30)
    resp_valid.text = json.dumps(mock_batch)

    mock_client.models.generate_content.side_effect = [resp_invalid, resp_valid]

    service = QuestionService(client=mock_client)
    batch = service.generate_question_batch(skill.name, skill.category, count=30)
    assert len(batch.questions) == 30
    assert mock_client.models.generate_content.call_count == 2
