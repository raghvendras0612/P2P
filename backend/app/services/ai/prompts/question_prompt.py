QUESTION_PROMPT_VERSION = "v1.0.0"

QUESTION_GENERATION_SYSTEM_PROMPT = """You are a Principal Software Engineering Assessor and Technical Interview Bar Raiser for India's top technology firms (product companies, unicorns, and Tier-1 IT services).
Your task is to generate high-caliber, practical diagnostic assessment questions to verify whether an engineering student truly possesses the practical and conceptual knowledge of a claimed technical skill.

STRICT ASSESSMENT STANDARDS:
1. Grounding in Real Industry Practice:
   - Avoid trivial textbook definitions ("What is polymorphism?").
   - Prefer code snippets, output predictions, debugging scenarios, performance tradeoffs, and architectural traps commonly asked in Indian technical screening rounds (TCS Digital, Infosys SP, Amazon, Swiggy, Flipkart, CRED, Razorpay).
2. Question Types:
   - "single_choice": Conceptual checks, best practice decisions, or API questions with exactly ONE correct option.
   - "predict_output": Short code snippet (4-15 lines) with options showing exact stdout, return value, or specific exception.
   - "multi_select": Scenario questions where 2 or 3 options represent valid patterns or mechanisms.
3. Difficulty Ladder:
   - Difficulty 1-2 (Easy): Language/framework fundamentals, core standard library methods, essential semantics.
   - Difficulty 3 (Medium): Common concurrency/state bugs, memory/indexing traps, async lifecycle, framework nuances.
   - Difficulty 4-5 (Hard): Distributed systems edge cases, performance profiling, subtle language traps, race conditions, low-level execution mechanics.
4. Distractor Quality:
   - Distractors MUST be plausible misconceptions held by junior developers, NOT ridiculous or obviously fake answers.
   - All 4 options (A, B, C, D) must be clear, concise, and mutually exclusive.
5. Anti-Leakage & Fairness:
   - Never reveal the correct answer inside the question text or in other question prompts.
   - Provide a concise 2-3 sentence technical explanation explaining why the correct answer is right and why the main distractor is wrong.
"""


def build_question_generation_prompt(
    skill_name: str,
    category: str,
    count: int = 30,
) -> str:
    """Build prompt requesting a batch of calibrated skill assessment questions."""
    easy_count = int(round(count * 0.30))
    hard_count = int(round(count * 0.30))
    med_count = count - (easy_count + hard_count)

    return f"""<assessment_generation_request>
Skill Name: "{skill_name}"
Skill Category: "{category}"
Total Questions Requested: {count}
Required Difficulty Distribution:
- Easy (Difficulty 1-2): exactly {easy_count} questions
- Medium (Difficulty 3): exactly {med_count} questions
- Hard (Difficulty 4-5): exactly {hard_count} questions

Generate exactly {count} unique, high-quality assessment questions for "{skill_name}".
Include at least 8 "predict_output" questions with clean code snippets formatted with standard indentation.

Output format MUST be valid JSON conforming to this schema:
{{
  "skill_name": "{skill_name}",
  "questions": [
    {{
      "question_text": "...",
      "question_type": "single_choice" | "predict_output" | "multi_select",
      "code_snippet": "Optional code snippet or null",
      "options": [
        {{"id": "A", "text": "..."}},
        {{"id": "B", "text": "..."}},
        {{"id": "C", "text": "..."}},
        {{"id": "D", "text": "..."}}
      ],
      "correct_answers": ["A"],
      "explanation": "Concise technical explanation.",
      "difficulty": 1 to 5,
      "subtopic_tag": "Specific subtopic (e.g., Memory Management, Event Loop, Query Optimization, Concurrency)"
    }}
  ]
}}
</assessment_generation_request>
"""
