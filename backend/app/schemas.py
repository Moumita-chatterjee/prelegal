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


class NdaChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class NdaChatRequest(BaseModel):
    messages: list[NdaChatMessage] = Field(min_length=1, max_length=60)


class PartyFieldsUpdate(BaseModel):
    printName: str | None = None
    title: str | None = None
    company: str | None = None
    noticeAddress: str | None = None
    date: str | None = None


class NdaFieldsUpdate(BaseModel):
    purpose: str | None = None
    effectiveDate: str | None = None
    mndaTerm: Literal["fixed", "open"] | None = None
    mndaTermYears: int | None = None
    termOfConfidentiality: Literal["fixed", "open"] | None = None
    termOfConfidentialityYears: int | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    partyOne: PartyFieldsUpdate | None = None
    partyTwo: PartyFieldsUpdate | None = None


class NdaChatResponse(BaseModel):
    reply: str
    fields: NdaFieldsUpdate
