from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.mentor import ChatThread
from app.models.progress import ProgressItem
from app.models.user import User
from app.routers.mentor import mentor_service
from tests.test_auth import get_sample_registration_payload


class MockStreamChunk:
    def __init__(self, text: str):
        self.text = text


@pytest.fixture
def auth_context(client: TestClient, db_session: Session):
    payload = get_sample_registration_payload("test_mentor_student@example.com")
    reg_res = client.post("/api/v1/auth/register", json=payload)
    token = reg_res.json()["access_token"]
    user_id = reg_res.json()["user"]["id"]
    user = db_session.query(User).filter(User.id == user_id).first()
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def test_mentor_thread_lifecycle(client: TestClient, auth_context: tuple, db_session: Session):
    """Test creating, listing, fetching, and deleting mentor threads."""
    test_user, auth_headers = auth_context

    # 1. Create a thread
    resp = client.post(
        "/api/v1/mentor/threads",
        headers=auth_headers,
        json={"title": "DSA and System Design Prep"},
    )
    assert resp.status_code == 201
    data = resp.json()
    thread_id = data["id"]
    assert data["title"] == "DSA and System Design Prep"
    assert data["user_id"] == test_user.id
    assert data["message_count"] == 0

    # 2. List threads
    resp_list = client.get("/api/v1/mentor/threads", headers=auth_headers)
    assert resp_list.status_code == 200
    threads = resp_list.json()
    assert len(threads) >= 1
    assert any(t["id"] == thread_id for t in threads)

    # 3. Get thread details
    resp_detail = client.get(f"/api/v1/mentor/threads/{thread_id}", headers=auth_headers)
    assert resp_detail.status_code == 200
    assert resp_detail.json()["id"] == thread_id

    # 4. Delete thread
    resp_del = client.delete(f"/api/v1/mentor/threads/{thread_id}", headers=auth_headers)
    assert resp_del.status_code == 204

    # 5. Verify thread deleted
    resp_check = client.get(f"/api/v1/mentor/threads/{thread_id}", headers=auth_headers)
    assert resp_check.status_code == 404


