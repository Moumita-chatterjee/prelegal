from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class DocumentChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=60)
    documentType: str | None = None


class DocumentChatResponse(BaseModel):
    reply: str
    documentType: str | None
    fields: dict | None


class DocumentSaveRequest(BaseModel):
    documentType: str
    title: str | None = None
    messages: list[ChatMessage] = Field(default_factory=list, max_length=60)
    fields: dict = Field(default_factory=dict)


class DocumentSummaryResponse(BaseModel):
    id: int
    documentType: str = Field(validation_alias="document_type", serialization_alias="documentType")
    title: str | None
    updatedAt: datetime = Field(validation_alias="updated_at", serialization_alias="updatedAt")

    model_config = {"from_attributes": True, "populate_by_name": True}


class DocumentResponse(BaseModel):
    id: int
    documentType: str = Field(validation_alias="document_type", serialization_alias="documentType")
    title: str | None
    messages: list[ChatMessage]
    fields: dict
    updatedAt: datetime = Field(validation_alias="updated_at", serialization_alias="updatedAt")

    model_config = {"from_attributes": True, "populate_by_name": True}
