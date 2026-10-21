import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.simulation import (
    SimulationComparisonSummary,
    SimulationOutput,
)
from app.services.ai.exceptions import (
    AIProviderError,
    AIRateLimitError,
    AISafetyBlockError,
    AITimeoutError,
    AIValidationError,
)
from app.services.ai.prompts import PROMPT_VERSION
from app.services.ai.prompts.builder import build_simulation_input_prompt
from app.services.ai.prompts.repair_prompt import build_repair_prompt
from app.services.ai.prompts.system_prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def clean_json_markdown(text: str) -> str:
    """Clean markdown code fences and extraneous whitespace from raw LLM output."""
    cleaned = text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    return cleaned


class AIService:
    def __init__(self, client: Optional[Any] = None, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client
        self.prompt_version = PROMPT_VERSION

    @property
    def client(self) -> Any:
        if self._client is None:
            from google import genai

            api_key = settings.GEMINI_API_KEY or "dummy_key_for_testing"
            self._client = genai.Client(api_key=api_key)
        return self._client

    def _call_gemini_raw(
        self, prompt: str, system_instruction: str = SYSTEM_PROMPT, timeout_seconds: int = 60
    ) -> str:
        """Call Gemini API with timeout and exponential backoff retry for transient errors."""
        from google.genai import types

        max_retries = 3
        backoff = 1.0

        for attempt in range(max_retries):
            try:
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    system_instruction=system_instruction,
                    temperature=0.3,
                )

                start_time = time.time()
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config,
                )
                elapsed = time.time() - start_time
                if elapsed > timeout_seconds:
                    raise AITimeoutError(f"AI response exceeded timeout of {timeout_seconds}s")

                if not response or not response.text:
                    raise AIProviderError("Empty response received from AI model.")

                return response.text

            except Exception as e:
                err_str = str(e).lower()
                # Check for rate limiting / 429
                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                    if attempt < max_retries - 1:
                        time.sleep(backoff)
                        backoff *= 2
                        continue
                    raise AIRateLimitError("Gemini API rate limit exceeded.") from e

                # Check for safety blocks
                if "safety" in err_str or "blocked" in err_str or "harm" in err_str:
                    raise AISafetyBlockError("Generation blocked by AI safety policy.") from e

                # Check for timeout / deadline
                if "timeout" in err_str or "deadline" in err_str:
                    if attempt < max_retries - 1:
                        time.sleep(backoff)
                        backoff *= 2
                        continue
                    raise AITimeoutError("AI call timed out.") from e

                # Generic retry for other connection errors
                if attempt < max_retries - 1 and (
                    "connection" in err_str or "network" in err_str or "503" in err_str
                ):
                    time.sleep(backoff)
                    backoff *= 2
                    continue

                raise AIProviderError(f"AI generation failed: {str(e)}") from e

        raise AIProviderError("Max retries exceeded calling Gemini.")

    def simulate_career_paths(
        self,
        student_snapshot: Dict[str, Any],
        mode: str = "auto",
        custom_slugs: Optional[List[str]] = None,
    ) -> SimulationOutput:
        """Generate 3 realistic career paths with strict validation and 2-stage repair retry."""
        user_prompt = build_simulation_input_prompt(
            student_snapshot, mode=mode, custom_slugs=custom_slugs
        )

        # Stage 1: Initial Generation
        raw_text = self._call_gemini_raw(user_prompt)
        clean_text = clean_json_markdown(raw_text)

        errors: List[str] = []
        try:
            output = SimulationOutput.model_validate_json(clean_text)
            return output
        except (ValidationError, ValueError, json.JSONDecodeError) as err:
            logger.warning(
                f"Initial AI simulation output failed schema validation: {err}. Initiating repair retry."
            )
            if isinstance(err, ValidationError):
                errors = [f"{e['loc']}: {e['msg']}" for e in err.errors()]
            else:
                errors = [str(err)]

        # Stage 2: Automatic Repair Retry
        repair_prompt = build_repair_prompt(clean_text, errors)
        repaired_raw = self._call_gemini_raw(repair_prompt)
        repaired_clean = clean_json_markdown(repaired_raw)

        try:
            repaired_output = SimulationOutput.model_validate_json(repaired_clean)
            return repaired_output
        except (ValidationError, ValueError, json.JSONDecodeError) as final_err:
            logger.error(f"Repaired simulation output still failed validation: {final_err}")
            final_errors = []
            if isinstance(final_err, ValidationError):
                final_errors = [f"{e['loc']}: {e['msg']}" for e in final_err.errors()]
            else:
                final_errors = [str(final_err)]
            raise AIValidationError(
                "AI output did not satisfy strict schema requirements after repair.",
                errors=final_errors,
            ) from final_err


def compute_simulation_comparison(
    baseline_output: SimulationOutput,
    new_output: SimulationOutput,
) -> SimulationComparisonSummary:
    """Compute fit-score changes, closed skill gaps, and new gaps between baseline and new simulation."""
    old_paths_map = {p.path_slug: p for p in baseline_output.paths}
    new_paths_map = {p.path_slug: p for p in new_output.paths}

    fit_score_changes: Dict[str, int] = {}
    closed_gaps: List[str] = []
    new_gaps: List[str] = []

    for slug, new_p in new_paths_map.items():
        if slug in old_paths_map:
            old_p = old_paths_map[slug]
            delta = new_p.fit_score - old_p.fit_score
            fit_score_changes[slug] = delta

            old_gaps_map = {g.skill.lower(): g for g in old_p.skill_gaps}
            new_gaps_map = {g.skill.lower(): g for g in new_p.skill_gaps}

            for skill_name, new_g in new_gaps_map.items():
                if skill_name in old_gaps_map:
                    old_g = old_gaps_map[skill_name]
                    # If current level improved or gap narrowed
                    if new_g.current_level > old_g.current_level:
                        closed_gaps.append(
                            f"{new_g.skill} (+{new_g.current_level - old_g.current_level} in {new_p.title})"
                        )
                else:
                    new_gaps.append(f"{new_g.skill} ({new_p.title})")

    # De-duplicate
    closed_gaps = sorted(list(set(closed_gaps)))
    new_gaps = sorted(list(set(new_gaps)))

    summary_parts = []
    if fit_score_changes:
        changes_str = ", ".join(
            f"{slug}: {'+' if d > 0 else ''}{d}" for slug, d in fit_score_changes.items()
        )
        summary_parts.append(f"Fit score changes: {changes_str}.")
    if closed_gaps:
        summary_parts.append(f"Closed/improved skill gaps: {', '.join(closed_gaps[:5])}.")
    if new_gaps:
        summary_parts.append(f"Newly surfaced skill gaps: {', '.join(new_gaps[:5])}.")

    summary_text = (
        " ".join(summary_parts)
        if summary_parts
        else "Simulations show consistent alignment with minimal score variance."
    )

    return SimulationComparisonSummary(
        fit_score_changes=fit_score_changes,
        closed_gaps=closed_gaps,
        new_gaps=new_gaps,
        summary_text=summary_text,
    )
