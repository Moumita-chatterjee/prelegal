from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Literal

FieldKind = Literal["text", "long_text", "date", "integer", "enum", "group"]


@dataclass
class EnumChoice:
    value: str
    label: str


@dataclass
class FieldDef:
    key: str
    label: str
    kind: FieldKind
    required: bool = True
    hint: str | None = None
    # Span variable names (as they appear inside <span class="*_link">...</span>,
    # possessive suffix stripped) that this field's resolved value substitutes
    # inline in the rendered document. A field with no link_names is never
    # substituted in the body — used for fields that only appear in the
    # synthesized Key Terms summary / appendix (e.g. dynamic role fields,
    # repeatable group items, whose values can't be inlined at a single spot).
    link_names: list[str] = field(default_factory=list)
    # Ask about this field in chat. False for fields stamped elsewhere (e.g. a
    # party's signature date, set by the signature step, never by chat).
    ask_in_chat: bool = True
    # Include this field's resolved value in the synthesized "Key Terms"
    # summary block rendered near the top of the document.
    summarize: bool = False
    # This is one of the document's (up to two) signing parties.
    is_party: bool = False

    # kind == "enum"
    choices: list[EnumChoice] | None = None

    # kind == "group"
    fields: list[FieldDef] | None = None
    repeat: bool = False
    appendix_title: str | None = None

    # Escape hatch for the handful of fields whose rendered text is a
    # composed phrase over sibling fields rather than a plain value (e.g.
    # NDA's "mndaTerm" + "mndaTermYears" -> "2 year(s) from the Effective
    # Date"). Called with this field's own group's values dict; return None
    # to fall back to the plain value.
    resolve: Callable[[dict[str, Any]], str | None] | None = None


PARTY_FIELDS: list[FieldDef] = [
    FieldDef(key="printName", label="Print Name", kind="text"),
    FieldDef(key="title", label="Title", kind="text"),
    FieldDef(key="company", label="Company", kind="text"),
    FieldDef(
        key="noticeAddress",
        label="Notice Address",
        kind="text",
        hint="An email or mailing address",
    ),
    FieldDef(key="date", label="Date", kind="text", required=False, ask_in_chat=False),
]


def party_field(key: str, label: str, link_names: list[str] | None = None) -> FieldDef:
    return FieldDef(
        key=key,
        label=label,
        kind="group",
        fields=PARTY_FIELDS,
        is_party=True,
        link_names=link_names or [label],
    )


@dataclass
class DocumentType:
    slug: str
    catalog_names: list[str]
    template_filename: str
    chat_intro: str
    fields: list[FieldDef]
    description: str = ""
    prompt_notes: str = ""


def _json_schema_for_field(f: FieldDef) -> dict:
    if f.kind in ("text", "long_text", "date"):
        return {"type": ["string", "null"]}
    if f.kind == "integer":
        return {"type": ["integer", "null"]}
    if f.kind == "enum":
        assert f.choices is not None
        return {"type": ["string", "null"], "enum": [c.value for c in f.choices] + [None]}
    if f.kind == "group":
        assert f.fields is not None
        item_schema = {
            "type": "object",
            "properties": {sub.key: _json_schema_for_field(sub) for sub in f.fields if sub.ask_in_chat},
            "required": [sub.key for sub in f.fields if sub.ask_in_chat],
            "additionalProperties": False,
        }
        if f.repeat:
            return {"type": ["array", "null"], "items": item_schema}
        return {"type": ["object", "null"], **{k: v for k, v in item_schema.items() if k != "type"}}
    raise ValueError(f"Unknown field kind: {f.kind}")


def build_response_schema(doctype: DocumentType) -> dict:
    chat_fields = [f for f in doctype.fields if f.ask_in_chat]
    return {
        "type": "object",
        "properties": {
            "reply": {"type": "string"},
            "fields": {
                "type": "object",
                "properties": {f.key: _json_schema_for_field(f) for f in chat_fields},
                "required": [f.key for f in chat_fields],
                "additionalProperties": False,
            },
        },
        "required": ["reply", "fields"],
        "additionalProperties": False,
    }


def _prompt_lines_for_field(f: FieldDef, indent: str) -> list[str]:
    if not f.ask_in_chat:
        return []
    lines: list[str] = []
    suffix = "" if f.required else " (optional, leave null if not known/applicable)"
    if f.kind == "enum":
        assert f.choices is not None
        choice_text = "; ".join(f'"{c.value}" = {c.label}' for c in f.choices)
        lines.append(f"{indent}- {f.key}: {f.label} — one of: {choice_text}{suffix}")
    elif f.kind == "group":
        assert f.fields is not None
        if f.repeat:
            lines.append(f"{indent}- {f.key}: a list of {f.label}. Ask how many there are and gather each one's:")
        else:
            lines.append(f"{indent}- {f.key} ({f.label}):")
        for sub in f.fields:
            lines.extend(_prompt_lines_for_field(sub, indent + "  "))
    else:
        hint = f" — {f.hint}" if f.hint else ""
        lines.append(f"{indent}- {f.key}: {f.label}{hint}{suffix}")
    return lines


def build_field_instructions(doctype: DocumentType) -> str:
    lines: list[str] = []
    for f in doctype.fields:
        lines.extend(_prompt_lines_for_field(f, ""))
    return "\n".join(lines)
