import copy
import json
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.catalog import Skill
from app.schemas.testing import GeneratedQuestion, GeneratedQuestionBatch
from app.services.ai.question_service import QuestionService
from tests.test_question_service import create_mock_question_batch


def test_generated_question_valid():
    """Verify that a compliant question passes validation."""
    valid_q = {
        "question_text": "What does GIL stand for in Python?",
        "question_type": "single_choice",
        "options": [
            {"id": "A", "text": "Global Interpreter Lock"},
            {"id": "B", "text": "General Interface Language"},
            {"id": "C", "text": "Garbage Iteration Loop"},
            {"id": "D", "text": "Generic Index List"},
        ],
        "correct_answers": ["A"],
        "explanation": "GIL is the Global Interpreter Lock in CPython.",
        "difficulty": 2,
        "subtopic_tag": "Concurrency",
    }
    q = GeneratedQuestion.model_validate(valid_q)
    assert q.question_text == valid_q["question_text"]
    assert q.correct_answers == ["A"]


def test_reject_single_choice_with_multiple_or_zero_correct():
    """Single choice must have strictly 1 correct answer."""
    base_q = {
        "question_text": "Which data structure is FIFO?",
        "question_type": "single_choice",
        "options": [
            {"id": "A", "text": "Queue"},
            {"id": "B", "text": "Stack"},
            {"id": "C", "text": "Tree"},
            {"id": "D", "text": "Graph"},
        ],
        "explanation": "Queues operate on First-In-First-Out.",
        "difficulty": 1,
        "subtopic_tag": "Data Structures",
    }
    # 0 answers: fails min_length=1 validation
    q_zero = copy.deepcopy(base_q)
    q_zero["correct_answers"] = []
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestion.model_validate(q_zero)
    assert "List should have at least 1 item" in str(exc.value)

    # 2 answers: fails model_validator strictly 1 correct option
    q_two = copy.deepcopy(base_q)
    q_two["correct_answers"] = ["A", "B"]
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestion.model_validate(q_two)
    assert "strictly 1 correct option" in str(exc.value)


def test_reject_multi_select_with_fewer_than_two_answers():
    """Multi-select must have at least 2 correct answers."""
    q_data = {
        "question_text": "Which of the following are mutable types in Python?",
        "question_type": "multi_select",
        "options": [
            {"id": "A", "text": "List"},
            {"id": "B", "text": "Tuple"},
            {"id": "C", "text": "Dictionary"},
            {"id": "D", "text": "String"},
        ],
        "correct_answers": ["A"],  # Only 1 answer provided
        "explanation": "Lists and dicts are mutable.",
        "difficulty": 2,
        "subtopic_tag": "Core Types",
    }
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestion.model_validate(q_data)
    assert "at least 2 correct options" in str(exc.value)


def test_reject_correct_answer_missing_from_options():
    """Correct answer ID must exist in options."""
    q_data = {
        "question_text": "What is 2 + 2 in elementary mathematics?",
        "question_type": "single_choice",
        "options": [
            {"id": "A", "text": "3"},
            {"id": "B", "text": "4"},
            {"id": "C", "text": "5"},
            {"id": "D", "text": "6"},
        ],
        "correct_answers": ["Z"],  # 'Z' is not in options A, B, C, D
        "explanation": "2 + 2 = 4.",
        "difficulty": 1,
        "subtopic_tag": "Math",
    }
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestion.model_validate(q_data)
    assert "Correct answer 'Z' must be one of A, B, C, D" in str(exc.value)


def test_reject_answer_leaked_in_question_text():
    """Question text must not give away the correct answer."""
    leaked_texts = [
        "What is the output? The correct answer is A because of hoisting.",
        "Choose option B for this query.",
        "Answer: C is the right answer to this question.",
    ]
    for text in leaked_texts:
        q_data = {
            "question_text": text,
            "question_type": "single_choice",
            "options": [
                {"id": "A", "text": "Option 1"},
                {"id": "B", "text": "Option 2"},
                {"id": "C", "text": "Option 3"},
                {"id": "D", "text": "Option 4"},
            ],
            "correct_answers": ["A"],
            "explanation": "Explanation here.",
            "difficulty": 2,
            "subtopic_tag": "General",
        }
        with pytest.raises(ValidationError) as exc:
            GeneratedQuestion.model_validate(q_data)
        assert "Answer leakage detected in question text" in str(exc.value)


