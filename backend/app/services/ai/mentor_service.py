import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.catalog import UserSelectedPath
from app.models.mentor import ChatMessage, ChatThread
from app.models.progress import ProgressItem
from app.models.user import User
from app.schemas.mentor import (
    ConfirmActionRequest,
    CreateThreadRequest,
    MessageResponse,
    ThreadResponse,
)
from app.services.ai.prompts.mentor_prompt import MENTOR_SYSTEM_PROMPT
from app.services.mentor_context_service import MentorContextService

logger = logging.getLogger(__name__)


def extract_proposed_actions(text: str) -> List[Dict[str, Any]]:
    """Extract [PROPOSED_ACTION: {...}] blocks from text."""
    actions: List[Dict[str, Any]] = []
    # Pattern to match [PROPOSED_ACTION: {...}]
    matches = re.finditer(r"\[PROPOSED_ACTION:\s*(\{.*?\})\s*\]", text, re.DOTALL)
    for m in matches:
        raw_json = m.group(1).strip()
        try:
            parsed = json.loads(raw_json)
            if isinstance(parsed, dict) and "type" in parsed and "title" in parsed:
                actions.append(
                    {
                        "type": parsed.get("type", "add_task"),
                        "title": str(parsed.get("title", ""))[:200],
                        "description": str(parsed.get("description", ""))[:500]
                        if parsed.get("description")
                        else None,
                    }
                )
        except Exception:
            logger.debug(f"Failed to parse proposed action JSON: {raw_json}")
    return actions


