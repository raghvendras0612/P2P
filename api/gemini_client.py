import os
import json
import asyncio
from typing import Optional, Dict, Any
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
SAMPLE_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_outputs.json")

def load_sample_data() -> Dict[str, Any]:
    try:
        if os.path.exists(SAMPLE_DATA_PATH):
            with open(SAMPLE_DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading sample data: {e}")
    return {}

async def call_gemini_with_fallback(
    system_instruction: str,
    prompt: str,
    response_schema: Optional[Any] = None,
    timeout_seconds: float = 25.0
) -> Dict[str, Any]:
    """
    Calls Gemini API with 25s timeout and 1 retry.
    Returns parsed dictionary or throws exception.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options={"headers": {"User-Agent": "aistudio-build"}}
    )

    config_args: Dict[str, Any] = {
        "system_instruction": system_instruction,
        "temperature": 0.4,
        "response_mime_type": "application/json"
    }
    if response_schema:
        config_args["response_schema"] = response_schema

    config = types.GenerateContentConfig(**config_args)

    # 1 retry logic with timeout
    last_error: Optional[Exception] = None
    for attempt in range(2):
        try:
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=GEMINI_MODEL,
                        contents=prompt,
                        config=config
                    )
                ),
                timeout=timeout_seconds
            )
            raw_text = response.text or ""
            # Strip markdown if present
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            data = json.loads(cleaned)
            return data
        except Exception as e:
            last_error = e
            print(f"Gemini call attempt {attempt + 1} failed: {e}")
            await asyncio.sleep(1.0)

    raise last_error or Exception("Gemini request failed after retry")
