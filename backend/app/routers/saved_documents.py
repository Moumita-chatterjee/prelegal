from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.documents.registry import REGISTRY
from app.models import Document, User
from app.schemas import DocumentResponse, DocumentSaveRequest, DocumentSummaryResponse

router = APIRouter(prefix="/api/documents", tags=["saved-documents"])


def _get_owned_document(document_id: int, current_user: User, db: Session) -> Document:
    document = (
        db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Document:
    if payload.documentType not in REGISTRY:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unknown documentType")

    document = Document(
        user_id=current_user.id,
        document_type=payload.documentType,
        title=payload.title,
        messages=[message.model_dump() for message in payload.messages],
        fields=payload.fields,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentSummaryResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.updated_at.desc())
        .all()
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Document:
    return _get_owned_document(document_id, current_user, db)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    payload: DocumentSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Document:
    if payload.documentType not in REGISTRY:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unknown documentType")

    document = _get_owned_document(document_id, current_user, db)
    document.document_type = payload.documentType
    document.title = payload.title
    document.messages = [message.model_dump() for message in payload.messages]
    document.fields = payload.fields
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    document = _get_owned_document(document_id, current_user, db)
    db.delete(document)
    db.commit()
