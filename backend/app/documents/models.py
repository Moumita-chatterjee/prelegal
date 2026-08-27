from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import BaseModel, create_model

from app.documents.fields import DocumentType, FieldDef
from app.documents.registry import REGISTRY


def _annotation_for_field(f: FieldDef):
    if f.kind in ("text", "long_text", "date"):
        return str | None
    if f.kind == "integer":
        return int | None
    if f.kind == "enum":
        assert f.choices is not None
        values = tuple(c.value for c in f.choices)
        return Literal[values] | None  # type: ignore[valid-type]
    if f.kind == "group":
        assert f.fields is not None
        sub_model = _build_model(f.key, f.fields)
        if f.repeat:
            return list[sub_model] | None  # type: ignore[valid-type]
        return sub_model | None
    raise ValueError(f"Unknown field kind: {f.kind}")


def _build_model(name: str, fields: list[FieldDef]) -> type[BaseModel]:
    chat_fields = [f for f in fields if f.ask_in_chat]
    kwargs = {f.key: (_annotation_for_field(f), None) for f in chat_fields}
    model = create_model(f"{name[:1].upper()}{name[1:]}Model", **kwargs)
    model.model_config["extra"] = "forbid"
    return model


@lru_cache(maxsize=None)
def fields_model_for(slug: str) -> type[BaseModel]:
    doctype: DocumentType = REGISTRY[slug]
    return _build_model(f"{slug}_fields", doctype.fields)