def test_mentor_cross_tenant_isolation(
    client: TestClient, auth_context: tuple, db_session: Session
):
    """Verify that User B cannot view, delete, or send messages to User A's thread."""
    _, auth_headers = auth_context

    # Create another user in DB
    other_user = User(
        email="other_student_phase5@example.com",
        password_hash="fakehash",
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    # Create thread owned by other_user
    other_thread = ChatThread(
        user_id=other_user.id,
        title="Other Student's Private Chat",
    )
    db_session.add(other_thread)
    db_session.commit()
    db_session.refresh(other_thread)

    # User A tries to view User B's thread -> 404
    resp = client.get(f"/api/v1/mentor/threads/{other_thread.id}", headers=auth_headers)
    assert resp.status_code == 404

    # User A tries to get messages from User B's thread -> 404
    resp_msgs = client.get(
        f"/api/v1/mentor/threads/{other_thread.id}/messages", headers=auth_headers
    )
    assert resp_msgs.status_code == 404

    # User A tries to delete User B's thread -> 404
    resp_del = client.delete(f"/api/v1/mentor/threads/{other_thread.id}", headers=auth_headers)
    assert resp_del.status_code == 404

    # User A tries to send message to User B's thread -> 404
    resp_send = client.post(
        f"/api/v1/mentor/threads/{other_thread.id}/messages",
        headers=auth_headers,
        json={"content": "Hacking into your thread"},
    )
    assert resp_send.status_code == 404


def test_mentor_streaming_reply_with_actions(
    client: TestClient, auth_context: tuple, db_session: Session
):
    """Test full SSE streaming flow including token deltas, action proposal parsing, and DB persistence."""
    _, auth_headers = auth_context

    # 1. Create a thread
    resp = client.post(
        "/api/v1/mentor/threads",
        headers=auth_headers,
        json={"title": "Weekly Roadmap Planning"},
    )
    assert resp.status_code == 201
    thread_id = resp.json()["id"]

    # 2. Mock Gemini generate_content_stream
    mock_chunks = [
        MockStreamChunk("Hello! As a 3rd year engineering student, "),
        MockStreamChunk("focusing on your core skill gaps is crucial for campus drives.\n\n"),
        MockStreamChunk("Here is a high-priority action you should complete this week:\n"),
        MockStreamChunk(
            '[PROPOSED_ACTION: {"type": "add_task", "title": "Implement Redis Cache for Auth", "description": "Reduce token verification latency by caching JWT sessions."}]\n\n'
        ),
        MockStreamChunk("Let me know once you make progress!"),
    ]

    mock_instance = MagicMock()
    mock_instance.models.generate_content_stream.return_value = iter(mock_chunks)
    mentor_service._client = mock_instance

    resp_stream = client.post(
        f"/api/v1/mentor/threads/{thread_id}/messages",
        headers=auth_headers,
        json={"content": "What should I focus on this week for placement preparation?"},
    )
    assert resp_stream.status_code == 200
    assert "text/event-stream" in resp_stream.headers["content-type"]

    body = resp_stream.text
    # Verify SSE structure
    assert "event: token" in body
    assert "event: action" in body
    assert "event: done" in body
    assert "Implement Redis Cache for Auth" in body

    # 3. Check messages persisted in DB
    resp_msgs = client.get(f"/api/v1/mentor/threads/{thread_id}/messages", headers=auth_headers)
    assert resp_msgs.status_code == 200
    msgs = resp_msgs.json()
    assert len(msgs) == 2  # user message and assistant message
    user_m = msgs[0]
    asst_m = msgs[1]

    assert user_m["role"] == "user"
    assert user_m["content"] == "What should I focus on this week for placement preparation?"

    assert asst_m["role"] == "assistant"
    assert "focusing on your core skill gaps" in asst_m["content"]
    assert asst_m["proposed_actions"] is not None
    assert len(asst_m["proposed_actions"]) == 1
    assert asst_m["proposed_actions"][0]["title"] == "Implement Redis Cache for Auth"
    assert asst_m["proposed_actions"][0]["type"] == "add_task"


def test_mentor_confirm_action_creates_progress_item(
    client: TestClient, auth_context: tuple, db_session: Session
):
    """Test confirming a proposed action adds it to progress items without silent mutation."""
    test_user, auth_headers = auth_context

    resp = client.post(
        "/api/v1/mentor/actions/confirm",
        headers=auth_headers,
        json={
            "type": "add_task",
            "title": "Solve 15 Tree and Graph LeetCode Problems",
            "description": "Essential for clearing Tier-1 OA rounds",
            "career_path_slug": "full-stack-developer",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "created"
    assert "Successfully added" in data["message"]

    # Verify item exists in database
    item = (
        db_session.query(ProgressItem)
        .filter(
            ProgressItem.user_id == test_user.id,
            ProgressItem.item_ref == "Solve 15 Tree and Graph LeetCode Problems",
        )
        .first()
    )
    assert item is not None
    assert item.item_type == "milestone_checkpoint"
    assert item.status == "not_started"

    # Confirming again is idempotent
    resp_again = client.post(
        "/api/v1/mentor/actions/confirm",
        headers=auth_headers,
        json={
            "type": "add_task",
            "title": "Solve 15 Tree and Graph LeetCode Problems",
            "career_path_slug": "full-stack-developer",
        },
    )
    assert resp_again.status_code == 200
    assert resp_again.json()["status"] == "already_exists"


def test_mentor_streaming_error_handling(
    client: TestClient, auth_context: tuple, db_session: Session
):
    """Test that model exceptions during streaming yield a clean event: error rather than crashing."""
    _, auth_headers = auth_context

    resp_thread = client.post(
        "/api/v1/mentor/threads",
        headers=auth_headers,
        json={"title": "Error Handling Test"},
    )
    thread_id = resp_thread.json()["id"]

    mock_instance = MagicMock()
    mock_instance.models.generate_content_stream.side_effect = Exception(
        "ResourceExhausted: 429 Rate limit exceeded"
    )
    mentor_service._client = mock_instance

    resp_stream = client.post(
        f"/api/v1/mentor/threads/{thread_id}/messages",
        headers=auth_headers,
        json={"content": "Tell me about microservices"},
    )
    assert resp_stream.status_code == 200
    body = resp_stream.text
    assert "event: error" in body
    assert "AI mentor is currently experiencing high placement demand" in body
