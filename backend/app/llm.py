import json

import litellm

from app.config import settings
from app.schemas import NdaChatMessage, NdaFieldsUpdate

MODEL = "openrouter/openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are a friendly assistant helping a user fill out a Common Paper Mutual \
Non-Disclosure Agreement (NDA) through natural conversation, a couple of related questions at \
a time rather than one huge list.

Gather the following, asking about whatever is still missing:
- purpose: how the confidential information may be used
- effectiveDate: the agreement's effective date, as an ISO date (YYYY-MM-DD)
- mndaTerm ("fixed" or "open") and, if "fixed", mndaTermYears: how long the MNDA itself lasts
- termOfConfidentiality ("fixed" or "open") and, if "fixed", termOfConfidentialityYears: how long \
information stays confidential ("open" means it lasts in perpetuity)
- governingLaw: a US state, and jurisdiction: city/county & state
- modifications: any changes to the standard terms (optional, leave null if the user has none)
- partyOne and partyTwo: for each, their printName, title, company, and noticeAddress (an email \
or mailing address)

Do NOT ask about signatures — those are collected separately outside this chat, after the rest \
of the fields are filled in.

Once every field above is known, tell the user their NDA is ready to review and sign below.

Always respond with the structured fields you were given. "reply" is your next conversational \
message to the user. "fields" must reflect your complete current understanding of every field \
based on the whole conversation so far — repeat values you already established earlier, not just \
what changed this turn. Use null for anything not yet known."""


def _party_schema() -> dict:
    return {
        "type": ["object", "null"],
        "properties": {
            "printName": {"type": ["string", "null"]},
            "title": {"type": ["string", "null"]},
            "company": {"type": ["string", "null"]},
            "noticeAddress": {"type": ["string", "null"]},
            "date": {"type": ["string", "null"]},
        },
        "required": ["printName", "title", "company", "noticeAddress", "date"],
        "additionalProperties": False,
    }


RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "fields": {
            "type": "object",
            "properties": {
                "purpose": {"type": ["string", "null"]},
                "effectiveDate": {"type": ["string", "null"]},
                "mndaTerm": {"type": ["string", "null"], "enum": ["fixed", "open", None]},
                "mndaTermYears": {"type": ["integer", "null"]},
                "termOfConfidentiality": {"type": ["string", "null"], "enum": ["fixed", "open", None]},
                "termOfConfidentialityYears": {"type": ["integer", "null"]},
                "governingLaw": {"type": ["string", "null"]},
                "jurisdiction": {"type": ["string", "null"]},
                "modifications": {"type": ["string", "null"]},
                "partyOne": _party_schema(),
                "partyTwo": _party_schema(),
            },
            "required": [
                "purpose",
                "effectiveDate",
                "mndaTerm",
                "mndaTermYears",
                "termOfConfidentiality",
                "termOfConfidentialityYears",
                "governingLaw",
                "jurisdiction",
                "modifications",
                "partyOne",
                "partyTwo",
            ],
            "additionalProperties": False,
        },
    },
    "required": ["reply", "fields"],
    "additionalProperties": False,
}


MAX_ATTEMPTS = 3


def _call_once(messages: list[NdaChatMessage]) -> tuple[str, NdaFieldsUpdate]:
    response = litellm.completion(
        model=MODEL,
        api_key=settings.openrouter_api_key,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}]
        + [{"role": message.role, "content": message.content} for message in messages],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "nda_chat_turn", "strict": True, "schema": RESPONSE_SCHEMA},
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
    if len(reply) > 1000:
        # A well-formed conversational reply is a few sentences. A reply this long
        # is a sign the model's reasoning leaked into it (see above) rather than a
        # legitimately long message, so treat it as a failed turn.
        raise ValueError(f"NDA chat reply unexpectedly long ({len(reply)} chars); likely leaked reasoning output")
    return reply, NdaFieldsUpdate.model_validate(parsed["fields"])


def get_nda_chat_reply(messages: list[NdaChatMessage]) -> tuple[str, NdaFieldsUpdate]:
    # A leaked-reasoning turn (see _call_once) is a transient sampling failure,
    # not a persistent one, so a retry is very likely to succeed. Only give up
    # and surface an error to the user after repeated failures.
    last_error: Exception | None = None
    for _attempt in range(MAX_ATTEMPTS):
        try:
            return _call_once(messages)
        except (ValueError, json.JSONDecodeError, KeyError) as exc:
            last_error = exc
    assert last_error is not None
    raise last_error
