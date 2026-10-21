def build_question_repair_prompt(
    skill_name: str,
    original_output: str,
    validation_error: str,
) -> str:
    """Build repair prompt informing the model of schema violations in generated questions."""
    return f"""The previous assessment questions you generated for "{skill_name}" failed strict automated validation.

Validation Errors Encountered:
{validation_error}

Original Malformed Output:
```json
{original_output[:3000]}
```

Repair Instructions:
1. Fix all schema issues listed above.
2. Ensure every question has exactly 4 options labeled A, B, C, D.
3. Ensure single_choice and predict_output questions have exactly ONE correct answer in correct_answers.
4. Ensure difficulties are integers from 1 to 5 with approx 30% easy, 40% medium, 30% hard.
5. Return ONLY valid, complete JSON without markdown code fences or conversational text.
"""
