from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.mentor import (
    ConfirmActionRequest,
    CreateThreadRequest,
    MessageResponse,
    SendMessageRequest,
    ThreadResponse,
)
from app.services.ai.mentor_service import MentorService

router = APIRouter(prefix="/mentor", tags=["AI Mentor Chat"])
mentor_service = MentorService()


@router.get("/threads", response_model=List[ThreadResponse])
def list_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all mentor chat threads for the current student."""
    return mentor_service.list_threads(db, current_user.id)


@router.post("/threads", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    req: CreateThreadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new mentor conversation thread."""
    return mentor_service.create_thread(db, current_user.id, req)


@router.get("/threads/{thread_id}", response_model=ThreadResponse)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get metadata for a specific thread."""
    thread = mentor_service.get_thread(db, current_user.id, thread_id)
    msg_count = len(thread.messages)
    last_msg = thread.messages[-1] if thread.messages else None
    preview = (
        last_msg.content[:80] + "..."
        if last_msg and len(last_msg.content) > 80
        else (last_msg.content if last_msg else None)
    )

    return ThreadResponse(
        id=thread.id,
        user_id=thread.user_id,
        title=thread.title,
        career_path_id=thread.career_path_id,
        career_path_name=thread.career_path.name if thread.career_path else None,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        message_count=msg_count,
        last_message_preview=preview,
    )


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a mentor thread and its messages."""
    mentor_service.delete_thread(db, current_user.id, thread_id)
    return None


@router.get("/threads/{thread_id}/messages", response_model=List[MessageResponse])
def get_thread_messages(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all messages in a thread in chronological order."""
    return mentor_service.get_messages(db, current_user.id, thread_id)


@router.post("/threads/{thread_id}/messages")
@limiter.limit("30/minute")
def send_thread_message(
    request: Request,
    thread_id: int,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI Mentor and stream the reply via Server-Sent Events (SSE).
    Returns a text/event-stream with token, action, done, and error events.
    """
    # Verify thread access first
    mentor_service.get_thread(db, current_user.id, thread_id)

    stream_generator = mentor_service.stream_reply(
        db=db,
        user=current_user,
        thread_id=thread_id,
        user_message=payload.content,
    )

    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/actions/confirm", response_model=Dict[str, Any])
def confirm_proposed_action(
    req: ConfirmActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Explicitly confirm and execute an AI Mentor proposed action.
    Adds the proposed task or project to the student's progress items.
    Never modifies data silently.
    """
    return mentor_service.confirm_action(db, current_user.id, req)
