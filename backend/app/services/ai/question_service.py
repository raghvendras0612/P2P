import json
import logging
import random
from typing import Any, Optional

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog import Skill
from app.models.testing import QuestionBank
from app.schemas.testing import GeneratedQuestionBatch
from app.services.ai.ai_service import clean_json_markdown
from app.services.ai.exceptions import (
    AIProviderError,
    AIValidationError,
)
from app.services.ai.prompts.question_prompt import (
    QUESTION_GENERATION_SYSTEM_PROMPT,
    QUESTION_PROMPT_VERSION,
    build_question_generation_prompt,
)
from app.services.ai.prompts.question_repair_prompt import build_question_repair_prompt

logger = logging.getLogger(__name__)


class QuestionService:
    def __init__(self, client: Optional[Any] = None, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client
        self.prompt_version = QUESTION_PROMPT_VERSION

    @property
    def client(self) -> Any:
        if self._client is None:
            from google import genai

            api_key = settings.GEMINI_API_KEY or "dummy_key_for_testing"
            self._client = genai.Client(api_key=api_key)
        return self._client

    def _call_gemini_raw(
        self, prompt: str, system_instruction: str = QUESTION_GENERATION_SYSTEM_PROMPT
    ) -> str:
        """Call Gemini API with configured model."""
        from google.genai import types

        max_retries = 3
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    response_mime_type="application/json",
                )
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )
                if not response or not response.text:
                    raise AIProviderError("Gemini returned an empty response.")
                return response.text
            except Exception as e:
                err_str = str(e).lower()
                if "rate limit" in err_str or "429" in err_str:
                    if attempt < max_retries - 1:
                        import time

                        time.sleep(backoff)
                        backoff *= 2.0
                        continue
                if attempt == max_retries - 1:
                    logger.error(f"Gemini API failure after {max_retries} attempts: {e}")
                    raise AIProviderError(f"Gemini API error: {e}") from e

        raise AIProviderError("Gemini call failed unexpectedly.")

    def generate_question_batch(
        self,
        skill_name: str,
        category: str,
        count: int = 30,
    ) -> GeneratedQuestionBatch:
        """Generate and validate a batch of diagnostic skill assessment questions."""
        prompt = build_question_generation_prompt(
            skill_name=skill_name,
            category=category,
            count=count,
        )

        raw_response = self._call_gemini_raw(prompt)
        cleaned_json = clean_json_markdown(raw_response)

        try:
            parsed = json.loads(cleaned_json)
            # Ensure questions array exists
            if isinstance(parsed, list):
                parsed = {"skill_name": skill_name, "questions": parsed}
            return GeneratedQuestionBatch.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as initial_err:
            logger.warning(
                f"Question batch validation failed on first attempt for {skill_name}: {initial_err}. Triggering repair retry."
            )
            repair_prompt = build_question_repair_prompt(
                skill_name=skill_name,
                original_output=cleaned_json,
                validation_error=str(initial_err),
            )
            raw_retry = self._call_gemini_raw(repair_prompt)
            retry_cleaned = clean_json_markdown(raw_retry)

            try:
                retry_parsed = json.loads(retry_cleaned)
                if isinstance(retry_parsed, list):
                    retry_parsed = {"skill_name": skill_name, "questions": retry_parsed}
                return GeneratedQuestionBatch.model_validate(retry_parsed)
            except Exception as retry_err:
                logger.error(
                    f"Repair retry failed for question batch generation {skill_name}: {retry_err}"
                )
                raise AIValidationError(
                    f"Question batch generation failed schema validation: {retry_err}"
                ) from retry_err

    def ensure_question_bank(
        self,
        db: Session,
        skill: Skill,
        min_count: int = 25,
    ) -> int:
        """Ensure the local question bank has at least min_count active questions for the skill."""
        existing_count = (
            db.query(QuestionBank)
            .filter(QuestionBank.skill_id == skill.id, QuestionBank.is_active.is_(True))
            .count()
        )

        if existing_count >= min_count:
            return existing_count

        # Need to generate more questions
        logger.info(
            f"Question bank for '{skill.name}' has {existing_count} questions (< {min_count}). Generating batch..."
        )
        try:
            batch = self.generate_question_batch(
                skill_name=skill.name,
                category=skill.category,
                count=30,
            )
        except (AIValidationError, Exception) as err:
            logger.error(f"Failed to populate question bank for {skill.name}: {err}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to generate valid question bank for '{skill.name}': {err}",
            ) from err

        # Store into database
        new_records = []
        for q in batch.questions:
            rec = QuestionBank(
                skill_id=skill.id,
                question_text=q.question_text.strip(),
                question_type=q.question_type,
                code_snippet=q.code_snippet.strip() if q.code_snippet else None,
                options_json=[opt.model_dump() for opt in q.options],
                correct_answers_json=q.correct_answers,
                explanation=q.explanation.strip(),
                difficulty=q.difficulty,
                subtopic_tag=q.subtopic_tag.strip(),
                times_served=0,
                times_correct=0,
                is_active=True,
            )
            new_records.append(rec)

        db.add_all(new_records)
        db.commit()

        total_count = (
            db.query(QuestionBank)
            .filter(QuestionBank.skill_id == skill.id, QuestionBank.is_active.is_(True))
            .count()
        )
        return total_count

    def sample_test_questions(
        self,
        db: Session,
        skill: Skill,
        target_count: int = 25,
    ) -> list[QuestionBank]:
        """Sample a balanced set of questions ordered strictly from easy to hard."""
        # Ensure questions exist in bank
        self.ensure_question_bank(db=db, skill=skill, min_count=target_count)

        easy_target = int(round(target_count * 0.30))  # 7-8
        hard_target = int(round(target_count * 0.30))  # 7-8
        med_target = target_count - (easy_target + hard_target)  # 9-10

        all_easy = (
            db.query(QuestionBank)
            .filter(
                QuestionBank.skill_id == skill.id,
                QuestionBank.is_active.is_(True),
                QuestionBank.difficulty.in_([1, 2]),
            )
            .all()
        )
        all_med = (
            db.query(QuestionBank)
            .filter(
                QuestionBank.skill_id == skill.id,
                QuestionBank.is_active.is_(True),
                QuestionBank.difficulty == 3,
            )
            .all()
        )
        all_hard = (
            db.query(QuestionBank)
            .filter(
                QuestionBank.skill_id == skill.id,
                QuestionBank.is_active.is_(True),
                QuestionBank.difficulty.in_([4, 5]),
            )
            .all()
        )

        sampled_easy = random.sample(all_easy, min(len(all_easy), easy_target))
        sampled_med = random.sample(all_med, min(len(all_med), med_target))
        sampled_hard = random.sample(all_hard, min(len(all_hard), hard_target))

        combined = sampled_easy + sampled_med + sampled_hard

        # If bank didn't have enough in specific buckets, backfill from remaining
        if len(combined) < target_count:
            chosen_ids = {q.id for q in combined}
            remaining = (
                db.query(QuestionBank)
                .filter(
                    QuestionBank.skill_id == skill.id,
                    QuestionBank.is_active.is_(True),
                    QuestionBank.id.notin_(chosen_ids),
                )
                .all()
            )
            needed = target_count - len(combined)
            combined.extend(random.sample(remaining, min(len(remaining), needed)))

        # Sort strictly by difficulty ascending so questions get progressively harder
        combined.sort(key=lambda q: (q.difficulty, q.id))
        return combined[:target_count]
