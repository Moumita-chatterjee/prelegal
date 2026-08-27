import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.documents.llm import get_classification_reply, get_document_chat_reply
from app.documents.registry import REGISTRY
from app.models import User
from app.schemas import DocumentChatRequest, DocumentChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/chat", response_model=DocumentChatResponse)
def chat(payload: DocumentChatRequest, current_user: User = Depends(get_current_user)) -> DocumentChatResponse:
    if payload.documentType is not None and payload.documentType not in REGISTRY:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unknown documentType")

    try:
        if payload.documentType is None:
            reply, resolved_slug = get_classification_reply(payload.messages)
            if resolved_slug is None:
                return DocumentChatResponse(reply=reply, documentType=None, fields=None)
            # Chain straight into field-gathering using the same message history, so
            # the user's first message (which likely already contains real field
            # info) isn't thrown away on the turn where the document type resolves.
            reply, fields = get_document_chat_reply(resolved_slug, payload.messages)
            return DocumentChatResponse(reply=reply, documentType=resolved_slug, fields=fields)

        reply, fields = get_document_chat_reply(payload.documentType, payload.messages)
        return DocumentChatResponse(reply=reply, documentType=payload.documentType, fields=fields)
    except Exception:
        logger.exception("Document chat completion failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI assistant is temporarily unavailable. Please try again.",
        )