def test_reject_invalid_difficulty():
    """Difficulty must be between 1 and 5."""
    q_data = {
        "question_text": "What is recursion in computer science?",
        "question_type": "single_choice",
        "options": [
            {"id": "A", "text": "A function that calls itself"},
            {"id": "B", "text": "A loop"},
            {"id": "C", "text": "A compiler"},
            {"id": "D", "text": "A linker"},
        ],
        "correct_answers": ["A"],
        "explanation": "Recursion definition.",
        "difficulty": 6,  # Invalid
        "subtopic_tag": "Algorithms",
    }
    with pytest.raises(ValidationError):
        GeneratedQuestion.model_validate(q_data)


def test_reject_batch_under_20_or_over_30():
    """Batch must have 20 to 30 questions."""
    raw_15 = create_mock_question_batch("Python", count=15)
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestionBatch.model_validate(raw_15)
    assert "at least 20 items" in str(exc.value)

    raw_35 = create_mock_question_batch("Python", count=35)
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestionBatch.model_validate(raw_35)
    assert "at most 30 items" in str(exc.value)


def test_reject_batch_with_duplicate_questions():
    """Batch must reject duplicate questions."""
    raw = create_mock_question_batch("Python", count=25)
    # Duplicate question 0 into question 1
    raw["questions"][1]["question_text"] = raw["questions"][0]["question_text"]
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestionBatch.model_validate(raw)
    assert "Duplicate or near-duplicate question detected" in str(exc.value)


def test_reject_batch_with_skewed_difficulty_distribution():
    """Batch must enforce ~30% easy, ~40% med, ~30% hard."""
    raw = create_mock_question_batch("Python", count=25)
    # Set all questions to difficulty 1 (100% easy, 0% hard)
    for q in raw["questions"]:
        q["difficulty"] = 1
    with pytest.raises(ValidationError) as exc:
        GeneratedQuestionBatch.model_validate(raw)
    assert "Invalid difficulty distribution" in str(exc.value)


def test_question_service_caching_and_ordering(db_session: Session):
    """Verify bank caching: second call reuses bank and never calls Gemini again."""
    skill = Skill(name="Docker Diagnostic", category="DevOps", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    mock_client = MagicMock()
    mock_batch = create_mock_question_batch(skill.name, count=30)
    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_batch)
    mock_client.models.generate_content.return_value = mock_response

    service = QuestionService(client=mock_client)

    # 1. First call populates 30 questions
    count1 = service.ensure_question_bank(db_session, skill=skill, min_count=25)
    assert count1 >= 25
    assert mock_client.models.generate_content.call_count == 1

    # 2. Second call reuses existing bank without calling AI
    count2 = service.ensure_question_bank(db_session, skill=skill, min_count=25)
    assert count2 == count1
    assert mock_client.models.generate_content.call_count == 1  # Still 1!

    # 3. Sample questions and verify ascending difficulty ordering
    sampled = service.sample_test_questions(db_session, skill=skill, target_count=25)
    assert len(sampled) == 25
    diffs = [q.difficulty for q in sampled]
    assert diffs == sorted(diffs)
    assert diffs[0] in (1, 2)
    assert diffs[-1] in (4, 5)


def test_question_service_double_failure_clean_error(db_session: Session):
    """Verify double failure in AI generation raises clean HTTPException 502."""
    skill = Skill(name="Broken AI Skill", category="Testing", is_verified_seed=True)
    db_session.add(skill)
    db_session.commit()

    mock_client = MagicMock()
    resp_invalid = MagicMock()
    resp_invalid.text = "NOT JSON TEXT AT ALL"
    mock_client.models.generate_content.return_value = resp_invalid

    service = QuestionService(client=mock_client)

    with pytest.raises(HTTPException) as exc:
        service.ensure_question_bank(db_session, skill=skill, min_count=25)
    assert exc.value.status_code == 502
    assert "Failed to generate valid question bank" in exc.value.detail