class MentorService:
    def __init__(self, client: Optional[Any] = None, model_name: Optional[str] = None):
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client
        self.context_service = MentorContextService()

    @property
    def client(self) -> Any:
        if self._client is None:
            from google import genai

            api_key = settings.GEMINI_API_KEY or "dummy_key_for_testing"
            self._client = genai.Client(api_key=api_key)
        return self._client

    # -------------------------------------------------------------
    # Thread Operations
    # -------------------------------------------------------------
    def list_threads(self, db: Session, user_id: int) -> List[ThreadResponse]:
        """List all conversation threads for the user, ordered by last update."""
        threads = (
            db.query(ChatThread)
            .filter(ChatThread.user_id == user_id)
            .order_by(ChatThread.updated_at.desc())
            .all()
        )

        res: List[ThreadResponse] = []
        for t in threads:
            msg_count = db.query(ChatMessage).filter(ChatMessage.thread_id == t.id).count()
            last_msg = (
                db.query(ChatMessage)
                .filter(ChatMessage.thread_id == t.id)
                .order_by(ChatMessage.created_at.desc())
                .first()
            )
            preview = (
                last_msg.content[:80] + "..."
                if last_msg and len(last_msg.content) > 80
                else (last_msg.content if last_msg else None)
            )

            res.append(
                ThreadResponse(
                    id=t.id,
                    user_id=t.user_id,
                    title=t.title,
                    career_path_id=t.career_path_id,
                    career_path_name=t.career_path.name if t.career_path else None,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                    message_count=msg_count,
                    last_message_preview=preview,
                )
            )
        return res

    def create_thread(self, db: Session, user_id: int, req: CreateThreadRequest) -> ThreadResponse:
        """Create a new mentor conversation thread."""
        title = req.title.strip() if req.title and req.title.strip() else "New Conversation"

        # If career_path_id is not supplied, auto-link active path if present
        career_path_id = req.career_path_id
        if not career_path_id:
            active_sel = (
                db.query(UserSelectedPath)
                .filter(UserSelectedPath.user_id == user_id, UserSelectedPath.is_active.is_(True))
                .first()
            )
            if active_sel:
                career_path_id = active_sel.career_path_id

        thread = ChatThread(
            user_id=user_id,
            title=title,
            career_path_id=career_path_id,
        )
        db.add(thread)
        db.commit()
        db.refresh(thread)

        return ThreadResponse(
            id=thread.id,
            user_id=thread.user_id,
            title=thread.title,
            career_path_id=thread.career_path_id,
            career_path_name=thread.career_path.name if thread.career_path else None,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            message_count=0,
            last_message_preview=None,
        )

    def get_thread(self, db: Session, user_id: int, thread_id: int) -> ChatThread:
        """Fetch a specific thread with tenant authorization."""
        thread = (
            db.query(ChatThread)
            .filter(ChatThread.id == thread_id, ChatThread.user_id == user_id)
            .first()
        )
        if not thread:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation thread {thread_id} not found.",
            )
        return thread

    def delete_thread(self, db: Session, user_id: int, thread_id: int) -> None:
        """Delete a thread and its messages."""
        thread = self.get_thread(db, user_id, thread_id)
        db.delete(thread)
        db.commit()

    def get_messages(self, db: Session, user_id: int, thread_id: int) -> List[MessageResponse]:
        """Fetch all messages in a thread in chronological order."""
        self.get_thread(db, user_id, thread_id)
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        return [MessageResponse.model_validate(m) for m in messages]

    # -------------------------------------------------------------
    # Action Confirmation
    # -------------------------------------------------------------
    def confirm_action(
        self, db: Session, user_id: int, req: ConfirmActionRequest
    ) -> Dict[str, Any]:
        """
        Executes a user-confirmed mentor proposal without silent mutation.
        Adds the proposed task or project to the student's progress items.
        """
        # Determine slug
        slug = req.career_path_slug
        if not slug:
            active_sel = (
                db.query(UserSelectedPath)
                .filter(UserSelectedPath.user_id == user_id, UserSelectedPath.is_active.is_(True))
                .first()
            )
            slug = (
                active_sel.career_path.slug if active_sel and active_sel.career_path else "general"
            )

        item_type = "project" if req.type == "add_project" else "milestone_checkpoint"
        # Check if item already exists
        existing = (
            db.query(ProgressItem)
            .filter(
                ProgressItem.user_id == user_id,
                ProgressItem.career_path_slug == slug,
                ProgressItem.item_type == item_type,
                ProgressItem.item_ref == req.title,
            )
            .first()
        )

        if existing:
            return {
                "status": "already_exists",
                "message": f"'{req.title}' is already in your progress tracking.",
                "item_id": existing.id,
            }

        new_item = ProgressItem(
            user_id=user_id,
            career_path_slug=slug,
            item_type=item_type,
            item_ref=req.title,
            status="not_started",
            notes=req.description,
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return {
            "status": "created",
            "message": f"Successfully added '{req.title}' to your {item_type.replace('_', ' ')} list.",
            "item_id": new_item.id,
        }

    # -------------------------------------------------------------
    # Streaming Reply Generator
    # -------------------------------------------------------------
    async def stream_reply(
        self,
        db: Session,
        user: User,
        thread_id: int,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Async generator yielding SSE data chunks.
        Saves user query, builds context, calls Gemini streaming,
        extracts proposed actions, persists assistant message, and signals completion.
        """
        # Verify thread access
        thread = self.get_thread(db, user.id, thread_id)

        # 1. Persist user message
        user_msg = ChatMessage(
            thread_id=thread.id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        # Update thread timestamp and title if first user message
        msg_count = db.query(ChatMessage).filter(ChatMessage.thread_id == thread.id).count()
        if msg_count <= 1 and thread.title == "New Conversation":
            # Set title from first few words of message
            words = user_message.strip().split()
            thread.title = " ".join(words[:6])[:150]
        thread.updated_at = datetime.now(timezone.utc)
        db.commit()

        # 2. Assemble student context
        context_snapshot = self.context_service.assemble_context(db, user)

        # 3. Retrieve conversation history (up to last 6 messages)
        recent_messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.thread_id == thread.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(6)
            .all()
        )
        recent_messages.reverse()

        history_lines = []
        for m in recent_messages[:-1]:  # exclude the one we just added
            role_label = "Student" if m.role == "user" else "Mentor"
            # Strip XML characters from history
            clean_m = re.sub(r"[<>]", "", m.content).strip()
            history_lines.append(f"{role_label}: {clean_m}")

        history_str = "\n".join(history_lines) if history_lines else "No previous messages."

        # Build full prompt
        clean_query = re.sub(r"[<>]", "", user_message).strip()
        full_prompt = (
            f"{context_snapshot}\n\n"
            f"RECENT CONVERSATION HISTORY:\n"
            f"{history_str}\n\n"
            f"<user_query>\n"
            f"{clean_query}\n"
            f"</user_query>\n\n"
            f"Provide your mentoring guidance adhering strictly to your persona and guidelines."
        )

        full_response_text = ""

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                system_instruction=MENTOR_SYSTEM_PROMPT,
                temperature=0.7,
            )

            # Call streaming API
            response_stream = self.client.models.generate_content_stream(
                model=self.model_name,
                contents=full_prompt,
                config=config,
            )

            for chunk in response_stream:
                token_text = chunk.text or ""
                if token_text:
                    full_response_text += token_text
                    data = json.dumps({"token": token_text})
                    yield f"event: token\ndata: {data}\n\n"

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Error streaming response from Gemini: {err_msg}", exc_info=True)
            if "ResourceExhausted" in err_msg or "429" in err_msg:
                user_err = "The AI mentor is currently experiencing high placement demand. Please wait a moment and try again."
            else:
                user_err = "Encountered a temporary error connecting to the AI mentor. Please try your question again."
            data = json.dumps({"error": user_err})
            yield f"event: error\ndata: {data}\n\n"
            return

        # 4. Extract any proposed actions
        actions = extract_proposed_actions(full_response_text)
        if actions:
            action_data = json.dumps({"actions": actions})
            yield f"event: action\ndata: {action_data}\n\n"

        # 5. Persist assistant message in DB
        asst_msg = ChatMessage(
            thread_id=thread.id,
            role="assistant",
            content=full_response_text,
            proposed_actions=actions if actions else None,
        )
        db.add(asst_msg)
        db.commit()
        db.refresh(asst_msg)

        # 6. Signal completion
        done_data = json.dumps(
            {
                "message_id": asst_msg.id,
                "actions": actions,
            }
        )
        yield f"event: done\ndata: {done_data}\n\n"
