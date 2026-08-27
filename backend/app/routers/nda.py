import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.llm import get_nda_chat_reply
from app.models import User
from app.schemas import NdaChatRequest, NdaChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nda", tags=["nda"])


@router.post("/chat", response_model=NdaChatResponse)
def chat(payload: NdaChatRequest, current_user: User = Depends(get_current_user)) -> NdaChatResponse:
    try:
        reply, fields = get_nda_chat_reply(payload.messages)
    except Exception:
        logger.exception("NDA chat completion failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI assistant is temporarily unavailable. Please try again.",
        )

    return NdaChatResponse(reply=reply, fields=fields)
