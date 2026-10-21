from typing import List, Optional


class AIServiceError(Exception):
    """Base exception for all AI simulation service errors."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AIRateLimitError(AIServiceError):
    """Raised when upstream AI provider rate limit is exceeded."""

    def __init__(
        self,
        message: str = "AI simulation service rate limit reached. Please retry in a few moments.",
    ):
        super().__init__(message, status_code=429)


class AISafetyBlockError(AIServiceError):
    """Raised when AI provider safety filters block generation."""

    def __init__(
        self,
        message: str = "Simulation content was flagged by AI safety filters. Please refine your profile text.",
    ):
        super().__init__(message, status_code=400)


class AITimeoutError(AIServiceError):
    """Raised when AI call times out."""

    def __init__(self, message: str = "AI simulation request timed out. Please try again."):
        super().__init__(message, status_code=504)


class AIValidationError(AIServiceError):
    """Raised when model output fails strict Pydantic schema validation after repair attempt."""

    def __init__(
        self,
        message: str = "AI output did not satisfy schema requirements.",
        errors: Optional[List[str]] = None,
    ):
        super().__init__(message, status_code=502)
        self.errors = errors or []


class AIProviderError(AIServiceError):
    """Generic error with the upstream AI provider."""

    def __init__(self, message: str = "Unexpected error communicating with AI provider."):
        super().__init__(message, status_code=502)
