import json

import litellm

from app.config import settings
from app.documents.fields import build_field_instructions, build_response_schema
from app.documents.models import fields_model_for
from app.documents.registry import ALL_DOCUMENT_TYPES, REGISTRY
from app.schemas import ChatMessage

MODEL = "openrouter/openai/gpt-oss-120b"

MAX_ATTEMPTS = 3
MAX_REPLY_CHARS = 1000

_DOCUMENT_PROMPT_TEMPLATE = """You are a friendly assistant helping a user fill out a Common Paper {doc_name} \
through natural conversation, a couple of related questions at a time rather than one huge list.

Gather the following, asking about whatever is still missing:
{field_instructions}

{prompt_notes}Do NOT ask about signatures or a party's signing date — those are collected separately \
outside this chat, after the rest of the fields are filled in.

Once every required field above is known, tell the user their document is ready to review and sign below.

Always respond with the structured fields you were given. "reply" is your next conversational message \
to the user. "fields" must reflect your complete current understanding of every field based on the whole \
conversation so far — repeat values you already established earlier, not just what changed this turn. \
Use null for anything not yet known."""

_CLASSIFICATION_SYSTEM_PROMPT = """You are a friendly assistant helping a user figure out which legal \
document they need. You can only generate the following document types:

{catalog_list}

Ask the user what they're trying to accomplish if it's not already clear. Once you're confident which of \
the documents above they need, set "documentType" to its exact name from the list and briefly confirm \
that's what you'll help them create next.

If what the user wants isn't one of the documents above, do NOT guess or pick one arbitrarily. Explain \
conversationally that you can't generate that document, suggest whichever of the documents above is the \
closest fit, and ask if they'd like to proceed with that instead. Only set "documentType" once the user has \
actually asked for (or agreed to) one of the documents above — leave it null while still clarifying.

Always respond with "reply" (your next conversational message) and "documentType" (the exact matched \
document name from the list above, or null if not yet resolved)."""

_CLASSIFICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "documentType": {
            "type": ["string", "null"],
            "enum": [doctype.catalog_names[0] for doctype in ALL_DOCUMENT_TYPES] + [None],
        },
    },
    "required": ["reply", "documentType"],
    "additionalProperties": False,
}


def _call_structured(system_prompt: str, schema: dict, schema_name: str, messages: list[ChatMessage]) -> dict:
    response = litellm.completion(
        model=MODEL,
        api_key=settings.openrouter_api_key,
        messages=[{"role": "system", "content": system_prompt}]
        + [{"role": message.role, "content": message.content} for message in messages],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": schema_name, "strict": True, "schema": schema},
        },
        max_tokens=2000,
        extra_body={
            # Cerebras is required per the project's AI design guidelines; fail rather
            # than silently falling back to a different inference provider.
            "provider": {"order": ["cerebras"], "allow_fallbacks": False, "require_parameters": True},
            # gpt-oss-120b is a reasoning model. Without this, its internal
            # analysis/self-correction has been observed leaking into the "reply"
            # string instead of being stripped, producing garbled, runaway output.
            "reasoning": {"exclude": True},
        },
    )

    parsed = json.loads(response.choices[0].message.content)
    reply = parsed["reply"]
    # The model has been observed occasionally double-escaping whitespace inside
    # the JSON string value (emitting the literal two characters "\n" rather than
    # a real newline), which then renders as a visible "\n" in the chat instead of
    # a line break. A literal backslash-n/t/r is never intentional in a
    # conversational reply, so unescape it defensively.
    reply = reply.replace("\\n", "\n").replace("\\t", "\t").replace("\\r", "\r")
    parsed["reply"] = reply
    if len(reply) > MAX_REPLY_CHARS:
        # A well-formed conversational reply is a few sentences. A reply this long
        # is a sign the model's reasoning leaked into it (see above) rather than a
        # legitimately long message, so treat it as a failed turn.
        raise ValueError(f"chat reply unexpectedly long ({len(reply)} chars); likely leaked reasoning output")
    return parsed


def _retry(call):
    # A leaked-reasoning turn (see _call_structured) is a transient sampling
    # failure, not a persistent one, so a retry is very likely to succeed. Only
    # give up and surface an error to the user after repeated failures.
    last_error: Exception | None = None
    for _attempt in range(MAX_ATTEMPTS):
        try:
            return call()
        except (ValueError, json.JSONDecodeError, KeyError) as exc:
            last_error = exc
    assert last_error is not None
    raise last_error


def get_document_chat_reply(slug: str, messages: list[ChatMessage]) -> tuple[str, dict]:
    doctype = REGISTRY[slug]
    prompt_notes = f"{doctype.prompt_notes}\n\n" if doctype.prompt_notes else ""
    system_prompt = _DOCUMENT_PROMPT_TEMPLATE.format(
        doc_name=doctype.catalog_names[0],
        field_instructions=build_field_instructions(doctype),
        prompt_notes=prompt_notes,
    )
    schema = build_response_schema(doctype)

    def _do():
        parsed = _call_structured(system_prompt, schema, f"{slug}_chat_turn", messages)
        model = fields_model_for(slug)
        fields = model.model_validate(parsed["fields"])
        return parsed["reply"], fields.model_dump()

    return _retry(_do)


def get_classification_reply(messages: list[ChatMessage]) -> tuple[str, str | None]:
    catalog_list = "\n".join(f"- {doctype.catalog_names[0]}: {doctype.description}" for doctype in ALL_DOCUMENT_TYPES)
    system_prompt = _CLASSIFICATION_SYSTEM_PROMPT.format(catalog_list=catalog_list)

    def _do():
        return _call_structured(system_prompt, _CLASSIFICATION_SCHEMA, "document_classification_turn", messages)

    parsed = _retry(_do)
    document_name = parsed["documentType"]
    slug = None
    if document_name is not None:
        for doctype in ALL_DOCUMENT_TYPES:
            if doctype.catalog_names[0] == document_name:
                slug = doctype.slug
                break
    return parsed["reply"], slug
