from typing import List


def build_repair_prompt(invalid_json_text: str, validation_errors: List[str]) -> str:
    """Build a targeted repair prompt instructing Gemini to fix validation errors."""
    errors_list = "\n".join(f"- {err}" for err in validation_errors)
    return f"""The previous JSON output failed strict schema validation with the following error(s):

{errors_list}

PREVIOUS OUTPUT RECEIVED:
```json
{invalid_json_text}
```

INSTRUCTIONS TO REPAIR:
1. Fix ALL the validation errors listed above while preserving the valid parts.
2. Ensure there are EXACTLY 3 distinct career paths with valid catalog slugs.
3. Ensure every path has 6 to 10 skill gaps (current and required levels 0-5).
4. Ensure every path has 3 to 5 projects.
5. Ensure every path's first_month_plan has strictly 4 weeks (numbered 1 to 4).
6. Ensure fit scores are differentiated (not all identical).
7. Return ONLY the corrected, raw valid JSON matching the schema with no markdown code fences or conversational text.
"""
