import datetime
import json
import re
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.rag_service import RAGService
from app.database.metadata_db import SessionLocal, ChatSession, ChatMessage

router = APIRouter()
rag_service = None

def get_rag_service() -> RAGService:
    global rag_service
    if rag_service is None:
        rag_service = RAGService()
    return rag_service

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"  # 'en' or 'ta'

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    session_id: Optional[str]
    confidence: float


class SessionSummary(BaseModel):
    session_id: str
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    message_count: int


class HistoryMessage(BaseModel):
    role: str
    content: str
    language: Optional[str] = None
    sources: List[str] = Field(default_factory=list)
    created_at: datetime.datetime


class SessionHistoryResponse(BaseModel):
    session_id: str
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: List[HistoryMessage]


def _normalize_title(message: str, max_length: int = 100) -> str:
    title = " ".join((message or "").split())
    if not title:
        return "New Conversation"
    return title[:max_length]


def _normalize_language(language: Optional[str]) -> str:
    if language and language.lower().startswith("ta"):
        return "ta"
    return "en"


def _serialize_sources(sources: Optional[List[str]]) -> str:
    if not sources:
        return "[]"
    return json.dumps([str(item) for item in sources])


def _deserialize_sources(raw_sources: Optional[str]) -> List[str]:
    if not raw_sources:
        return []
    try:
        parsed = json.loads(raw_sources)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except Exception:
        pass
    return []


def _is_pdf_name(value: str) -> bool:
    text = (value or "").strip()
    if not text:
        return False
    return bool(re.search(r"(^|[\\/])[^\\/\s]+\.pdf($|[?#\s])", text, flags=re.IGNORECASE))


def _sanitize_sources(
    raw_sources: Optional[List[str]],
    max_items: int = 5,
    max_chars: int = 220,
) -> List[str]:
    if not raw_sources:
        return []

    cleaned = []
    seen = set()

    for item in raw_sources:
        value = " ".join(str(item).split()).strip()
        if not value or _is_pdf_name(value):
            continue
        signature = value.lower()
        if signature in seen:
            continue
        seen.add(signature)
        if len(value) > max_chars:
            value = f"{value[: max_chars - 3]}..."
        cleaned.append(value)
        if len(cleaned) >= max_items:
            break

    return cleaned


def _should_hide_sources(answer_text: str) -> bool:
    text = (answer_text or "").lower()
    return (
        "llm quota is exceeded" in text
        or "gemini quota is exceeded" in text
        or "quota currently exceeded" in text
        or "ai generation is currently unavailable" in text
        or "api key is invalid or unauthorized" in text
        or "missing api key" in text
        or "unauthorized" in text
        or "billing/quota" in text
    )


def _get_or_create_session(db, requested_session_id: Optional[str], first_message: str) -> ChatSession:
    normalized_id = (requested_session_id or "").strip() or None
    session = None

    if normalized_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.session_id == normalized_id)
            .first()
        )

    if session is None:
        session = ChatSession(
            session_id=str(uuid4()),
            title=_normalize_title(first_message),
        )
        db.add(session)
        db.flush()

    return session


def _store_message(
    db,
    session: ChatSession,
    role: str,
    content: str,
    language: Optional[str] = None,
    sources: Optional[List[str]] = None,
):
    db.add(
        ChatMessage(
            chat_session_id=session.id,
            role=role,
            content=content,
            language=language,
            sources=_serialize_sources(sources),
        )
    )


def _run_and_store_reply(request: ChatRequest) -> Dict[str, Any]:
    service = get_rag_service()
    db = SessionLocal()

    try:
        session = _get_or_create_session(db, request.session_id, request.message)
        normalized_language = _normalize_language(request.language)

        _store_message(
            db=db,
            session=session,
            role="user",
            content=request.message,
            language=normalized_language,
        )

        result = service.get_answer(request.message, language=normalized_language)
        answer = str(result.get("answer", ""))
        sources = _sanitize_sources([str(item) for item in (result.get("sources", []) or [])])
        if _should_hide_sources(answer):
            sources = []

        _store_message(
            db=db,
            session=session,
            role="assistant",
            content=answer,
            language=normalized_language,
            sources=sources,
        )

        session.updated_at = datetime.datetime.utcnow()
        db.commit()

        return {
            "answer": answer,
            "sources": sources,
            "session_id": session.session_id,
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.post("/query", response_model=ChatResponse)
async def chat_query(request: ChatRequest):
    """Main chat endpoint"""
    try:
        result = _run_and_store_reply(request)
        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            session_id=result.get("session_id"),
            confidence=0.9  # Can be calculated based on relevance
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tamil-query")
async def tamil_query(request: ChatRequest):
    """Special endpoint for Tamil queries"""
    try:
        request.language = "ta"
        result = _run_and_store_reply(request)
        return {
            "answer": result["answer"],
            "language": "tamil",
            "sources": result.get("sources", []),
            "session_id": result.get("session_id"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(limit: int = 20):
    """List recent chat sessions."""
    db = SessionLocal()
    try:
        safe_limit = max(1, min(limit, 100))
        sessions = (
            db.query(ChatSession)
            .order_by(ChatSession.updated_at.desc())
            .limit(safe_limit)
            .all()
        )

        result = []
        for session in sessions:
            message_count = (
                db.query(ChatMessage)
                .filter(ChatMessage.chat_session_id == session.id)
                .count()
            )
            result.append(
                SessionSummary(
                    session_id=session.session_id,
                    title=session.title or "New Conversation",
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    message_count=message_count,
                )
            )
        return result
    finally:
        db.close()


@router.get("/history/{session_id}", response_model=SessionHistoryResponse)
async def get_session_history(session_id: str):
    """Get full message history for one chat session."""
    db = SessionLocal()
    try:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.session_id == session_id)
            .first()
        )
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.chat_session_id == session.id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

        return SessionHistoryResponse(
            session_id=session.session_id,
            title=session.title or "New Conversation",
            created_at=session.created_at,
            updated_at=session.updated_at,
            messages=[
                HistoryMessage(
                    role=message.role,
                    content=message.content,
                    language=message.language,
                    sources=_sanitize_sources(_deserialize_sources(message.sources)),
                    created_at=message.created_at,
                )
                for message in messages
            ],
        )
    finally:
        db.close()


@router.get("/legal-topics")
async def get_legal_topics():
    """Get list of available legal topics"""
    topics = [
        "Criminal Law",
        "Civil Law",
        "Property Law",
        "Family Law",
        "Labour Law",
        "Taxation",
        "Constitutional Law",
        "முறையான சட்டம்",
        "குடும்ப சட்டம்",
        "சொத்து சட்டம்"
    ]
    return {"topics": topics}
