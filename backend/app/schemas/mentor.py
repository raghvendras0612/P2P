from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class CreateThreadRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=150, description="Optional custom thread title")
    career_path_id: Optional[int] = Field(None, description="Optional career path ID to associate")


class ThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    career_path_id: Optional[int] = None
    career_path_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_id: int
    role: Literal["user", "assistant", "system"]
    content: str
    proposed_actions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str = Field(
        ..., min_length=1, max_length=1000, description="User question or prompt (max 1000 chars)"
    )


class ProposedAction(BaseModel):
    type: Literal["add_task", "add_project"]
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=500)


class ConfirmActionRequest(BaseModel):
    type: Literal["add_task", "add_project"]
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    career_path_slug: Optional[str] = Field(None, max_length=100)
