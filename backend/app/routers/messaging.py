from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Conversation, Job, Message, User
from app.schemas.schemas import ConversationOut, MessageCreate, MessageOut

router = APIRouter(prefix="/api/messaging", tags=["messaging"])


def _conversation_out(db: Session, conv: Conversation, viewer_id: int) -> ConversationOut:
    out = ConversationOut.model_validate(conv)
    out.candidate_name = conv.candidate.name if conv.candidate else ""
    out.employer_name = conv.employer.name if conv.employer else ""
    out.job_title = conv.job.title if conv.job else ""

    last = db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).limit(1)
    ).scalar_one_or_none()
    if last:
        out.last_message = last.body
        out.last_message_at = last.created_at

    unread = db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id == conv.id,
            Message.sender_id != viewer_id,
            Message.read == False,  # noqa: E712
        )
    ).scalar_one()
    out.unread = unread
    return out


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def start_conversation(
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate_id = payload.get("candidate_id")
    employer_id = payload.get("employer_id")
    job_id = payload.get("job_id")

    # Both sides may start; enforce that the caller is one of the parties.
    other = candidate_id or employer_id
    if not other or (user.id != candidate_id and user.id != employer_id):
        raise HTTPException(status_code=403, detail="You must be a participant")

    existing = db.execute(
        select(Conversation).where(
            Conversation.candidate_id == (user.id if user.id == candidate_id else candidate_id),
            Conversation.employer_id == (user.id if user.id == employer_id else employer_id),
        )
    ).scalar_one_or_none()
    if existing:
        return _conversation_out(db, existing, user.id)

    conv = Conversation(
        job_id=job_id,
        candidate_id=candidate_id,
        employer_id=employer_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return _conversation_out(db, conv, user.id)


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = (
        db.execute(
            select(Conversation)
            .where(or_(Conversation.candidate_id == user.id, Conversation.employer_id == user.id))
            .order_by(Conversation.updated_at.desc())
        )
        .scalars()
        .all()
    )
    return [_conversation_out(db, c, user.id) for c in convs]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user.id not in (conv.candidate_id, conv.employer_id):
        raise HTTPException(status_code=403, detail="Not a participant")

    messages = (
        db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        .scalars()
        .all()
    )

    # Mark as read
    for m in messages:
        if m.sender_id != user.id and not m.read:
            m.read = True
    if user.id == conv.candidate_id:
        conv.candidate_read_at = str(datetime.now(timezone.utc))
    else:
        conv.employer_read_at = str(datetime.now(timezone.utc))
    db.commit()
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user.id not in (conv.candidate_id, conv.employer_id):
        raise HTTPException(status_code=403, detail="Not a participant")

    msg = Message(conversation_id=conversation_id, sender_id=user.id, body=payload.body)
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return MessageOut.model_validate(msg)
